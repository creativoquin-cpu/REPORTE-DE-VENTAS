# Quin — web (Next.js)

Reescritura de `index.html` + `quin-admin.html` en Next.js (App Router) +
TypeScript, construida en paralelo a la app vieja (que sigue en producción
en la raíz del repo). Contexto completo, reglas de negocio y el plan fase
por fase están en [`../docs/`](../docs/):

- [`../docs/ARCHITECTURE.md`](../docs/ARCHITECTURE.md) — cómo funciona el sistema actual.
- [`../docs/BUSINESS-RULES.md`](../docs/BUSINESS-RULES.md) — lo que no puede cambiar de comportamiento.
- [`../docs/MIGRATION-PLAN.md`](../docs/MIGRATION-PLAN.md) — checklist de fases.

Este directorio es el resultado de la **Fase 1** de ese plan: estructura,
sistema de diseño portado, y el flujo de login funcionando de punta a
punta contra el proyecto real de Supabase. El resto de pantallas
(Fases 2-10) están marcadas con `TODO Fase N` en el código.

**Estilos**: Tailwind CSS v4. Los tokens de marca (colores, radios, sombras)
están declarados en `app/globals.css` dentro de un bloque `@theme`, así que
generan sus propias utilidades (`bg-turquesa`, `rounded-card`, `shadow-card`,
etc.) en vez de vivir en archivos `.module.css` sueltos.

## Requisitos

- Node 20+ (probado con Node 24).
- Las variables de entorno ya están en `.env.local` (mismas credenciales
  públicas — anon/publishable key — que ya usan `index.html`/`quin-admin.html`
  hoy). `.env.local.example` documenta qué hace falta si se arma desde cero.

## Comandos

```bash
npm run dev      # servidor de desarrollo, http://localhost:3000
npm run build    # build de producción
npm run lint     # ESLint (eslint-config-next)
npm run format   # Prettier
```

## Estructura

```
proxy.ts                      # gate de sesión para /admin/* (antes "middleware", ver el archivo)
app/
  layout.tsx, globals.css     # shell raíz + tokens Tailwind (@theme: tokens públicos + tema oscuro admin)
  page.tsx                    # "/" — vista pública del equipo
  admin/
    login/page.tsx            # login (sin el chrome del panel)
    (panel)/                  # route group: agrupa las 5 pestañas bajo un layout común
      layout.tsx              # cabecera + nav + botón de salir
      cargar/                 # Fase 4 (TODO)
      tablero/                # Fase 5 (TODO)
      calendario/             # Fase 6 (TODO)
      comparativo/            # Fase 7 (TODO)
      vista-vendedor/         # reutiliza <VistaEquipo/> — ya no es un iframe
components/
  VistaEquipo/                # KPIs, meta, ranking — compartido entre "/" y vista-vendedor
  LoginForm/                  # funcional: llama a supabase.auth.signInWithPassword
  ChartCanvas/                # wrapper de Chart.js con destroy() garantizado (arregla el bug del paso 10.2)
  AdminShell/                 # nav de pestañas + botón de logout
lib/
  supabase/client.ts          # cliente para Client Components
  supabase/server.ts          # cliente para Server Components (cookies() async)
  motor/                      # jornada, festivos, reparto, metas — stubs tipados para la Fase 2
store/
  uiStore.ts, adminStore.ts   # Zustand — estado de UI y estado del panel (aún vacío, Fase 4)
types/
  database.ts                 # espejo TS de supabase-esquema.sql
```

## Sobre la seguridad

`proxy.ts` y el layout del panel solo controlan qué se **muestra**. El
permiso real de administrador sigue viviendo en Postgres (RLS +
`privado.es_admin()`, ver `../supabase-esquema.sql` y
`../docs/BUSINESS-RULES.md` regla 10) — igual que en la app actual. Nada de
eso se reimplementa en el cliente.

## Notas de versión

Este scaffold usa **Next.js 16**, que tiene cambios de convención frente a
versiones anteriores (el más relevante acá: `middleware.ts` ahora se llama
`proxy.ts`). Antes de usar una API que no aparezca en este README, conviene
revisar `node_modules/next/dist/docs/` en vez de asumir el comportamiento
de versiones anteriores.
