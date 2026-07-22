import { describe, it, expect } from "vitest";
import {
  estadoMes,
  resumenMensualCerrado,
  mesDeClave,
  resumenMes,
  sellarMes,
  reabrirMesDatos,
} from "./cierre";
import type { MesCerradoDatos } from "@/types/database";

describe("estadoMes", () => {
  it("con sello cerrado → cerrado", () => {
    expect(estadoMes("2026-05", { estado: "cerrado" }, "2026-07")).toBe("cerrado");
  });
  it("con sello abierto (reabierto a mano) → reabierto", () => {
    expect(estadoMes("2026-05", { estado: "abierto" }, "2026-07")).toBe("reabierto");
  });
  it("sin sello y mes pasado → pendiente", () => {
    expect(estadoMes("2026-06", null, "2026-07")).toBe("pendiente");
  });
  it("sin sello y mes en curso → en curso", () => {
    expect(estadoMes("2026-07", undefined, "2026-07")).toBe("en curso");
  });
  it("sin sello y mes futuro → en curso (no se cierra lo que no pasó)", () => {
    expect(estadoMes("2026-08", null, "2026-07")).toBe("en curso");
  });
});

describe("resumenMensualCerrado", () => {
  const jornadas = {
    "2026-07-01": { propias: 10, dropi: 3 },
    "2026-07-02": { propias: 8, dropi: 2 },
    "2026-06-30": { propias: 5, dropi: 1 },
  };
  it("suma solo las jornadas del mes pedido", () => {
    expect(resumenMensualCerrado(jornadas, "2026-07")).toEqual({
      dias: 2,
      total: 23,
      p: 18,
      d: 5,
    });
  });
  it("mes sin jornadas → todo en cero", () => {
    expect(resumenMensualCerrado(jornadas, "2026-01")).toEqual({ dias: 0, total: 0, p: 0, d: 0 });
  });
});

describe("mesDeClave", () => {
  it("recorta a YYYY-MM", () => {
    expect(mesDeClave("2026-07-15")).toBe("2026-07");
  });
});

describe("resumenMes", () => {
  const jornadas = {
    "2026-07-01": { propias: 10, dropi: 3, ven: { Ana: 10 }, tie: { T1: 3 } },
    "2026-07-02": { propias: 8, dropi: 2, ven: { Beto: 8 }, tie: {} },
    "2026-06-30": { propias: 99, dropi: 99, ven: { Ana: 99 }, tie: {} }, // otro mes
  };
  it("suma solo el mes, promedia y arma mejor/peor y detalle", () => {
    const r = resumenMes(jornadas, [], "2026-07");
    expect(r.dias).toBe(2);
    expect(r.total).toBe(23);
    expect(r.p).toBe(18);
    expect(r.d).toBe(5);
    expect(r.prom).toBe(12); // round(23/2)=12
    expect(r.pct).toBe(78); // round(18*100/23)=78
    expect(r.mejor).toEqual({ k: "2026-07-01", t: 13 });
    expect(r.peor).toEqual({ k: "2026-07-02", t: 10 });
    expect(r.ven).toEqual({ Ana: 10, Beto: 8 });
    expect(r.tie).toEqual({ T1: 3 });
  });
  it("con metas por defecto (200/160) ningún día chico llega a la meta", () => {
    const r = resumenMes(jornadas, [], "2026-07");
    expect(r.enMetaT).toBe(0);
    expect(r.enMetaP).toBe(0);
  });
});

describe("sellarMes / reabrirMesDatos", () => {
  const resumen = resumenMes({ "2026-06-01": { propias: 5, dropi: 1, ven: {}, tie: {} } }, [], "2026-06");

  it("sellar por primera vez → cerrado, traza 'Cerrado a mano'", () => {
    const d = sellarMes(null, resumen, "1-jul 08:00");
    expect(d.estado).toBe("cerrado");
    expect(d.cerrado).toBe("1-jul 08:00");
    expect(d.auto).toBe(false);
    expect(d.resumen).toBe(resumen);
    expect(d.traza).toHaveLength(1);
    expect(d.traza[0].que).toBe("Cerrado a mano");
    expect(d.traza[0].total).toBe(resumen.total);
  });

  it("volver a sellar (ya había traza) → 'Vuelto a cerrar a mano'", () => {
    const previo: MesCerradoDatos = sellarMes(null, resumen, "1-jul 08:00");
    const d = sellarMes(previo, resumen, "5-jul 09:00");
    expect(d.traza).toHaveLength(2);
    expect(d.traza[1].que).toBe("Vuelto a cerrar a mano");
  });

  it("reabrir → abierto, sin fecha de cierre, traza 'Reabierto'", () => {
    const previo: MesCerradoDatos = sellarMes(null, resumen, "1-jul 08:00");
    const d = reabrirMesDatos(previo, "6-jul 10:00");
    expect(d.estado).toBe("abierto");
    expect(d.cerrado).toBeNull();
    expect(d.traza).toHaveLength(2);
    expect(d.traza[1].que).toBe("Reabierto");
    expect(d.traza[1].total).toBe(resumen.total);
  });
});
