"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const PESTANAS = [
  { href: "/admin/cargar", etiqueta: "1 · Cargar y validar" },
  { href: "/admin/tablero", etiqueta: "2 · Tablero del mes" },
  { href: "/admin/calendario", etiqueta: "3 · Calendario" },
  { href: "/admin/comparativo", etiqueta: "4 · Comparativo" },
  { href: "/admin/vista-vendedor", etiqueta: "5 · Vista del vendedor" },
];

/**
 * Puerto de la nav de 5 pestañas (quin-admin.html:313-319), pero ahora
 * cada una es una ruta real en vez de mostrar(n) alternando `display` de
 * 5 divs — ver ../../docs/MIGRATION-PLAN.md, Fases 4-8.
 */
export function AdminNav() {
  const pathname = usePathname();
  return (
    <nav className="flex gap-1 overflow-x-auto border-b border-d-sup-3 px-6">
      {PESTANAS.map((p) => {
        const activo = pathname === p.href;
        return (
          <Link
            key={p.href}
            href={p.href}
            className={`border-b-2 px-4 py-3 text-sm font-semibold whitespace-nowrap ${
              activo
                ? "border-turquesa text-turquesa"
                : "border-transparent text-d-txt-2 hover:text-d-txt"
            }`}
          >
            {p.etiqueta}
          </Link>
        );
      })}
    </nav>
  );
}
