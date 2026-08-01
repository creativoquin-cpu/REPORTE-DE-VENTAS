import { describe, it, expect } from "vitest";
import { jornadaDe, fechaEffi, horaDeCorte, CORTE_JORNADA_POR_DEFECTO, type CorteJornada } from "./jornada";

// Portado de pruebas/test-motor-real.js §8 y §9, actualizado a la regla de
// rangos vigente desde 01-ago-2026 (BUSINESS-RULES.md regla 1): lunes 8am
// (se corre al primer día hábil si el lunes es festivo), martes a viernes
// 7:30am, fin de semana (sáb+dom, acumulado) 7am.

describe("jornadaDe — bordes del turno, corte por defecto", () => {
  const casos: Array<[string, number, number, number, number, string]> = [
    // 07-jul-2026 es martes y el lunes anterior (06-jul) NO es festivo, así
    // que usa el corte normal de 7:30am (a diferencia del 14-jul, ver más
    // abajo: el lunes 13-jul sí es festivo y le corre el corte al martes).
    ["martes 07-jul 07:29 cuenta como el lunes", 2026, 7, 7, 7.483, "2026-07-06"],
    ["martes 07-jul 07:31 es ya su propio día", 2026, 7, 7, 7.517, "2026-07-07"],
    ["sábado 11-jul 06:59 cae en el viernes", 2026, 7, 11, 6.983, "2026-07-10"],
    ["sábado 11-jul 07:01 es ya el sábado", 2026, 7, 11, 7.017, "2026-07-11"],
    ["domingo 12-jul 06:59 cuenta como sábado", 2026, 7, 12, 6.983, "2026-07-11"],
    ["domingo 12-jul 07:01 es ya el domingo", 2026, 7, 12, 7.017, "2026-07-12"],
    ["lunes 06-jul (no festivo) 07:59 cuenta como el domingo", 2026, 7, 6, 7.983, "2026-07-05"],
    ["lunes 06-jul (no festivo) 08:01 es ya su propio día", 2026, 7, 6, 8.017, "2026-07-06"],
  ];
  it.each(casos)("%s", (_nombre, y, m, d, hora, esperado) => {
    expect(jornadaDe(y, m, d, hora)).toBe(esperado);
  });

  it("lunes 13-jul-2026 es festivo (Chiquinquirá): el corte de 8am se corre al martes 14-jul", () => {
    // El martes deja de tener el corte normal de 7:30am y pasa a tener el
    // largo del lunes (8am), porque el lunes 13 es puente.
    expect(jornadaDe(2026, 7, 14, 7.75, CORTE_JORNADA_POR_DEFECTO)).toBe("2026-07-13"); // 7:45am martes → todavía cuenta para el lunes
    expect(jornadaDe(2026, 7, 14, 8.25, CORTE_JORNADA_POR_DEFECTO)).toBe("2026-07-14"); // 8:15am martes → ya es su propio día
    // El miércoles siguiente vuelve al corte normal de martes-viernes (7:30am).
    expect(jornadaDe(2026, 7, 15, 7.75, CORTE_JORNADA_POR_DEFECTO)).toBe("2026-07-15");
  });
});

describe("horaDeCorte — resolución de rangos y de correrSiFestivo", () => {
  it("un rango simple sin correrSiFestivo aplica siempre, festivo o no", () => {
    const corte: CorteJornada = [{ dias: [1, 2, 3, 4, 5], hora: 9 }, { dias: [6, 0], hora: 6 }];
    expect(horaDeCorte(new Date(2026, 6, 13), corte)).toBe(9); // lunes festivo, igual usa el rango normal
  });

  it("ningún rango cubre ese día de la semana: cae al valor de emergencia (8am)", () => {
    const corte: CorteJornada = [{ dias: [1, 2, 3, 4, 5], hora: 9 }]; // sin sábado/domingo
    expect(horaDeCorte(new Date(2026, 6, 11), corte)).toBe(8); // sábado 11-jul-2026
  });

  it("correrSiFestivo camina festivo tras festivo hasta el primer día hábil (con diasManuales sintéticos)", () => {
    const corte: CorteJornada = [
      { dias: [1], hora: 8, correrSiFestivo: true },
      { dias: [2, 3, 4, 5], hora: 7.5 },
      { dias: [6, 0], hora: 7 },
    ];
    // Lunes 3-ago y martes 4-ago-2026 cerrados a mano los dos: el corte de
    // 8am debería aterrizar recién el miércoles 5-ago.
    const diasManuales = { "2026-08-03": true, "2026-08-04": true };
    expect(horaDeCorte(new Date(2026, 7, 3), corte, diasManuales)).toBe(8); // lunes cerrado: sin rango normal que lo cubra → 8 de emergencia
    expect(horaDeCorte(new Date(2026, 7, 4), corte, diasManuales)).toBe(7.5); // martes cerrado, todavía no aterriza: usa su rango normal
    expect(horaDeCorte(new Date(2026, 7, 5), corte, diasManuales)).toBe(8); // miércoles: acá aterriza el corte largo
    expect(horaDeCorte(new Date(2026, 7, 6), corte, diasManuales)).toBe(7.5); // jueves: ya vuelve a la normalidad
  });
});

describe("jornadaDe — corte editable (BUSINESS-RULES.md regla 1)", () => {
  it("con el corte por defecto explícito da lo mismo que sin pasarlo", () => {
    expect(jornadaDe(2026, 7, 14, 7.483, CORTE_JORNADA_POR_DEFECTO)).toBe(
      jornadaDe(2026, 7, 14, 7.483)
    );
  });

  it("un corte de medianoche (0am) hace que toda hora cuente para su propio día", () => {
    const corte: CorteJornada = [{ dias: [0, 1, 2, 3, 4, 5, 6], hora: 0 }];
    expect(jornadaDe(2026, 7, 14, 0.5, corte)).toBe("2026-07-14");
    expect(jornadaDe(2026, 7, 11, 0.5, corte)).toBe("2026-07-11");
  });

  it("un corte más tarde (10am entre semana, 9am sábado) corre el límite", () => {
    const corte: CorteJornada = [{ dias: [0, 1, 2, 3, 4, 5], hora: 10 }, { dias: [6], hora: 9 }];
    expect(jornadaDe(2026, 7, 14, 9.5, corte)).toBe("2026-07-13"); // martes 9:30 sigue siendo lunes
    expect(jornadaDe(2026, 7, 14, 10.5, corte)).toBe("2026-07-14"); // martes 10:30 ya es martes
    expect(jornadaDe(2026, 7, 11, 8.5, corte)).toBe("2026-07-10"); // sábado 8:30 sigue siendo viernes
    expect(jornadaDe(2026, 7, 11, 9.5, corte)).toBe("2026-07-11"); // sábado 9:30 ya es sábado
  });
});

describe("fechaEffi — la fecha de Effi en todos los formatos", () => {
  const casos: Array<[string, Date | string | null, string | null]> = [
    ["fecha como Date, 2am del sábado → viernes", new Date(2026, 6, 11, 2, 0), "2026-07-10"],
    ["fecha como Date, 8am del sábado → sábado", new Date(2026, 6, 11, 8, 0), "2026-07-11"],
    ["texto AAAA-MM-DD con hora de madrugada", "2026-07-11 02:00:28", "2026-07-10"],
    ["texto AAAA-MM-DD con hora de la tarde", "2026-07-11 15:20:00", "2026-07-11"],
    ["texto DD/MM/AAAA con hora de madrugada", "11/07/2026 03:15", "2026-07-10"],
    ["texto sin hora se queda en su día", "2026-07-11", "2026-07-11"],
    ["martes 07:29 → lunes", "2026-07-07 07:29:00", "2026-07-06"],
    ["martes 07:31 → martes", "2026-07-07 07:31:00", "2026-07-07"],
    ["celda vacía no rompe", null, null],
  ];
  it.each(casos)("%s", (_nombre, celda, esperado) => {
    expect(fechaEffi(celda)).toBe(esperado);
  });

  it("respeta un corte propio en vez del de la regla vigente", () => {
    const corte: CorteJornada = [{ dias: [0, 1, 2, 3, 4, 5], hora: 10 }, { dias: [6], hora: 9 }];
    expect(fechaEffi("2026-07-14 09:30:00", corte)).toBe("2026-07-13");
    expect(fechaEffi("2026-07-14 10:30:00", corte)).toBe("2026-07-14");
  });

  it("respeta diasManuales para correrSiFestivo (lunes 06-jul, no festivo, cerrado a mano)", () => {
    const corte: CorteJornada = [
      { dias: [1], hora: 8, correrSiFestivo: true },
      { dias: [2, 3, 4, 5], hora: 7.5 },
      { dias: [6, 0], hora: 7 },
    ];
    // Sin marcar el lunes como cerrado, el martes usa su corte normal (7:30).
    expect(fechaEffi("2026-07-07 07:45:00", corte)).toBe("2026-07-07");
    // Marcándolo a mano, el martes hereda el corte largo del lunes (8am).
    expect(fechaEffi("2026-07-07 07:45:00", corte, { "2026-07-06": true })).toBe("2026-07-06");
  });
});
