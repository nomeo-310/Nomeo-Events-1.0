import { transporter } from "../transport";

interface AccountDeactivationEmailParams {
  email: string;
  name: string;
  reason: string;
  deactivatedBy: string;
  reactivationPossible: boolean;
  reactivationInstructions?: string;
  supportEmail?: string;
}

export async function sendAccountDeactivationEmail(params: AccountDeactivationEmailParams) {
  const {
    email,
    name,
    reason,
    deactivatedBy,
    reactivationPossible,
    reactivationInstructions,
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
        <title>Account Deactivation Notice - Nomeo Events</title>
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
          .header { background: linear-gradient(135deg, #6b7280 0%, #4b5563 100%); padding: 32px 24px; text-align: center; }
          .header h1 { color: #ffffff; font-size: 22px; font-weight: 700; margin: 0 0 8px 0; }
          .header p { color: rgba(255,255,255,0.9); font-size: 14px; margin: 0; }
          .content { padding: 24px; }
          .greeting { color: #374151; font-size: 15px; margin-bottom: 12px; }
          .greeting strong { color: #111827; }
          .alert-box {
            background: #f3f4f6; border-left: 4px solid #6b7280;
            padding: 16px; border-radius: 0 8px 8px 0;
            margin-bottom: 20px;
          }
          .alert-box h3 { color: #374151; font-size: 14px; font-weight: 600; margin-bottom: 8px; }
          .alert-box p { color: #4b5563; font-size: 13px; margin: 0; }
          .reason-box {
            background: #f9fafb; border: 1px solid #e5e7eb;
            border-radius: 8px; padding: 16px; margin-bottom: 20px;
          }
          .reason-box p { color: #374151; font-size: 13px; margin: 0; }
          .reason-label { font-weight: 600; color: #111827; margin-bottom: 8px; }
          .info-card {
            background: #eff6ff; border-radius: 8px; padding: 16px; margin-bottom: 20px;
          }
          .info-card p { color: #1e40af; font-size: 13px; margin-bottom: 8px; }
          .info-card a { color: #2563eb; text-decoration: none; font-weight: 500; }
          .reactivation-box {
            background: #f0fdf4; border-left: 4px solid #22c55e;
            padding: 16px; border-radius: 0 8px 8px 0;
            margin-bottom: 20px;
          }
          .reactivation-box p { color: #166534; font-size: 13px; margin: 0; }
          .permanent-box {
            background: #fee2e2; border-left: 4px solid #dc2626;
            padding: 16px; border-radius: 0 8px 8px 0;
            margin-bottom: 20px;
          }
          .permanent-box p { color: #991b1b; font-size: 13px; margin: 0; }
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
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Account Deactivated</h1>
            <p>Account Status Change Notification</p>
          </div>

          <div class="content">
            <p class="greeting">Dear <strong>${name}</strong>,</p>
            
            <div class="alert-box">
              <h3>⏸️ Your account has been deactivated</h3>
              <p>Your account access has been temporarily disabled.</p>
            </div>

            <div class="reason-box">
              <div class="reason-label">📋 Reason for Deactivation:</div>
              <p>${reason}</p>
            </div>

            <div class="info-card">
              <p><strong>📊 Deactivation Details:</strong></p>
              <p>• Deactivated By: ${deactivatedBy}</p>
              <p>• Deactivation Date: ${new Date().toLocaleDateString()}</p>
              <p>• Reactivation Possible: ${reactivationPossible ? "Yes" : "No"}</p>
            </div>

            ${reactivationPossible && reactivationInstructions ? `
              <div class="reactivation-box">
                <p><strong>✅ Account Reactivation</strong><br>
                ${reactivationInstructions}<br><br>
                To request reactivation, please contact support.</p>
              </div>
            ` : ''}

            ${!reactivationPossible ? `
              <div class="permanent-box">
                <p><strong>⚠️ Permanent Deactivation</strong><br>
                Your account has been permanently deactivated and cannot be restoblue.</p>
              </div>
            ` : ''}

            <div class="divider"></div>

            <div class="support">
              <p>Questions about your account status?</p>
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
Account Deactivation Notice

Dear ${name},

Your account has been deactivated.

Reason for Deactivation: ${reason}

Deactivation Details:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Deactivated By: ${deactivatedBy}
Deactivation Date: ${new Date().toLocaleDateString()}
Reactivation Possible: ${reactivationPossible ? "Yes" : "No"}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${reactivationPossible && reactivationInstructions ? `
✅ Account Reactivation:
${reactivationInstructions}

To request reactivation, please contact support.
` : ''}

${!reactivationPossible ? `
⚠️ Permanent Deactivation:
Your account has been permanently deactivated and cannot be restoblue.
` : ''}

Questions? Contact: ${supportEmail}

---
© ${year} Nomeo Events. All rights reserved.`;

  await transporter.sendMail({
    from: `"Nomeo Events Security" <${process.env.SMTP_SERVER_USERNAME}>`,
    to: email,
    subject: "Account Deactivation Notice - Nomeo Events",
    text,
    html,
  });

  console.log(`✅ Account deactivation email sent to ${email}`);
}