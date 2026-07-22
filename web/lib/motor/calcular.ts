/**
 * Cálculo día-por-día del motor: toma las filas crudas de los dos Excel más
 * los filtros del admin y produce el mapa de días con propias/Dropi, detalle
 * por vendedor y tienda, motivo de no-laborable y reparto de bloques.
 *
 * Es la parte PURA de calcular() de quin-admin.html:1640-1715 — sin nada del
 * render de HTML, que en Next.js lo hace React. Los mismos números de
 * referencia de pruebas/test-motor-real.js deben salir de acá.
 */
import { claveFecha, fdate, aNumero } from "./fechas";
import { fechaDropi, horaDropi, jornadaDe, fechaEffi } from "./jornada";
import { porQueNoLaborable } from "./festivos";
import { repartir, armarBloques, type Bloque } from "./reparto";
import { permitido, nombreTienda, type FilaExcel, type ItemFiltro } from "./filtros";

/** Lo calculado para un día operativo. */
export interface DiaCalculado {
  /** Prendas propias (Effi) reales del día. */
  propias: number;
  /** Prendas Dropi reales del día. */
  dropi: number;
  /** Detalle propias por vendedor. PRIVADO (nunca va al rol anon). */
  ven: Record<string, number>;
  /** Detalle Dropi por tienda. PRIVADO. */
  tie: Record<string, number>;
  /** Motivo de no-laborable, o null si es día hábil. */
  motivo: string | null;
  /** Propias tras repartir el bloque de fin de semana/festivo. */
  repP: number;
  /** Dropi tras repartir. */
  repD: number;
}

export interface EntradaCalculo {
  filasDropi: FilaExcel[] | null;
  filasEffi: FilaExcel[] | null;
  listaEstatus: ItemFiltro[];
  listaVend: ItemFiltro[];
  descartarNovedad: boolean;
  diasManuales: Record<string, unknown>;
}

export interface ResultadoCalculo {
  /** Mapa clave "YYYY-MM-DD" → día calculado, con el rango completo relleno. */
  dias: Record<string, DiaCalculado>;
  /** Claves ordenadas del primer al último día con datos (rango continuo). */
  claves: string[];
  /** Bloques de días no laborables consecutivos. */
  bloques: Array<Bloque & { sumaP: number; sumaD: number }>;
  /** Total propias por vendedor en todo el periodo. */
  porVendedorEffi: Record<string, number>;
  /** Total Dropi por tienda en todo el periodo. */
  porTienda: Record<string, number>;
}

function diaVacio(): DiaCalculado {
  return { propias: 0, dropi: 0, ven: {}, tie: {}, motivo: null, repP: 0, repD: 0 };
}

export function calcular(entrada: EntradaCalculo): ResultadoCalculo {
  const {
    filasDropi,
    filasEffi,
    listaEstatus,
    listaVend,
    descartarNovedad,
    diasManuales,
  } = entrada;

  const dias: Record<string, DiaCalculado> = {};
  const dia = (k: string) => dias[k] || (dias[k] = diaVacio());
  const porTienda: Record<string, number> = {};
  const porVendedorEffi: Record<string, number> = {};

  // ---- DROPI ----
  (filasDropi || []).forEach((r) => {
    const cant = aNumero(r["CANTIDAD"]);
    const est = String(r["ESTATUS"] == null ? "" : r["ESTATUS"]).trim();
    const nov = String(r["NOVEDAD"] == null ? "" : r["NOVEDAD"]).trim();
    let motivo: string | null = null;
    if (!permitido(listaEstatus, est, "(sin estatus)"))
      motivo = "estatus desmarcado: " + (est || "(sin estatus)");
    if (!motivo && descartarNovedad && nov !== "" && nov.toLowerCase() !== "none")
      motivo = "tiene novedad: " + nov;
    const f = fechaDropi(r["FECHA"]);
    const h = horaDropi(r["HORA"]);
    let jor: string | null = null;
    if (f && h != null) jor = jornadaDe(f.y, f.m, f.d, h);
    else if (!motivo) motivo = "sin fecha u hora legible";
    if (!motivo && jor) {
      const dj = dia(jor);
      dj.dropi += cant;
      const tnd = nombreTienda(r["TIENDA"]);
      porTienda[tnd] = (porTienda[tnd] || 0) + cant;
      dj.tie[tnd] = (dj.tie[tnd] || 0) + cant;
    }
  });

  // ---- EFFI ----
  (filasEffi || []).forEach((r) => {
    const cant = aNumero(r["Cantidad"]);
    const vend = String(r["Vendedor"] == null ? "" : r["Vendedor"]).trim();
    let motivo: string | null = null;
    if (!permitido(listaVend, vend, "(sin vendedor)"))
      motivo = "vendedor desmarcado: " + (vend || "(sin vendedor)");
    const k = fechaEffi(r["Fecha creación"] != null ? r["Fecha creación"] : r["Fecha creacion"]);
    if (!motivo && !k) motivo = "sin fecha legible";
    if (!motivo && k) {
      const de = dia(k);
      de.propias += cant;
      porVendedorEffi[vend] = (porVendedorEffi[vend] || 0) + cant;
      de.ven[vend] = (de.ven[vend] || 0) + cant;
    }
  });

  // ---- completar el rango de días ----
  const conDatos = Object.keys(dias).sort();
  const claves: string[] = [];
  if (conDatos.length) {
    const f = fdate(conDatos[0]);
    const fin = fdate(conDatos[conDatos.length - 1]);
    while (f <= fin) {
      const k = claveFecha(f.getFullYear(), f.getMonth() + 1, f.getDate());
      claves.push(k);
      dia(k);
      f.setDate(f.getDate() + 1);
    }
  }

  // ---- bloques y reparto ----
  claves.forEach((k) => {
    dias[k].motivo = porQueNoLaborable(k, diasManuales);
    dias[k].repP = dias[k].propias;
    dias[k].repD = dias[k].dropi;
  });
  const bloques = armarBloques(claves, diasManuales).map((b) => {
    let sp = 0,
      sd = 0;
    b.dias.forEach((k) => {
      sp += dias[k].propias;
      sd += dias[k].dropi;
    });
    const rp = repartir(sp, b.dias.length);
    const rd = repartir(sd, b.dias.length);
    b.dias.forEach((k, i) => {
      dias[k].repP = rp[i];
      dias[k].repD = rd[i];
    });
    return { ...b, sumaP: sp, sumaD: sd };
  });

  return { dias, claves, bloques, porVendedorEffi, porTienda };
}
