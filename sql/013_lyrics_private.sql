-- OVIO v1.6: letras privadas guardadas por artistas aprobados.
-- Ejecutar sobre el proyecto Supabase EXISTENTE, tras la migración 012.
-- No cambia las canciones publicadas, moderación ni permisos anteriores.
-- Las letras NO aparecen en vistas públicas ni rankings; no se crean endpoints de publicación.
begin;
create table if not exists public.artist_lyric_drafts (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  track_id uuid references public.tracks(id) on delete set null,
  title text not null check (char_length(btrim(title)) between 1 and 120),
  body text not null default '' check (char_length(body) <= 30000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists artist_lyric_drafts_owner_idx
  on public.artist_lyric_drafts(owner_id, updated_at desc);

alter table public.artist_lyric_drafts enable row level security;
-- FORCE también protege frente a propietarios de la tabla no exentos de RLS.
alter table public.artist_lyric_drafts force row level security;
revoke all on public.artist_lyric_drafts from public, anon, authenticated;
grant select, delete on public.artist_lyric_drafts to authenticated;
grant insert (owner_id,track_id,title,body) on public.artist_lyric_drafts to authenticated;
grant update (track_id,title,body) on public.artist_lyric_drafts to authenticated;

drop policy if exists artist_lyric_drafts_private_read on public.artist_lyric_drafts;
create policy artist_lyric_drafts_private_read on public.artist_lyric_drafts
  for select to authenticated using (owner_id=(select auth.uid()));

drop policy if exists artist_lyric_drafts_private_insert on public.artist_lyric_drafts;
create policy artist_lyric_drafts_private_insert on public.artist_lyric_drafts
  for insert to authenticated with check (
    owner_id=(select auth.uid()) and
    (select public.is_approved_artist((select auth.uid()))) and
    (track_id is null or exists (
      select 1 from public.tracks t
      where t.id=track_id and t.artist_id=(select auth.uid())
    ))
  );

drop policy if exists artist_lyric_drafts_private_update on public.artist_lyric_drafts;
create policy artist_lyric_drafts_private_update on public.artist_lyric_drafts
  for update to authenticated
  using (owner_id=(select auth.uid()))
  with check (
    owner_id=(select auth.uid()) and
    (select public.is_approved_artist((select auth.uid()))) and
    (track_id is null or exists (
      select 1 from public.tracks t
      where t.id=track_id and t.artist_id=(select auth.uid())
    ))
  );

drop policy if exists artist_lyric_drafts_private_delete on public.artist_lyric_drafts;
create policy artist_lyric_drafts_private_delete on public.artist_lyric_drafts
  for delete to authenticated using (owner_id=(select auth.uid()));

create or replace function public.touch_artist_lyric_draft()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.updated_at = now();
  return new;
end; $$;
drop trigger if exists artist_lyric_drafts_touch on public.artist_lyric_drafts;
create trigger artist_lyric_drafts_touch before update on public.artist_lyric_drafts
  for each row execute function public.touch_artist_lyric_draft();
commit;
