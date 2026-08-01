import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Cliente de Supabase para Client Components (mismo rol que `sb` en quin-admin.html).
 *
 * Singleton: varias instancias de GoTrueClient compartiendo la misma cookie de
 * sesión corren temporizadores de auto-refresh independientes que compiten
 * entre sí. Cuando dos refrescan el token casi al mismo tiempo (ej. al abrir
 * el historial en otra pestaña mientras hay un formulario abierto en esta),
 * Supabase invalida el refresh token que "llegó tarde" y esa pestaña queda
 * deslogueada. Reusar una única instancia evita la carrera.
 */
let cliente: SupabaseClient | undefined;

export function createClient() {
  if (!cliente) {
    cliente = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }
  return cliente;
}
