import { transporter } from "../transport";

interface AccountSuspensionEmailParams {
  email: string;
  name: string;
  reason: string;
  duration?: number;
  expectedReactivation?: Date;
  suspendedBy: string;
  appealDeadline?: Date;
  supportEmail?: string;
}

export async function sendAccountSuspensionEmail(params: AccountSuspensionEmailParams) {
  const {
    email,
    name,
    reason,
    duration,
    expectedReactivation,
    suspendedBy,
    appealDeadline,
    supportEmail = "support@nomeo-events.com"
  } = params;

  const year = new Date().getFullYear();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://nomeo-events.com";
  const hasDuration = duration && duration > 0;

  const html = `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Account Suspension Notice - Nomeo Events</title>
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
          .alert-box {
            background: #fef3c7; border-left: 4px solid #f59e0b;
            padding: 16px; border-radius: 0 8px 8px 0;
            margin-bottom: 20px;
          }
          .alert-box h3 { color: #92400e; font-size: 14px; font-weight: 600; margin-bottom: 8px; }
          .alert-box p { color: #78350f; font-size: 13px; margin: 0; }
          .reason-box {
            background: #fffbeb; border: 1px solid #fde68a;
            border-radius: 8px; padding: 16px; margin-bottom: 20px;
          }
          .reason-box p { color: #92400e; font-size: 13px; margin: 0; }
          .reason-label { font-weight: 600; color: #78350f; margin-bottom: 8px; }
          .info-card {
            background: #f3f4f6; border-radius: 8px; padding: 16px; margin-bottom: 20px;
          }
          .info-card p { color: #4b5563; font-size: 13px; margin-bottom: 8px; }
          .warning-box {
            background: #fee2e2; border-left: 4px solid #dc2626;
            padding: 12px 16px; border-radius: 0 8px 8px 0;
            margin-bottom: 20px; font-size: 13px; color: #991b1b;
          }
          .action-box {
            background: #e0e7ff; border-radius: 8px; padding: 16px; margin-bottom: 20px; text-align: center;
          }
          .action-button {
            display: inline-block; background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
            color: #ffffff; text-decoration: none; padding: 12px 24px;
            border-radius: 6px; font-weight: 600; font-size: 14px;
            margin-top: 12px;
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
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Account Temporarily Suspended</h1>
            <p>Important Action Requiblue</p>
          </div>

          <div class="content">
            <p class="greeting">Dear <strong>${name}</strong>,</p>
            
            <div class="alert-box">
              <h3>🚫 Your account has been suspended</h3>
              <p>Due to violations of our terms of service, your account access has been temporarily restricted.</p>
            </div>

            <div class="reason-box">
              <div class="reason-label">📋 Reason for Suspension:</div>
              <p>${reason}</p>
            </div>

            <div class="info-card">
              <p><strong>📊 Suspension Details:</strong></p>
              <p>• Suspended By: ${suspendedBy}</p>
              <p>• Suspension Date: ${new Date().toLocaleDateString()}</p>
              ${hasDuration ? `<p>• Suspension Duration: ${duration} days</p>` : '<p>• Suspension Duration: Indefinite pending review</p>'}
              ${expectedReactivation ? `<p>• Expected Reactivation: ${expectedReactivation.toLocaleDateString()}</p>` : ''}
              ${appealDeadline ? `<p>• Appeal Deadline: ${appealDeadline.toLocaleDateString()}</p>` : ''}
            </div>

            <div class="warning-box">
              <strong>⚠️ During Suspension:</strong><br>
              • You cannot log into your account<br>
              • Your events will be hidden from public view<br>
              • New registrations will be blocked<br>
              • Pending payouts will be on hold
            </div>

            ${appealDeadline ? `
              <div class="action-box">
                <p><strong>📝 Appeal Process</strong></p>
                <p>You have the right to appeal this suspension. Submit your appeal before ${appealDeadline.toLocaleDateString()}.</p>
                <a href="${appUrl}/appeal" class="action-button">Submit Appeal</a>
              </div>
            ` : ''}

            <div class="divider"></div>

            <div class="support">
              <p>Questions about your suspension?</p>
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
Account Suspension Notice

Dear ${name},

Your account has been temporarily suspended.

Reason for Suspension: ${reason}

Suspension Details:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Suspended By: ${suspendedBy}
Suspension Date: ${new Date().toLocaleDateString()}
Suspension Duration: ${hasDuration ? `${duration} days` : "Indefinite pending review"}
${expectedReactivation ? `Expected Reactivation: ${expectedReactivation.toLocaleDateString()}` : ''}
${appealDeadline ? `Appeal Deadline: ${appealDeadline.toLocaleDateString()}` : ''}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⚠️ During Suspension:
• You cannot log into your account
• Your events will be hidden from public view
• New registrations will be blocked
• Pending payouts will be on hold

${appealDeadline ? `
📝 Appeal Process:
You have the right to appeal this suspension. Submit your appeal before ${appealDeadline.toLocaleDateString()}.
Visit: ${appUrl}/appeal
` : ''}

Questions about your suspension? Contact: ${supportEmail}

---
© ${year} Nomeo Events. All rights reserved.`;

  await transporter.sendMail({
    from: `"Nomeo Events Security" <${process.env.SMTP_SERVER_USERNAME}>`,
    to: email,
    subject: "Account Suspension Notice - Nomeo Events",
    text,
    html,
  });

  console.log(`✅ Account suspension email sent to ${email}`);
}