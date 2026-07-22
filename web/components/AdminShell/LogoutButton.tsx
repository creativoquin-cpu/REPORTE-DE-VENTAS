"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function LogoutButton() {
  const router = useRouter();

  async function salir() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <button
      onClick={salir}
      className="rounded-full border border-d-sup-3 px-4 py-2 text-[13px] font-semibold text-d-txt-2 hover:border-d-txt-2 hover:text-d-txt"
    >
      Cerrar sesión
    </button>
  );
}
