-- Create zen_notes table
create table if not exists public.zen_notes (
    id uuid default gen_random_uuid() primary key,
    project_id uuid references public.zen_projects(id) on delete cascade,
    content text not null,
    created_by uuid references auth.users(id) on delete cascade,
    created_at timestamptz default now(),
    mentions text[] default array[]::text[],
    updated_at timestamptz default now()
);

-- Set up RLS policies
alter table public.zen_notes enable row level security;

-- Allow users to view notes if they are part of the project
create policy "Users can view notes if they are part of the project" on public.zen_notes
    for select using (
        auth.uid() in (
            select user_id from zen_project_members where project_id = zen_notes.project_id
            union
            select created_by from zen_projects where id = zen_notes.project_id
        )
    );

-- Allow users to create notes if they are part of the project
create policy "Users can create notes if they are part of the project" on public.zen_notes
    for insert with check (
        auth.uid() in (
            select user_id from zen_project_members where project_id = zen_notes.project_id
            union
            select created_by from zen_projects where id = zen_notes.project_id
        )
    );

-- Add updated_at trigger
create or replace function public.handle_updated_at()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language plpgsql;

create trigger handle_zen_notes_updated_at
    before update on public.zen_notes
    for each row
    execute function public.handle_updated_at();

-- Grant access to authenticated users
grant all on public.zen_notes to authenticated;
