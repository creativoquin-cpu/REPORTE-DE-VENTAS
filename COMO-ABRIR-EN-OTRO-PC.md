# Cómo abrir el proyecto en otro PC

Guía rápida para retomar el trabajo en otra computadora. El proyecto vive en
GitHub, así que basta con clonarlo y configurar las claves.

## 1. Instalar lo básico

- **Git** → https://git-scm.com/downloads
- **Node.js** (versión 20 o superior) → https://nodejs.org

Para verificar que quedaron instalados, en una terminal:

```bash
git --version
node -v
```

## 2. Clonar el repositorio

```bash
git clone https://github.com/creativoquin-cpu/REPORTE-DE-VENTAS.git
cd REPORTE-DE-VENTAS/web
```

Todo el código de la app nueva (Next.js) está dentro de la carpeta **`web/`**.

## 3. Poner las claves de Supabase (`.env.local`)

⚠️ **Importante:** el archivo `web/.env.local` **NO** está en GitHub a propósito
(tiene claves, una de ellas secreta). Sin ese archivo, el panel de administrador
no se conecta a la base de datos.

Tenés que llevarlo aparte desde el PC actual (por USB, Drive, etc.) y ponerlo en
`REPORTE-DE-VENTAS/web/.env.local`. Debe tener estas tres variables:

```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SECRET_KEY=...
```

Los valores salen del panel de Supabase (Project Settings → API) si no podés
copiar el archivo. **Nunca** subas `.env.local` a git ni lo pegues en un chat.

## 4. Instalar dependencias y arrancar

```bash
npm install
npm run dev
```

Después abrí en el navegador:

- Vista pública del equipo → **http://localhost:3000**
- Panel de administrador → **http://localhost:3000/admin**
  (login con tu correo y contraseña de siempre)

## 5. Comandos útiles

```bash
npm run dev      # servidor de desarrollo (lo que usás para trabajar)
npm run build    # compilar para verificar que todo está bien
npx vitest run   # correr los tests del motor y del dibujo
npm run lint     # revisar estilo de código
```

## Notas

- **No hace falta Vercel** para trabajar acá: Vercel es solo para el sitio en
  vivo. GitHub alcanza para el desarrollo.
- El proyecto de Vercel a conservar es el que está **conectado a este repo**
  (`creativoquin-cpu/REPORTE-DE-VENTAS`); los demás se pueden borrar desde el
  dashboard de Vercel (Settings → Delete Project).
- Para guardar cambios nuevos en la nube:
  ```bash
  git add -A
  git commit -m "Quin: descripción del cambio"
  git push origin main
  ```
