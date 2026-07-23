import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

/**
 * Gate de sesión para /admin/*. En Next.js 16 esto se llama "proxy"
 * (antes "middleware") — ver node_modules/next/dist/docs/01-app/01-getting-started/16-proxy.md.
 *
 * IMPORTANTE: esto es solo una comodidad de UX (evita el parpadeo del panel
 * antes de redirigir a /admin/login). NO es la barrera de seguridad real.
 * El permiso de administrador se verifica en Postgres en cada consulta
 * (RLS + privado.es_admin(), ver ../docs/BUSINESS-RULES.md regla 10). Un
 * bug acá no filtraría ven/tie/dropi — esas columnas ni siquiera están
 * concedidas al rol anon en la base.
 */
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  const esLogin = path === "/admin/login";
  const esAdmin = path.startsWith("/admin");

  if (esAdmin && !esLogin && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin/login";
    return NextResponse.redirect(url);
  }

  if (esLogin && user) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin";
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: ["/admin/:path*"],
};
