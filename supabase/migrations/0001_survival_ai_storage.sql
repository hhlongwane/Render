-- CloudForge / Survival AI starter backend
-- Run this in the Supabase SQL Editor for your own project.
-- This migration is designed for user-owned memory records and private files.
-- It does NOT create a Supabase project or switch on billing.

create extension if not exists pgcrypto;

create table if not exists public.ai_memories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  memory_key text not null check (char_length(memory_key) between 1 and 160),
  content jsonb not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint ai_memories_user_key_unique unique (user_id, memory_key)
);

create index if not exists ai_memories_user_updated_idx
  on public.ai_memories (user_id, updated_at desc);

alter table public.ai_memories enable row level security;

revoke all on table public.ai_memories from anon, authenticated;
grant select, insert, update, delete on table public.ai_memories to authenticated;

drop policy if exists "Users read their own AI memories" on public.ai_memories;
create policy "Users read their own AI memories"
  on public.ai_memories for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Users create their own AI memories" on public.ai_memories;
create policy "Users create their own AI memories"
  on public.ai_memories for insert to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users update their own AI memories" on public.ai_memories;
create policy "Users update their own AI memories"
  on public.ai_memories for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users delete their own AI memories" on public.ai_memories;
create policy "Users delete their own AI memories"
  on public.ai_memories for delete to authenticated
  using ((select auth.uid()) = user_id);

create or replace function public.set_ai_memories_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_ai_memories_updated_at on public.ai_memories;
create trigger set_ai_memories_updated_at
  before update on public.ai_memories
  for each row execute function public.set_ai_memories_updated_at();

-- Private object storage. Every user's files live under a folder named for
-- their authenticated user UUID: <user-uuid>/<filename>.
insert into storage.buckets (id, name, public)
values ('survival-ai-files', 'survival-ai-files', false)
on conflict (id) do nothing;

drop policy if exists "Users list their own Survival AI files" on storage.objects;
create policy "Users list their own Survival AI files"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'survival-ai-files'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

drop policy if exists "Users upload their own Survival AI files" on storage.objects;
create policy "Users upload their own Survival AI files"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'survival-ai-files'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

drop policy if exists "Users update their own Survival AI files" on storage.objects;
create policy "Users update their own Survival AI files"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'survival-ai-files'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  )
  with check (
    bucket_id = 'survival-ai-files'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

drop policy if exists "Users delete their own Survival AI files" on storage.objects;
create policy "Users delete their own Survival AI files"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'survival-ai-files'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
