# Email Integration Setup

This document explains how to set up and configure the email integration feature.

## Required Environment Variables

Add these variables to your `.env.local` file:

```env
# Email Configuration
EMAIL_SMTP_HOST=smtp.example.com
EMAIL_SMTP_PORT=587
EMAIL_SMTP_SECURE=false
EMAIL_SMTP_USER=your-email@example.com
EMAIL_SMTP_PASS=your-smtp-password
EMAIL_FROM_ADDRESS=support@yourcompany.com

# OpenAI Configuration (for email analysis)
OPENAI_API_KEY=your-openai-api-key

# Cron Job Security
CRON_SECRET=your-secret-key-for-cron-jobs
```

## Features

1. **Daily Digest Emails**
   - Sends a daily summary of ticket updates and new sessions
   - Customizable email templates stored in the database
   - Sent to all project members

2. **Email-to-Ticket Creation**
   - Users can create new tickets by sending emails
   - AI analyzes email content to set appropriate priority and status
   - Automatic thread tracking for email conversations

3. **Email Replies**
   - Users can reply to ticket emails to add comments
   - AI processes replies to update ticket status (e.g., closing tickets)
   - All email interactions are logged for audit purposes

## Setting Up Email Processing

1. Install the required dependencies:
   ```bash
   npm install nodemailer mustache
   ```

2. Run the database migrations:
   ```bash
   npm run migration:up
   ```

3. Configure your email service (e.g., SendGrid, Postmark) to forward incoming emails to:
   ```
   POST /api/email/incoming
   ```

4. Set up a daily cron job to trigger the digest emails:
   ```
   POST /api/email/digest
   ```
   Headers required:
   ```
   Authorization: Bearer ${CRON_SECRET}
   ```

## Email Templates

The system uses Mustache templates for email formatting. The default daily digest template is included in the migrations, but you can customize it through the database.

## Security Considerations

1. All incoming emails are verified using your email service's webhook signatures
2. The digest API is protected with a secret key
3. Email processing is done asynchronously to prevent timeouts
4. All email interactions are logged for audit purposes
