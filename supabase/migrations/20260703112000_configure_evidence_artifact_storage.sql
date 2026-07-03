insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'radar-evidence-artifacts',
  'radar-evidence-artifacts',
  false,
  52428800,
  array[
    'application/json',
    'application/pdf',
    'application/zip',
    'image/png',
    'image/jpeg',
    'image/webp',
    'text/csv',
    'text/markdown',
    'text/plain'
  ]
)
on conflict (id) do update
set
  name = excluded.name,
  public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types,
  updated_at = now();
