import { createClient } from "@/lib/supabase/client";
import type { Meta } from "@/types/database";
import type { ResultadoEscritura } from "./escribir-jornadas";

/**
 * Escritura de metas (Fase 4c): mutaciones puntuales sobre `metas` — upsert de
 * UNA meta nueva o delete de UNA meta programada. Corre en el navegador con la
 * sesión del admin (RLS autoriza). El historial nunca se edita ni se borra en
 * bloque: cada cambio es una fila nueva (regla 6); solo se puede quitar una meta
 * que aún no entró en vigencia.
 */

/** Guarda (upsert) una meta nueva; devuelve la fila escrita para el store. */
export async function ejecutarGuardarMeta(
  meta: Meta
): Promise<{ res: ResultadoEscritura; fila?: Meta }> {
  const sb = createClient();
  const fila: Meta = { ...meta, actualizado: new Date().toISOString() };
  const { error } = await sb.from("metas").upsert(fila);
  if (error) return { res: { ok: false, error: error.message } };
  return { res: { ok: true }, fila };
}

/** Quita (delete) una meta por id — solo se ofrece para metas programadas. */
export async function ejecutarQuitarMeta(id: number): Promise<ResultadoEscritura> {
  const sb = createClient();
  const { error } = await sb.from("metas").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}
