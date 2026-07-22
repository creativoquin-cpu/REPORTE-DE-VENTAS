import { createClient } from "@/lib/supabase/client";
import type { DiaManual } from "@/types/database";
import type { ResultadoEscritura } from "./escribir-jornadas";

/**
 * Escritura de días no laborables marcados a mano (Fase 4d): mutaciones
 * puntuales sobre `dias_manuales` — upsert de UNA fecha o delete de UNA fecha.
 * Corre en el navegador con la sesión del admin (RLS autoriza). `dias_manuales`
 * es de lectura pública (el visitante también los ve, para que su vista aplique
 * el mismo reparto), pero solo el admin escribe.
 */
export async function ejecutarMarcarDia(fecha: string): Promise<ResultadoEscritura> {
  const sb = createClient();
  const fila: DiaManual = {
    fecha,
    motivo: "Marcado a mano",
    actualizado: new Date().toISOString(),
  };
  const { error } = await sb.from("dias_manuales").upsert(fila);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function ejecutarQuitarDia(fecha: string): Promise<ResultadoEscritura> {
  const sb = createClient();
  const { error } = await sb.from("dias_manuales").delete().eq("fecha", fecha);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}
