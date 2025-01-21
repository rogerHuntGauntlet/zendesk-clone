-- Create enum for user roles
CREATE TYPE user_role AS ENUM ('project_admin', 'employee', 'client');

-- Create projects table
CREATE TABLE zen_projects (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    creator_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'archived')),
    settings JSONB DEFAULT '{}'::jsonb
);

-- Create project admins table
CREATE TABLE zen_project_admins (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    company_name TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create employees table
CREATE TABLE zen_employees (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    department TEXT,
    job_title TEXT,
    specialties TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create clients table
CREATE TABLE zen_clients (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    company_name TEXT,
    industry TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create project members table
CREATE TABLE zen_project_members (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID REFERENCES zen_projects(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    role user_role NOT NULL,
    permissions TEXT[] DEFAULT '{}',
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    invited_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    UNIQUE(project_id, user_id)
);

-- Create RLS policies

-- Projects policies
ALTER TABLE zen_projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Project admins can create projects"
    ON zen_projects FOR INSERT
    TO authenticated
    WITH CHECK (EXISTS (
        SELECT 1 FROM zen_project_admins
        WHERE user_id = auth.uid()
    ));

CREATE POLICY "Users can view projects they are members of"
    ON zen_projects FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM zen_project_members
            WHERE project_id = zen_projects.id
            AND user_id = auth.uid()
        )
        OR
        EXISTS (
            SELECT 1 FROM zen_project_admins
            WHERE user_id = auth.uid()
        )
    );

-- Project members policies
ALTER TABLE zen_project_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Project admins can manage members"
    ON zen_project_members
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM zen_project_admins
            WHERE user_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM zen_project_admins
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Members can view their own memberships"
    ON zen_project_members FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

-- Create functions

-- Function to automatically add creator as project member
CREATE OR REPLACE FUNCTION public.handle_new_project()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO zen_project_members (project_id, user_id, role, permissions)
    VALUES (NEW.id, NEW.creator_id, 'project_admin', '{admin}');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to add creator as project member
CREATE TRIGGER on_project_created
    AFTER INSERT ON zen_projects
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_project();

-- Function to handle new user registration (to be called from edge function)
CREATE OR REPLACE FUNCTION public.handle_user_registration(user_id UUID, user_role TEXT)
RETURNS void AS $$
BEGIN
    CASE 
        WHEN user_role = 'project_admin' THEN
            INSERT INTO zen_project_admins (user_id)
            VALUES (user_id);
        WHEN user_role = 'employee' THEN
            INSERT INTO zen_employees (user_id)
            VALUES (user_id);
        WHEN user_role = 'client' THEN
            INSERT INTO zen_clients (user_id)
            VALUES (user_id);
    END CASE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 