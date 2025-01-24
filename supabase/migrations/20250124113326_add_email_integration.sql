-- Create email_templates table for storing daily digest and notification templates
CREATE TABLE zen_email_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    subject_template TEXT NOT NULL,
    body_template TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create email_logs table for tracking all sent emails
CREATE TABLE zen_email_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id UUID REFERENCES zen_email_templates(id),
    recipient_email TEXT NOT NULL,
    subject TEXT NOT NULL,
    body TEXT NOT NULL,
    status TEXT NOT NULL,
    sent_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    error_message TEXT,
    metadata JSONB
);

-- Create email_replies table for tracking incoming email replies
CREATE TABLE zen_email_replies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    original_email_id UUID REFERENCES zen_email_logs(id),
    ticket_id UUID REFERENCES zen_tickets(id),
    from_email TEXT NOT NULL,
    subject TEXT NOT NULL,
    body TEXT NOT NULL,
    received_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    processed_at TIMESTAMPTZ,
    processing_status TEXT NOT NULL DEFAULT 'pending',
    ai_analysis JSONB,
    metadata JSONB
);

-- Add email_thread_id to zen_tickets table to track email conversations
ALTER TABLE zen_tickets 
ADD COLUMN email_thread_id TEXT UNIQUE,
ADD COLUMN last_email_sync_at TIMESTAMPTZ;

-- Create indexes for better query performance
CREATE INDEX idx_email_logs_recipient ON zen_email_logs(recipient_email);
CREATE INDEX idx_email_logs_sent_at ON zen_email_logs(sent_at);
CREATE INDEX idx_email_replies_ticket ON zen_email_replies(ticket_id);
CREATE INDEX idx_email_replies_processing_status ON zen_email_replies(processing_status);
CREATE INDEX idx_tickets_email_thread ON zen_tickets(email_thread_id);

-- Insert default email templates
INSERT INTO zen_email_templates (name, subject_template, body_template) VALUES
(
    'daily_digest',
    '{{project_name}} - Daily Ticket Updates ({{date}})',
    '<!DOCTYPE html>
    <html>
    <body>
        <h2>Daily Digest for {{project_name}}</h2>
        <h3>New Tickets</h3>
        {{#new_tickets}}
        <div style="margin-bottom: 20px;">
            <p><strong>Ticket #{{id}}</strong>: {{title}}</p>
            <p>Status: {{status}}</p>
            <p>Created: {{created_at}}</p>
        </div>
        {{/new_tickets}}
        
        <h3>Updated Tickets</h3>
        {{#updated_tickets}}
        <div style="margin-bottom: 20px;">
            <p><strong>Ticket #{{id}}</strong>: {{title}}</p>
            <p>Status: {{status}}</p>
            <p>Last Update: {{updated_at}}</p>
        </div>
        {{/updated_tickets}}
        
        <h3>New Sessions</h3>
        {{#new_sessions}}
        <div style="margin-bottom: 20px;">
            <p><strong>Session for Ticket #{{ticket_id}}</strong></p>
            <p>Duration: {{duration}}</p>
            <p>Notes: {{notes}}</p>
        </div>
        {{/new_sessions}}
        
        <p>Reply to this email to add a new comment or update to any ticket.</p>
        <p>Include the ticket number in your reply (e.g., "RE: #123") to ensure it''s properly associated.</p>
    </body>
    </html>'
);
