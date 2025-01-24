-- Enable UUID extension if not already enabled
create extension if not exists "uuid-ossp";

-- Add new columns to auth.users
alter table auth.users add column if not exists role text check (role in ('admin', 'employee', 'client'));
alter table auth.users add column if not exists last_active timestamptz;
alter table auth.users add column if not exists avatar_url text;
alter table auth.users add column if not exists name text;

-- Create messages table
create table public.zen_messages (
    id uuid primary key default uuid_generate_v4(),
    content text not null,
    sender_id uuid references auth.users(id),
    receiver_id uuid references auth.users(id),
    project_id uuid references zen_projects(id),
    timestamp timestamptz default now(),
    is_read boolean default false,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

-- Enable Row Level Security
alter table public.zen_messages enable row level security;
alter table public.zen_messages replica identity full;

-- Create RLS policies for zen_messages
create policy "Users can read messages they sent or received"
    on public.zen_messages for select
    using (auth.uid() = sender_id or auth.uid() = receiver_id);

create policy "Users can insert messages they send"
    on public.zen_messages for insert
    with check (auth.uid() = sender_id);

-- Function to update user's last_active status
create or replace function public.update_user_last_active()
returns trigger as $$
begin
    update auth.users
    set last_active = now()
    where id = auth.uid();
    return new;
end;
$$ language plpgsql security definer;

-- Trigger for updating last_active
create trigger update_user_last_active
    after insert on public.zen_messages
    for each row
    execute function public.update_user_last_active();

-- Function to update updated_at timestamp
create or replace function public.update_updated_at_column()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language plpgsql;

-- Trigger for updating updated_at
create trigger update_zen_messages_updated_at
    before update on public.zen_messages
    for each row
    execute function public.update_updated_at_column();

-- Create indexes for better performance
create index if not exists idx_zen_messages_sender_id on public.zen_messages(sender_id);
create index if not exists idx_zen_messages_receiver_id on public.zen_messages(receiver_id);
create index if not exists idx_zen_messages_project_id on public.zen_messages(project_id);
create index if not exists idx_zen_messages_timestamp on public.zen_messages(timestamp);

-- Enable realtime for zen_messages
alter publication supabase_realtime add table zen_messages;

-- Add some helpful functions
create or replace function public.get_online_agents(project_id uuid)
returns table (
    id uuid,
    name text,
    role text,
    avatar_url text,
    last_active timestamptz
) as $$
begin
    return query
    select 
        u.id,
        u.name,
        u.role,
        u.avatar_url,
        u.last_active
    from auth.users u
    where u.role in ('admin', 'employee')
    and (u.last_active > now() - interval '5 minutes' or u.last_active is null)
    and exists (
        select 1 
        from zen_project_members pm 
        where pm.user_id = u.id 
        and pm.project_id = $1
    );
end;
$$ language plpgsql security definer;
