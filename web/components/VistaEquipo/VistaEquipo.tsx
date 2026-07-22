import { KpiCard } from "./KpiCard";
import { GoalProgressBar } from "./GoalProgressBar";
import { RankingList } from "./RankingList";

/**
 * Componente único reutilizado en "/" (vista pública) y en
 * /admin/vista-vendedor. Reemplaza el <iframe src="index.html"> que usaba
 * quin-admin.html:403-406 para no duplicar esta pantalla — ver
 * ../../docs/ARCHITECTURE.md sección 2.2, pestaña 5.
 *
 * TODO Fase 3: reemplazar los datos de ejemplo de abajo por las 4 consultas
 * reales a Supabase (jornadas, metas, dias_manuales, ranking_publico,
 * ver index.html:398-402) y el cálculo con lib/motor (corte de jornada,
 * festivos, reparto, metaEn) — más la gráfica Chart.js del equipo
 * (index.html:268-287) con <ChartCanvas/>.
 */
export function VistaEquipo() {
  const datosDeEjemplo = {
    propias: 0,
    promedio: 0,
    diasEnMeta: 0,
    mejorDia: 0,
    meta: 200,
    ranking: [] as { puesto: number; nombre: string }[],
  };

  return (
    <div className="mx-auto max-w-[1240px] px-6 py-8 pb-11">
      <div className="mb-4 rounded-card-sm border border-menta bg-menta-5 px-4 py-3.5 text-[15px] text-tinta-2">
        Vista de ejemplo — la Fase 3 de la migración conecta esto a Supabase (ver
        docs/MIGRATION-PLAN.md).
      </div>

      <div className="mb-4 grid grid-cols-2 gap-3.5 sm:grid-cols-4">
        <KpiCard etiqueta="Prendas propias del equipo" valor={datosDeEjemplo.propias} destacada />
        <KpiCard etiqueta="Promedio por día" valor={datosDeEjemplo.promedio} />
        <KpiCard etiqueta="Días en meta" valor={datosDeEjemplo.diasEnMeta} />
        <KpiCard etiqueta="Mejor día del equipo" valor={datosDeEjemplo.mejorDia} />
      </div>

      <div className="mb-4 rounded-card border border-black/[0.04] bg-white p-6 shadow-card">
        <h2 className="mb-3 text-[22px] font-black tracking-tight text-tinta">Meta del equipo</h2>
        <GoalProgressBar actual={datosDeEjemplo.propias} meta={datosDeEjemplo.meta} />
      </div>

      <div className="rounded-card border border-black/[0.04] bg-white p-6 shadow-card">
        <h2 className="mb-3 text-[22px] font-black tracking-tight text-tinta">Ranking del mes</h2>
        <RankingList entradas={datosDeEjemplo.ranking} />
      </div>
    </div>
  );
}
