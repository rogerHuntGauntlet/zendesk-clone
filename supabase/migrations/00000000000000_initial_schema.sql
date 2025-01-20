-- Create tables for the CRM system

-- Teams/Departments table
create table if not exists public.teams (
    id uuid default gen_random_uuid() primary key,
    name text not null,
    description text,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

-- Users table (extends Supabase auth.users)
create table if not exists public.user_profiles (
    id uuid references auth.users primary key,
    full_name text,
    team_id uuid references public.teams,
    role text not null check (role in ('admin', 'agent', 'customer')),
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

-- Tickets table
create table if not exists public.tickets (
    id uuid default gen_random_uuid() primary key,
    title text not null,
    description text,
    status text not null check (status in ('new', 'open', 'pending', 'resolved', 'closed')),
    priority text not null check (priority in ('low', 'medium', 'high', 'urgent')),
    customer_id uuid references auth.users,
    assigned_to uuid references auth.users,
    team_id uuid references public.teams,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

-- Ticket comments/interactions
create table if not exists public.ticket_interactions (
    id uuid default gen_random_uuid() primary key,
    ticket_id uuid references public.tickets on delete cascade,
    user_id uuid references auth.users,
    content text not null,
    is_internal boolean default false,
    created_at timestamptz default now()
);

-- Storage bucket for attachments
insert into storage.buckets (id, name, public) 
values ('ticket-attachments', 'ticket-attachments', false);

-- RLS Policies will be added in a separate migration 