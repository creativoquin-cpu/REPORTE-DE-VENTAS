import { cargarEstadoAdmin } from "@/lib/data/admin";
import { PanelCompleto } from "@/components/PanelCompleto";
import { VistaEquipo } from "@/components/VistaEquipo";

/**
 * Panel de administrador (todas las fases) en UNA sola página que baja en
 * scroll. Carga el estado del admin una vez en el servidor y lo pasa a
 * <PanelCompleto>, que apila las cinco secciones. <VistaEquipo> se renderiza
 * acá (Server Component) y se pasa como slot, porque hace su propia consulta
 * pública y no depende del estado del admin.
 */
export default async function AdminPage() {
  const estadoInicial = await cargarEstadoAdmin();
  return <PanelCompleto estadoInicial={estadoInicial} vistaVendedor={<VistaEquipo />} />;
}
