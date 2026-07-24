import type { ReactNode } from "react";
import { createClient } from "@/lib/supabase/server";
import { LogoutButton } from "@/components/AdminShell";
import { LogoQuin, Quino } from "@/components/Marca";

/**
 * Cabecera del panel, con la estética "Jornada Quin" (mockup): una soft-card
 * blanca sobre fondo claro con Quino, el logo y la fecha, dentro de un
 * contenedor centrado. Ya no hay pestañas (el panel baja en scroll) ni barra
 * fija. El gate de "¿hay sesión?" lo resuelve ../../../proxy.ts antes de
 * llegar acá; este layout solo arma el chrome y deja bajar el contenido.
 */
export default async function AdminPanelLayout({ children }: { children: ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const fecha = new Date().toLocaleDateString("es-CO", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const fechaCap = fecha.charAt(0).toUpperCase() + fecha.slice(1);

  return (
    <div className="relative min-h-dvh overflow-hidden" data-quin-theme="admin">
      <div className="decor-grid" />
      <main className="relative mx-auto max-w-[1180px] px-4 py-8 sm:px-6">
        <header className="soft-card flex flex-wrap items-center justify-between gap-4 p-4 sm:p-6">
          <div className="flex items-center gap-4">
            <Quino emocion="bienvenida" alto={64} className="shrink-0" priority />
            <div>
              <p className="eyebrow">Panel administrador</p>
              <div className="mt-1.5">
                <LogoQuin tono="claro" alto={30} priority />
              </div>
              <p className="mt-1.5 text-sm text-d-txt-2">{fechaCap}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {user?.email && <span className="text-[13px] text-d-txt-2">{user.email}</span>}
            <LogoutButton />
          </div>
        </header>
        <div className="mt-8">{children}</div>
      </main>
    </div>
  );
}
