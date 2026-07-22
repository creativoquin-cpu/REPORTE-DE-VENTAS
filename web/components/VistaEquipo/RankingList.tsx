import type { RankingPublicoEntry } from "@/types/database";

interface RankingListProps {
  entradas: Pick<RankingPublicoEntry, "puesto" | "nombre">[];
}

/**
 * Puerto del bloque de ranking — index.html:371-378. Solo puesto+nombre,
 * NUNCA cifras individuales (docs/BUSINESS-RULES.md regla 9).
 */
export function RankingList({ entradas }: RankingListProps) {
  if (entradas.length === 0) {
    return <p className="text-sm text-gris">Todavía no hay ranking para este mes.</p>;
  }

  const top10 = entradas.slice(0, 10);

  return (
    <div className="flex flex-col gap-1">
      {top10.map((e) => (
        <div
          key={e.puesto}
          className="grid grid-cols-[32px_1fr] items-center gap-3 rounded-xl px-3 py-2.5"
        >
          <span className="grid h-[29px] w-[29px] place-items-center rounded-full bg-linea-2 text-sm font-extrabold text-gris-2">
            {e.puesto === 1 ? "🏆" : e.puesto}
          </span>
          <span className="overflow-hidden text-ellipsis whitespace-nowrap text-base font-semibold text-tinta">
            {e.nombre}
          </span>
        </div>
      ))}
      {entradas.length > 10 && (
        <p className="mt-2.5 text-[13px] text-gris">y {entradas.length - 10} más…</p>
      )}
    </div>
  );
}
