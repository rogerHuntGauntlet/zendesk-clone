import sgMail from '@sendgrid/mail';

// Initialize SendGrid with API key
if (!process.env.SENDGRID_API_KEY) {
  throw new Error('SENDGRID_API_KEY is not configured');
}
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

type InviteType = 'client' | 'employee';

interface SendInviteEmailParams {
  email: string;
  projectName: string;
  inviteType: InviteType;
  inviteToken: string;
}

export async function sendProjectInviteEmail({
  email,
  projectName,
  inviteType,
  inviteToken,
}: SendInviteEmailParams) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const portalPath = inviteType === 'client' ? 'client-portal' : 'employee-portal';
  const loginUrl = `${baseUrl}/${portalPath}/login?invite=${inviteToken}`;

  const emailTemplate = {
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
  };

  const template = emailTemplate[inviteType];

  const msg = {
    to: email,
    from: process.env.SENDGRID_FROM_EMAIL || 'noreply@zendesk-clone.com',
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
  };

  try {
    await sgMail.send(msg);
    console.log(`Invite email sent to ${email} for project ${projectName}`);
  } catch (error) {
    console.error('Error sending invite email:', error);
    throw new Error('Failed to send invite email');
  }
}
