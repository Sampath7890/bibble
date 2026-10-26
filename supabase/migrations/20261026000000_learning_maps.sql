-- Learning maps are private user-owned records. Auth identity comes from auth.uid().
create table if not exists public.learning_maps (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  title text not null check (char_length(title) between 1 and 200),
  description text not null default '',
  category text not null default 'Personal growth',
  accent text not null default 'lavender',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.map_bibbles (
  id text primary key,
  map_id text not null references public.learning_maps(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 200),
  description text not null default '',
  status text not null default 'not-started' check (status in ('not-started', 'learning', 'completed')),
  progress integer not null default 0 check (progress between 0 and 100),
  position_x double precision not null default 0,
  position_y double precision not null default 0,
  resources jsonb not null default '[]'::jsonb,
  notes text not null default '',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (map_id, id)
);

create table if not exists public.map_edges (
  id text primary key,
  map_id text not null references public.learning_maps(id) on delete cascade,
  source_id text not null,
  target_id text not null,
  created_at timestamptz not null default timezone('utc', now()),
  unique (map_id, id),
  foreign key (map_id, source_id) references public.map_bibbles(map_id, id) on delete cascade,
  foreign key (map_id, target_id) references public.map_bibbles(map_id, id) on delete cascade,
  check (source_id <> target_id)
);

create index if not exists learning_maps_user_updated_idx on public.learning_maps(user_id, updated_at desc);
create index if not exists map_bibbles_map_idx on public.map_bibbles(map_id);
create index if not exists map_edges_map_idx on public.map_edges(map_id);

-- RLS controls row access; these grants control which roles can access the tables at all.
revoke all on public.learning_maps, public.map_bibbles, public.map_edges from anon;
grant select, insert, update, delete on public.learning_maps, public.map_bibbles, public.map_edges to authenticated;

create or replace function public.set_learning_map_updated_at()
returns trigger language plpgsql security invoker set search_path = public as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists learning_maps_updated_at on public.learning_maps;
create trigger learning_maps_updated_at before update on public.learning_maps
for each row execute function public.set_learning_map_updated_at();

drop trigger if exists map_bibbles_updated_at on public.map_bibbles;
create trigger map_bibbles_updated_at before update on public.map_bibbles
for each row execute function public.set_learning_map_updated_at();

alter table public.learning_maps enable row level security;
alter table public.map_bibbles enable row level security;
alter table public.map_edges enable row level security;

drop policy if exists "Users can manage their own maps" on public.learning_maps;
create policy "Users can manage their own maps" on public.learning_maps
for all to authenticated using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

drop policy if exists "Users can manage bibbles in their own maps" on public.map_bibbles;
create policy "Users can manage bibbles in their own maps" on public.map_bibbles
for all to authenticated
using (exists (select 1 from public.learning_maps m where m.id = map_bibbles.map_id and m.user_id = (select auth.uid())))
with check (exists (select 1 from public.learning_maps m where m.id = map_bibbles.map_id and m.user_id = (select auth.uid())));

drop policy if exists "Users can manage edges in their own maps" on public.map_edges;
create policy "Users can manage edges in their own maps" on public.map_edges
for all to authenticated
using (exists (select 1 from public.learning_maps m where m.id = map_edges.map_id and m.user_id = (select auth.uid())))
with check (exists (select 1 from public.learning_maps m where m.id = map_edges.map_id and m.user_id = (select auth.uid())));

-- Export files are private and addressed as <auth uid>/<map id>/<filename>.
insert into storage.buckets (id, name, public) values ('map-exports', 'map-exports', false)
on conflict (id) do update set public = false;

drop policy if exists "Users can read their map exports" on storage.objects;
create policy "Users can read their map exports" on storage.objects
for select to authenticated using (
  bucket_id = 'map-exports'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
  and exists (select 1 from public.learning_maps m where m.id = (storage.foldername(name))[2] and m.user_id = (select auth.uid()))
);

drop policy if exists "Users can upload their map exports" on storage.objects;
create policy "Users can upload their map exports" on storage.objects
for insert to authenticated with check (
  bucket_id = 'map-exports'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
  and exists (select 1 from public.learning_maps m where m.id = (storage.foldername(name))[2] and m.user_id = (select auth.uid()))
);

drop policy if exists "Users can update their map exports" on storage.objects;
create policy "Users can update their map exports" on storage.objects
for update to authenticated using (
  bucket_id = 'map-exports'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
  and exists (select 1 from public.learning_maps m where m.id = (storage.foldername(name))[2] and m.user_id = (select auth.uid()))
) with check (
  bucket_id = 'map-exports'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
  and exists (select 1 from public.learning_maps m where m.id = (storage.foldername(name))[2] and m.user_id = (select auth.uid()))
);

drop policy if exists "Users can delete their map exports" on storage.objects;
create policy "Users can delete their map exports" on storage.objects
for delete to authenticated using (
  bucket_id = 'map-exports'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
  and exists (select 1 from public.learning_maps m where m.id = (storage.foldername(name))[2] and m.user_id = (select auth.uid()))
);
