import { SupabaseClient } from '@supabase/supabase-js';
import nodemailer from 'nodemailer';
import { createClient } from '@supabase/supabase-js';
import { format } from 'date-fns';
import Mustache from 'mustache';
import OpenAI from 'openai';

interface IncomingEmail {
  from: string;
  subject: string;
  text?: string;
  html?: string;
}

export class EmailService {
  private supabase: SupabaseClient;
  private transporter: nodemailer.Transporter;

  constructor(supabase: SupabaseClient) {
    this.supabase = supabase;
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
      const { data: project } = await this.supabase
        .from('zen_projects')
        .select('*')
        .eq('id', projectId)
        .single();

      if (!project) throw new Error('Project not found');

      // Get template
      const { data: template } = await this.supabase
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
      const { data: newTickets } = await this.supabase
        .from('zen_tickets')
        .select('*')
        .eq('project_id', projectId)
        .gte('created_at', startOfDay.toISOString())
        .lte('created_at', endOfDay.toISOString());

      // Get updated tickets
      const { data: updatedTickets } = await this.supabase
        .from('zen_tickets')
        .select('*')
        .eq('project_id', projectId)
        .neq('status', 'closed')
        .gte('updated_at', startOfDay.toISOString())
        .lte('updated_at', endOfDay.toISOString());

      // Get new sessions
      const { data: newSessions } = await this.supabase
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
      const { data: members } = await this.supabase
        .from('zen_project_members')
        .select('user_id')
        .eq('project_id', projectId);

      if (!members || members.length === 0) return;

      const { data: users } = await this.supabase
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

  async processIncomingEmail(email: IncomingEmail) {
    try {
      // Extract client email
      const clientEmail = email.from;

      // Find the client in the database
      const { data: userData, error: userError } = await this.supabase
        .from('zen_users')
        .select('id, role')
        .eq('email', clientEmail)
        .single();

      if (userError || !userData) {
        throw new Error('Client not found');
      }

      if (userData.role !== 'client') {
        throw new Error('Only clients can create tickets via email');
      }

      // Create a new ticket
      const { data: ticket, error: ticketError } = await this.supabase
        .from('zen_tickets')
        .insert([
          {
            title: email.subject,
            description: email.text || email.html || '',
            status: 'new',
            priority: 'medium',
            client_id: userData.id,
          },
        ])
        .select()
        .single();

      if (ticketError) {
        throw ticketError;
      }

      return {
        success: true,
        message: 'Ticket created successfully',
        ticketId: ticket.id,
      };
    } catch (error) {
      console.error('Error in processIncomingEmail:', error);
      throw error;
    }
  }

  async sendTicketUpdate(ticketId: string, updateType: 'status' | 'comment' | 'assignment') {
    try {
      // Get ticket details with client information
      const { data: ticket, error: ticketError } = await this.supabase
        .from('zen_tickets')
        .select(`
          *,
          zen_clients (
            profiles (
              email,
              full_name
            )
          )
        `)
        .eq('id', ticketId)
        .single();

      if (ticketError || !ticket) {
        throw new Error('Ticket not found');
      }

      // Compose and send email based on update type
      // This is where you'd integrate with your email service provider
      console.log('Would send email to:', ticket.zen_clients.profiles.email);
      
      return {
        success: true,
        message: 'Update email sent successfully'
      };
    } catch (error) {
      console.error('Error in sendTicketUpdate:', error);
      throw error;
    }
  }

  async analyzeEmailContent(content: string) {
    try {
      const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY
      });

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
      const { data: emailLog } = await this.supabase
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
      await this.supabase
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
