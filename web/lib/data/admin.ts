import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Jornada, MesCerrado, AjustesDatos, Meta } from "@/types/database";

/**
 * Carga del estado privado del admin para la pestaña "Cargar y validar"
 * (Fase 4b-1, solo lectura). Equivale a cargarNube() de quin-admin.html:820-892
 * pero del lado servidor: en /admin/* la sesión viaja en la cookie, así que la
 * anon key + RLS (privado.es_admin) devuelven las columnas privadas
 * (ven/tie/cerrada_el/fotos) y las tablas `meses`/`ajustes` que el visitante
 * anónimo nunca ve. La frontera la impone Postgres, no este código
 * (docs/BUSINESS-RULES.md regla 10).
 *
 * A diferencia del app viejo —que cargaba TODAS las filas de `jornadas` como si
 * fueran oficiales— acá solo tomamos las cerradas (`cerrada = true`). Los días
 * sin cerrar (bosquejo) se reconstruyen del Excel al cargarlo, así que un
 * borrador nunca se muestra como jornada oficial.
 */
export interface EstadoAdminInicial {
  /** Jornadas oficiales (cerradas), con su detalle privado. */
  jornadas: Jornada[];
  /** Historial de metas (para el resumen sellado del mes). */
  metas: Meta[];
  /** Sellos mensuales. */
  meses: MesCerrado[];
  /** Fechas marcadas a mano como no laborables. */
  diasManuales: string[];
  /** Ajustes guardados de "qué cuenta y qué no", o null si no hay. */
  ajustes: AjustesDatos | null;
  /** true si alguna consulta falló (p. ej. la sesión no es de un admin). */
  error: boolean;
}

const VACIO: EstadoAdminInicial = {
  jornadas: [],
  metas: [],
  meses: [],
  diasManuales: [],
  ajustes: null,
  error: false,
};

export async function cargarEstadoAdmin(): Promise<EstadoAdminInicial> {
  const sb = await createClient();

  const [rJor, rMet, rMes, rDia, rAju] = await Promise.all([
    sb.from("jornadas").select("*").eq("cerrada", true),
    sb.from("metas").select("*"),
    sb.from("meses").select("*"),
    sb.from("dias_manuales").select("fecha"),
    sb.from("ajustes").select("datos").eq("id", 1).maybeSingle(),
  ]);

  if (rJor.error || rMet.error || rMes.error || rDia.error) {
    return { ...VACIO, error: true };
  }

  return {
    jornadas: (rJor.data ?? []) as Jornada[],
    metas: (rMet.data ?? []) as Meta[],
    meses: (rMes.data ?? []) as MesCerrado[],
    diasManuales: ((rDia.data ?? []) as { fecha: string }[]).map((x) => x.fecha),
    ajustes: (rAju.data?.datos ?? null) as AjustesDatos | null,
    error: false,
  };
}
