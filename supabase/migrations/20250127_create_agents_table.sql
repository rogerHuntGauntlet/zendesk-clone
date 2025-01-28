-- Create agents table
create table if not exists public.zen_agents (
    id uuid default gen_random_uuid() primary key,
    email text unique not null,
    name text not null,
    role text not null,
    department text,
    title text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
    metadata jsonb default '{}'::jsonb,
    is_active boolean default true
);

-- Add RLS policies
alter table public.zen_agents enable row level security;

create policy "Agents are viewable by authenticated users"
    on public.zen_agents for select
    to authenticated
    using (true);

create policy "Agents are insertable by admin users"
    on public.zen_agents for insert
    to authenticated
    with check (
        exists (
            select 1 from public.zen_users
            where auth.uid() = zen_users.id
            and zen_users.role = 'admin'
        )
    );

create policy "Agents are updatable by admin users"
    on public.zen_agents for update
    to authenticated
    using (
        exists (
            select 1 from public.zen_users
            where auth.uid() = zen_users.id
            and zen_users.role = 'admin'
        )
    );

-- Create function to handle agent updates
create or replace function public.handle_agent_updated()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language plpgsql security definer;

-- Create trigger for handling updates
create trigger on_agent_updated
    before update on public.zen_agents
    for each row
    execute procedure public.handle_agent_updated();
