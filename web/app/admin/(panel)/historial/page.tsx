import { cargarEstadoAdmin } from "@/lib/data/admin";
import { HistorialJornadas } from "@/components/Historial";

/**
 * Historial de jornadas oficiales en su propia página (botón "Ver historial
 * completo" en la cabecera del panel). Reusa cargarEstadoAdmin() porque ya
 * trae TODAS las jornadas cerradas (sin filtro de fecha, ver lib/data/admin.ts).
 */
export default async function HistorialPage() {
  const estado = await cargarEstadoAdmin();
  return (
    <HistorialJornadas
      jornadas={estado.jornadas}
      metas={estado.metas}
      diasNulos={estado.diasNulos}
      diasManuales={estado.diasManuales}
    />
  );
}
