import { createClient } from "@/lib/supabase/client";
import {
  filasDeBosquejo,
  rankingPublico,
  type CifraDia,
  type RankingReemplazo,
} from "@/lib/motor";
import type { Jornada } from "@/types/database";
import { reemplazarRanking, type ResultadoEscritura } from "./escribir-jornadas";

/**
 * Sync del bosquejo (Fase 4b-4): sube los días sin cerrar a `jornadas` con
 * `cerrada:false` para que la vista pública muestre las cifras preliminares.
 * Puerto de sincronizarBosquejo() (quin-admin.html:759-776), pero reconciliando
 * contra la nube en vez de un snapshot de localStorage: se leen los borradores
 * que ya hay y se borran los que ya no están en el cálculo actual.
 *
 * Toda operación de borrado lleva el guard `.eq("cerrada", false)`: NUNCA toca
 * una jornada oficial. Es el write de mayor alcance (varias filas) y el único
 * que impacta la vista pública en vivo, por eso la vista previa importa.
 */
export interface PlanBosquejo {
  /** Días sin cerrar a subir (cerrada:false). */
  upserts: Jornada[];
  /** Borradores viejos en la nube que ya no están en el cálculo → borrar. */
  borrar: string[];
  /** Ranking del mes en curso recalculado (oficiales + bosquejo). */
  ranking: RankingReemplazo[];
}

/** Arma el plan del bosquejo leyendo de la nube qué borradores ya existen. */
export async function prepararBosquejo(
  cifras: Record<string, CifraDia>,
  jornadas: Record<string, Jornada>,
  mesActual: string
): Promise<{ plan?: PlanBosquejo; error?: string }> {
  const sb = createClient();
  const upserts = filasDeBosquejo(cifras, jornadas, new Date().toISOString());
  const claves = new Set(upserts.map((u) => u.fecha));

  const { data, error } = await sb.from("jornadas").select("fecha").eq("cerrada", false);
  if (error) return { error: error.message };
  const borrar = ((data ?? []) as { fecha: string }[])
    .map((x) => x.fecha)
    .filter((f) => !claves.has(f));

  const oficiales: Record<string, { ven: Record<string, number> }> = {};
  Object.keys(jornadas).forEach((k) => (oficiales[k] = { ven: jornadas[k].ven }));
  const borradores: Record<string, { ven: Record<string, number> }> = {};
  upserts.forEach((u) => (borradores[u.fecha] = { ven: u.ven }));
  const ranking: RankingReemplazo[] = [
    { mes: mesActual, filas: rankingPublico(oficiales, borradores, mesActual) },
  ];

  return { plan: { upserts, borrar, ranking } };
}

/** Ejecuta el plan del bosquejo: upsert de borradores + borrado de los viejos + ranking. */
export async function ejecutarBosquejo(plan: PlanBosquejo): Promise<ResultadoEscritura> {
  const sb = createClient();
  if (plan.upserts.length) {
    const { error } = await sb.from("jornadas").upsert(plan.upserts);
    if (error) return { ok: false, error: error.message };
  }
  if (plan.borrar.length) {
    const { error } = await sb
      .from("jornadas")
      .delete()
      .in("fecha", plan.borrar)
      .eq("cerrada", false);
    if (error) return { ok: false, error: error.message };
  }
  return reemplazarRanking(sb, plan.ranking);
}
