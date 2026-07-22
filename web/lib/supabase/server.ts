import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

/**
 * Cliente de Supabase para Server Components / Route Handlers — para
 * lecturas del lado servidor (ej. pre-renderizar "/" en la Fase 3).
 *
 * Ojo: este cliente NUNCA debe usarse para decidir en código si alguien es
 * administrador. Esa autorización vive en Postgres (RLS + privado.es_admin,
 * ver ../../docs/BUSINESS-RULES.md regla 10) — este archivo solo habla con
 * Supabase, no reemplaza esa verificación.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Llamado desde un Server Component sin permiso de escritura de
            // cookies; proxy.ts ya se encarga de refrescar la sesión en ese caso.
          }
        },
      },
    }
  );
}
