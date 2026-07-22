import { createClient } from "@/lib/supabase/client";
import type { MesCerrado, MesCerradoDatos } from "@/types/database";
import type { ResultadoEscritura } from "./escribir-jornadas";

/**
 * Escritura del sello mensual (Fase 4b-3): upsert de UNA fila de `meses`. Corre
 * en el navegador con la sesión del admin (RLS autoriza). `meses` es privada:
 * el visitante anónimo no tiene ninguna política sobre ella (supabase-esquema.sql).
 *
 * Devuelve también la fila escrita para reflejarla en el store sin recargar.
 */
export async function ejecutarSelloMes(
  mes: string,
  datos: MesCerradoDatos
): Promise<{ res: ResultadoEscritura; fila?: MesCerrado }> {
  const sb = createClient();
  const ahoraISO = new Date().toISOString();
  const fila: MesCerrado = {
    mes,
    datos: { ...datos, actualizado: ahoraISO },
    sellado_en: ahoraISO,
  };
  const { error } = await sb.from("meses").upsert(fila);
  if (error) return { res: { ok: false, error: error.message } };
  return { res: { ok: true }, fila };
}
