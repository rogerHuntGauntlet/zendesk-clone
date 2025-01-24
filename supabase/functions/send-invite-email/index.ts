import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { SendGridClient } from 'https://deno.land/x/sendgrid@0.0.3/mod.ts'

const sendgrid = new SendGridClient(Deno.env.get('SENDGRID_API_KEY')!)
const fromEmail = Deno.env.get('SENDGRID_FROM_EMAIL')!
const appUrl = Deno.env.get('APP_URL') || 'http://localhost:3000'

serve(async (req) => {
  try {
    const { email, projectName, inviteType, inviteId } = await req.json()

    // Construct the login URL
    const loginUrl = `${appUrl}/${inviteType === 'client' ? 'client-portal' : 'employee-portal'}/login?invite=${inviteId}`

    const template = {
      client: {
        subject: `You've been invited to ${projectName} on ZenDesk`,
        heading: 'Welcome to ZenDesk!',
        message: `You've been invited to access the client portal for project "${projectName}". Click the button below to set up your account and get started.`,
      },
      employee: {
        subject: `You've been added to ${projectName} on ZenDesk`,
        heading: 'New Project Assignment',
        message: `You've been assigned to work on project "${projectName}". Click the button below to access the project in your employee portal.`,
      },
    }[inviteType]

    const msg = {
      to: email,
      from: fromEmail,
      subject: template.subject,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #6D28D9; margin-bottom: 24px;">${template.heading}</h1>
          <p style="color: #374151; font-size: 16px; line-height: 24px; margin-bottom: 32px;">
            ${template.message}
          </p>
          <a href="${loginUrl}" 
             style="display: inline-block; background-color: #6D28D9; color: white; 
                    padding: 12px 24px; text-decoration: none; border-radius: 6px;
                    font-weight: 500;">
            Get Started
          </a>
          <p style="color: #6B7280; font-size: 14px; margin-top: 32px;">
            If you didn't expect this invitation, please ignore this email.
          </p>
        </div>
      `,
    }

    await sendgrid.send(msg)

    return new Response(
      JSON.stringify({ message: 'Invite email sent successfully' }),
      { headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error sending invite email:', error)
    return new Response(
      JSON.stringify({ error: 'Failed to send invite email' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})
