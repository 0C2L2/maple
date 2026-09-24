-- Organization logos and banners (D-025). Anyone can view them; an organization can only write inside
-- its own folder: org-media/<organization id>/<file>.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('org-media', 'org-media', true, 2097152, array['image/png', 'image/jpeg', 'image/webp']);

-- ponytail: every upload gets a new file name and old ones are kept; add a cleanup job if storage grows.
create policy "organizations upload own media" on storage.objects for insert to authenticated
  with check (bucket_id = 'org-media' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "organizations delete own media" on storage.objects for delete to authenticated
  using (bucket_id = 'org-media' and (storage.foldername(name))[1] = (select auth.uid())::text);
