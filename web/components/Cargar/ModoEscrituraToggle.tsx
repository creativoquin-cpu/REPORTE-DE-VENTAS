"use client";

import { useCargar } from "@/lib/store/cargar";

/**
 * Interruptor Vista previa / En vivo, compartido por los paneles que escriben
 * (jornadas y cierre). El estado vive en el store, así que ambos quedan
 * sincronizados. Por defecto "Vista previa" (dry-run): nada toca la nube hasta
 * pasar deliberadamente a "En vivo".
 */
export function ModoEscrituraToggle() {
  const { modoEscritura, setModoEscritura } = useCargar();
  const vivo = modoEscritura === "vivo";
  return (
    <div className="inline-flex overflow-hidden rounded-full border border-d-sup-3 text-[13px]">
      <button
        onClick={() => setModoEscritura("preview")}
        className={`px-3 py-1.5 font-semibold ${!vivo ? "bg-turquesa text-d-en-turquesa" : "text-d-txt-2"}`}
      >
        Vista previa
      </button>
      <button
        onClick={() => setModoEscritura("vivo")}
        className={`px-3 py-1.5 font-semibold ${vivo ? "bg-red-500 text-white" : "text-d-txt-2"}`}
      >
        En vivo
      </button>
    </div>
  );
}
