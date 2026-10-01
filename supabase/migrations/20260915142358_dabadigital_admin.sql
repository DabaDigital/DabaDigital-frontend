-- DabaDigital content and inbox. An Auth account alone never grants admin access.
create table public.dd_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table public.dd_admins enable row level security;
revoke all on public.dd_admins from anon, authenticated;
grant select on public.dd_admins to authenticated;
create policy "Admins can check their membership" on public.dd_admins for select to authenticated using (user_id = (select auth.uid()));

create table public.dd_categories (
  id uuid primary key default gen_random_uuid(),
  name jsonb not null check (jsonb_typeof(name) = 'object' and length(trim(coalesce(name->>'en', ''))) between 1 and 160),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and length(slug) <= 160),
  position integer not null default 0 check (position between 0 and 9999)
);
create table public.dd_projects (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(trim(name)) between 1 and 160),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and length(slug) <= 160),
  summary jsonb not null check (jsonb_typeof(summary) = 'object' and length(trim(coalesce(summary->>'en', ''))) between 1 and 500),
  description jsonb not null default '{"en":"","fr":"","ar":""}'::jsonb,
  year text not null check (year ~ '^[0-9]{4}$'),
  tone text not null default 'primary' check (tone in ('primary', 'accent')),
  image_url text not null default '' check (image_url = '' or image_url ~ '^https?://[^[:space:]]+$'),
  website_url text not null default '' check (website_url = '' or website_url ~ '^https?://[^[:space:]]+$'),
  status text not null default 'draft' check (status in ('draft', 'published')),
  position integer not null default 0 check (position between 0 and 9999),
  updated_at timestamptz not null default now()
);
create table public.dd_project_categories (
  project_id uuid not null references public.dd_projects(id) on delete cascade,
  category_id uuid not null references public.dd_categories(id) on delete restrict,
  primary key (project_id, category_id)
);
create index dd_project_categories_category_idx on public.dd_project_categories(category_id);
create index dd_projects_status_position_idx on public.dd_projects(status, position);

create table public.dd_services (
  id uuid primary key default gen_random_uuid(),
  title jsonb not null check (jsonb_typeof(title) = 'object' and length(trim(coalesce(title->>'en', ''))) between 1 and 160),
  description jsonb not null check (jsonb_typeof(description) = 'object' and length(trim(coalesce(description->>'en', ''))) between 1 and 10000),
  icon text not null default 'code',
  status text not null default 'draft' check (status in ('draft', 'published')),
  position integer not null default 0 check (position between 0 and 9999)
);
create table public.dd_social_links (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(trim(name)) between 1 and 160),
  url text not null check (url ~ '^https?://[^[:space:]]+$'),
  icon text not null default 'globe',
  status text not null default 'draft' check (status in ('draft', 'published')),
  position integer not null default 0 check (position between 0 and 9999)
);
create table public.dd_contact_channels (
  id uuid primary key default gen_random_uuid(),
  label jsonb not null check (jsonb_typeof(label) = 'object' and length(trim(coalesce(label->>'en', ''))) between 1 and 160),
  value jsonb not null check (jsonb_typeof(value) = 'object' and length(trim(coalesce(value->>'en', ''))) between 1 and 500),
  href text not null default '' check (href = '' or href ~ '^https?://[^[:space:]]+$' or href ~ '^mailto:[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' or href ~ '^tel:[+0-9 ()-]+$'),
  icon text not null default 'mail',
  status text not null default 'draft' check (status in ('draft', 'published')),
  position integer not null default 0 check (position between 0 and 9999)
);
create table public.dd_messages (
  id uuid primary key default gen_random_uuid(),
  full_name text not null check (length(trim(full_name)) between 2 and 160),
  email text not null check (length(email) <= 254 and email ~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'),
  company_name text not null default '' check (length(company_name) <= 250),
  project_type text not null check (project_type in ('website', 'web_app', 'ecommerce', 'mobile_app', 'other')),
  budget text not null default '' check (length(budget) <= 250),
  description text not null check (length(trim(description)) between 20 and 10000),
  locale text not null default 'en' check (locale in ('en','fr','ar')),
  status text not null default 'new' check (status in ('new','read','replied','archived')),
  created_at timestamptz not null default now()
);
create index dd_messages_created_at_idx on public.dd_messages(created_at desc);

-- Explicit grants plus RLS: public visitors only see published content.
do $$
declare table_name text;
begin
  foreach table_name in array array['dd_categories','dd_projects','dd_project_categories','dd_services','dd_social_links','dd_contact_channels'] loop
    execute format('alter table public.%I enable row level security', table_name);
    execute format('revoke all on public.%I from anon, authenticated', table_name);
    execute format('grant select on public.%I to anon, authenticated', table_name);
    execute format('grant insert, update, delete on public.%I to authenticated', table_name);
    execute format('create policy "Approved admins manage content" on public.%I for all to authenticated using (exists (select 1 from public.dd_admins where user_id = (select auth.uid()))) with check (exists (select 1 from public.dd_admins where user_id = (select auth.uid())))', table_name);
  end loop;
  foreach table_name in array array['dd_projects','dd_services','dd_social_links','dd_contact_channels'] loop
    execute format('create policy "Visitors read published content" on public.%I for select to anon, authenticated using (status = ''published'')', table_name);
  end loop;
end;
$$;
create policy "Visitors read categories" on public.dd_categories for select to anon, authenticated using (true);
create policy "Visitors read published project categories" on public.dd_project_categories for select to anon, authenticated using (exists (select 1 from public.dd_projects where id = project_id and status = 'published'));

alter table public.dd_messages enable row level security;
revoke all on public.dd_messages from anon, authenticated;
-- Visitors may only provide these columns. Status and timestamps are server-owned.
grant insert (id, full_name, email, company_name, project_type, budget, description, locale) on public.dd_messages to anon, authenticated;
grant select on public.dd_messages to authenticated;
grant update (status) on public.dd_messages to authenticated;
create policy "Visitors send new messages" on public.dd_messages for insert to anon, authenticated with check (status = 'new');
create policy "Approved admins read messages" on public.dd_messages for select to authenticated using (exists (select 1 from public.dd_admins where user_id = (select auth.uid())));
create policy "Approved admins triage messages" on public.dd_messages for update to authenticated using (exists (select 1 from public.dd_admins where user_id = (select auth.uid()))) with check (exists (select 1 from public.dd_admins where user_id = (select auth.uid())));

-- Project + category links save in a single transaction and retain caller RLS.
create function public.dd_save_project(project_data jsonb, category_ids uuid[]) returns uuid
language plpgsql security invoker set search_path = '' as $$
declare v_project_id uuid := (project_data->>'id')::uuid;
begin
  insert into public.dd_projects (id, name, slug, summary, description, year, tone, image_url, website_url, status, position, updated_at)
  values (v_project_id, project_data->>'name', project_data->>'slug', project_data->'summary', project_data->'description', project_data->>'year', project_data->>'tone', project_data->>'image_url', project_data->>'website_url', project_data->>'status', (project_data->>'position')::integer, now())
  on conflict (id) do update set name = excluded.name, slug = excluded.slug, summary = excluded.summary, description = excluded.description, year = excluded.year, tone = excluded.tone, image_url = excluded.image_url, website_url = excluded.website_url, status = excluded.status, position = excluded.position, updated_at = now();
  delete from public.dd_project_categories where dd_project_categories.project_id = v_project_id;
  insert into public.dd_project_categories (project_id, category_id) select v_project_id, category_id from (select distinct unnest(category_ids) as category_id) categories;
  return v_project_id;
end;
$$;
revoke all on function public.dd_save_project(jsonb, uuid[]) from public, anon, authenticated;
grant execute on function public.dd_save_project(jsonb, uuid[]) to authenticated;
