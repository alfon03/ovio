-- OVIO Beta v1.4 · Recogida privada de comentarios y gestión por moderadores.
-- Ejecutar UNA sola vez tras 010, sobre el mismo proyecto. No toca cuentas ni canciones.
-- Revisar en entorno de prueba y hacer backup antes de producción.
begin;
create table if not exists public.beta_feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  category text not null check (category in ('error','usabilidad','idea','otro')),
  screen text not null check (screen in ('Inicio','Buscar','Reproductor','Playlists','Perfil','OVIO Studio','Otra')),
  title text not null check (char_length(btrim(title)) between 8 and 120),
  details text not null check (char_length(btrim(details)) between 15 and 2000),
  priority text not null default 'normal' check(priority in ('normal','high')),
  status text not null default 'open' check(status in ('open','reviewing','resolved','dismissed')),
  response text not null default '' check(char_length(response)<=1000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists beta_feedback_owner_idx on public.beta_feedback(user_id,created_at desc);
create index if not exists beta_feedback_open_idx on public.beta_feedback(created_at desc) where status in ('open','reviewing');
alter table public.beta_feedback enable row level security;
-- Evitar que alguien pueda elevarse a moderador por escribir en columnas protegidas.
revoke all on table public.beta_feedback from public, anon, authenticated;
grant select on table public.beta_feedback to authenticated;
grant insert (user_id,category,screen,title,details,priority) on table public.beta_feedback to authenticated;
grant update (status,response) on table public.beta_feedback to authenticated;

drop policy if exists beta_feedback_read on public.beta_feedback;
create policy beta_feedback_read on public.beta_feedback for select to authenticated
  using (user_id=(select auth.uid()) or (select public.is_admin()));
drop policy if exists beta_feedback_write on public.beta_feedback;
create policy beta_feedback_write on public.beta_feedback for insert to authenticated
  with check (user_id=(select auth.uid()) and status='open' and response='');
drop policy if exists beta_feedback_admin_update on public.beta_feedback;
create policy beta_feedback_admin_update on public.beta_feedback for update to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

-- Control de frecuencia a nivel servidor. Se serializan envíos del mismo usuario.
create or replace function public.limit_beta_feedback()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtext(new.user_id::text));
  if (select count(*) from public.beta_feedback f
      where f.user_id=new.user_id and f.created_at>now()-interval '1 hour') >= 5 then
    raise exception 'Máximo 5 comentarios por hora.' using errcode='P0001';
  end if;
  return new;
end; $$;
drop trigger if exists limit_beta_feedback_insert on public.beta_feedback;
create trigger limit_beta_feedback_insert before insert on public.beta_feedback
  for each row execute function public.limit_beta_feedback();

create or replace function public.touch_beta_feedback()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.updated_at=now();
  return new;
end; $$;
drop trigger if exists touch_beta_feedback_update on public.beta_feedback;
create trigger touch_beta_feedback_update before update on public.beta_feedback
  for each row execute function public.touch_beta_feedback();
commit;
