import { CalendarioPanel } from "@/components/Calendario";
import { cargarEstadoAdmin } from "@/lib/data/admin";

/**
 * Pestaña 3 · Calendario (Fase 6). Carga el estado del admin en el servidor y
 * lo pasa al panel cliente, que lo combina con el bosquejo del Excel del store.
 * Solo lectura: explora las jornadas por fechas con selección por arrastre.
 */
export default async function CalendarioPage() {
  const estadoInicial = await cargarEstadoAdmin();
  return <CalendarioPanel estadoInicial={estadoInicial} />;
}
