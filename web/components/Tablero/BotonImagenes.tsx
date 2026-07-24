"use client";

import { useState } from "react";
import { dibujarImagen, IMG_W, IMG_H, type ModoImagen, type Lienzo2D } from "@/lib/imagen/dibujar";
import type { DatosImagen } from "@/lib/motor";

/**
 * Un solo botón baja DOS imágenes (Fase 9): la consolidada (propias + Dropi) y
 * la de ventas propias. Puerto de descargarImagen() (quin-admin.html:2423-2443).
 * Se bajan una tras otra con una pausa corta, porque algunos navegadores
 * ignoran la segunda descarga si sale en el mismo instante.
 *
 * La mascota Quino (emoción "presentando") se dibuja en la imagen; se precarga
 * desde /public antes de generar (mismo origen, así toDataURL no se contamina).
 * Si no carga, la imagen sale igual sin ella.
 *
 * `datos` puede ser null si el mes no tiene días con datos: en ese caso el botón
 * queda deshabilitado, sin `alert()` (a diferencia del original).
 */
const INFORMES: Array<{ modo: ModoImagen; sufijo: string }> = [
  { modo: "total", sufijo: "consolidado" },
  { modo: "propias", sufijo: "propias" },
];

const MASCOTA_SRC = "/quino/presentando.png";

function cargarMascota(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

export function BotonImagenes({ datos }: { datos: DatosImagen | null }) {
  const [bajando, setBajando] = useState(false);

  async function descargar() {
    if (!datos || bajando) return;
    setBajando(true);
    const mascota = await cargarMascota(MASCOTA_SRC);
    INFORMES.forEach((inf, i) => {
      setTimeout(() => {
        const cv = document.createElement("canvas");
        cv.width = IMG_W;
        cv.height = IMG_H;
        const ctx = cv.getContext("2d");
        if (ctx) {
          // El contexto real tipa fillStyle más ancho (gradientes/patrones); el
          // dibujo solo usa colores string, así que Lienzo2D lo cubre.
          dibujarImagen(ctx as unknown as Lienzo2D, datos, mascota, inf.modo);
          const a = document.createElement("a");
          a.href = cv.toDataURL("image/png");
          a.download = `quin-${inf.sufijo}-${datos.dia}.png`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
        }
        if (i === INFORMES.length - 1) setBajando(false);
      }, i * 700);
    });
  }

  return (
    <button
      type="button"
      onClick={descargar}
      disabled={!datos || bajando}
      className="rounded-full border border-d-sup-3 bg-d-sup-2 px-4 py-2 text-[13px] font-semibold text-d-txt-2 hover:border-turquesa hover:text-d-txt disabled:cursor-not-allowed disabled:opacity-40"
    >
      {bajando ? "Generando…" : "Imágenes para WhatsApp (2)"}
    </button>
  );
}
