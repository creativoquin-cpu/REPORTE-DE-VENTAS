import { cargarEstadoAdmin } from "@/lib/data/admin";
import { PanelCompleto } from "@/components/PanelCompleto";

/**
 * Panel de administrador en UNA sola página que baja en scroll. Carga el estado
 * del admin una vez en el servidor y lo pasa a <PanelCompleto>, que apila las
 * secciones (Cargar, Tablero, Calendario, Comparativo). La vista del vendedor
 * NO va acá: vive en la página pública "/".
 */
export default async function AdminPage() {
  const estadoInicial = await cargarEstadoAdmin();
  return <PanelCompleto estadoInicial={estadoInicial} />;
}
