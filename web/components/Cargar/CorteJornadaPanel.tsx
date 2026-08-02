"use client";

import { useState } from "react";
import type { CorteJornada } from "@/lib/motor";
import { useCargar } from "@/lib/store/cargar";
import { ejecutarGuardarCorteJornada } from "@/lib/data/escribir-ajustes";
import { ModoEscrituraToggle } from "./ModoEscrituraToggle";
import { SelectorHora } from "./SelectorHora";

/**
 * Panel "Corte de jornada" (BUSINESS-RULES.md regla 1). Antes era un valor fijo
 * en el código (8am, 7am sábado); se volvió editable el 28-jul-2026 porque la
 * jornada de la agencia cambió. Reescrito a RANGOS el 01-ago-2026 (segundo
 * cambio de regla): ya no alcanza con "entre semana / sábado", cada tramo de
 * días de la semana tiene su propia hora, y el lunes puede correrse al
 * primer día hábil si cae festivo. El cambio solo aplica hacia adelante: los
 * días ya cerrados quedan como están (regla 7/8), esto solo cambia a qué día
 * operativo se asigna una venta nueva al calcular.
 */

// Date.getDay(): 0=domingo … 6=sábado. Orden de despliegue lunes-primero.
const DIA_CHIP = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
const ORDEN_SEMANA = [1, 2, 3, 4, 5, 6, 0];
const ABREV = ["dom", "lun", "mar", "mié", "jue", "vie", "sáb"];
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** dias=[2,3,4,5] → "Mar-Vie"; dias=[6,0] → "Sáb-Dom" (agrupa corridas consecutivas). */
function etiquetaDias(dias: number[]): string {
  const set = new Set(dias);
  const ordenados = ORDEN_SEMANA.filter((d) => set.has(d));
  const grupos: number[][] = [];
  for (const d of ordenados) {
    const ultimo = grupos[grupos.length - 1];
    const posD = ORDEN_SEMANA.indexOf(d);
    const posUltimo = ultimo ? ORDEN_SEMANA.indexOf(ultimo[ultimo.length - 1]) : -2;
    if (ultimo && posUltimo === posD - 1) ultimo.push(d);
    else grupos.push([d]);
  }
  return grupos
    .map((g) =>
      g.length > 1 ? `${cap(ABREV[g[0]])}-${cap(ABREV[g[g.length - 1]])}` : cap(ABREV[g[0]])
    )
    .join(", ");
}

/** "HH:MM" → horas decimales (6:45 → 6.75), o null si no es una hora válida. */
function horaValida(texto: string): number | null {
  const m = texto.trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!m) return null;
  const h = +m[1];
  const min = +m[2];
  if (h < 0 || h > 23 || min < 0 || min > 59) return null;
  return h + min / 60;
}

/** Horas decimales → "HH:MM" 24h (6.75 → "06:45"), para el <SelectorHora>. */
function horaATexto(horas: number): string {
  const totalMin = Math.round(horas * 60);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/** Horas decimales → "6:45am" para mostrar. */
function horaBonita(horas: number): string {
  const totalMin = Math.round(horas * 60);
  let h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  const ampm = h < 12 ? "am" : "pm";
  h = h % 12 || 12;
  return `${h}:${String(m).padStart(2, "0")}${ampm}`;
}

/** Borrador editable de un rango (los días como texto "HH:MM" para el selector). */
interface RangoBorrador {
  dias: number[];
  horaTexto: string;
  correrSiFestivo: boolean;
}

function aBorrador(corte: CorteJornada): RangoBorrador[] {
  return corte.map((r) => ({
    dias: r.dias,
    horaTexto: horaATexto(r.hora),
    correrSiFestivo: !!r.correrSiFestivo,
  }));
}

/** Valida que los 7 días de la semana queden cubiertos por exactamente un rango. */
function validarCobertura(rangos: RangoBorrador[]): string | null {
  const dueño: (number | null)[] = [null, null, null, null, null, null, null];
  for (let i = 0; i < rangos.length; i++) {
    if (!rangos[i].dias.length) return `El rango ${i + 1} no tiene ningún día marcado.`;
    for (const d of rangos[i].dias) {
      if (dueño[d] != null) return `${DIA_CHIP[d]} está en más de un rango — sacalo de uno de los dos.`;
      dueño[d] = i;
    }
  }
  const faltan = dueño
    .map((v, d) => (v == null ? DIA_CHIP[d] : null))
    .filter((x): x is string => x != null);
  if (faltan.length) return `Sin corte asignado: ${faltan.join(", ")}.`;
  return null;
}

function RangoEditor({
  rango,
  onCambiar,
  onQuitar,
  quitable,
}: {
  rango: RangoBorrador;
  onCambiar: (r: RangoBorrador) => void;
  onQuitar: () => void;
  quitable: boolean;
}) {
  function toggleDia(d: number) {
    const dias = rango.dias.includes(d) ? rango.dias.filter((x) => x !== d) : [...rango.dias, d];
    onCambiar({ ...rango, dias });
  }

  return (
    <div className="rounded-card-sm border border-d-sup-3 bg-d-sup-2/40 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1.5">
          {DIA_CHIP.map((label, d) => {
            const activo = rango.dias.includes(d);
            return (
              <button
                key={d}
                type="button"
                onClick={() => toggleDia(d)}
                className={`rounded-full border px-2.5 py-1 text-[12px] font-semibold transition-colors ${
                  activo
                    ? "border-turquesa bg-turquesa text-d-en-turquesa"
                    : "border-d-sup-3 bg-d-sup text-d-txt-2 hover:border-turquesa hover:text-d-txt"
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
        <div className="flex items-center gap-2">
          <SelectorHora value={rango.horaTexto} onChange={(v) => onCambiar({ ...rango, horaTexto: v })} />
          {quitable && (
            <button
              type="button"
              onClick={onQuitar}
              title="Quitar este rango"
              className="rounded-full border border-d-sup-3 px-2.5 py-1.5 text-[13px] font-bold text-d-txt-2 hover:border-red-500 hover:text-red-400"
            >
              ×
            </button>
          )}
        </div>
      </div>
      <label className="mt-3 flex cursor-pointer items-center gap-2 text-[12px] text-d-txt-2">
        <input
          type="checkbox"
          checked={rango.correrSiFestivo}
          onChange={(e) => onCambiar({ ...rango, correrSiFestivo: e.target.checked })}
          className="h-3.5 w-3.5 accent-turquesa"
        />
        Si el día cae festivo, correr este corte al primer día hábil siguiente
      </label>
    </div>
  );
}

const card = "rounded-card border border-d-sup-3 bg-d-sup p-6 shadow-card";

export function CorteJornadaPanel() {
  const { corteJornada, ajustesRaw, modoEscritura, aplicarGuardarCorteLocal } = useCargar();
  const [rangos, setRangos] = useState<RangoBorrador[]>(() => aBorrador(corteJornada));
  const [pendiente, setPendiente] = useState<CorteJornada | null>(null);
  const [escribiendo, setEscribiendo] = useState(false);
  const [mensaje, setMensaje] = useState<{ ok: boolean; texto: string } | null>(null);
  const modoVivo = modoEscritura === "vivo";

  // Cuando cambia el corte vigente (hidratación de la nube, o tras guardar),
  // el borrador se resincroniza como punto de partida a editar.
  const [base, setBase] = useState(corteJornada);
  if (base !== corteJornada) {
    setBase(corteJornada);
    setRangos(aBorrador(corteJornada));
  }

  function cambiarRango(i: number, r: RangoBorrador) {
    setRangos((prev) => prev.map((x, j) => (j === i ? r : x)));
  }

  function quitarRango(i: number) {
    setRangos((prev) => prev.filter((_, j) => j !== i));
  }

  function agregarRango() {
    setRangos((prev) => [...prev, { dias: [], horaTexto: "07:00", correrSiFestivo: false }]);
  }

  function prepararGuardar() {
    setMensaje(null);
    const error = validarCobertura(rangos);
    if (error) {
      setMensaje({ ok: false, texto: error });
      return;
    }
    const corte: CorteJornada = [];
    for (const r of rangos) {
      const hora = horaValida(r.horaTexto);
      if (hora == null) {
        setMensaje({ ok: false, texto: "Alguna hora quedó inválida — volvé a elegirla." });
        return;
      }
      corte.push({ dias: [...r.dias].sort(), hora, correrSiFestivo: r.correrSiFestivo || undefined });
    }
    if (JSON.stringify(corte) === JSON.stringify(corteJornada)) {
      setMensaje({ ok: false, texto: "Es el mismo corte que ya está guardado." });
      return;
    }
    setPendiente(corte);
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
    setMensaje({ ok: true, texto: "Corte guardado." });
    setPendiente(null);
  }

  return (
    <section>
      <h2 className="mb-3 text-[22px] font-black tracking-tight text-d-txt">Corte de jornada</h2>
      <div className={card}>
        <p className="mb-4 text-[13px] text-d-txt-2">
          Una venta con hora antes del corte pertenece a la jornada del día anterior. Aplica a Dropi
          (fecha + hora) y a Effi cuando la celda trae hora. Cada rango cubre uno o más días de la
          semana con su propia hora; un rango puede correrse al siguiente día hábil si el suyo cae
          festivo (ej.: el corte largo del lunes pasa al martes si el lunes es puente). El cambio solo
          afecta ventas que se calculen de ahora en adelante — los días ya cerrados no se recalculan.
        </p>

        <div className="flex flex-col gap-3">
          {rangos.map((r, i) => (
            <RangoEditor
              key={i}
              rango={r}
              onCambiar={(nr) => cambiarRango(i, nr)}
              onQuitar={() => quitarRango(i)}
              quitable={rangos.length > 1}
            />
          ))}
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={agregarRango}
            className="rounded-full border border-d-sup-3 px-4 py-2 text-[13px] font-semibold text-d-txt-2 hover:border-turquesa hover:text-d-txt"
          >
            + Agregar rango
          </button>
          <button
            onClick={prepararGuardar}
            className="rounded-full bg-turquesa px-4 py-2 text-[13px] font-bold text-d-en-turquesa hover:brightness-110"
          >
            Guardar corte
          </button>
          <ModoEscrituraToggle />
        </div>

        <p className="mt-3 text-[13px] text-d-txt-2">
          Vigente hoy:{" "}
          {corteJornada.map((r, i) => (
            <span key={i}>
              <b className="text-d-txt">{etiquetaDias(r.dias)}</b> {horaBonita(r.hora)}
              {r.correrSiFestivo ? " (corre si festivo)" : ""}
              {i < corteJornada.length - 1 ? " · " : ""}
            </span>
          ))}
          .
        </p>

        {pendiente && (
          <div className="mt-4 rounded-card-sm border border-turquesa/30 bg-turquesa/[0.07] p-4 text-sm">
            <p className="mb-2 text-xs font-extrabold uppercase tracking-[0.12em] text-turquesa-prof">
              {modoVivo ? "Confirmar escritura" : "Vista previa — no se escribe nada"}
            </p>
            <p className="text-d-txt">
              Upsert en <code className="text-turquesa">ajustes</code>: nuevo corte —{" "}
              {pendiente.map((r, i) => (
                <span key={i}>
                  <b>
                    {etiquetaDias(r.dias)} {horaBonita(r.hora)}
                    {r.correrSiFestivo ? " (corre si festivo)" : ""}
                  </b>
                  {i < pendiente.length - 1 ? ", " : ""}
                </span>
              ))}
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
