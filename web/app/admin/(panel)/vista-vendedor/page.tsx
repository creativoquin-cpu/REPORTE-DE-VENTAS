import { VistaEquipo } from "@/components/VistaEquipo";

/**
 * Antes esto era un <iframe src="index.html"> (quin-admin.html:403-406,
 * decisión del paso 10.5 para no duplicar la implementación). Ahora es
 * literalmente el mismo componente que renderiza "/", sin iframe y sin dos
 * copias de la misma lógica — ver ../../../../docs/ARCHITECTURE.md sección 2.2.
 */
export default function VistaVendedorPage() {
  return <VistaEquipo />;
}
