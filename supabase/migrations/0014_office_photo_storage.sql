insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'consultorio-fotos',
  'consultorio-fotos',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "office photos public read" on storage.objects;
create policy "office photos public read"
on storage.objects for select
to anon, authenticated
using (bucket_id = 'consultorio-fotos');

drop policy if exists "office photos authenticated upload" on storage.objects;
create policy "office photos authenticated upload"
on storage.objects for insert
to authenticated
with check (bucket_id = 'consultorio-fotos');

drop policy if exists "office photos authenticated update" on storage.objects;
create policy "office photos authenticated update"
on storage.objects for update
to authenticated
using (bucket_id = 'consultorio-fotos')
with check (bucket_id = 'consultorio-fotos');

drop policy if exists "office photos authenticated delete" on storage.objects;
create policy "office photos authenticated delete"
on storage.objects for delete
to authenticated
using (bucket_id = 'consultorio-fotos');
