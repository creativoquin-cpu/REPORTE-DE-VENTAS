import "server-only";
import { createClient } from "@/lib/supabase/server";
import {
  resumenEquipo,
  type JornadaPublicaDia,
  type ResumenEquipo,
} from "@/lib/motor/equipo";
import { claveFecha } from "@/lib/motor/fechas";
import { MOTIVO_SIN_VENTAS, type Meta } from "@/types/database";

/**
 * Carga de datos de la vista pública del equipo (Fase 3). Hace las MISMAS 4
 * consultas de solo lectura que index.html:398-402 y calcula el resumen con el
 * motor puro (lib/motor/equipo). Se ejecuta del lado servidor con la anon key:
 * la frontera de privacidad la impone Postgres (RLS por columna) — de
 * `jornadas` solo se piden fecha/propias/cerrada/actualizado, nunca ven/tie
 * (docs/BUSINESS-RULES.md reglas 9 y 10).
 */

export interface RankingEntry {
  puesto: number;
  nombre: string;
}

export interface DatosVistaEquipo {
  /** Mes en curso "YYYY-MM". */
  mes: string;
  resumen: ResumenEquipo;
  ranking: RankingEntry[];
  /** true si alguna de las consultas falló (la vista muestra un aviso). */
  error: boolean;
}

function hoy(): { clave: string; mes: string } {
  const f = new Date();
  const clave = claveFecha(f.getFullYear(), f.getMonth() + 1, f.getDate());
  return { clave, mes: clave.slice(0, 7) };
}

// Formas mínimas que devuelve cada consulta (cliente sin tipos generados).
interface FilaJornada {
  fecha: string;
  propias: number;
  cerrada: boolean;
  actualizado: string | null;
}
type FilaMeta = Pick<Meta, "id" | "desde" | "total" | "propias">;

export async function cargarVistaEquipo(): Promise<DatosVistaEquipo> {
  const { clave, mes } = hoy();
  const vacio: ResumenEquipo = resumenEquipo({}, [], {}, clave);

  const sb = await createClient();
  const [rJor, rMet, rDia, rRank] = await Promise.all([
    sb.from("jornadas").select("fecha,propias,cerrada,actualizado"),
    sb.from("metas").select("id,desde,total,propias"),
    sb.from("dias_manuales").select("fecha, motivo"),
    sb.from("ranking_publico").select("puesto,nombre").eq("mes", mes).order("puesto"),
  ]);

  if (rJor.error || rMet.error || rDia.error || rRank.error) {
    return { mes, resumen: vacio, ranking: [], error: true };
  }

  const jornadasDelMes: Record<string, JornadaPublicaDia> = {};
  ((rJor.data ?? []) as FilaJornada[]).forEach((x) => {
    if (x.fecha.slice(0, 7) === mes)
      jornadasDelMes[x.fecha] = {
        propias: x.propias,
        cerrada: x.cerrada,
        actualizado: x.actualizado,
      };
  });

  const metas = (rMet.data ?? []) as FilaMeta[];
  const diasManuales: Record<string, true> = {};
  const diasNulos: Record<string, true> = {};
  ((rDia.data ?? []) as { fecha: string; motivo: string | null }[]).forEach((x) => {
    if (x.motivo === MOTIVO_SIN_VENTAS) diasNulos[x.fecha] = true;
    else diasManuales[x.fecha] = true;
  });

  const resumen = resumenEquipo(jornadasDelMes, metas, diasManuales, clave, diasNulos);
  const ranking = (rRank.data ?? []) as RankingEntry[];

  return { mes, resumen, ranking, error: false };
}
