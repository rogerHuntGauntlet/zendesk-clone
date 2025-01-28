-- Enable RLS on zen_pending_invites
ALTER TABLE public.zen_pending_invites ENABLE ROW LEVEL SECURITY;

-- Project admins can manage invites
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

-- Grant access to authenticated users
GRANT ALL ON public.zen_pending_invites TO authenticated;
