interface KpiCardProps {
  etiqueta: string;
  valor: string | number;
  pie?: string;
  destacada?: boolean;
}

/** Puerto de la función kpi() — index.html:253-257. */
export function KpiCard({ etiqueta, valor, pie, destacada }: KpiCardProps) {
  return (
    <div
      className={`flex min-w-0 flex-col gap-1 rounded-card border border-black/[0.04] p-5 shadow-card ${
        destacada ? "bg-tinta" : "bg-white"
      }`}
    >
      <span
        className={`text-sm leading-tight font-semibold ${destacada ? "text-gris-5" : "text-gris-2"}`}
      >
        {etiqueta}
      </span>
      <span
        className={`text-[38px] leading-tight font-black tracking-tight tabular-nums ${
          destacada ? "text-turquesa" : "text-tinta"
        }`}
      >
        {valor}
      </span>
      {pie && (
        <span className={`text-sm font-normal ${destacada ? "text-gris-5" : "text-gris"}`}>
          {pie}
        </span>
      )}
    </div>
  );
}
