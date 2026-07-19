-- ###################################################################
-- QUIN — esquema de la base de datos (Supabase / PostgreSQL)
-- ###################################################################
-- Proyecto: creativoquin-cpu's Project
-- URL:      https://vhczimiicebyuytikdat.supabase.co
-- Región:   us-east-2
-- Aplicado: 19-jul-2026
--
-- Este archivo es la copia de referencia de lo que está montado. Si algún día
-- hay que rehacer el proyecto desde cero, se corre esto y queda igual.
--
-- ---------------------------------------------------------------
-- LA IDEA EN UNA FRASE
-- ---------------------------------------------------------------
-- El detalle por vendedor y por tienda NUNCA sale de la base sin la clave del
-- administrador. Quien abre la página sin identificarse solo puede leer cifras
-- del equipo (decisión 11 de la bitácora: el vendedor no ve cifras de nadie).
--
-- Eso NO se logra escondiendo cosas en el código de la página —cualquiera puede
-- leer ese código—, sino quitándole el permiso al visitante dentro de la propia
-- base de datos. Se conceden COLUMNAS, no tablas: el visitante tiene permiso
-- sobre `fecha`, `propias` y `cerrada`, y no lo tiene sobre `ven` ni `tie`.
-- Si intenta leerlas, Postgres le responde "permiso denegado".

-- ###################################################################
-- TABLAS
-- ###################################################################

-- Una fila por día operativo.
-- cerrada_el y fotos son del paso 9.1 (capa de guardado en la nube): guardan
-- lo mismo que ya vivía en el navegador (la fecha de texto del cierre y el
-- historial de re-subidas para el comparativo), y son PRIVADOS igual que ven/tie.
create table public.jornadas (
  fecha        date primary key,
  propias      integer not null default 0,
  dropi        integer not null default 0,
  ven          jsonb   not null default '{}'::jsonb,  -- detalle por vendedor (PRIVADO)
  tie          jsonb   not null default '{}'::jsonb,  -- detalle por tienda   (PRIVADO)
  cerrada      boolean not null default false,
  cerrada_el   text,                                   -- texto "Cerrada el" (PRIVADO)
  fotos        jsonb   not null default '[]'::jsonb,    -- historial de re-subidas (PRIVADO)
  actualizado  timestamptz not null default now()
);

-- Historial de metas: cada cambio es una fila y NADA se borra. La clave es
-- el id (no la fecha "desde"), porque el historial puede tener MÁS DE UNA
-- meta para la misma fecha: la más nueva rige y la anterior queda "reemplazada"
-- pero sigue visible (decisión 14 de la bitácora). No es sensible: el
-- vendedor ya ve "meta del equipo" hoy, así que el público sigue leyendo todo.
create table public.metas (
  id          bigint primary key,
  desde       date not null,
  total       integer not null,
  propias     integer not null,
  cuando      text,
  quien       text,
  actualizado timestamptz not null default now()
);

-- Una sola fila con las casillas de "qué cuenta y qué no".
create table public.ajustes (
  id           integer primary key default 1 check (id = 1),
  datos        jsonb not null default '{}'::jsonb,
  actualizado  timestamptz not null default now()
);

-- El sello del cierre mensual.
create table public.meses (
  mes         text primary key,          -- '2026-07'
  datos       jsonb not null,
  sellado_en  timestamptz not null default now()
);

-- Días marcados a mano como no laborables.
create table public.dias_manuales (
  fecha       date primary key,
  motivo      text,
  actualizado timestamptz not null default now()
);

-- Ranking público: SOLO puesto y nombre, ninguna cifra.
-- Lo escribe el administrador ya calculado, para que el detalle por vendedor
-- no tenga que salir nunca de la tabla privada.
create table public.ranking_publico (
  mes     text    not null,
  puesto  integer not null,
  nombre  text    not null,
  primary key (mes, puesto)
);

-- Quién es administrador. Estar registrado NO alcanza: hay que estar aquí.
create table public.admins (
  user_id  uuid primary key references auth.users(id) on delete cascade,
  nombre   text,
  creado   timestamptz not null default now()
);

-- ###################################################################
-- ¿QUIÉN ES ADMINISTRADOR?
-- ###################################################################
-- Vive en un esquema privado que la API pública no expone, para que nadie
-- pueda llamarla desde internet.
create schema if not exists privado;
revoke all on schema privado from anon, authenticated, public;
grant usage on schema privado to authenticated;

create or replace function privado.es_admin()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (select 1 from public.admins a where a.user_id = auth.uid());
$$;
revoke all on function privado.es_admin() from public, anon;
grant execute on function privado.es_admin() to authenticated;

-- ###################################################################
-- PERMISOS
-- ###################################################################
alter table public.jornadas        enable row level security;
alter table public.metas           enable row level security;
alter table public.ajustes         enable row level security;
alter table public.meses           enable row level security;
alter table public.dias_manuales   enable row level security;
alter table public.ranking_publico enable row level security;
alter table public.admins          enable row level security;

-- se quita todo lo que Supabase concede por defecto y se vuelve a dar a mano
revoke all on public.jornadas, public.metas, public.ajustes, public.meses,
              public.dias_manuales, public.ranking_publico, public.admins
  from anon, authenticated;

-- El administrador puede todo
grant select, insert, update, delete on
  public.jornadas, public.metas, public.ajustes, public.meses,
  public.dias_manuales, public.ranking_publico
  to authenticated;
grant select on public.admins to authenticated;

-- El público solo lee lo que puede ver el vendedor.
-- OJO: se conceden COLUMNAS, no la tabla entera. ven, tie y dropi quedan fuera.
grant select (fecha, propias, cerrada) on public.jornadas       to anon;
grant select                          on public.metas           to anon;
grant select                          on public.ranking_publico to anon;
grant select                          on public.dias_manuales   to anon;

-- ---- políticas ----
create policy admin_todo on public.jornadas
  for all to authenticated using (privado.es_admin()) with check (privado.es_admin());
create policy publico_lee on public.jornadas
  for select to anon using (true);

create policy admin_todo on public.metas
  for all to authenticated using (privado.es_admin()) with check (privado.es_admin());
create policy publico_lee on public.metas
  for select to anon using (true);

create policy admin_todo on public.ranking_publico
  for all to authenticated using (privado.es_admin()) with check (privado.es_admin());
create policy publico_lee on public.ranking_publico
  for select to anon using (true);

create policy admin_todo on public.dias_manuales
  for all to authenticated using (privado.es_admin()) with check (privado.es_admin());
create policy publico_lee on public.dias_manuales
  for select to anon using (true);

-- ajustes y meses son solo del administrador: el visitante no tiene ninguna política
create policy admin_todo on public.ajustes
  for all to authenticated using (privado.es_admin()) with check (privado.es_admin());
create policy admin_todo on public.meses
  for all to authenticated using (privado.es_admin()) with check (privado.es_admin());

create policy admin_se_ve on public.admins
  for select to authenticated using (user_id = auth.uid());

-- ###################################################################
-- DAR DE ALTA AL ADMINISTRADOR
-- ###################################################################
-- 1) Crear la cuenta en el panel de Supabase: Authentication → Users → Add user
--    (con correo y contraseña, marcando "Auto Confirm User").
-- 2) Copiar el ID que queda y correr:
--
--    insert into public.admins (user_id, nombre)
--    values ('EL-ID-QUE-COPIASTE', 'Jonatan');
--
-- 3) Importante: apagar el registro abierto en Authentication → Sign In / Up →
--    "Allow new users to sign up", para que nadie más pueda crearse una cuenta.

-- ###################################################################
-- COMPROBACIONES QUE YA SE CORRIERON (19-jul-2026)
-- ###################################################################
-- Visitante sin sesión:
--   ok  ve fecha, propias y cerrada
--   ok  NO puede leer ven (detalle por vendedor)
--   ok  NO puede leer tie (detalle por tienda)
--   ok  NO puede leer dropi
--   ok  NO puede leer ajustes
--   ok  NO puede leer los sellos mensuales
--   ok  NO puede escribir ni borrar jornadas
-- Usuario con sesión que no está en la tabla admins:
--   ok  NO puede escribir
--   ok  NO ve el detalle
-- Linter de seguridad de Supabase: sin advertencias.

-- ###################################################################
-- MIGRACIÓN PENDIENTE (paso 9.1 — capa de guardado en la nube)
-- ###################################################################
-- Este archivo ya quedó actualizado arriba con el esquema final. Pero la
-- base real (la que está aplicada hoy en Supabase) todavía tiene la versión
-- vieja de `jornadas`, `metas` y `dias_manuales`. Falta correr esto UNA VEZ
-- en el SQL Editor de Supabase para que las dos queden iguales:
--
--   https://supabase.com/dashboard/project/vhczimiicebyuytikdat/sql/new
--
-- Es seguro: `metas` está vacía todavía (nadie ha guardado una meta desde la
-- nube), y los `alter table` de jornadas/dias_manuales solo agregan columnas
-- nuevas, no tocan ni borran nada de lo que ya hay.

-- 1) jornadas: dos columnas nuevas, privadas (el visitante NO gana acceso
--    a ellas solo por existir: los permisos son por columna, no automáticos).
alter table public.jornadas add column if not exists cerrada_el text;
alter table public.jornadas add column if not exists fotos jsonb not null default '[]'::jsonb;

-- 2) dias_manuales: para poder comparar qué copia es más reciente al sincronizar.
alter table public.dias_manuales add column if not exists actualizado timestamptz not null default now();

-- 3) metas: la clave tiene que ser el id, no la fecha "desde", porque el
--    historial guarda MÁS DE UNA meta para la misma fecha (las reemplazadas
--    quedan visibles, no se borran — decisión 14 de la bitácora). Con
--    `desde` como clave, la segunda pisaría a la primera. Como la tabla no
--    tiene datos reales todavía, se puede rehacer sin perder nada.
drop table public.metas;
create table public.metas (
  id          bigint primary key,
  desde       date not null,
  total       integer not null,
  propias     integer not null,
  cuando      text,
  quien       text,
  actualizado timestamptz not null default now()
);
alter table public.metas enable row level security;
revoke all on public.metas from anon, authenticated;
grant select, insert, update, delete on public.metas to authenticated;
grant select on public.metas to anon;
create policy admin_todo on public.metas
  for all to authenticated using (privado.es_admin()) with check (privado.es_admin());
create policy publico_lee on public.metas
  for select to anon using (true);
