-- OVIO v1.0 · 009_registro_identidades.sql
-- Ejecutar SOLAMENTE después de 001..008, en SQL Editor, con copia de seguridad.
-- No elimina usuarios ni reemplaza sus nombres visibles.
-- Si ya hay nombres artísticos activos duplicados (incluso cambiando mayúsculas
-- o espacios), esta migración se detiene: resolverlos antes de reintentar.

begin;

-- Identificador estable para perfiles: las cuentas existentes reciben uno
-- temporal pero inequívocamente único, basado en su UUID, sin cambiar display_name.
alter table public.profiles add column if not exists username text;
update public.profiles
   set username = 'u_' || replace(id::text, '-', '')
 where username is null or btrim(username) = '';

-- Normalizar cualquier username anterior y rechazar formatos inválidos.
update public.profiles set username = lower(btrim(username));
alter table public.profiles alter column username set not null;

-- Usuarios nuevos: 3..24 caracteres; identificadores migrados: 34.
-- Los nombres largos se admiten ÚNICAMENTE si son el temporal derivado
-- del UUID de esa misma cuenta.
alter table public.profiles drop constraint if exists ovio_username_format;
alter table public.profiles add constraint ovio_username_format check (
  (username ~ '^[a-z][a-z0-9_]{2,23}$'
   or username = 'u_' || replace(id::text, '-', ''))
  and username not in ('admin','administrator','soporte','support','ovio','oficial','official','moderador','moderator','staff','seguridad')
);
create unique index if not exists ovio_profiles_username_unique on public.profiles (username);

-- Ante cambios desde el perfil se normaliza y aplica también el índice UNIQUE.
create or replace function public.ovio_normalize_username()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.username := lower(btrim(new.username));
  return new;
end; $$;
drop trigger if exists ovio_normalize_username_trigger on public.profiles;
create trigger ovio_normalize_username_trigger before insert or update of username on public.profiles
for each row execute function public.ovio_normalize_username();

-- Actualizar el trigger de alta SIN tocar otras columnas de profiles.
-- El único modo de conseguir el username durante signup es vía Auth metadata;
-- el UNIQUE de DB decide quién consigue el identificador si hay carrera.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
declare requested text;
begin
  requested := lower(btrim(coalesce(new.raw_user_meta_data ->> 'username', '')));
  if requested = '' then
    requested := 'u_' || replace(new.id::text, '-', '');
  end if;
  insert into public.profiles (id, display_name, username)
  values (new.id,
    left(coalesce(nullif(btrim(new.raw_user_meta_data ->> 'display_name'),''), 'Nuevo oyente'), 60),
    requested);
  return new;
end; $$;
-- El trigger on_auth_user_created YA existe desde 001_initial.sql.
-- No lo recreamos para evitar efectos secundarios.

-- Reservar nombres ARTÍSTICOS solo mientras la solicitud está pendiente o aprobada.
-- Los nombres rechazados se pueden volver a utilizar.
-- La regla ignora el caso y comprime secuencias de espacios.
create or replace function public.ovio_artist_key(value text)
returns text language sql immutable set search_path = '' as $$
  select lower(regexp_replace(btrim(value), '[[:space:]]+', ' ', 'g'));
$$;

-- Un duplicado previo debe revisarse MANUALMENTE: abortar en vez de renombrar artistas.
do $$
begin
  if exists (
    select 1 from public.artist_applications
    where status in ('pending','approved')
    group by public.ovio_artist_key(artist_name)
    having count(*) > 1
  ) then
    raise exception 'OVIO: ya hay nombres artísticos activos duplicados. Consulta las instrucciones PREVIO A LA MIGRACIÓN.';
  end if;
end $$;

create unique index if not exists ovio_artist_active_name_unique
on public.artist_applications (public.ovio_artist_key(artist_name))
where status in ('pending', 'approved');

-- Normalizar las nuevas solicitudes de artista sin cambiar las ya existentes.
create or replace function public.ovio_normalize_artist_name()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.artist_name := regexp_replace(btrim(new.artist_name), '[[:space:]]+', ' ', 'g');
  return new;
end; $$;
drop trigger if exists ovio_artist_name_trigger on public.artist_applications;
create trigger ovio_artist_name_trigger before insert or update of artist_name on public.artist_applications
for each row execute function public.ovio_normalize_artist_name();

-- Comprobación previa para UX: ayuda, pero NO reserva un nombre.
-- La restricción UNIQUE anterior evita carreras concurrentes.
create or replace function public.ovio_username_available(candidate text)
returns boolean language sql stable security definer set search_path = '' as $$
  select
    candidate is not null
    and lower(btrim(candidate)) ~ '^[a-z][a-z0-9_]{2,23}$'
    and lower(btrim(candidate)) not in ('admin','administrator','soporte','support','ovio','oficial','official','moderador','moderator','staff','seguridad')
    and not exists (
      select 1 from public.profiles p where p.username = lower(btrim(candidate))
    );
$$;
revoke all on function public.ovio_username_available(text) from public, anon, authenticated;
grant execute on function public.ovio_username_available(text) to anon, authenticated;

create or replace function public.ovio_artist_name_available(candidate text)
returns boolean language sql stable security definer set search_path = '' as $$
  select
    candidate is not null
    and char_length(btrim(candidate)) between 2 and 70
    and not exists (
      select 1 from public.artist_applications a
      where a.status in ('pending','approved')
        and public.ovio_artist_key(a.artist_name) = public.ovio_artist_key(candidate)
    );
$$;
revoke all on function public.ovio_artist_name_available(text) from public, anon, authenticated;
grant execute on function public.ovio_artist_name_available(text) to authenticated;

commit;
