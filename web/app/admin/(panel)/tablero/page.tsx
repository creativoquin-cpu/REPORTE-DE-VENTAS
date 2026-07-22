import { TableroPanel } from "@/components/Tablero";
import { cargarEstadoAdmin } from "@/lib/data/admin";

/**
 * Pestaña 2 · Tablero del mes (Fase 5). Carga en el servidor el estado del admin
 * (jornadas/metas/meses con la sesión de la cookie) y lo pasa al panel cliente,
 * que combina eso con el bosquejo del Excel que haya en el store de la sesión.
 */
export default async function TableroPage() {
  const estadoInicial = await cargarEstadoAdmin();
  return <TableroPanel estadoInicial={estadoInicial} />;
}
