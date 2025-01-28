-- Drop existing foreign key constraints that reference users table
ALTER TABLE zen_ticket_activities DROP CONSTRAINT IF EXISTS zen_ticket_activities_created_by_fkey;
ALTER TABLE zen_ticket_summaries DROP CONSTRAINT IF EXISTS zen_ticket_summaries_created_by_fkey;
ALTER TABLE zen_ticket_messages DROP CONSTRAINT IF EXISTS zen_ticket_messages_created_by_fkey;
ALTER TABLE zen_ticket_comments DROP CONSTRAINT IF EXISTS zen_ticket_comments_created_by_fkey;
ALTER TABLE zen_tickets DROP CONSTRAINT IF EXISTS zen_tickets_created_by_fkey;
ALTER TABLE zen_tickets DROP CONSTRAINT IF EXISTS zen_tickets_assigned_to_fkey;
ALTER TABLE zen_projects DROP CONSTRAINT IF EXISTS zen_projects_created_by_fkey;
ALTER TABLE zen_projects DROP CONSTRAINT IF EXISTS zen_projects_admin_id_fkey;
ALTER TABLE zen_project_members DROP CONSTRAINT IF EXISTS zen_project_members_user_id_fkey;
ALTER TABLE zen_project_invites DROP CONSTRAINT IF EXISTS zen_project_invites_invited_by_fkey;
ALTER TABLE zen_email_logs DROP CONSTRAINT IF EXISTS zen_email_logs_sent_by_fkey;
ALTER TABLE zen_response_templates DROP CONSTRAINT IF EXISTS zen_response_templates_created_by_fkey;

-- Add new foreign key constraints referencing zen_users
ALTER TABLE zen_ticket_activities 
ADD CONSTRAINT zen_ticket_activities_created_by_fkey 
FOREIGN KEY (created_by) REFERENCES zen_users(id);

ALTER TABLE zen_ticket_summaries 
ADD CONSTRAINT zen_ticket_summaries_created_by_fkey 
FOREIGN KEY (created_by) REFERENCES zen_users(id);

ALTER TABLE zen_ticket_messages 
ADD CONSTRAINT zen_ticket_messages_created_by_fkey 
FOREIGN KEY (created_by) REFERENCES zen_users(id);

ALTER TABLE zen_ticket_comments 
ADD CONSTRAINT zen_ticket_comments_created_by_fkey 
FOREIGN KEY (created_by) REFERENCES zen_users(id);

ALTER TABLE zen_tickets 
ADD CONSTRAINT zen_tickets_created_by_fkey 
FOREIGN KEY (created_by) REFERENCES zen_users(id);

ALTER TABLE zen_tickets 
ADD CONSTRAINT zen_tickets_assigned_to_fkey 
FOREIGN KEY (assigned_to) REFERENCES zen_users(id);

ALTER TABLE zen_projects 
ADD CONSTRAINT zen_projects_created_by_fkey 
FOREIGN KEY (created_by) REFERENCES zen_users(id);

ALTER TABLE zen_projects 
ADD CONSTRAINT zen_projects_admin_id_fkey 
FOREIGN KEY (admin_id) REFERENCES zen_users(id);

ALTER TABLE zen_project_members 
ADD CONSTRAINT zen_project_members_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES zen_users(id);

ALTER TABLE zen_project_invites 
ADD CONSTRAINT zen_project_invites_invited_by_fkey 
FOREIGN KEY (invited_by) REFERENCES zen_users(id);

ALTER TABLE zen_email_logs 
ADD CONSTRAINT zen_email_logs_sent_by_fkey 
FOREIGN KEY (sent_by) REFERENCES zen_users(id);

ALTER TABLE zen_response_templates 
ADD CONSTRAINT zen_response_templates_created_by_fkey 
FOREIGN KEY (created_by) REFERENCES zen_users(id); 