"use client";

import { useEffect } from "react";
import { useCargar } from "./cargar";
import type { EstadoAdminInicial } from "@/lib/data/admin";

/**
 * Vuelca al store el estado de la nube cargado en el servidor, una vez al
 * montar. El estado del Excel (filas/filtros) persiste en el store, así que
 * `hidratarNube` solo pisa la parte de la nube preservando lo del Excel.
 *
 * Desde que el panel es una sola página con las cinco secciones apiladas, este
 * hook se llama varias veces con EL MISMO `estadoInicial` (una por sección).
 * Para no hidratar cinco veces, se recuerda el último objeto hidratado y se
 * salta si es el mismo: solo la primera sección hidrata. Si llega un
 * `estadoInicial` nuevo (otra carga del servidor), vuelve a hidratar.
 */
let ultimoHidratado: EstadoAdminInicial | null = null;

export function useHidratarNube(estadoInicial: EstadoAdminInicial) {
  const hidratarNube = useCargar((s) => s.hidratarNube);
  useEffect(() => {
    if (ultimoHidratado === estadoInicial) return;
    ultimoHidratado = estadoInicial;
    hidratarNube(estadoInicial);
  }, [estadoInicial, hidratarNube]);
}
