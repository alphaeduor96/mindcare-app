insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'perfil-fotos',
  'perfil-fotos',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "profile photos public read" on storage.objects;
create policy "profile photos public read"
on storage.objects for select
to anon, authenticated
using (bucket_id = 'perfil-fotos');

drop policy if exists "profile photos authenticated upload" on storage.objects;
create policy "profile photos authenticated upload"
on storage.objects for insert
to authenticated
with check (bucket_id = 'perfil-fotos');

drop policy if exists "profile photos authenticated update" on storage.objects;
create policy "profile photos authenticated update"
on storage.objects for update
to authenticated
using (bucket_id = 'perfil-fotos')
with check (bucket_id = 'perfil-fotos');

drop policy if exists "profile photos authenticated delete" on storage.objects;
create policy "profile photos authenticated delete"
on storage.objects for delete
to authenticated
using (bucket_id = 'perfil-fotos');
