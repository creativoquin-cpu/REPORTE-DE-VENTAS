import type { ReactNode } from "react";
import { createClient } from "@/lib/supabase/server";
import { AdminNav, LogoutButton } from "@/components/AdminShell";

/**
 * Cabecera + nav de las 5 pestañas del panel — puerto de la estructura de
 * quin-admin.html:299-319. El gate de "¿hay sesión?" ya lo resuelve
 * ../../../proxy.ts antes de llegar acá; este layout solo arma el chrome
 * y muestra el correo de quien entró.
 */
export default async function AdminPanelLayout({ children }: { children: ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="min-h-dvh" data-quin-theme="admin">
      <header className="flex items-center gap-3.5 px-6 py-4">
        <span className="flex-1 text-lg font-black text-d-txt">Agencia Quin</span>
        {user?.email && <span className="text-[13px] text-d-txt-2">{user.email}</span>}
        <LogoutButton />
      </header>
      <AdminNav />
      <main className="p-6">{children}</main>
    </div>
  );
}
