import { createClient } from "@/lib/supabase/client";
import type { AjustesDatos } from "@/types/database";
import type { CorteJornada } from "@/lib/motor";
import type { ResultadoEscritura } from "./escribir-jornadas";

/**
 * Escritura del corte de jornada (BUSINESS-RULES.md regla 1, editable desde
 * 28-jul-2026). Es un upsert de LA fila única de `ajustes` (id=1): se manda
 * `datosActuales` completo con las dos horas de corte encimadas para no pisar
 * otras claves (est/ven/descartarNovedad/diasManuales) que ya vivían ahí.
 * Corre en el navegador con la sesión del admin (RLS autoriza), igual que el
 * resto de las escrituras puntuales.
 */
export async function ejecutarGuardarCorteJornada(
  datosActuales: AjustesDatos,
  corte: CorteJornada
): Promise<ResultadoEscritura> {
  const sb = createClient();
  const datos: AjustesDatos = {
    ...datosActuales,
    corteSemana: corte.semana,
    corteSabado: corte.sabado,
  };
  const { error } = await sb
    .from("ajustes")
    .upsert({ id: 1, datos, actualizado: new Date().toISOString() });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}
