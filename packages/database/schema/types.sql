-- User roles
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM (
        'admin',
        'employee',
        'client',
        'project_admin'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Ticket statuses
DO $$ BEGIN
    CREATE TYPE ticket_status AS ENUM (
        'new',
        'open',
        'in_progress',
        'pending',
        'resolved',
        'closed'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Ticket priorities
DO $$ BEGIN
    CREATE TYPE ticket_priority AS ENUM (
        'low',
        'medium',
        'high',
        'urgent'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$; 