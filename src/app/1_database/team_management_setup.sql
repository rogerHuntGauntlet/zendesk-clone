-- Create new tables for team management
CREATE TABLE IF NOT EXISTS zen_teams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    focus_area TEXT NOT NULL,
    team_lead_id UUID NOT NULL REFERENCES zen_users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT unique_team_name UNIQUE (name)
);

CREATE TABLE IF NOT EXISTS zen_team_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID NOT NULL REFERENCES zen_teams(id),
    user_id UUID NOT NULL REFERENCES zen_users(id),
    role TEXT NOT NULL,
    joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT unique_team_member UNIQUE (team_id, user_id)
);

CREATE TABLE IF NOT EXISTS zen_team_skills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT unique_skill_name UNIQUE (name)
);

CREATE TABLE IF NOT EXISTS zen_team_member_skills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_member_id UUID NOT NULL REFERENCES zen_team_members(id),
    skill_id UUID NOT NULL REFERENCES zen_team_skills(id),
    CONSTRAINT unique_member_skill UNIQUE (team_member_id, skill_id)
);

-- Insert or update admin user
INSERT INTO zen_users (email, name, role)
VALUES ('begin@ideatrek.io', 'Admin User', 'admin')
ON CONFLICT (email) DO UPDATE 
SET name = EXCLUDED.name, role = EXCLUDED.role
RETURNING id;

-- Insert or update employees
WITH employee_data AS (
    SELECT * FROM (VALUES
        ('john.smith@ideatrek.io', 'John Smith'),
        ('sarah.wilson@ideatrek.io', 'Sarah Wilson'),
        ('michael.chen@ideatrek.io', 'Michael Chen'),
        ('emma.brown@ideatrek.io', 'Emma Brown'),
        ('david.miller@ideatrek.io', 'David Miller'),
        ('lisa.taylor@ideatrek.io', 'Lisa Taylor'),
        ('james.anderson@ideatrek.io', 'James Anderson'),
        ('maria.garcia@ideatrek.io', 'Maria Garcia'),
        ('robert.johnson@ideatrek.io', 'Robert Johnson'),
        ('emily.davis@ideatrek.io', 'Emily Davis')
    ) AS t(email, name)
),
inserted_employees AS (
    INSERT INTO zen_users (email, name, role)
    SELECT email, name, 'employee'
    FROM employee_data
    ON CONFLICT (email) DO UPDATE 
    SET name = EXCLUDED.name, role = EXCLUDED.role
    RETURNING id, email
)
INSERT INTO zen_employees (user_id, department, specialties, performance)
SELECT 
    id,
    CASE random() * 3
        WHEN 0 THEN 'Frontend'
        WHEN 1 THEN 'Backend'
        ELSE 'Full Stack'
    END,
    ARRAY['JavaScript', 'React', 'Node.js']::TEXT[],
    jsonb_build_object(
        'customerRating', 4 + random(),
        'avgResponseTime', (random() * 2 || 'h ' || random() * 60 || 'm')::TEXT,
        'resolvedTickets', floor(random() * 100)
    )
FROM inserted_employees
ON CONFLICT (user_id) DO UPDATE
SET 
    specialties = zen_employees.specialties || EXCLUDED.specialties,
    performance = EXCLUDED.performance;

-- Insert or update clients
WITH client_data AS (
    SELECT * FROM (VALUES
        ('client1@company.com', 'Alice Cooper'),
        ('client2@company.com', 'Bob Wilson'),
        ('client3@company.com', 'Carol Martinez'),
        ('client4@company.com', 'Daniel Lee'),
        ('client5@company.com', 'Eva Green')
    ) AS t(email, name)
),
inserted_clients AS (
    INSERT INTO zen_users (email, name, role)
    SELECT email, name, 'client'
    FROM client_data
    ON CONFLICT (email) DO UPDATE 
    SET name = EXCLUDED.name, role = EXCLUDED.role
    RETURNING id, email
)
INSERT INTO zen_clients (user_id, company, plan)
SELECT 
    id,
    CASE floor(random() * 5)
        WHEN 0 THEN 'TechCorp Inc.'
        WHEN 1 THEN 'Digital Solutions Ltd.'
        WHEN 2 THEN 'Innovation Systems'
        WHEN 3 THEN 'Future Technologies'
        ELSE 'Smart Solutions Co.'
    END,
    CASE floor(random() * 3)
        WHEN 0 THEN 'basic'
        WHEN 1 THEN 'standard'
        ELSE 'premium'
    END
FROM inserted_clients
ON CONFLICT (user_id) DO UPDATE
SET 
    company = EXCLUDED.company,
    plan = EXCLUDED.plan;

-- Insert sample projects if they don't exist
WITH admin_user AS (
    SELECT id FROM zen_users WHERE email = 'begin@ideatrek.io'
)
INSERT INTO zen_projects (name, description, admin_id)
SELECT 
    p.name, p.description, au.id
FROM (VALUES
    ('Website Redesign', 'Complete overhaul of company website'),
    ('Mobile App Development', 'New mobile application for client services'),
    ('API Integration', 'Integration with third-party services'),
    ('E-commerce Platform', 'Building new e-commerce solution'),
    ('CRM Implementation', 'Customer relationship management system setup')
) AS p(name, description)
CROSS JOIN admin_user au
ON CONFLICT DO NOTHING;

-- Insert teams if they don't exist
WITH employee_users AS (
    SELECT u.id, u.name, u.email
    FROM zen_users u
    WHERE u.role = 'employee'
)
INSERT INTO zen_teams (name, description, focus_area, team_lead_id)
SELECT 
    t.name, t.description, t.focus_area,
    (SELECT id FROM employee_users WHERE email = t.lead_email)
FROM (VALUES
    ('Frontend Development', 'Responsible for user interface and experience', 'Frontend', 'john.smith@ideatrek.io'),
    ('Backend Development', 'Handles server-side logic and database operations', 'Backend', 'sarah.wilson@ideatrek.io'),
    ('Full Stack Team', 'Works on end-to-end feature development', 'Full Stack', 'michael.chen@ideatrek.io'),
    ('Mobile Development', 'Focuses on mobile app development', 'Mobile', 'emma.brown@ideatrek.io'),
    ('DevOps Team', 'Manages deployment and infrastructure', 'DevOps', 'david.miller@ideatrek.io')
) AS t(name, description, focus_area, lead_email)
ON CONFLICT (name) DO UPDATE
SET 
    description = EXCLUDED.description,
    focus_area = EXCLUDED.focus_area,
    team_lead_id = EXCLUDED.team_lead_id;

-- Insert team skills if they don't exist
INSERT INTO zen_team_skills (name, category)
VALUES
    ('React', 'Frontend'),
    ('Vue.js', 'Frontend'),
    ('Angular', 'Frontend'),
    ('Node.js', 'Backend'),
    ('Python', 'Backend'),
    ('Java', 'Backend'),
    ('React Native', 'Mobile'),
    ('Flutter', 'Mobile'),
    ('AWS', 'DevOps'),
    ('Docker', 'DevOps'),
    ('Kubernetes', 'DevOps'),
    ('TypeScript', 'Frontend'),
    ('GraphQL', 'Backend'),
    ('MongoDB', 'Backend'),
    ('PostgreSQL', 'Backend')
ON CONFLICT (name) DO NOTHING;

-- Clear existing team members and reassign
DELETE FROM zen_team_member_skills;
DELETE FROM zen_team_members;

-- Assign members to teams with roles
WITH team_data AS (
    SELECT t.id as team_id, t.name as team_name, u.id as user_id
    FROM zen_teams t
    CROSS JOIN zen_users u
    WHERE u.role = 'employee'
)
INSERT INTO zen_team_members (team_id, user_id, role)
SELECT 
    team_id,
    user_id,
    CASE floor(random() * 3)
        WHEN 0 THEN 'Senior Developer'
        WHEN 1 THEN 'Developer'
        ELSE 'Junior Developer'
    END
FROM team_data
WHERE random() < 0.7;

-- Assign skills to team members
WITH team_member_data AS (
    SELECT tm.id as team_member_id, ts.id as skill_id
    FROM zen_team_members tm
    CROSS JOIN zen_team_skills ts
)
INSERT INTO zen_team_member_skills (team_member_id, skill_id)
SELECT team_member_id, skill_id
FROM team_member_data
WHERE random() < 0.3;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_teams_lead ON zen_teams(team_lead_id);
CREATE INDEX IF NOT EXISTS idx_team_members_team ON zen_team_members(team_id);
CREATE INDEX IF NOT EXISTS idx_team_members_user ON zen_team_members(user_id);
CREATE INDEX IF NOT EXISTS idx_team_skills_category ON zen_team_skills(category);
CREATE INDEX IF NOT EXISTS idx_team_member_skills_member ON zen_team_member_skills(team_member_id);
CREATE INDEX IF NOT EXISTS idx_team_member_skills_skill ON zen_team_member_skills(skill_id); 