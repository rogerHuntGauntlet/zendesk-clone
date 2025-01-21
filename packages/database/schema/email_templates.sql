-- Reset Password Email Template
SELECT auth.email_templates_update(
  'reset_password',
  'Reset Your Password - ZenDesk Clone',
  '<!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
  </head>
  <body style="background: #f9f9f9; font-family: Arial, sans-serif; padding: 20px;">
    <div style="max-width: 600px; margin: 0 auto; background: white; padding: 20px; border-radius: 10px; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
      <h1 style="color: #333; text-align: center;">Reset Your Password</h1>
      <p style="color: #666; line-height: 1.6;">
        Hello,<br><br>
        Someone has requested a password reset for your account. If this was you, click the button below to reset your password. If you didn''t request this, you can safely ignore this email.
      </p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="{{ .ConfirmationURL }}" style="background: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
          Reset Password
        </a>
      </div>
      <p style="color: #666; font-size: 14px; text-align: center;">
        This link will expire in 24 hours.
      </p>
    </div>
  </body>
  </html>'
);

-- Welcome Email Template
SELECT auth.email_templates_update(
  'confirm_signup',
  'Welcome to ZenDesk Clone',
  '<!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
  </head>
  <body style="background: #f9f9f9; font-family: Arial, sans-serif; padding: 20px;">
    <div style="max-width: 600px; margin: 0 auto; background: white; padding: 20px; border-radius: 10px; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
      <h1 style="color: #333; text-align: center;">Welcome to ZenDesk Clone!</h1>
      <p style="color: #666; line-height: 1.6;">
        Hello,<br><br>
        Thank you for signing up! We''re excited to have you on board. To get started, please verify your email address by clicking the button below.
      </p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="{{ .ConfirmationURL }}" style="background: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
          Verify Email
        </a>
      </div>
      <p style="color: #666; font-size: 14px; text-align: center;">
        If you didn''t create an account, you can safely ignore this email.
      </p>
    </div>
  </body>
  </html>'
);

-- Magic Link Email Template
SELECT auth.email_templates_update(
  'magic_link',
  'Your Magic Link - ZenDesk Clone',
  '<!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
  </head>
  <body style="background: #f9f9f9; font-family: Arial, sans-serif; padding: 20px;">
    <div style="max-width: 600px; margin: 0 auto; background: white; padding: 20px; border-radius: 10px; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
      <h1 style="color: #333; text-align: center;">Login to ZenDesk Clone</h1>
      <p style="color: #666; line-height: 1.6;">
        Hello,<br><br>
        Click the button below to sign in to your account. This link will expire in 24 hours.
      </p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="{{ .ConfirmationURL }}" style="background: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
          Sign In
        </a>
      </div>
      <p style="color: #666; font-size: 14px; text-align: center;">
        If you didn''t request this email, you can safely ignore it.
      </p>
    </div>
  </body>
  </html>'
); 