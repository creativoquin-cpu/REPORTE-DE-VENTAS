import { ComparativoPanel } from "@/components/Comparativo";
import { cargarEstadoAdmin } from "@/lib/data/admin";

/**
 * Pestaña 4 · Comparativo (Fase 7). Carga el estado del admin en el servidor y
 * lo pasa al panel cliente, que lo combina con el bosquejo del Excel del store.
 * Solo lectura: compara meses entre sí, no escribe nada.
 */
export default async function ComparativoPage() {
  const estadoInicial = await cargarEstadoAdmin();
  return <ComparativoPanel estadoInicial={estadoInicial} />;
}
