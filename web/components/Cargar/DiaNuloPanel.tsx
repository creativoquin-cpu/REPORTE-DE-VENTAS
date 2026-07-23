"use client";

import { useState } from "react";
import { bonita } from "@/lib/motor";
import { useCargar } from "@/lib/store/cargar";
import { ejecutarMarcarNulo, ejecutarQuitarDia } from "@/lib/data/escribir-dias";
import { ModoEscrituraToggle } from "./ModoEscrituraToggle";

/**
 * Panel "Días sin ventas / descanso" (día nulo). Marca días donde el equipo no
 * trabajó y no hubo absolutamente ninguna venta. A DIFERENCIA de "días no
 * laborables", un día nulo NO entra en el reparto de fin de semana: se saca del
 * cálculo (no cuenta ni baja el promedio) y, si tuviera ventas registradas, esas
 * ventas pasan al DÍA ANTERIOR (ej.: sábado 315 + domingo nulo 30 → sábado 345,
 * domingo afuera). Escribe en `dias_manuales` con motivo "Sin ventas"; pasa por
 * la misma VISTA PREVIA (dry-run) antes de tocar producción.
 */
type Pendiente = { tipo: "marcar" | "quitar"; fecha: string };

export function DiaNuloPanel() {
  const { diasNulos, modoEscritura, aplicarMarcarNuloLocal, aplicarQuitarDiaLocal } = useCargar();
  const [fecha, setFecha] = useState("");
  const [pendiente, setPendiente] = useState<Pendiente | null>(null);
  const [escribiendo, setEscribiendo] = useState(false);
  const [mensaje, setMensaje] = useState<{ ok: boolean; texto: string } | null>(null);
  const modoVivo = modoEscritura === "vivo";

  const marcados = Object.keys(diasNulos).sort();

  function prepararMarcar() {
    setMensaje(null);
    if (!fecha) {
      setMensaje({ ok: false, texto: "Elegí una fecha primero." });
      return;
    }
    if (diasNulos[fecha]) {
      setMensaje({ ok: false, texto: "Ese día ya está marcado como día sin ventas." });
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
        ? await ejecutarMarcarNulo(pendiente.fecha)
        : await ejecutarQuitarDia(pendiente.fecha);
    setEscribiendo(false);
    if (!res.ok) {
      setMensaje({ ok: false, texto: `No se pudo escribir: ${res.error}` });
      return;
    }
    if (pendiente.tipo === "marcar") {
      aplicarMarcarNuloLocal(pendiente.fecha);
      setFecha("");
      setMensaje({ ok: true, texto: `Marqué ${bonita(pendiente.fecha)} como día sin ventas.` });
    } else {
      aplicarQuitarDiaLocal(pendiente.fecha);
      setMensaje({ ok: true, texto: `Quité ${bonita(pendiente.fecha)}.` });
    }
    setPendiente(null);
  }

  return (
    <section>
      <h2 className="mb-3 text-[22px] font-black tracking-tight text-d-txt">Días sin ventas (descanso)</h2>
      <div className="rounded-card border border-d-sup-3 bg-d-sup p-6 shadow-card">
        <p className="mb-3 text-[13px] text-d-txt-2">
          Días donde el equipo descansó y no hubo <b>ninguna</b> venta. El día se saca del cálculo:
          <b> no cuenta ni baja el promedio</b>. No se reparte como un fin de semana; si ese día
          quedaron ventas cargadas, pasan al <b>día anterior</b>.
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
            Marcar día sin ventas
          </button>
          <ModoEscrituraToggle />
        </div>

        <div className="mt-4">
          {marcados.length ? (
            <div className="flex flex-wrap gap-2">
              {marcados.map((k) => (
                <span
                  key={k}
                  className="inline-flex items-center gap-1.5 rounded-full border border-red-500/40 bg-red-500/10 px-3 py-1 text-[13px] text-d-txt"
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
            <p className="text-[13px] text-d-txt-2">Ningún día sin ventas marcado.</p>
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
                  <b>{bonita(pendiente.fecha)}</b> (motivo: Sin ventas)
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
