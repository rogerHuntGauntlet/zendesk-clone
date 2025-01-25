-- Create zen_employees table
create table if not exists public.zen_employees (
    user_id uuid primary key references auth.users(id) on delete cascade,
    department text not null default 'General',
    status text not null default 'active',
    hire_date timestamptz default now(),
    performance jsonb default '{}',
    skills text[] default array[]::text[],
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

-- Set up RLS policies
alter table public.zen_employees enable row level security;

-- Allow employees to view their own records
create policy "Employees can view their own records" on public.zen_employees
    for select using (auth.uid() = user_id);

-- Allow employees to update their own records
create policy "Employees can update their own records" on public.zen_employees
    for update using (auth.uid() = user_id);

-- Allow system to create employee records during signup
create policy "System can create employee records" on public.zen_employees
    for insert with check (true);

-- Add updated_at trigger
create trigger handle_zen_employees_updated_at
    before update on public.zen_employees
    for each row
    execute function public.handle_updated_at();

-- Create index on department for faster queries
create index if not exists idx_employees_department on public.zen_employees(department);

-- Grant access to authenticated users
grant all on public.zen_employees to authenticated;
