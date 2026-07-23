/**
 * Tipos TS espejo de supabase-esquema.sql (../supabase-esquema.sql).
 * Fuente de verdad manual por ahora; en la Fase 11 (auditoría de backend)
 * esto puede reemplazarse por tipos generados con
 * `supabase gen types typescript`.
 */

export interface Jornada {
  fecha: string; // date, "YYYY-MM-DD"
  propias: number;
  dropi: number;
  /** Detalle por vendedor — PRIVADO, el rol anon no puede leer esta columna. */
  ven: Record<string, number>;
  /** Detalle por tienda — PRIVADO. En Dropi la tienda ES el vendedor (BUSINESS-RULES.md regla 5). */
  tie: Record<string, number>;
  cerrada: boolean;
  /** PRIVADO. Texto "Cerrada el ..." mostrado en el panel. */
  cerrada_el: string | null;
  /** PRIVADO. Historial de re-subidas tras el cierre oficial. */
  fotos: JornadaFoto[];
  actualizado: string; // timestamptz
}

/**
 * Columnas que el rol `anon` puede leer de `jornadas`
 * (supabase-esquema.sql:146, BUSINESS-RULES.md regla 10). Nunca agregar
 * `ven`/`tie`/`dropi`/`cerrada_el`/`fotos` acá: ese es justamente el límite
 * que hace cumplir Postgres, no el código.
 */
export type JornadaPublica = Pick<Jornada, "fecha" | "propias" | "cerrada" | "actualizado">;

/**
 * Una "revisión posterior": cada vez que se vuelve a subir un día ya cerrado,
 * el app viejo empuja `{ cuando, p, d }` (quin-admin.html:1126). Ese es el
 * shape REAL guardado en la nube — no `{fecha_subida, propias, dropi}`.
 */
export interface JornadaFoto {
  cuando: string;
  p: number;
  d: number;
}

export interface Meta {
  id: number;
  desde: string; // date
  total: number;
  propias: number;
  cuando: string | null;
  quien: string | null;
  actualizado: string;
}

/**
 * Datos de "qué cuenta y qué no". OJO: `est`/`ven` se guardan como mapa
 * valor→bool (quin-admin.html:621-623 `est[x.valor]=x.cuenta`), no como
 * arreglo de objetos.
 */
export interface AjustesDatos {
  est?: Record<string, boolean>;
  ven?: Record<string, boolean>;
  descartarNovedad?: boolean;
  diasManuales?: Record<string, true>;
  actualizado?: string;
}

export interface Ajustes {
  id: 1;
  datos: AjustesDatos;
  actualizado: string;
}

/** Un evento en la bitácora de cierres/reaperturas (quin-admin.html:1205). */
export interface TrazaCierre {
  que: string;
  cuando: string | null;
  quien: string | null;
  total: number | null;
}

/** Resumen sellado de un mes (salida de resumenMes(), quin-admin.html:1184). */
export interface ResumenMes {
  dias: number;
  total: number;
  p: number;
  d: number;
  prom: number;
  pct: number;
  mejor: { k: string; t: number } | null;
  peor: { k: string; t: number } | null;
  ven: Record<string, number>;
  tie: Record<string, number>;
  enMetaT: number;
  enMetaP: number;
  sinDetalle: number;
}

export interface MesCerradoDatos {
  estado: "cerrado" | "abierto";
  cerrado: string | null;
  auto: boolean;
  resumen: ResumenMes | null;
  traza: TrazaCierre[];
  actualizado?: string;
}

export interface MesCerrado {
  mes: string; // "YYYY-MM"
  datos: MesCerradoDatos;
  sellado_en: string;
}

export interface DiaManual {
  fecha: string;
  motivo: string | null;
  actualizado: string;
}

/**
 * Motivo con el que se marca un "día nulo / sin ventas" (día de descanso) en
 * `dias_manuales`. Es DISTINTO de un no laborable normal: el día nulo se saca
 * del cálculo y sus ventas pasan al día anterior (no se reparten). Cualquier
 * otro `motivo` (p. ej. "Marcado a mano") es un no laborable con reparto.
 */
export const MOTIVO_SIN_VENTAS = "Sin ventas";

/** Nunca lleva cifras — ver BUSINESS-RULES.md regla 9. */
export interface RankingPublicoEntry {
  mes: string;
  puesto: number;
  nombre: string;
}

export interface AdminRow {
  user_id: string;
  nombre: string | null;
  creado: string;
}
