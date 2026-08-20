-- Run this in Supabase SQL Editor (https://supabase.com/dashboard -> SQL Editor -> New query)

-- 1. Reviews table
create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  rating int not null check (rating between 1 and 5),
  description text not null check (char_length(description) >= 80),
  avatar_url text,
  images jsonb default '[]'::jsonb,
  video_url text,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  admin_token uuid not null default gen_random_uuid(),
  created_at timestamptz not null default now()
);

alter table public.reviews enable row level security;

-- 2. Anyone can submit a review, but it always starts as 'pending' (force via security definer)
create or replace function public.submit_review(
  p_name text,
  p_rating int,
  p_description text,
  p_avatar_url text default null,
  p_images jsonb default '[]'::jsonb,
  p_video_url text default null
) returns uuid
language sql security definer
as $$
  insert into public.reviews (name, rating, description, avatar_url, images, video_url)
  values (
    p_name,
    p_rating,
    p_description,
    p_avatar_url,
    p_images,
    p_video_url
  )
  returning id;
$$;

-- 3. Public can only read approved reviews
create policy "read approved reviews" on public.reviews
  for select using (status = 'approved');

-- 4. Public can insert (through the function, which forces status pending)
grant execute on function public.submit_review to anon;

-- 5. Admin (service_role) can update status. Handle moderation through the edge function,
--    which uses the service role key server-side. No extra policy needed for that.

-- 6. Storage bucket for uploads (public read)
insert into storage.buckets (id, name, public)
values ('review-files', 'review-files', true)
on conflict (id) do nothing;

-- 7. Storage policies: anon can upload to review-files
create policy "upload review files" on storage.objects
  for insert to anon
  with check (bucket_id = 'review-files');

-- 8. Public read of review files
create policy "read review files" on storage.objects
  for select to anon
  using (bucket_id = 'review-files');