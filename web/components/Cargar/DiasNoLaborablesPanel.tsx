"use client";

import { useState } from "react";
import { bonita } from "@/lib/motor";
import { useCargar } from "@/lib/store/cargar";
import { ejecutarMarcarDia, ejecutarQuitarDia } from "@/lib/data/escribir-dias";
import { ModoEscrituraToggle } from "./ModoEscrituraToggle";

/**
 * Panel "Días no laborables" (Fase 4d). Puerto de construirCalendario()
 * (quin-admin.html:1084-1116). Sábados, domingos y festivos de Colombia se
 * detectan solos; acá el admin agrega o quita días extra a mano. Escribe en
 * `dias_manuales`, que la vista pública también lee para aplicar el mismo
 * reparto — por eso pasa por la misma VISTA PREVIA (dry-run).
 */
type Pendiente = { tipo: "marcar" | "quitar"; fecha: string };

export function DiasNoLaborablesPanel() {
  const { diasManuales, modoEscritura, aplicarMarcarDiaLocal, aplicarQuitarDiaLocal } = useCargar();
  const [fecha, setFecha] = useState("");
  const [pendiente, setPendiente] = useState<Pendiente | null>(null);
  const [escribiendo, setEscribiendo] = useState(false);
  const [mensaje, setMensaje] = useState<{ ok: boolean; texto: string } | null>(null);
  const modoVivo = modoEscritura === "vivo";

  const marcados = Object.keys(diasManuales).sort();

  function prepararMarcar() {
    setMensaje(null);
    if (!fecha) {
      setMensaje({ ok: false, texto: "Elegí una fecha primero." });
      return;
    }
    if (diasManuales[fecha]) {
      setMensaje({ ok: false, texto: "Ese día ya está marcado como no laborable." });
      return;
    }
    setPendiente({ tipo: "marcar", fecha });
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
      setFecha("");
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
        <p className="mb-3 text-[13px] text-d-txt-2">
          Sábados, domingos y festivos de Colombia se detectan solos. Acá solo agregás los días extra
          que decidas cerrar. Afecta el reparto también en la vista pública.
        </p>

        <div className="flex flex-wrap items-end gap-3">
          <input
            type="date"
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
            className="rounded-lg border border-d-sup-3 bg-d-sup-2 px-2.5 py-1.5 text-sm text-d-txt outline-none focus:outline-2 focus:outline-turquesa"
          />
          <button
            onClick={prepararMarcar}
            className="rounded-full bg-turquesa px-4 py-2 text-[13px] font-bold text-d-en-turquesa hover:brightness-110"
          >
            Marcar como no laborable
          </button>
          <ModoEscrituraToggle />
        </div>

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
