-- Create storage bucket for admin recordings if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM storage.buckets WHERE id = 'zen_admin_recordings'
    ) THEN
        INSERT INTO storage.buckets (id, name)
        VALUES ('zen_admin_recordings', 'zen_admin_recordings');
    END IF;
END $$;

-- Disable RLS for storage.objects
ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;

-- Drop existing policy if it exists and create new one
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
CREATE POLICY "Public Access" ON storage.objects
    FOR ALL USING (bucket_id = 'zen_admin_recordings');

-- Add type column to zen_ticket_comments if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'zen_ticket_comments' 
        AND column_name = 'type'
    ) THEN
        ALTER TABLE zen_ticket_comments ADD COLUMN type text;
    END IF;
END $$;

-- Create zen_ticket_activities table if it doesn't exist
CREATE TABLE IF NOT EXISTS zen_ticket_activities (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    ticket_id uuid REFERENCES zen_tickets(id),
    activity_type text NOT NULL,
    content text,
    media_url text,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamptz DEFAULT now()
);

-- Create zen_ticket_summaries table if it doesn't exist
CREATE TABLE IF NOT EXISTS zen_ticket_summaries (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    ticket_id uuid REFERENCES zen_tickets(id),
    summary text NOT NULL,
    recordings jsonb DEFAULT '[]'::jsonb,
    created_at timestamptz DEFAULT now()
);

-- Disable RLS for ticket activities and summaries
ALTER TABLE zen_ticket_activities DISABLE ROW LEVEL SECURITY;
ALTER TABLE zen_ticket_summaries DISABLE ROW LEVEL SECURITY;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_ticket_activities_ticket_id ON zen_ticket_activities(ticket_id);
CREATE INDEX IF NOT EXISTS idx_ticket_activities_created_at ON zen_ticket_activities(created_at);
CREATE INDEX IF NOT EXISTS idx_ticket_summaries_ticket_id ON zen_ticket_summaries(ticket_id);

-- Create zen_response_templates table if it doesn't exist
CREATE TABLE IF NOT EXISTS zen_response_templates (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    title text NOT NULL,
    content text NOT NULL,
    created_by text NOT NULL,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Disable RLS for response templates
ALTER TABLE zen_response_templates DISABLE ROW LEVEL SECURITY;

-- Create index for response templates
CREATE INDEX IF NOT EXISTS idx_response_templates_created_by ON zen_response_templates(created_by); 