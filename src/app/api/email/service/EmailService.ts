import nodemailer from 'nodemailer';
import { createClient } from '@supabase/supabase-js';
import { format } from 'date-fns';
import Mustache from 'mustache';
import OpenAI from 'openai';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.EMAIL_SMTP_HOST,
      port: parseInt(process.env.EMAIL_SMTP_PORT || '587'),
      secure: process.env.EMAIL_SMTP_SECURE === 'true',
      auth: {
        user: process.env.EMAIL_SMTP_USER,
        pass: process.env.EMAIL_SMTP_PASS,
      },
    });
  }

  async sendDailyDigest(projectId: string) {
    try {
      // Get project details
      const { data: project } = await supabase
        .from('zen_projects')
        .select('*')
        .eq('id', projectId)
        .single();

      if (!project) throw new Error('Project not found');

      // Get template
      const { data: template } = await supabase
        .from('zen_email_templates')
        .select('*')
        .eq('name', 'daily_digest')
        .single();

      if (!template) throw new Error('Email template not found');

      // Get yesterday's date range
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const startOfDay = new Date(yesterday.setHours(0, 0, 0, 0));
      const endOfDay = new Date(yesterday.setHours(23, 59, 59, 999));

      // Get new tickets
      const { data: newTickets } = await supabase
        .from('zen_tickets')
        .select('*')
        .eq('project_id', projectId)
        .gte('created_at', startOfDay.toISOString())
        .lte('created_at', endOfDay.toISOString());

      // Get updated tickets
      const { data: updatedTickets } = await supabase
        .from('zen_tickets')
        .select('*')
        .eq('project_id', projectId)
        .neq('status', 'closed')
        .gte('updated_at', startOfDay.toISOString())
        .lte('updated_at', endOfDay.toISOString());

      // Get new sessions
      const { data: newSessions } = await supabase
        .from('zen_time_entries')
        .select('*')
        .eq('project_id', projectId)
        .gte('created_at', startOfDay.toISOString())
        .lte('created_at', endOfDay.toISOString());

      // Prepare template data
      const templateData = {
        project_name: project.name,
        date: format(yesterday, 'MMM dd, yyyy'),
        new_tickets: newTickets,
        updated_tickets: updatedTickets,
        new_sessions: newSessions
      };

      // Render email content
      const subject = Mustache.render(template.subject_template, templateData);
      const html = Mustache.render(template.body_template, templateData);

      // Get project members' emails
      const { data: members } = await supabase
        .from('zen_project_members')
        .select('user_id')
        .eq('project_id', projectId);

      if (!members || members.length === 0) return;

      const { data: users } = await supabase
        .from('zen_users')
        .select('email')
        .in('id', members.map(m => m.user_id));

      if (!users || users.length === 0) return;

      // Send email to each member
      for (const user of users) {
        const emailLog = await this.sendEmail(
          user.email,
          subject,
          html,
          template.id,
          { project_id: projectId }
        );

        if (emailLog) {
          console.log(`Daily digest sent to ${user.email}`);
        }
      }
    } catch (error) {
      console.error('Error sending daily digest:', error);
      throw error;
    }
  }

  async processIncomingEmail(from: string, subject: string, body: string, threadId?: string) {
    try {
      // Create email reply record
      const { data: reply } = await supabase
        .from('zen_email_replies')
        .insert({
          from_email: from,
          subject,
          body,
          processing_status: 'processing'
        })
        .select()
        .single();

      if (!reply) throw new Error('Failed to create email reply record');

      // Use OpenAI to analyze the email content
      const analysis = await this.analyzeEmailContent(body);

      // Find associated ticket
      let ticketId: string | null = null;

      if (threadId) {
        const { data: ticket } = await supabase
          .from('zen_tickets')
          .select('id')
          .eq('email_thread_id', threadId)
          .single();

        if (ticket) ticketId = ticket.id;
      }

      // Update the ticket or create a new one based on AI analysis
      if (analysis.action === 'create_ticket') {
        const { data: newTicket } = await supabase
          .from('zen_tickets')
          .insert({
            title: analysis.title,
            description: analysis.description,
            priority: analysis.priority,
            status: 'new',
            email_thread_id: threadId || `thread_${Date.now()}`
          })
          .select()
          .single();

        if (newTicket) ticketId = newTicket.id;
      } else if (analysis.action === 'update_ticket' && ticketId) {
        await supabase
          .from('zen_tickets')
          .update({
            status: analysis.status,
            updated_at: new Date().toISOString()
          })
          .eq('id', ticketId);

        // Add comment
        await supabase
          .from('zen_ticket_comments')
          .insert({
            ticket_id: ticketId,
            content: body,
            type: 'email'
          });
      }

      // Update email reply record
      await supabase
        .from('zen_email_replies')
        .update({
          ticket_id: ticketId,
          processed_at: new Date().toISOString(),
          processing_status: 'completed',
          ai_analysis: analysis
        })
        .eq('id', reply.id);

    } catch (error) {
      console.error('Error processing incoming email:', error);
      throw error;
    }
  }

  private async analyzeEmailContent(content: string) {
    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: `Analyze the following email content and extract relevant information for a ticket system.
            Determine if this should create a new ticket or update an existing one.
            For new tickets, provide a title, description, and priority.
            For updates, determine if the status should change (e.g., if it should be closed).
            Return the analysis in a structured format.`
          },
          {
            role: "user",
            content
          }
        ],
        response_format: { type: "json_object" }
      });

      return JSON.parse(completion.choices[0].message.content);
    } catch (error) {
      console.error('Error analyzing email content:', error);
      throw error;
    }
  }

  private async sendEmail(
    to: string,
    subject: string,
    html: string,
    templateId: string,
    metadata?: any
  ) {
    try {
      // Send email
      await this.transporter.sendMail({
        from: process.env.EMAIL_FROM_ADDRESS,
        to,
        subject,
        html
      });

      // Log the email
      const { data: emailLog } = await supabase
        .from('zen_email_logs')
        .insert({
          template_id: templateId,
          recipient_email: to,
          subject,
          body: html,
          status: 'sent',
          metadata
        })
        .select()
        .single();

      return emailLog;
    } catch (error) {
      // Log failed email attempt
      await supabase
        .from('zen_email_logs')
        .insert({
          template_id: templateId,
          recipient_email: to,
          subject,
          body: html,
          status: 'failed',
          error_message: error.message,
          metadata
        });

      throw error;
    }
  }
}
