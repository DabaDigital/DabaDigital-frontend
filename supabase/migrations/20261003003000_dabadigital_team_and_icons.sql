-- Uploaded icons for services, social links and contact channels, and the Team section's members.
-- Runs after 20260915142358_dabadigital_admin.sql and 20260915200000_dabadigital_project_images.sql.

-- An uploaded icon takes the place of the built-in glyph in `icon`; '' keeps the glyph, so rows
-- saved before this migration render exactly as they did.
alter table public.dd_services add column icon_url text not null default '' check (icon_url = '' or icon_url ~ '^https?://[^[:space:]]+$');
alter table public.dd_social_links add column icon_url text not null default '' check (icon_url = '' or icon_url ~ '^https?://[^[:space:]]+$');
alter table public.dd_contact_channels add column icon_url text not null default '' check (icon_url = '' or icon_url ~ '^https?://[^[:space:]]+$');

-- A person's name is not translated; their role and description are, with English as the fallback.
create table public.dd_team_members (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(trim(name)) between 1 and 160),
  role jsonb not null check (jsonb_typeof(role) = 'object' and length(trim(coalesce(role->>'en', ''))) between 1 and 160),
  description jsonb not null check (jsonb_typeof(description) = 'object' and length(trim(coalesce(description->>'en', ''))) between 1 and 1000),
  url text not null default '' check (url = '' or url ~ '^https?://[^[:space:]]+$'),
  photo_url text not null default '' check (photo_url = '' or photo_url ~ '^https?://[^[:space:]]+$'),
  status text not null default 'draft' check (status in ('draft', 'published')),
  position integer not null default 0 check (position between 0 and 9999)
);
create index dd_team_members_status_position_idx on public.dd_team_members(status, position);

-- The same access as every other content table: visitors read what is published, approved admins manage all of it.
alter table public.dd_team_members enable row level security;
revoke all on public.dd_team_members from anon, authenticated;
grant select on public.dd_team_members to anon, authenticated;
grant insert, update, delete on public.dd_team_members to authenticated;
create policy "Approved admins manage content" on public.dd_team_members for all to authenticated using (exists (select 1 from public.dd_admins where user_id = (select auth.uid()))) with check (exists (select 1 from public.dd_admins where user_id = (select auth.uid())));
create policy "Visitors read published content" on public.dd_team_members for select to anon, authenticated using (status = 'published');

-- Icons and portraits. Public, so the website shows them without a session; only approved admins
-- may add, replace or remove files. SVG is allowed for icons: the site only ever shows these files
-- through <img>, which never runs a script inside one.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('dd-media', 'dd-media', true, 5242880, array['image/png', 'image/jpeg', 'image/webp', 'image/avif', 'image/gif', 'image/svg+xml'])
on conflict (id) do update set public = excluded.public, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

create policy "Approved admins read media records" on storage.objects for select to authenticated using (bucket_id = 'dd-media' and exists (select 1 from public.dd_admins where user_id = (select auth.uid())));
create policy "Approved admins upload media" on storage.objects for insert to authenticated with check (bucket_id = 'dd-media' and exists (select 1 from public.dd_admins where user_id = (select auth.uid())));
create policy "Approved admins replace media" on storage.objects for update to authenticated using (bucket_id = 'dd-media' and exists (select 1 from public.dd_admins where user_id = (select auth.uid()))) with check (bucket_id = 'dd-media' and exists (select 1 from public.dd_admins where user_id = (select auth.uid())));
create policy "Approved admins delete media" on storage.objects for delete to authenticated using (bucket_id = 'dd-media' and exists (select 1 from public.dd_admins where user_id = (select auth.uid())));

-- The two founders, as the website shows them today, so the Team section is not empty once it reads
-- from this table. Skipped when the table already has anyone in it. Portraits are uploaded from the dashboard.
insert into public.dd_team_members (name, role, description, url, status, position)
select seed.name, seed.role::jsonb, seed.description::jsonb, seed.url, 'published', seed.position
from (values
  ('Keltoum Malouki',
   '{"en": "Full Stack Developer", "fr": "Développement full stack", "ar": "تطوير فول ستاك"}',
   '{"en": "Passionate about building useful digital products and turning ideas into real-world solutions.", "fr": "La passion de créer des produits digitaux utiles et de transformer les idées en solutions concrètes.", "ar": "شغف ببناء منتجات رقمية مفيدة، وتحويل الأفكار إلى حلول واقعية."}',
   'https://keltoummalouki.com', 0),
  ('Jawad Boulmal',
   '{"en": "Full Stack Developer", "fr": "Développement full stack", "ar": "تطوير فول ستاك"}',
   '{"en": "Focused on clean code, great user experiences and scalable solutions.", "fr": "Priorité au code propre, à une expérience utilisateur soignée et aux solutions évolutives.", "ar": "تركيز على الشيفرة النظيفة، وتجارب المستخدم المتميّزة، والحلول القابلة للتوسّع."}',
   'https://jawadboulmal.com', 1)
) as seed(name, role, description, url, position)
where not exists (select 1 from public.dd_team_members);
