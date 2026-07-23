"use client";

import { useEffect } from "react";

/**
 * Registra el service worker (Fase 10). Puerto del registro que la app vieja
 * hacía al final de index.html (navigator.serviceWorker.register("sw.js")).
 * No renderiza nada. Si el navegador no soporta service workers, no hace nada.
 */
export function RegistrarSW() {
  useEffect(() => {
    if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js").catch(() => {
      // Si el registro falla, la app funciona igual (sin modo offline).
    });
  }, []);
  return null;
}
