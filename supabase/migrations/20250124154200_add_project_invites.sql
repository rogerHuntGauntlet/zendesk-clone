-- Create project_invites table
create table public.project_invites (
  id uuid default gen_random_uuid() primary key,
  project_id uuid references public.projects(id) on delete cascade,
  email text not null,
  invite_type text not null check (invite_type in ('client', 'employee')),
  token text not null unique,
  expires_at timestamp with time zone not null,
  created_at timestamp with time zone default now(),
  used_at timestamp with time zone
);

-- Add RLS policies
alter table public.project_invites enable row level security;

-- Allow admins to create invites
create policy "Admins can create invites"
  on public.project_invites
  for insert
  to authenticated
  with check (
    exists (
      select 1 from public.users
      where id = auth.uid()
      and role = 'admin'
    )
  );

-- Allow admins to view all invites
create policy "Admins can view all invites"
  on public.project_invites
  for select
  to authenticated
  using (
    exists (
      select 1 from public.users
      where id = auth.uid()
      and role = 'admin'
    )
  );

-- Create index for faster token lookups
create index project_invites_token_idx on public.project_invites(token);

-- Create function to check if invite is valid
create or replace function public.is_invite_valid(token text)
returns boolean
language plpgsql
security definer
as $$
begin
  return exists (
    select 1
    from public.project_invites
    where project_invites.token = token
    and used_at is null
    and expires_at > now()
  );
end;
$$;
