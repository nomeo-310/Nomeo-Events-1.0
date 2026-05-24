import { transporter } from "../transport";

interface AccountDeletionEmailParams {
  email: string;
  name: string;
  reason: string;
  deletionType: "soft" | "hard";
  scheduledDeletionDate?: Date;
  affectedEvents?: number;
  affectedRegistrations?: number;
  initiatedBy: string;
  supportEmail?: string;
}

export async function sendAccountDeletionEmail(params: AccountDeletionEmailParams) {
  const {
    email,
    name,
    reason,
    deletionType,
    scheduledDeletionDate,
    affectedEvents = 0,
    affectedRegistrations = 0,
    initiatedBy,
    supportEmail = "support@nomeo-events.com"
  } = params;

  const year = new Date().getFullYear();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://nomeo-events.com";

  const isSoftDelete = deletionType === "soft";
  const title = isSoftDelete ? "Account Scheduled for Deletion" : "Account Permanently Deleted";
  const message = isSoftDelete
    ? "Your account has been scheduled for deletion due to policy violations."
    : "Your account has been permanently deleted from our platform.";

  const html = `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${title} - Nomeo Events</title>
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
          .header { background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); padding: 32px 24px; text-align: center; }
          .header h1 { color: #ffffff; font-size: 22px; font-weight: 700; margin: 0 0 8px 0; }
          .header p { color: rgba(255,255,255,0.9); font-size: 14px; margin: 0; }
          .content { padding: 24px; }
          .greeting { color: #374151; font-size: 15px; margin-bottom: 12px; }
          .greeting strong { color: #111827; }
          .alert-box {
            background: #fee2e2; border-left: 4px solid #dc2626;
            padding: 16px; border-radius: 0 8px 8px 0;
            margin-bottom: 20px;
          }
          .alert-box h3 { color: #991b1b; font-size: 14px; font-weight: 600; margin-bottom: 8px; }
          .alert-box p { color: #7f1d1d; font-size: 13px; margin: 0; }
          .info-card {
            background: #f3f4f6; border-radius: 8px; padding: 16px; margin-bottom: 20px;
          }
          .info-card p { color: #4b5563; font-size: 13px; margin-bottom: 8px; }
          .reason-box {
            background: #fff7ed; border: 1px solid #fed7aa;
            border-radius: 8px; padding: 16px; margin-bottom: 20px;
          }
          .reason-box p { color: #9a3412; font-size: 13px; margin: 0; }
          .reason-label { font-weight: 600; color: #7c2d12; margin-bottom: 8px; }
          .warning-box {
            background: #fef3c7; border-left: 4px solid #f59e0b;
            padding: 12px 16px; border-radius: 0 8px 8px 0;
            margin-bottom: 20px; font-size: 13px; color: #92400e;
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
            <h1>${title}</h1>
            <p>Account Action Notification</p>
          </div>

          <div class="content">
            <p class="greeting">Dear <strong>${name}</strong>,</p>
            
            <div class="alert-box">
              <h3>⚠️ Account ${isSoftDelete ? "Scheduled for" : "Permanently"} Deleted</h3>
              <p>${message}</p>
            </div>

            <div class="reason-box">
              <div class="reason-label">📋 Reason for Deletion:</div>
              <p>${reason}</p>
            </div>

            <div class="info-card">
              <p><strong>📊 Account Details:</strong></p>
              <p>• Deletion Type: ${isSoftDelete ? "Soft Delete (30-day grace period)" : "Hard Delete (Immediate)"}</p>
              <p>• Initiated By: ${initiatedBy}</p>
              <p>• Date: ${new Date().toLocaleDateString()}</p>
              ${affectedEvents > 0 ? `<p>• Events Affected: ${affectedEvents}</p>` : ''}
              ${affectedRegistrations > 0 ? `<p>• Registrations Affected: ${affectedRegistrations}</p>` : ''}
            </div>

            ${isSoftDelete && scheduledDeletionDate ? `
              <div class="warning-box">
                <strong>⏰ Grace Period Information</strong><br>
                Your account will be permanently deleted on <strong>${scheduledDeletionDate.toLocaleDateString()}</strong>.
                During this grace period, you cannot access your account or restore your data.
              </div>
            ` : ''}

            ${!isSoftDelete ? `
              <div class="warning-box">
                <strong>⚠️ Data Permanently Removed</strong><br>
                All your data has been permanently deleted from our systems. This action cannot be undone.
              </div>
            ` : ''}

            <div class="divider"></div>

            <div class="support">
              <p>If you believe this action was taken in error, please contact our support team.</p>
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
${title}

Dear ${name},

${message}

Reason for Deletion: ${reason}

Account Details:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Deletion Type: ${isSoftDelete ? "Soft Delete (30-day grace period)" : "Hard Delete (Immediate)"}
Initiated By: ${initiatedBy}
Date: ${new Date().toLocaleDateString()}
${affectedEvents > 0 ? `Events Affected: ${affectedEvents}` : ''}
${affectedRegistrations > 0 ? `Registrations Affected: ${affectedRegistrations}` : ''}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${isSoftDelete && scheduledDeletionDate ? `
⚠️ Grace Period Information:
Your account will be permanently deleted on ${scheduledDeletionDate.toLocaleDateString()}.
During this grace period, you cannot access your account or restore your data.
` : ''}

${!isSoftDelete ? `
⚠️ Data Permanently Removed:
All your data has been permanently deleted from our systems. This action cannot be undone.
` : ''}

If you believe this action was taken in error, please contact our support team:
${supportEmail}

---
© ${year} Nomeo Events. All rights reserved.`;

  await transporter.sendMail({
    from: `"Nomeo Events Security" <${process.env.SMTP_SERVER_USERNAME}>`,
    to: email,
    subject: `${title} - Nomeo Events`,
    text,
    html,
  });

  console.log(`✅ Account deletion email sent to ${email}`);
}