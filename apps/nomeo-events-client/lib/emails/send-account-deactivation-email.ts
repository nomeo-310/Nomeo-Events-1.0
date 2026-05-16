// ============================================
// lib/emails/send-account-deactivation-email.ts
// ============================================
import { transporter } from "../transporter";

interface DeactivationEmailParams {
  email: string;
  name: string;
  reason: string;
  reactivationLink: string;
  eventsCount: number;
  registrationCount: number;
  supportEmail?: string;
}

export async function sendAccountDeactivationEmail(params: DeactivationEmailParams) {
  const {
    email, name, reason, reactivationLink,
    eventsCount, registrationCount,
    supportEmail = "support@nomeo-events.com"
  } = params;

  const year = new Date().getFullYear();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://nomeo-events.com";

  const html = `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Account Deactivated - Nomeo Events</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            background-color: #f9fafb; padding: 12px; line-height: 1.5;
          }
          .container {
            max-width: 560px; margin: 0 auto; background-color: #ffffff;
            border-radius: 16px; overflow: hidden;
            box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06);
          }
          .header { background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 32px 24px; text-align: center; }
          .header h1 { color: #ffffff; font-size: 22px; font-weight: 700; margin: 0 0 8px 0; }
          .header p { color: rgba(255,255,255,0.9); font-size: 14px; margin: 0; }
          .content { padding: 24px; }
          .greeting { color: #374151; font-size: 15px; margin-bottom: 12px; }
          .greeting strong { color: #111827; }
          .message { color: #4b5563; font-size: 14px; margin-bottom: 20px; line-height: 1.6; }
          .info-card {
            background: #fefce8; border: 1px solid #fde68a;
            border-radius: 12px; padding: 20px; margin-bottom: 20px;
          }
          .info-card h3 { color: #92400e; font-size: 15px; font-weight: 600; margin-bottom: 12px; }
          .info-list { list-style: none; padding: 0; }
          .info-list li { 
            color: #78350f; font-size: 14px; padding: 8px 0 8px 24px; 
            position: relative; border-bottom: 1px solid #fde68a;
          }
          .info-list li:last-child { border-bottom: none; }
          .info-list li:before {
            content: "•"; color: #d97706; font-weight: bold;
            position: absolute; left: 8px; font-size: 18px;
          }
          .stats {
            display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 20px;
          }
          .stat-box {
            background: #f3f4f6; border-radius: 8px; padding: 12px; text-align: center;
          }
          .stat-number { font-size: 24px; font-weight: 700; color: #111827; }
          .stat-label { font-size: 12px; color: #6b7280; margin-top: 4px; }
          .cta-button {
            display: inline-block; background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
            color: #ffffff; text-decoration: none; padding: 14px 32px;
            border-radius: 8px; font-weight: 600; font-size: 15px;
            margin: 12px 0; text-align: center;
          }
          .warning { 
            background: #fef3c7; border-left: 4px solid #f59e0b; 
            padding: 12px 16px; border-radius: 0 8px 8px 0; 
            margin-bottom: 16px; font-size: 13px; color: #92400e; line-height: 1.6; 
          }
          .divider { border-top: 1px solid #e5e7eb; margin: 20px 0; }
          .support { text-align: center; }
          .support p { color: #6b7280; font-size: 13px; margin-bottom: 6px; }
          .support a { color: #6366f1; font-size: 13px; font-weight: 500; text-decoration: none; }
          .footer { background-color: #f9fafb; padding: 20px 24px; text-align: center; border-top: 1px solid #e5e7eb; }
          .footer a { color: #6b7280; font-size: 12px; text-decoration: none; margin: 0 8px; }
          .copyright { color: #9ca3af; font-size: 12px; margin-top: 8px; }
          @media (max-width: 600px) {
            .content { padding: 16px; }
            .header { padding: 24px 16px; }
            .stats { grid-template-columns: 1fr; }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Account Deactivated</h1>
            <p>Your account has been temporarily deactivated</p>
          </div>

          <div class="content">
            <p class="greeting">Hello <strong>${name}</strong>,</p>
            <p class="message">
              Your Nomeo Events account has been deactivated. 
              ${reason !== 'Account deactivated by user request' ? `<br><strong>Reason:</strong> ${reason}` : ''}
            </p>

            <div class="stats">
              <div class="stat-box">
                <div class="stat-number">${eventsCount}</div>
                <div class="stat-label">Events Unpublished</div>
              </div>
              <div class="stat-box">
                <div class="stat-number">${registrationCount}</div>
                <div class="stat-label">Registrations Preserved</div>
              </div>
            </div>

            <div class="info-card">
              <h3>📋 What This Means</h3>
              <ul class="info-list">
                <li>Your events are now hidden from public view</li>
                <li>All ${registrationCount} registrations are preserved</li>
                <li>Your subscription has been paused</li>
                <li>You won't receive event notifications</li>
                <li>All your data is safe and can be restored</li>
              </ul>
            </div>

            <div class="warning">
              <strong>💡 Want to come back?</strong> Simply log in to your account and everything will be automatically restored — your events, settings, and data will be exactly as you left them.
            </div>

            <div style="text-align: center;">
              <a href="${reactivationLink}" class="cta-button">Reactivate My Account</a>
            </div>

            <div class="divider"></div>

            <div class="support">
              <p>Questions or need help?</p>
              <a href="mailto:${supportEmail}">${supportEmail}</a>
            </div>
          </div>

          <div class="footer">
            <a href="${appUrl}/privacy">Privacy</a>
            <span style="color: #d1d5db; margin: 0 8px;">•</span>
            <a href="${appUrl}/terms">Terms</a>
            <span style="color: #d1d5db; margin: 0 8px;">•</span>
            <a href="${appUrl}/help">Help</a>
            <div class="copyright">© ${year} Nomeo Events. All rights reserved.</div>
          </div>
        </div>
      </body>
    </html>`;

  await transporter.sendMail({
    from: `"Nomeo Events" <${process.env.SMTP_SERVER_USERNAME}>`,
    to: email,
    subject: `Account Deactivated - ${name}`,
    html,
  });

  console.log(`✅ Deactivation email sent to ${email}`);
}