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

export interface JornadaFoto {
  fecha_subida: string;
  propias: number;
  dropi: number;
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

export interface Ajustes {
  id: 1;
  datos: {
    est?: Array<{ valor: string; cuenta: boolean }>;
    ven?: Array<{ valor: string; cuenta: boolean }>;
    descartarNovedad?: boolean;
    diasManuales?: Record<string, true>;
  };
  actualizado: string;
}

export interface MesCerrado {
  mes: string; // "YYYY-MM"
  datos: {
    estado: "cerrado" | "abierto";
    auto: boolean;
    resumen: Record<string, unknown>;
    traza: Array<{ accion: string; cuando: string }>;
  };
  sellado_en: string;
}

export interface DiaManual {
  fecha: string;
  motivo: string | null;
  actualizado: string;
}

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
