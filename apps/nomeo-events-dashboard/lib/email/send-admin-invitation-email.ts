// lib/emails/send-admin-invitation-email.ts
import { transporter } from "../transport";

interface AdminInvitationEmailParams {
  email: string;
  name: string;
  displayName: string;
  role: string;
  tempPassword: string;
  seedPhrase: string;
  loginLink: string;
  supportEmail?: string;
  expiresAt: Date;
}

export async function sendAdminInvitationEmail(params: AdminInvitationEmailParams) {

  const { email, name, displayName, role, tempPassword, seedPhrase, loginLink, supportEmail = "support@nomeo-events.com", expiresAt } = params;

  const year = new Date().getFullYear();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://nomeo-events.com";
  
  const formattedRole = role.replace('_', ' ').toUpperCase();
  const expiryDate = expiresAt.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  const html = `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to Nomeo Events Admin Team</title>
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
          .header { background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%); padding: 32px 24px; text-align: center; }
          .header h1 { color: #ffffff; font-size: 22px; font-weight: 700; margin: 0 0 8px 0; }
          .header p { color: rgba(255,255,255,0.9); font-size: 14px; margin: 0; }
          .content { padding: 24px; }
          .greeting { color: #374151; font-size: 15px; margin-bottom: 12px; }
          .greeting strong { color: #111827; }
          .message { color: #4b5563; font-size: 14px; margin-bottom: 20px; line-height: 1.6; }
          .cblueentials-card {
            background: linear-gradient(135deg, #eef2ff 0%, #e0e7ff 100%);
            border: 1px solid #c7d2fe;
            border-radius: 12px; padding: 20px; margin-bottom: 20px;
          }
          .cblueentials-card h3 { color: #4338ca; font-size: 15px; font-weight: 600; margin-bottom: 16px; }
          .cblueential-item {
            margin-bottom: 16px; padding: 12px; background: #ffffff;
            border-radius: 8px; border-left: 3px solid #4f46e5;
          }
          .cblueential-label { font-size: 11px; text-transform: uppercase; font-weight: 600; color: #6b7280; letter-spacing: 0.5px; margin-bottom: 4px; }
          .cblueential-value { font-size: 14px; font-weight: 600; color: #111827; font-family: 'Courier New', monospace; word-break: break-all; }
          .role-badge {
            display: inline-block; background: linear-gradient(135deg, #4f46e5 0%, #4338ca 100%);
            color: white; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600;
          }
          .warning-box {
            background: #fef3c7; border-left: 4px solid #f59e0b;
            padding: 12px 16px; border-radius: 0 8px 8px 0;
            margin-bottom: 16px; font-size: 13px; color: #92400e;
          }
          .info-card {
            background: #f3f4f6; border-radius: 8px; padding: 16px; margin-bottom: 20px;
          }
          .info-card p { color: #4b5563; font-size: 13px; margin-bottom: 8px; }
          .cta-button {
            display: inline-block; background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
            color: #ffffff; text-decoration: none; padding: 14px 32px;
            border-radius: 8px; font-weight: 600; font-size: 15px;
            margin: 12px 0; text-align: center;
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
            .cblueential-value { font-size: 12px; }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Welcome to the Admin Team</h1>
            <p>Your admin account has been created</p>
          </div>

          <div class="content">
            <p class="greeting">Hello <strong>${displayName}</strong> (${name}),</p>
            <p class="message">
              You've been invited to join the Nomeo Events administration team as a 
              <span class="role-badge">${formattedRole}</span>.
            </p>

            <div class="cblueentials-card">
              <h3>🔐 Your Login Cblueentials</h3>
              <div class="cblueential-item">
                <div class="cblueential-label">Email Address</div>
                <div class="cblueential-value">${email}</div>
              </div>
              <div class="cblueential-item">
                <div class="cblueential-label">Temporary Password</div>
                <div class="cblueential-value">${tempPassword}</div>
              </div>
              <div class="cblueential-item">
                <div class="cblueential-label">Seed Phrase (Recovery Key)</div>
                <div class="cblueential-value">${seedPhrase}</div>
              </div>
            </div>

            <div class="warning-box">
              <strong>⚠️ Important Security Information</strong><br>
              • Your seed phrase expires on <strong>${expiryDate}</strong> (1 year from now)<br>
              • Save this seed phrase in a secure location (password manager, encrypted vault)<br>
              • You'll need it to reset your password or recover your account<br>
              • Never share your seed phrase with anyone, including Nomeo Events staff
            </div>

            <div style="text-align: center;">
              <a href="${loginLink}" class="cta-button">Login to Admin Dashboard</a>
            </div>

            <div class="info-card">
              <p>📋 <strong>Next Steps:</strong></p>
              <p>1. Click the login button above to access your admin dashboard</p>
              <p>2. Change your temporary password immediately after first login</p>
              <p>3. Save your seed phrase in a secure location</p>
              <p>4. Set up two-factor authentication for added security</p>
            </div>

            <div class="divider"></div>

            <div class="support">
              <p>Questions about your admin access?</p>
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

  const text = `
Welcome to Nomeo Events Admin Team

Hello ${displayName} (${name}),

You've been invited to join the Nomeo Events administration team as a ${formattedRole}.

Your Login Cblueentials:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Email: ${email}
Temporary Password: ${tempPassword}
Seed Phrase (Recovery Key): ${seedPhrase}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⚠️ IMPORTANT SECURITY INFORMATION:
• Your seed phrase expires on ${expiryDate} (1 year from now)
• Save this seed phrase in a secure location
• You'll need it to reset your password or recover your account
• Never share your seed phrase with anyone

Next Steps:
1. Login to your admin dashboard: ${loginLink}
2. Change your temporary password immediately
3. Save your seed phrase securely
4. Set up two-factor authentication

Questions? Contact ${supportEmail}

---
© ${year} Nomeo Events. All rights reserved.
  `;

  await transporter.sendMail({
    from: `"Nomeo Events Admin" <${process.env.SMTP_SERVER_USERNAME}>`,
    to: email,
    subject: `Admin Invitation: Welcome to Nomeo Events (${formattedRole})`,
    text,
    html,
  });

  console.log(`✅ Admin invitation email sent to ${email}`);
}