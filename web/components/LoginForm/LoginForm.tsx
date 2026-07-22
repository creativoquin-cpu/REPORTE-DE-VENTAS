"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

/**
 * Puerto directo de quin-admin.html:909-936 (textoErrorLogin + el submit de
 * #formLogin). Este componente NO decide si el usuario es administrador —
 * eso lo resuelve Postgres (privado.es_admin()) en cada consulta
 * posterior a que exista sesión. Ver ../../docs/BUSINESS-RULES.md regla 10.
 */
function textoErrorLogin(msg: string): string {
  if (/invalid login credentials/i.test(msg)) return "Correo o contraseña incorrectos";
  return `No se pudo entrar: ${msg}`;
}

export function LoginForm() {
  const router = useRouter();
  const [estado, setEstado] = useState<{ texto: string; esError: boolean }>({
    texto: "",
    esError: false,
  });
  const [enviando, setEnviando] = useState(false);

  async function alEnviar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const email = String(formData.get("email") ?? "").trim();
    const password = String(formData.get("password") ?? "");

    setEnviando(true);
    setEstado({ texto: "Entrando…", esError: false });

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setEstado({ texto: textoErrorLogin(error.message), esError: true });
      setEnviando(false);
      return;
    }

    // El proxy también redirige, pero hacerlo acá evita esperar el
    // próximo request para que se sienta instantáneo.
    router.push("/admin/cargar");
    router.refresh();
  }

  const campoClase =
    "rounded-xl border border-d-sup-3 bg-d-sup-2 px-3.5 py-2.5 text-[15px] text-d-txt outline-none focus:outline-2 focus:outline-turquesa";

  return (
    <form className="flex flex-col gap-3.5" onSubmit={alEnviar}>
      <label className="flex flex-col gap-1.5 text-sm font-semibold text-d-txt-2">
        Correo
        <input name="email" type="email" required autoComplete="username" className={campoClase} />
      </label>
      <label className="flex flex-col gap-1.5 text-sm font-semibold text-d-txt-2">
        Contraseña
        <input
          name="password"
          type="password"
          required
          autoComplete="current-password"
          className={campoClase}
        />
      </label>
      <button
        type="submit"
        disabled={enviando}
        className="rounded-full bg-turquesa px-5 py-3 text-[15px] font-extrabold text-d-en-turquesa transition hover:brightness-110 disabled:cursor-default disabled:opacity-60"
      >
        {enviando ? "Entrando…" : "Entrar"}
      </button>
      {estado.texto && (
        <p className={`text-sm ${estado.esError ? "text-red-400" : "text-d-txt-2"}`}>
          {estado.texto}
        </p>
      )}
    </form>
  );
}
