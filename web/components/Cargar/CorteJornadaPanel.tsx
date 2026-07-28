"use client";

import { useState } from "react";
import type { CorteJornada } from "@/lib/motor";
import { useCargar } from "@/lib/store/cargar";
import { ejecutarGuardarCorteJornada } from "@/lib/data/escribir-ajustes";
import { ModoEscrituraToggle } from "./ModoEscrituraToggle";

/**
 * Panel "Corte de jornada" (BUSINESS-RULES.md regla 1). Antes era un valor fijo
 * en el código (8am, 7am sábado); se volvió editable el 28-jul-2026 porque la
 * jornada de la agencia cambió. El cambio solo aplica hacia adelante: los días
 * ya cerrados quedan como están (regla 7/8), esto solo cambia a qué día
 * operativo se asigna una venta nueva al calcular.
 */
const inputCls =
  "w-[120px] rounded-lg border border-d-sup-3 bg-d-sup-2 px-2.5 py-1.5 text-sm text-d-txt outline-none focus:outline-2 focus:outline-turquesa";

/** "HH:MM" → horas decimales (6:45 → 6.75), o null si no es una hora válida. */
function horaValida(texto: string): number | null {
  const m = texto.trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!m) return null;
  const h = +m[1];
  const min = +m[2];
  if (h < 0 || h > 23 || min < 0 || min > 59) return null;
  return h + min / 60;
}

/** Horas decimales → "HH:MM" (6.75 → "06:45"), para mostrar y para el <input type="time">. */
function horaATexto(horas: number): string {
  const totalMin = Math.round(horas * 60);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export function CorteJornadaPanel() {
  const { corteJornada, ajustesRaw, modoEscritura, aplicarGuardarCorteLocal } = useCargar();
  const [semana, setSemana] = useState(horaATexto(corteJornada.semana));
  const [sabado, setSabado] = useState(horaATexto(corteJornada.sabado));
  const [pendiente, setPendiente] = useState<CorteJornada | null>(null);
  const [escribiendo, setEscribiendo] = useState(false);
  const [mensaje, setMensaje] = useState<{ ok: boolean; texto: string } | null>(null);
  const modoVivo = modoEscritura === "vivo";

  // Cuando cambia el corte vigente (hidratación de la nube, o tras guardar),
  // los campos se resincronizan como punto de partida a editar.
  const [base, setBase] = useState(corteJornada);
  if (base.semana !== corteJornada.semana || base.sabado !== corteJornada.sabado) {
    setBase(corteJornada);
    setSemana(horaATexto(corteJornada.semana));
    setSabado(horaATexto(corteJornada.sabado));
  }

  function prepararGuardar() {
    setMensaje(null);
    const s = horaValida(semana);
    const b = horaValida(sabado);
    if (s == null || b == null) {
      setMensaje({ ok: false, texto: "Las dos horas deben tener formato HH:MM (por ejemplo 6:45)." });
      return;
    }
    if (s === corteJornada.semana && b === corteJornada.sabado) {
      setMensaje({ ok: false, texto: "Es el mismo corte que ya está guardado." });
      return;
    }
    setPendiente({ semana: s, sabado: b });
  }

  async function confirmar() {
    if (!pendiente) return;
    setEscribiendo(true);
    const res = await ejecutarGuardarCorteJornada(ajustesRaw, pendiente);
    setEscribiendo(false);
    if (!res.ok) {
      setMensaje({ ok: false, texto: `No se pudo escribir: ${res.error}` });
      return;
    }
    aplicarGuardarCorteLocal(pendiente);
    setMensaje({
      ok: true,
      texto: `Corte guardado: ${horaATexto(pendiente.semana)}am entre semana, ${horaATexto(pendiente.sabado)}am sábado.`,
    });
    setPendiente(null);
  }

  return (
    <section>
      <h2 className="mb-3 text-[22px] font-black tracking-tight text-d-txt">Corte de jornada</h2>
      <div className="rounded-card border border-d-sup-3 bg-d-sup p-6 shadow-card">
        <p className="mb-4 text-[13px] text-d-txt-2">
          Una venta con hora antes del corte pertenece a la jornada del día anterior. Aplica a Dropi
          (fecha + hora) y a Effi cuando la celda trae hora. El cambio solo afecta ventas que se
          calculen de ahora en adelante — los días ya cerrados no se recalculan.
        </p>
        <div className="flex flex-wrap items-end gap-3">
          <label className="text-[13px] font-semibold text-d-txt-2">
            Corte entre semana
            <input
              type="time"
              value={semana}
              onChange={(e) => setSemana(e.target.value)}
              className={`mt-1 block ${inputCls}`}
            />
          </label>
          <label className="text-[13px] font-semibold text-d-txt-2">
            Corte sábado
            <input
              type="time"
              value={sabado}
              onChange={(e) => setSabado(e.target.value)}
              className={`mt-1 block ${inputCls}`}
            />
          </label>
          <button
            onClick={prepararGuardar}
            className="rounded-full bg-turquesa px-4 py-2 text-[13px] font-bold text-d-en-turquesa hover:brightness-110"
          >
            Guardar corte
          </button>
          <ModoEscrituraToggle />
        </div>
        <p className="mt-2.5 text-[13px] text-d-txt-2">
          Vigente hoy: <b className="text-d-txt">{horaATexto(corteJornada.semana)}am</b> entre semana,{" "}
          <b className="text-d-txt">{horaATexto(corteJornada.sabado)}am</b> el sábado.
        </p>

        {pendiente && (
          <div className="mt-4 rounded-card-sm border border-turquesa/30 bg-turquesa/[0.07] p-4 text-sm">
            <p className="mb-2 text-xs font-extrabold uppercase tracking-[0.12em] text-turquesa-prof">
              {modoVivo ? "Confirmar escritura" : "Vista previa — no se escribe nada"}
            </p>
            <p className="text-d-txt">
              Upsert en <code className="text-turquesa">ajustes</code>: corte entre semana{" "}
              {horaATexto(corteJornada.semana)}am → <b>{horaATexto(pendiente.semana)}am</b>, corte sábado{" "}
              {horaATexto(corteJornada.sabado)}am → <b>{horaATexto(pendiente.sabado)}am</b>
            </p>
            <div className="mt-3 flex gap-2">
              {modoVivo && (
                <button
                  onClick={confirmar}
                  disabled={escribiendo}
                  className="rounded-full bg-red-500 px-4 py-2 text-[13px] font-bold text-white hover:brightness-110 disabled:opacity-60"
                >
                  {escribiendo ? "Escribiendo…" : "Escribir en producción"}
                </button>
              )}
              <button
                onClick={() => setPendiente(null)}
                disabled={escribiendo}
                className="rounded-full border border-d-sup-3 px-4 py-2 text-[13px] font-semibold text-d-txt-2 hover:bg-d-sup-2 disabled:opacity-60"
              >
                {modoVivo ? "Cancelar" : "Cerrar vista previa"}
              </button>
            </div>
          </div>
        )}

        {mensaje && (
          <p className={`mt-3 text-sm ${mensaje.ok ? "text-emerald-400" : "text-red-400"}`}>
            {mensaje.ok ? "Listo: " : ""}
            {mensaje.texto}
          </p>
        )}
      </div>
    </section>
  );
}
