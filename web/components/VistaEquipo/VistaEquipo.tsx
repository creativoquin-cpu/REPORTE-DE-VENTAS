import { KpiCard } from "./KpiCard";
import { GoalProgressBar } from "./GoalProgressBar";
import { RankingList } from "./RankingList";
import { TeamChart } from "./TeamChart";
import { cargarVistaEquipo } from "@/lib/data/equipo";
import { bonita, MESES_L } from "@/lib/motor/fechas";

/**
 * Vista pública del equipo (Fase 3). Server Component asíncrono: carga las 4
 * consultas públicas de Supabase y calcula el resumen con el motor puro, luego
 * pinta KPIs, gráfica, meta y ranking. Puerto de pintarVendedorPublico()
 * (index.html:302-387).
 *
 * Componente único reutilizado en "/" (vista pública) y en la sección "Vista
 * del vendedor" del panel (última sección de components/PanelCompleto) —
 * reemplaza el <iframe src="index.html"> de quin-admin.html:403-406. Nunca
 * muestra cifras por persona (docs/BUSINESS-RULES.md regla 9).
 */

const avisoBox =
  "mb-4 rounded-card-sm border border-menta bg-menta-5 px-4 py-3.5 text-[15px] text-tinta-2";
const cardBox = "rounded-card border border-black/[0.04] bg-white p-6 shadow-card";
const h2Box = "mb-3 text-[22px] font-black tracking-tight text-tinta";

export async function VistaEquipo() {
  const { mes, resumen, ranking, error } = await cargarVistaEquipo();
  const [anio, m] = mes.split("-");
  const subtitulo = `Mes en curso: ${MESES_L[+m - 1]} ${anio}. Cifras del equipo.`;
  const n = resumen.claves.length;
  const plural = (x: number) => (x === 1 ? "" : "s");

  return (
    <div className="mx-auto max-w-[1240px] px-6 py-8 pb-11">
      <p className="mb-4 text-sm text-gris">{subtitulo}</p>

      {error && (
        <div className={avisoBox}>
          <b>No se pudo conectar.</b> Probá de nuevo en un momento.
        </div>
      )}

      {!error && n === 0 && (
        <div className={avisoBox}>
          <b>Todavía no hay ventas cargadas este mes.</b>
        </div>
      )}

      {!error && n > 0 && (
        <>
          {resumen.abiertas.length > 0 && (
            <div className={avisoBox}>
              Hay{" "}
              <b>
                {resumen.abiertas.length} día{plural(resumen.abiertas.length)}
              </b>{" "}
              que todavía no cierra el administrador. Esas cifras pueden cambiar.
              {resumen.ultimaSubida &&
                ` Subidas por última vez: ${new Date(resumen.ultimaSubida).toLocaleString(
                  "es-CO",
                  { dateStyle: "short", timeStyle: "short" }
                )}.`}
            </div>
          )}

          <div className="mb-4 grid grid-cols-2 gap-3.5 sm:grid-cols-4">
            <KpiCard
              etiqueta="Prendas propias del equipo"
              valor={resumen.total}
              pie={`en ${n} día${plural(n)}`}
              destacada
            />
            <KpiCard
              etiqueta="Promedio por día"
              valor={resumen.promedio}
              pie={`meta de ${resumen.metaHoyPropias}`}
            />
            <KpiCard etiqueta="Días en meta" valor={resumen.diasEnMeta} pie={`de ${n} día${plural(n)}`} />
            <KpiCard
              etiqueta="Mejor día del equipo"
              valor={resumen.mejor ? resumen.mejor.valor : "—"}
              pie={resumen.mejor ? bonita(resumen.mejor.clave) : ""}
            />
          </div>

          <div className={`mb-4 ${cardBox}`}>
            <h2 className={h2Box}>Cómo va el equipo</h2>
            <p className="mb-3 text-sm text-gris">
              Prendas propias por día, con la meta del equipo.
            </p>
            <div className="mb-3 flex flex-wrap gap-4 text-[13px] text-gris-2">
              <span className="flex items-center gap-1.5">
                <i className="inline-block h-3 w-3 rounded-sm bg-turquesa" />
                Propias del equipo
              </span>
              <span className="flex items-center gap-1.5">
                <i className="inline-block h-0.5 w-[18px] bg-tinta" />
                Meta del equipo
              </span>
            </div>
            <TeamChart
              claves={resumen.claves}
              porDia={resumen.porDia}
              metaPorDia={resumen.metaPorDia}
            />
          </div>

          <div className={`mb-4 ${cardBox}`}>
            <p className="mb-1 text-xs font-extrabold tracking-[0.12em] text-turquesa-prof">
              META DEL EQUIPO
            </p>
            <h2 className={h2Box}>Meta de propias del mes</h2>
            <GoalProgressBar actual={resumen.total} meta={resumen.metaPeriodo} />
          </div>

          <div className={cardBox}>
            <h2 className={h2Box}>Ranking del mes</h2>
            <RankingList entradas={ranking} />
          </div>
        </>
      )}
    </div>
  );
}
