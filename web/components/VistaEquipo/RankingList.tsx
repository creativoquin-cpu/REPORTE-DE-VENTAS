import type { RankingPublicoEntry } from "@/types/database";

interface RankingListProps {
  entradas: Pick<RankingPublicoEntry, "puesto" | "nombre" | "cantidad">[];
}

/**
 * Puerto del bloque de ranking — index.html:371-378. Puesto, nombre y
 * cantidad de cada vendedor (docs/BUSINESS-RULES.md regla 9, actualizada: el
 * equipo pregunta cómo le va, así que ahora sí ve la cifra de cada quien).
 */
export function RankingList({ entradas }: RankingListProps) {
  if (entradas.length === 0) {
    return <p className="text-sm text-gris">Todavía no hay ranking para este mes.</p>;
  }

  const top10 = entradas.slice(0, 10);
  const max = top10.length ? Math.max(...top10.map((e) => e.cantidad)) : 0;
  const medalla = (puesto: number) => {
    if (puesto === 1) return "bg-turquesa text-white";
    if (puesto === 2) return "bg-turquesa/30 text-turquesa-prof";
    if (puesto === 3) return "bg-turquesa/15 text-turquesa-prof";
    return "bg-linea-2 text-gris-2";
  };

  return (
    <div className="flex flex-col gap-1">
      {top10.map((e) => (
        <div
          key={e.puesto}
          className="grid grid-cols-[32px_1fr_auto] items-center gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-linea-2/60"
        >
          <span
            className={`grid h-[29px] w-[29px] place-items-center rounded-full text-sm font-extrabold ${medalla(e.puesto)}`}
          >
            {e.puesto === 1 ? "🏆" : e.puesto}
          </span>
          <div className="min-w-0">
            <span className="block overflow-hidden text-ellipsis whitespace-nowrap text-base font-semibold text-tinta">
              {e.nombre}
            </span>
            <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-linea">
              <div
                className="h-full rounded-full bg-turquesa"
                style={{ width: `${max ? Math.round((e.cantidad / max) * 100) : 0}%` }}
              />
            </div>
          </div>
          <span className="shrink-0 text-sm font-black tabular-nums text-tinta">{e.cantidad}</span>
        </div>
      ))}
      {entradas.length > 10 && (
        <p className="mt-2.5 text-[13px] text-gris">y {entradas.length - 10} más…</p>
      )}
    </div>
  );
}
