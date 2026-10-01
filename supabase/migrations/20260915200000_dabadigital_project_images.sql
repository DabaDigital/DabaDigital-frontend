-- Project cover images. The bucket is public so the website shows covers without a session;
-- only approved admins may add, replace or remove files. Size and type limits are enforced by
-- Storage itself, whatever the client sends.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('dd-project-images', 'dd-project-images', true, 5242880, array['image/png', 'image/jpeg', 'image/webp', 'image/avif', 'image/gif'])
on conflict (id) do update set public = excluded.public, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

create policy "Approved admins read project image records" on storage.objects for select to authenticated using (bucket_id = 'dd-project-images' and exists (select 1 from public.dd_admins where user_id = (select auth.uid())));
create policy "Approved admins upload project images" on storage.objects for insert to authenticated with check (bucket_id = 'dd-project-images' and exists (select 1 from public.dd_admins where user_id = (select auth.uid())));
create policy "Approved admins replace project images" on storage.objects for update to authenticated using (bucket_id = 'dd-project-images' and exists (select 1 from public.dd_admins where user_id = (select auth.uid()))) with check (bucket_id = 'dd-project-images' and exists (select 1 from public.dd_admins where user_id = (select auth.uid())));
create policy "Approved admins delete project images" on storage.objects for delete to authenticated using (bucket_id = 'dd-project-images' and exists (select 1 from public.dd_admins where user_id = (select auth.uid())));
