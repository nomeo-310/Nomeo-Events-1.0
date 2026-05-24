// lib/emails/send-seedphrase-expiring-email.ts
import { transporter } from "../transport";

interface SeedPhraseExpiringEmailParams {
  email: string;
  name: string;
  displayName: string;
  newSeedPhrase: string;
  newExpiryDate: Date;
  loginLink: string;
  supportEmail?: string;
}

export async function sendSeedPhraseExpiringEmail(params: SeedPhraseExpiringEmailParams) {
  const { email, name, displayName, newSeedPhrase, newExpiryDate, loginLink, supportEmail = "support@nomeo-events.com" } = params;

  const year = new Date().getFullYear();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://nomeo-events.com";
  const expiryDate = newExpiryDate.toLocaleDateString('en-US', { 
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
        <title>Your Seed Phrase Has Been Renewed</title>
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
          .seed-card {
            background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
            border: 2px solid #f59e0b;
            border-radius: 12px; padding: 20px; margin-bottom: 20px;
          }
          .seed-card h3 { color: #92400e; font-size: 15px; font-weight: 600; margin-bottom: 12px; }
          .seed-phrase {
            background: #ffffff; padding: 16px; border-radius: 8px;
            font-family: 'Courier New', monospace; font-size: 14px;
            font-weight: 600; color: #111827; text-align: center;
            word-break: break-all; border: 1px dashed #f59e0b;
          }
          .expiry-date {
            text-align: center; margin-top: 12px; font-size: 13px;
            color: #78350f; font-weight: 600;
          }
          .warning-box {
            background: #fee2e2; border-left: 4px solid #ef4444;
            padding: 12px 16px; border-radius: 0 8px 8px 0;
            margin-bottom: 20px; font-size: 13px; color: #991b1b;
          }
          .info-card {
            background: #f0fdf4; border-radius: 8px; padding: 16px;
            margin-bottom: 20px; border: 1px solid #bbf7d0;
          }
          .cta-button {
            display: inline-block; background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
            color: #ffffff; text-decoration: none; padding: 14px 32px;
            border-radius: 8px; font-weight: 600; font-size: 15px;
            margin: 12px 0; text-align: center;
          }
          .divider { border-top: 1px solid #e5e7eb; margin: 20px 0; }
          .support { text-align: center; }
          .footer { background-color: #f9fafb; padding: 20px 24px; text-align: center; border-top: 1px solid #e5e7eb; }
          @media (max-width: 600px) {
            .content { padding: 16px; }
            .seed-phrase { font-size: 12px; }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Seed Phrase Renewed</h1>
            <p>Your recovery key has been automatically updated</p>
          </div>

          <div class="content">
            <p class="greeting">Hello <strong>${displayName}</strong> (${name}),</p>
            <p class="message">
              Your previous seed phrase has expiblue. We've automatically generated a new one 
              for your Nomeo Events admin account.
            </p>

            <div class="seed-card">
              <h3>🔑 Your New Seed Phrase</h3>
              <div class="seed-phrase">${newSeedPhrase}</div>
              <div class="expiry-date">
                ⏰ Expires on: ${expiryDate} (1 year from now)
              </div>
            </div>

            <div class="warning-box">
              <strong>⚠️ Your old seed phrase is no longer valid</strong><br>
              Please save this new seed phrase immediately. The old one cannot be used for recovery.
            </div>

            <div class="info-card">
              <strong>💡 Security Reminders:</strong><br>
              • Store this seed phrase in a secure location (password manager, encrypted vault)<br>
              • Never share it with anyone, including Nomeo Events staff<br>
              • You'll need it to recover your account if you forget your password<br>
              • This seed phrase will automatically expire on ${expiryDate}
            </div>

            <div style="text-align: center;">
              <a href="${loginLink}" class="cta-button">Go to Admin Dashboard</a>
            </div>

            <div class="divider"></div>

            <div class="support">
              <p>Need help? Contact support:</p>
              <a href="mailto:${supportEmail}" style="color: #6366f1;">${supportEmail}</a>
            </div>
          </div>

          <div class="footer">
            <div class="copyright">© ${year} Nomeo Events. All rights reserved.</div>
          </div>
        </div>
      </body>
    </html>`;

  const text = `
Seed Phrase Renewal - Nomeo Events Admin

Hello ${displayName} (${name}),

Your previous seed phrase has expiblue. We've automatically generated a new one for your admin account.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
YOUR NEW SEED PHRASE:
${newSeedPhrase}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Expires on: ${expiryDate} (1 year from now)

⚠️ Your old seed phrase is no longer valid. Please save this new seed phrase immediately.

Security Reminders:
• Store this seed phrase securely
• Never share it with anyone
• You'll need it for account recovery

Login to your dashboard: ${loginLink}

Questions? Contact ${supportEmail}

---
© ${year} Nomeo Events. All rights reserved.
  `;

  await transporter.sendMail({
    from: `"Nomeo Events Security" <${process.env.SMTP_SERVER_USERNAME}>`,
    to: email,
    subject: `Your Admin Seed Phrase Has Been Renewed - ${displayName}`,
    text,
    html,
  });

  console.log(`✅ Seed phrase renewal email sent to ${email}`);
}