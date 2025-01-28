-- Drop the existing foreign key constraint
ALTER TABLE zen_ticket_activities
DROP CONSTRAINT IF EXISTS zen_ticket_activities_created_by_fkey;

-- Add the correct foreign key constraint
ALTER TABLE zen_ticket_activities
ADD CONSTRAINT zen_ticket_activities_created_by_fkey
FOREIGN KEY (created_by)
REFERENCES zen_users(id);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_ticket_activities_created_by
ON zen_ticket_activities(created_by); 