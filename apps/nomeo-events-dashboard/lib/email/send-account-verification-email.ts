// lib/email/send-account-verification-emails.ts
import { transporter } from "../transport";

interface AccountVerificationEmailParams {
  email: string;
  name: string;
  verifiedBy: string;
  verifiedAt: Date;
  accountType: string;
  supportEmail?: string;
  dashboardUrl?: string;
}

export async function sendAccountVerificationEmail(params: AccountVerificationEmailParams) {
  const {
    email,
    name,
    verifiedBy,
    verifiedAt,
    accountType,
    supportEmail = "support@nomeo-events.com",
    dashboardUrl = `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`
  } = params;

  const year = new Date().getFullYear();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://nomeo-events.com";
  const formattedDate = verifiedAt.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  const formattedTime = verifiedAt.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit'
  });

  const html = `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Account Verified - Nomeo Events</title>
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
          .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 32px 24px; text-align: center; }
          .header h1 { color: #ffffff; font-size: 22px; font-weight: 700; margin: 0 0 8px 0; }
          .header p { color: rgba(255,255,255,0.9); font-size: 14px; margin: 0; }
          .badge {
            display: inline-block;
            background: rgba(255,255,255,0.2);
            border-radius: 40px;
            padding: 6px 12px;
            font-size: 12px;
            font-weight: 600;
            color: white;
            margin-top: 12px;
          }
          .content { padding: 24px; }
          .greeting { color: #374151; font-size: 15px; margin-bottom: 12px; }
          .greeting strong { color: #111827; }
          .success-box {
            background: #ecfdf5; border-left: 4px solid #10b981;
            padding: 16px; border-radius: 0 8px 8px 0;
            margin-bottom: 20px;
          }
          .success-box h3 { color: #065f46; font-size: 14px; font-weight: 600; margin-bottom: 8px; }
          .success-box p { color: #047857; font-size: 13px; margin: 0; }
          .info-card {
            background: #f0fdf4; border-radius: 8px; padding: 16px; margin-bottom: 20px;
          }
          .info-card p { color: #166534; font-size: 13px; margin-bottom: 8px; }
          .benefits-list {
            background: #f9fafb; border-radius: 8px; padding: 16px; margin-bottom: 20px;
          }
          .benefits-list h4 { color: #374151; font-size: 13px; font-weight: 600; margin-bottom: 12px; }
          .benefits-list ul { margin: 0; padding-left: 20px; }
          .benefits-list li { color: #4b5563; font-size: 13px; margin-bottom: 6px; }
          .cta-button {
            text-align: center; margin: 20px 0;
          }
          .cta-button a {
            display: inline-block;
            background: #10b981;
            color: white;
            padding: 12px 24px;
            border-radius: 8px;
            text-decoration: none;
            font-weight: 600;
            font-size: 14px;
          }
          .divider { border-top: 1px solid #e5e7eb; margin: 20px 0; }
          .support { text-align: center; }
          .support p { color: #6b7280; font-size: 13px; margin-bottom: 6px; }
          .support a { color: #10b981; font-size: 13px; font-weight: 500; text-decoration: none; }
          .footer { background-color: #f9fafb; padding: 20px 24px; text-align: center; border-top: 1px solid #e5e7eb; }
          .footer a { color: #6b7280; font-size: 12px; text-decoration: none; margin: 0 8px; }
          .copyright { color: #9ca3af; font-size: 12px; margin-top: 8px; }
          @media (max-width: 600px) {
            .content { padding: 16px; }
            .header { padding: 24px 16px; }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Account Verified! 🎉</h1>
            <p>Your account has been successfully verified</p>
            <div class="badge">${accountType === 'organization' ? 'Organization' : 'Individual'} Account</div>
          </div>

          <div class="content">
            <p class="greeting">Dear <strong>${name}</strong>,</p>
            
            <div class="success-box">
              <h3>✅ Verification Complete</h3>
              <p>Congratulations! Your account has been verified and approved.</p>
            </div>

            <div class="info-card">
              <p><strong>📋 Verification Details:</strong></p>
              <p>• Verified By: ${verifiedBy}</p>
              <p>• Verification Date: ${formattedDate} at ${formattedTime}</p>
              <p>• Account Type: ${accountType === 'organization' ? 'Organization Account' : 'Individual Account'}</p>
            </div>

            <div class="benefits-list">
              <h4>✨ What You Can Do Now:</h4>
              <ul>
                <li>✓ Create and publish events on the platform</li>
                <li>✓ Access premium features and tools</li>
                <li>✓ Receive bookings and manage attendees</li>
                <li>✓ Build trust with verified badge on your profile</li>
                <li>✓ Access analytics and insights</li>
              </ul>
            </div>

            <div class="cta-button">
              <a href="${dashboardUrl}">Go to Dashboard</a>
            </div>

            <div class="divider"></div>

            <div class="support">
              <p>Need help getting started?</p>
              <a href="mailto:${supportEmail}">${supportEmail}</a>
            </div>
          </div>

          <div class="footer">
            <a href="${appUrl}/privacy">Privacy</a>
            <span style="color: #d1d5db; margin: 0 8px;">•</span>
            <a href="${appUrl}/terms">Terms</a>
            <span style="color: #d1d5db; margin: 0 8px;">•</span>
            <a href="${appUrl}/help">Help Center</a>
            <div class="copyright">© ${year} Nomeo Events. All rights reserved.</div>
          </div>
        </div>
      </body>
    </html>`;

  const text = `
Account Verified! 🎉

Dear ${name},

Your account has been successfully verified!

Verification Details:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Verified By: ${verifiedBy}
Verification Date: ${formattedDate} at ${formattedTime}
Account Type: ${accountType === 'organization' ? 'Organization Account' : 'Individual Account'}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✨ What You Can Do Now:
✓ Create and publish events on the platform
✓ Access premium features and tools
✓ Receive bookings and manage attendees
✓ Build trust with verified badge on your profile
✓ Access analytics and insights

Get started: ${dashboardUrl}

Need help? Contact: ${supportEmail}

---
© ${year} Nomeo Events. All rights reserved.`;

  await transporter.sendMail({
    from: `"Nomeo Events Verification" <${process.env.SMTP_SERVER_USERNAME}>`,
    to: email,
    subject: "✅ Account Verified - Welcome to Nomeo Events!",
    text,
    html,
  });

  console.log(`✅ Account verification email sent to ${email}`);
}