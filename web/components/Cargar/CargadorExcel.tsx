"use client";

import { useRef, type ChangeEvent } from "react";
import * as XLSX from "xlsx";
import type { FilaExcel } from "@/lib/motor";
import type { EstadoArchivo } from "@/lib/store/cargar";

/**
 * Un cargador de Excel: input de archivo + estado. Puerto de leerArchivo()
 * (quin-admin.html:982-1002). Lee la primera hoja con fechas como Date y
 * defval null, idéntico a la app vieja, y entrega las filas crudas al store.
 */
interface CargadorExcelProps {
  titulo: string;
  pista: string;
  estado: EstadoArchivo;
  onEstado: (e: EstadoArchivo) => void;
  onFilas: (filas: FilaExcel[] | null) => void;
}

export function CargadorExcel({ titulo, pista, estado, onEstado, onFilas }: CargadorExcelProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  function alCambiar(e: ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    onEstado({ texto: "Leyendo…", tipo: "leyendo" });
    const lector = new FileReader();
    lector.onload = (ev) => {
      try {
        const libro = XLSX.read(new Uint8Array(ev.target!.result as ArrayBuffer), {
          type: "array",
          cellDates: true,
        });
        const filas = XLSX.utils.sheet_to_json<FilaExcel>(libro.Sheets[libro.SheetNames[0]], {
          defval: null,
        });
        onFilas(filas);
        onEstado({ texto: `${filas.length} filas leídas`, tipo: "ok" });
      } catch (err) {
        onFilas(null);
        onEstado({ texto: `No se pudo leer: ${(err as Error).message}`, tipo: "err" });
      }
    };
    lector.readAsArrayBuffer(f);
  }

  const colorEstado =
    estado.tipo === "ok" ? "text-turquesa" : estado.tipo === "err" ? "text-red-400" : "text-d-txt-2";

  return (
    <div className="flex-1 min-w-[240px]">
      <label className="mb-1.5 block text-sm font-bold text-d-txt">
        {titulo} <span className="font-normal text-d-txt-2">{pista}</span>
      </label>
      <input
        ref={inputRef}
        type="file"
        accept=".xlsx,.xls"
        onChange={alCambiar}
        className="w-full text-[13px] text-d-txt file:mr-3 file:rounded-lg file:border-0 file:bg-d-sup-3 file:px-3 file:py-2 file:text-[13px] file:font-semibold file:text-d-txt hover:file:brightness-125"
      />
      {estado.texto && <div className={`mt-1.5 text-[13px] ${colorEstado}`}>{estado.texto}</div>}
    </div>
  );
}
