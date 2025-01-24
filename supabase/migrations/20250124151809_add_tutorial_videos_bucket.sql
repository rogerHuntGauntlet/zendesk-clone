-- Create a new storage bucket for tutorial videos
insert into storage.buckets (id, name, public)
values ('zen_tutorial_videos', 'zen_tutorial_videos', true);

-- Allow public access to read the videos
create policy "zen_tutorial_videos_public_read"
  on storage.objects for select
  using ( bucket_id = 'zen_tutorial_videos' );

-- Allow authenticated users to upload videos
create policy "zen_tutorial_videos_auth_insert"
  on storage.objects for insert
  with check (
    bucket_id = 'zen_tutorial_videos'
    and auth.role() = 'authenticated'
  );
