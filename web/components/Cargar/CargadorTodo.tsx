"use client";

import { useRef, type ChangeEvent } from "react";
import * as XLSX from "xlsx";
import type { FilaExcel } from "@/lib/motor";
import type { EstadoArchivo } from "@/lib/store/cargar";

/**
 * Un solo botón "Subir todo": el admin elige los dos Excel de una (o los
 * arrastra) y cada uno se enruta solo a su canal. La detección es por columnas
 * (robusto ante nombres de archivo cambiados) con respaldo por nombre:
 *  - Effi (remisiones): trae "Descripción artículo" / "ID remisión".
 *  - Dropi (órdenes):   trae "VARIACION" / "TIPO DE TIENDA" / "PRODUCTO ID".
 * Reemplaza los dos inputs separados. Puerto ampliado de leerArchivo()
 * (quin-admin.html:982-1002): misma lectura (primera hoja, fechas como Date,
 * defval null), pero para varios archivos y con auto-clasificación.
 */
interface CargadorTodoProps {
  estadoDropi: EstadoArchivo;
  estadoEffi: EstadoArchivo;
  onEstadoDropi: (e: EstadoArchivo) => void;
  onEstadoEffi: (e: EstadoArchivo) => void;
  onFilasDropi: (filas: FilaExcel[] | null) => void;
  onFilasEffi: (filas: FilaExcel[] | null) => void;
}

type Canal = "dropi" | "effi";

function detectar(nombre: string, headers: string[]): Canal | null {
  const h = headers.map((x) => x.toLowerCase());
  const tiene = (s: string) => h.some((x) => x.includes(s));
  // Por columnas (lo más confiable).
  if (tiene("descripción artículo") || tiene("descripcion articulo") || tiene("remisión") || tiene("remision"))
    return "effi";
  if (tiene("variacion") || tiene("variación") || tiene("tipo de tienda") || tiene("producto id") || tiene("transportadora"))
    return "dropi";
  // Respaldo por nombre de archivo.
  const n = nombre.toLowerCase();
  if (n.includes("remis") || n.includes("concepto") || n.includes("effi")) return "effi";
  if (n.includes("orden") || n.includes("dropi") || n.includes("producto")) return "dropi";
  return null;
}

async function leerFilas(f: File): Promise<FilaExcel[]> {
  const buf = await f.arrayBuffer();
  const libro = XLSX.read(new Uint8Array(buf), { type: "array", cellDates: true });
  return XLSX.utils.sheet_to_json<FilaExcel>(libro.Sheets[libro.SheetNames[0]], { defval: null });
}

export function CargadorTodo({
  estadoDropi,
  estadoEffi,
  onEstadoDropi,
  onEstadoEffi,
  onFilasDropi,
  onFilasEffi,
}: CargadorTodoProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  async function alCambiar(e: ChangeEvent<HTMLInputElement>) {
    const archivos = Array.from(e.target.files ?? []);
    if (!archivos.length) return;

    onEstadoDropi({ texto: "", tipo: "leyendo" });
    onEstadoEffi({ texto: "", tipo: "leyendo" });
    const sinReconocer: string[] = [];
    let cargoDropi = false;
    let cargoEffi = false;

    for (const f of archivos) {
      try {
        const filas = await leerFilas(f);
        const headers = filas.length ? Object.keys(filas[0]) : [];
        const canal = detectar(f.name, headers);
        if (canal === "effi") {
          onFilasEffi(filas);
          onEstadoEffi({ texto: `Effi: ${filas.length} filas`, tipo: "ok" });
          cargoEffi = true;
        } else if (canal === "dropi") {
          onFilasDropi(filas);
          onEstadoDropi({ texto: `Dropi: ${filas.length} filas`, tipo: "ok" });
          cargoDropi = true;
        } else {
          sinReconocer.push(f.name);
        }
      } catch (err) {
        sinReconocer.push(`${f.name} (${(err as Error).message})`);
      }
    }

    if (sinReconocer.length) {
      const msg = `No se reconoció: ${sinReconocer.join(", ")}`;
      // Solo avisa en los canales que no cargaron en esta selección, para no
      // pisar el "ok" de uno que sí se reconoció.
      if (!cargoDropi) onEstadoDropi({ texto: msg, tipo: "err" });
      if (!cargoEffi) onEstadoEffi({ texto: msg, tipo: "err" });
    }
    // Permite volver a elegir el mismo archivo.
    e.target.value = "";
  }

  function linea(label: string, estado: EstadoArchivo) {
    const color =
      estado.tipo === "ok" ? "text-turquesa-prof" : estado.tipo === "err" ? "text-red-500" : "text-d-txt-2";
    return (
      <div className="flex items-center gap-2 text-[13px]">
        <span className="font-bold text-d-txt">{label}</span>
        <span className={color}>{estado.texto || "sin cargar"}</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <input
        ref={inputRef}
        type="file"
        accept=".xlsx,.xls"
        multiple
        onChange={alCambiar}
        className="hidden"
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="flex w-fit items-center gap-2 rounded-2xl bg-turquesa px-5 py-3 text-[15px] font-black text-d-en-turquesa shadow-card transition hover:-translate-y-0.5"
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="17 8 12 3 7 8" />
          <line x1="12" x2="12" y1="3" y2="15" />
        </svg>
        Subir todo (Dropi y Effi)
      </button>
      <p className="text-[13px] text-d-txt-2">
        Elegí los dos Excel a la vez; se detecta solo cuál es cuál.
      </p>
      <div className="flex flex-wrap gap-x-6 gap-y-1">
        {linea("Dropi", estadoDropi)}
        {linea("Effi", estadoEffi)}
      </div>
    </div>
  );
}
