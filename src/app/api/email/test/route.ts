import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function GET(req: NextRequest) {
  try {
    // Create SendGrid transporter
    const transporter = nodemailer.createTransport({
      host: 'smtp.sendgrid.net',
      port: 587,
      secure: false,
      auth: {
        user: 'apikey', // Must be 'apikey' for SendGrid
        pass: process.env.EMAIL_SMTP_PASS,
      },
    });

    // Send test email
    await transporter.sendMail({
      from: process.env.EMAIL_FROM_ADDRESS,
      to: process.env.EMAIL_FROM_ADDRESS, // Send to same address for testing
      subject: 'Test Email from ZenDesk Clone',
      html: `
        <h1>Test Email</h1>
        <p>If you're seeing this, the email system is working correctly!</p>
        <p>Sent at: ${new Date().toISOString()}</p>
        <hr>
        <p>Configuration used:</p>
        <ul>
          <li>SMTP Host: smtp.sendgrid.net</li>
          <li>From Address: ${process.env.EMAIL_FROM_ADDRESS}</li>
          <li>Using SendGrid API Key: Yes</li>
        </ul>
      `,
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Test email sent successfully',
      config: {
        host: 'smtp.sendgrid.net',
        port: 587,
        from: process.env.EMAIL_FROM_ADDRESS
      }
    });
  } catch (error: any) {
    console.error('Error sending test email:', error);
    return NextResponse.json(
      { 
        error: 'Failed to send test email', 
        details: error.message,
        config: {
          host: 'smtp.sendgrid.net',
          port: 587,
          from: process.env.EMAIL_FROM_ADDRESS
        }
      },
      { status: 500 }
    );
  }
}
