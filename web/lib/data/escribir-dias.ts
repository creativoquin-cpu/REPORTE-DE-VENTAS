import { createClient } from "@/lib/supabase/client";
import { MOTIVO_SIN_VENTAS, type DiaManual } from "@/types/database";
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

/**
 * Marca un "día nulo / sin ventas" (día de descanso). Va a la misma tabla
 * `dias_manuales` pero con `motivo = "Sin ventas"`, así el motor lo distingue de
 * un no laborable con reparto: el día nulo se saca del cálculo y sus ventas
 * pasan al día anterior. El upsert por `fecha` pisa el motivo si el día ya
 * estaba marcado de otra forma, así que un día es de un solo tipo.
 */
export async function ejecutarMarcarNulo(fecha: string): Promise<ResultadoEscritura> {
  const sb = createClient();
  const fila: DiaManual = {
    fecha,
    motivo: MOTIVO_SIN_VENTAS,
    actualizado: new Date().toISOString(),
  };
  const { error } = await sb.from("dias_manuales").upsert(fila);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

/** Quita un día de `dias_manuales`, sea no laborable o nulo (borra por fecha). */
export async function ejecutarQuitarDia(fecha: string): Promise<ResultadoEscritura> {
  const sb = createClient();
  const { error } = await sb.from("dias_manuales").delete().eq("fecha", fecha);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}
