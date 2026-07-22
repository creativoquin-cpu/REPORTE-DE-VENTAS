import { PanelCargar } from "@/components/Cargar";
import { cargarEstadoAdmin } from "@/lib/data/admin";

/**
 * Pestaña 1 · Cargar y validar. Carga en el servidor el estado privado del
 * admin (jornadas oficiales, sellos, días no laborables, ajustes) con la sesión
 * de la cookie — RLS devuelve las columnas privadas — y lo pasa al panel
 * cliente, que parsea Excel y recalcula con el motor puro. El gate de sesión ya
 * lo resolvió ../../../proxy.ts. Fase 4a + 4b-1 de docs/MIGRATION-PLAN.md.
 */
export default async function CargarPage() {
  const estadoInicial = await cargarEstadoAdmin();
  return <PanelCargar estadoInicial={estadoInicial} />;
}
