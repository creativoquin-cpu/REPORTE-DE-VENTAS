"use client";

import { useState } from "react";
import { bonita } from "@/lib/motor";
import { useCargar } from "@/lib/store/cargar";
import { ejecutarMarcarDia, ejecutarQuitarDia } from "@/lib/data/escribir-dias";
import { ModoEscrituraToggle } from "./ModoEscrituraToggle";
import { CalendarioMarcar } from "./CalendarioMarcar";

/**
 * Panel "Días no laborables" (Fase 4d). Puerto de construirCalendario()
 * (quin-admin.html:1084-1116). Sábados, domingos y festivos de Colombia se
 * detectan solos; acá el admin agrega o quita días extra a mano. Escribe en
 * `dias_manuales`, que la vista pública también lee para aplicar el mismo
 * reparto — por eso pasa por la misma VISTA PREVIA (dry-run).
 */
type Pendiente = { tipo: "marcar" | "quitar"; fecha: string };

export function DiasNoLaborablesPanel() {
  const { diasManuales, diasNulos, modoEscritura, aplicarMarcarDiaLocal, aplicarQuitarDiaLocal } =
    useCargar();
  const [pendiente, setPendiente] = useState<Pendiente | null>(null);
  const [escribiendo, setEscribiendo] = useState(false);
  const [mensaje, setMensaje] = useState<{ ok: boolean; texto: string } | null>(null);
  const modoVivo = modoEscritura === "vivo";

  const marcados = Object.keys(diasManuales).sort();

  // Un clic en el calendario: si el día ya está marcado, prepara quitarlo; si no,
  // prepara marcarlo.
  function elegir(f: string) {
    setMensaje(null);
    setPendiente({ tipo: diasManuales[f] ? "quitar" : "marcar", fecha: f });
  }
  function prepararQuitar(f: string) {
    setMensaje(null);
    setPendiente({ tipo: "quitar", fecha: f });
  }

  async function confirmar() {
    if (!pendiente) return;
    setEscribiendo(true);
    const res =
      pendiente.tipo === "marcar"
        ? await ejecutarMarcarDia(pendiente.fecha)
        : await ejecutarQuitarDia(pendiente.fecha);
    setEscribiendo(false);
    if (!res.ok) {
      setMensaje({ ok: false, texto: `No se pudo escribir: ${res.error}` });
      return;
    }
    if (pendiente.tipo === "marcar") {
      aplicarMarcarDiaLocal(pendiente.fecha);
      setMensaje({ ok: true, texto: `Marqué ${bonita(pendiente.fecha)} como no laborable.` });
    } else {
      aplicarQuitarDiaLocal(pendiente.fecha);
      setMensaje({ ok: true, texto: `Quité ${bonita(pendiente.fecha)}.` });
    }
    setPendiente(null);
  }

  return (
    <section>
      <h2 className="mb-3 text-[22px] font-black tracking-tight text-d-txt">Días no laborables</h2>
      <div className="rounded-card border border-d-sup-3 bg-d-sup p-6 shadow-card">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <p className="text-[13px] text-d-txt-2">
            Sábados, domingos y festivos de Colombia se detectan solos. Tocá un día del calendario
            para agregarlo o quitarlo. Afecta el reparto también en la vista pública.
          </p>
          <ModoEscrituraToggle />
        </div>

        <CalendarioMarcar marcados={diasManuales} otros={diasNulos} onElegir={elegir} color="turquesa" />

        <div className="mt-4">
          {marcados.length ? (
            <div className="flex flex-wrap gap-2">
              {marcados.map((k) => (
                <span
                  key={k}
                  className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/40 bg-amber-500/10 px-3 py-1 text-[13px] text-d-txt"
                >
                  {bonita(k)}
                  <button
                    onClick={() => prepararQuitar(k)}
                    className="font-semibold text-red-400 hover:underline"
                  >
                    quitar
                  </button>
                </span>
              ))}
            </div>
          ) : (
            <p className="text-[13px] text-d-txt-2">Ningún día extra marcado.</p>
          )}
        </div>

        {pendiente && (
          <div className="mt-4 rounded-card-sm border border-turquesa/30 bg-turquesa/[0.07] p-4 text-sm">
            <p className="mb-2 text-xs font-extrabold uppercase tracking-[0.12em] text-turquesa-prof">
              {modoVivo ? "Confirmar escritura" : "Vista previa — no se escribe nada"}
            </p>
            <p className="text-d-txt">
              {pendiente.tipo === "marcar" ? (
                <>
                  Upsert en <code className="text-turquesa">dias_manuales</code>:{" "}
                  <b>{bonita(pendiente.fecha)}</b> (motivo: Marcado a mano)
                </>
              ) : (
                <>
                  Delete en <code className="text-turquesa">dias_manuales</code>:{" "}
                  <b>{bonita(pendiente.fecha)}</b>
                </>
              )}
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
