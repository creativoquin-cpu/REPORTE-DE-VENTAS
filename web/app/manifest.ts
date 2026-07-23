import type { MetadataRoute } from "next";

/**
 * Manifest de la PWA (Fase 10). Puerto de los DOS manifests de la app vieja
 * (manifest.json + manifest-admin.json), fusionados en UNO: ahora es una sola
 * app Next.js, el público (/) y el admin (/admin) viven bajo el mismo origen y
 * scope, así que un único manifest instalable basta. Next enlaza este archivo
 * automáticamente (no hace falta <link rel="manifest">).
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Quin — Ventas",
    short_name: "Quin",
    description: "Cómo va el equipo este mes: prendas propias, meta y ranking.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#fafbfc",
    theme_color: "#17C3C3",
    lang: "es",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
