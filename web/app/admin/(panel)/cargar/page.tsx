import { PanelCargar } from "@/components/Cargar";

/**
 * Pestaña 1 · Cargar y validar. La lógica vive en <PanelCargar> (client:
 * parsea Excel con SheetJS y recalcula con el motor puro). El gate de sesión
 * ya lo resolvió ../../../proxy.ts. Fase 4a de docs/MIGRATION-PLAN.md.
 */
export default function CargarPage() {
  return <PanelCargar />;
}
