import type { ReactNode } from "react";
import { createClient } from "@/lib/supabase/server";
import { LogoutButton } from "@/components/AdminShell";

/**
 * Cabecera del panel. Ya no hay pestañas: el panel es una sola página que baja
 * en scroll (ver ../page.tsx y components/PanelCompleto). El gate de "¿hay
 * sesión?" lo resuelve ../../../proxy.ts antes de llegar acá; este layout solo
 * arma el chrome (cabecera fija con el correo y "cerrar sesión") y deja bajar
 * el contenido.
 */
export default async function AdminPanelLayout({ children }: { children: ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="min-h-dvh" data-quin-theme="admin">
      <header className="sticky top-0 z-20 flex items-center gap-3.5 border-b border-d-sup-3 bg-d-bg/90 px-6 py-4 backdrop-blur">
        <span className="flex-1 text-lg font-black text-d-txt">Agencia Quin</span>
        {user?.email && <span className="text-[13px] text-d-txt-2">{user.email}</span>}
        <LogoutButton />
      </header>
      <main className="p-6">{children}</main>
    </div>
  );
}
