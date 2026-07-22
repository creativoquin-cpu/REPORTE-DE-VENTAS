"use client";

import { useEffect } from "react";
import { useCargar } from "./cargar";
import type { EstadoAdminInicial } from "@/lib/data/admin";

/**
 * Vuelca al store el estado de la nube cargado en el servidor, una vez al
 * montar. Cada página del panel (cargar, tablero, …) lo llama con lo que trae su
 * propia consulta server-side; el estado del Excel (filas/filtros) persiste en
 * el store entre navegaciones, así que no hay que volver a subirlo al cambiar de
 * pestaña.
 */
export function useHidratarNube(estadoInicial: EstadoAdminInicial) {
  const hidratarNube = useCargar((s) => s.hidratarNube);
  useEffect(() => {
    hidratarNube(estadoInicial);
  }, [estadoInicial, hidratarNube]);
}
