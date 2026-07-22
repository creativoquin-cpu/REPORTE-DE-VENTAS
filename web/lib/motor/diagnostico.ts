/**
 * Diagnóstico de la carga: por qué cada fila cuenta o se descarta, más los
 * totales de "cuentan / descartadas". Es la parte PURA del bloque
 * "Qué se descartó" de calcular() (quin-admin.html:1650-1692, 1786-1793),
 * separada del render — en Next.js las tablas las pinta React.
 *
 * Reusa exactamente los mismos predicados que calcular() para que los números
 * cuadren fila por fila; no re-decide reglas de negocio.
 */
import { aNumero } from "./fechas";
import { fechaDropi, horaDropi, jornadaDe, fechaEffi, type CeldaExcel } from "./jornada";
import { permitido } from "./filtros";
import type { EntradaCalculo } from "./calcular";

/** Una fila de Dropi con el veredicto de por qué cuenta o no. */
export interface FilaDiagDropi {
  fila: number;
  fecha: CeldaExcel;
  hora: CeldaExcel;
  estatus: string;
  cant: number;
  jor: string | null;
  motivo: string | null;
}

/** Una fila de Effi con el veredicto. */
export interface FilaDiagEffi {
  fila: number;
  fecha: CeldaExcel;
  vendedor: string;
  cant: number;
  jor: string | null;
  motivo: string | null;
}

export interface Diagnostico {
  contadasDropi: number;
  descartadasDropi: number;
  sinFechaDropi: number;
  contadasEffi: number;
  descartadasEffi: number;
  detalleDropi: FilaDiagDropi[];
  detalleEffi: FilaDiagEffi[];
}

/** Recorre las filas crudas y explica el destino de cada una. */
export function diagnosticar(entrada: EntradaCalculo): Diagnostico {
  const { filasDropi, filasEffi, listaEstatus, listaVend, descartarNovedad } = entrada;

  // ---- DROPI ----
  const detalleDropi: FilaDiagDropi[] = [];
  let contadasDropi = 0;
  let descartadasDropi = 0;
  let sinFechaDropi = 0;
  (filasDropi || []).forEach((r, i) => {
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
    else if (!motivo) {
      motivo = "sin fecha u hora legible";
      sinFechaDropi++;
    }
    if (motivo) descartadasDropi += cant;
    else contadasDropi += cant;
    detalleDropi.push({ fila: i + 2, fecha: r["FECHA"], hora: r["HORA"], estatus: est, cant, jor, motivo });
  });

  // ---- EFFI ----
  const detalleEffi: FilaDiagEffi[] = [];
  let contadasEffi = 0;
  let descartadasEffi = 0;
  (filasEffi || []).forEach((r, i) => {
    const cant = aNumero(r["Cantidad"]);
    const vend = String(r["Vendedor"] == null ? "" : r["Vendedor"]).trim();
    let motivo: string | null = null;
    if (!permitido(listaVend, vend, "(sin vendedor)"))
      motivo = "vendedor desmarcado: " + (vend || "(sin vendedor)");
    const k = fechaEffi(r["Fecha creación"] != null ? r["Fecha creación"] : r["Fecha creacion"]);
    if (!motivo && !k) motivo = "sin fecha legible";
    if (motivo) descartadasEffi += cant;
    else contadasEffi += cant;
    detalleEffi.push({ fila: i + 2, fecha: r["Fecha creación"], vendedor: vend, cant, jor: k, motivo });
  });

  return {
    contadasDropi,
    descartadasDropi,
    sinFechaDropi,
    contadasEffi,
    descartadasEffi,
    detalleDropi,
    detalleEffi,
  };
}
