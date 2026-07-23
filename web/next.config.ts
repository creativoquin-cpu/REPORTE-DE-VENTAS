import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Permite abrir el servidor de desarrollo desde otros equipos de la red
  // local (ej. el celular en http://192.168.1.58:3000). Sin esto, Next.js
  // bloquea los recursos de /_next entre orígenes distintos y la página se
  // ve rota o en blanco en esos dispositivos. Solo afecta a `next dev`.
  allowedDevOrigins: ["192.168.1.58"],

  // El panel dejó de tener pestañas (ahora es una sola página que baja, en
  // /admin). Las rutas viejas por pestaña ya no existen: se reenvían a /admin
  // para que los marcadores o el historial no den 404.
  async redirects() {
    return ["cargar", "tablero", "calendario", "comparativo", "vista-vendedor"].map((p) => ({
      source: `/admin/${p}`,
      destination: "/admin",
      permanent: false,
    }));
  },

  // El service worker (Fase 10) nunca debe quedar cacheado por el navegador:
  // así, cuando cambie, el usuario recibe la versión nueva de inmediato.
  async headers() {
    return [
      {
        source: "/sw.js",
        headers: [
          { key: "Content-Type", value: "application/javascript; charset=utf-8" },
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
        ],
      },
    ];
  },
};

export default nextConfig;
