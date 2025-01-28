-- Create pending invites table
CREATE TABLE IF NOT EXISTS public.zen_pending_invites (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID REFERENCES zen_projects(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    role user_role NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
    invited_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW() + INTERVAL '7 days'),
    UNIQUE(project_id, email)
);

-- Enable RLS
ALTER TABLE public.zen_pending_invites ENABLE ROW LEVEL SECURITY;

-- Project admins can create and manage invites
CREATE POLICY "Project admins can manage invites"
    ON public.zen_pending_invites
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

-- Users can view their own pending invites
CREATE POLICY "Users can view their own invites"
    ON public.zen_pending_invites
    FOR SELECT
    TO authenticated
    USING (email = auth.jwt() ->> 'email');

-- Create indexes
CREATE INDEX idx_pending_invites_email ON public.zen_pending_invites(email);
CREATE INDEX idx_pending_invites_project ON public.zen_pending_invites(project_id);
CREATE INDEX idx_pending_invites_status ON public.zen_pending_invites(status);

-- Grant access to authenticated users
GRANT ALL ON public.zen_pending_invites TO authenticated;
