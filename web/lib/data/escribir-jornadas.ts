import { createClient } from "@/lib/supabase/client";
import type { PlanCierre, PlanReapertura, RankingReemplazo } from "@/lib/motor";

/**
 * Capa de ESCRITURA de jornadas (Fase 4b-2). Ejecuta mutaciones PUNTUALES —
 * upsert de los días que se cierran, delete del día que se reabre, y reemplazo
 * del ranking del mes tocado— en vez del patrón "subir tabla completa y borrar
 * lo que falta" del app viejo. El radio de impacto es un día / un mes.
 *
 * Corre en el navegador con la sesión del admin: Postgres (RLS + es_admin) es
 * quien autoriza, no este código (docs/BUSINESS-RULES.md regla 10). La vista
 * previa (dry-run) del panel muestra exactamente estos cambios ANTES de que se
 * llame a cualquiera de estas funciones.
 */
export interface ResultadoEscritura {
  ok: boolean;
  error?: string;
}

async function reemplazarRanking(
  sb: ReturnType<typeof createClient>,
  ranking: RankingReemplazo[]
): Promise<ResultadoEscritura> {
  for (const r of ranking) {
    const { error: eDel } = await sb.from("ranking_publico").delete().eq("mes", r.mes);
    if (eDel) return { ok: false, error: eDel.message };
    if (r.filas.length) {
      const { error: eIns } = await sb.from("ranking_publico").insert(r.filas);
      if (eIns) return { ok: false, error: eIns.message };
    }
  }
  return { ok: true };
}

/** Cierra los días del plan: upsert de las jornadas + reemplazo del ranking. */
export async function ejecutarCierre(plan: PlanCierre): Promise<ResultadoEscritura> {
  const sb = createClient();
  if (plan.jornadas.length) {
    const { error } = await sb.from("jornadas").upsert(plan.jornadas);
    if (error) return { ok: false, error: error.message };
  }
  return reemplazarRanking(sb, plan.ranking);
}

/**
 * Reabre una jornada: borra ESE día (solo si está cerrado, nunca un bosquejo) y
 * recalcula el ranking del mes.
 */
export async function ejecutarReapertura(plan: PlanReapertura): Promise<ResultadoEscritura> {
  const sb = createClient();
  const { error } = await sb.from("jornadas").delete().eq("fecha", plan.fecha).eq("cerrada", true);
  if (error) return { ok: false, error: error.message };
  return reemplazarRanking(sb, plan.ranking);
}
