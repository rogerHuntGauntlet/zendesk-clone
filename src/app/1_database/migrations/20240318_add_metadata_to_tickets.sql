-- Add metadata column to zen_tickets table
ALTER TABLE zen_tickets ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- Create an index on the metadata column for better query performance
CREATE INDEX IF NOT EXISTS idx_tickets_metadata ON zen_tickets USING gin (metadata); 