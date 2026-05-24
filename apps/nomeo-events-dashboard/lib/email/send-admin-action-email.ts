import { transporter } from "../transport";

interface AdminActionEmailParams {
  email: string;
  name: string;
  action: string;
  details: string;
  performedBy: string;
  performedByEmail: string;
  newRole?: string;
  oldRole?: string;
  reason?: string;
  supportEmail?: string;
}

export async function sendAdminActionEmail(params: AdminActionEmailParams) {
  const {
    email,
    name,
    action,
    details,
    performedBy,
    performedByEmail,
    newRole,
    oldRole,
    reason,
    supportEmail = "support@nomeo-events.com"
  } = params;

  const year = new Date().getFullYear();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://nomeo-events.com";

  const getActionColor = () => {
    switch (action) {
      case "promote": return "linear-gradient(135deg, #10b981 0%, #059669 100%)";
      case "demote": return "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)";
      case "suspend": return "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)";
      case "activate": return "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)";
      case "deactivate": return "linear-gradient(135deg, #6b7280 0%, #4b5563 100%)";
      default: return "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)";
    }
  };

  const getActionTitle = () => {
    switch (action) {
      case "promote": return "Role Promotion";
      case "demote": return "Role Demotion";
      case "suspend": return "Account Suspended";
      case "activate": return "Account Activated";
      case "deactivate": return "Account Deactivated";
      default: return "Account Update";
    }
  };

  const html = `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Admin Account Update - Nomeo Events</title>
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
          .header { background: ${getActionColor()}; padding: 32px 24px; text-align: center; }
          .header h1 { color: #ffffff; font-size: 22px; font-weight: 700; margin: 0 0 8px 0; }
          .header p { color: rgba(255,255,255,0.9); font-size: 14px; margin: 0; }
          .content { padding: 24px; }
          .greeting { color: #374151; font-size: 15px; margin-bottom: 12px; }
          .greeting strong { color: #111827; }
          .alert-box {
            background: #f3f4f6; border-left: 4px solid ${action === "promote" ? "#10b981" : action === "demote" ? "#f59e0b" : action === "suspend" ? "#ef4444" : "#3b82f6"};
            padding: 16px; border-radius: 0 8px 8px 0;
            margin-bottom: 20px;
          }
          .alert-box h3 { color: #374151; font-size: 14px; font-weight: 600; margin-bottom: 8px; }
          .alert-box p { color: #4b5563; font-size: 13px; margin: 0; }
          .info-card {
            background: #eff6ff; border-radius: 8px; padding: 16px; margin-bottom: 20px;
          }
          .info-card p { color: #1e40af; font-size: 13px; margin-bottom: 8px; }
          .info-card strong { color: #1e3a8a; }
          .reason-box {
            background: #fef2f2; border: 1px solid #fecaca;
            border-radius: 8px; padding: 16px; margin-bottom: 20px;
          }
          .reason-box p { color: #991b1b; font-size: 13px; margin: 0; }
          .divider { border-top: 1px solid #e5e7eb; margin: 20px 0; }
          .support { text-align: center; }
          .support p { color: #6b7280; font-size: 13px; margin-bottom: 6px; }
          .support a { color: #6366f1; font-size: 13px; font-weight: 500; text-decoration: none; }
          .footer { background-color: #f9fafb; padding: 20px 24px; text-align: center; border-top: 1px solid #e5e7eb; }
          .footer a { color: #6b7280; font-size: 12px; text-decoration: none; margin: 0 8px; }
          .copyright { color: #9ca3af; font-size: 12px; margin-top: 8px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>${getActionTitle()}</h1>
            <p>Admin Account Update Notification</p>
          </div>

          <div class="content">
            <p class="greeting">Dear <strong>${name}</strong>,</p>
            
            <div class="alert-box">
              <h3>📋 Account Update</h3>
              <p>${details}</p>
            </div>

            <div class="info-card">
              <p><strong>📊 Update Details:</strong></p>
              <p>• Action By: ${performedBy} (${performedByEmail})</p>
              <p>• Action Date: ${new Date().toLocaleString()}</p>
              ${oldRole && newRole ? `<p>• Role Change: ${oldRole} → ${newRole}</p>` : ''}
            </div>

            ${reason ? `
              <div class="reason-box">
                <p><strong>📝 Reason Provided:</strong><br>${reason}</p>
              </div>
            ` : ''}

            <div class="divider"></div>

            <div class="support">
              <p>Questions about this update?</p>
              <a href="mailto:${supportEmail}">${supportEmail}</a>
            </div>
          </div>

          <div class="footer">
            <a href="${appUrl}/privacy">Privacy Policy</a>
            <span style="color: #d1d5db; margin: 0 8px;">•</span>
            <a href="${appUrl}/terms">Terms of Service</a>
            <span style="color: #d1d5db; margin: 0 8px;">•</span>
            <a href="${appUrl}/help">Help Center</a>
            <div class="copyright">© ${year} Nomeo Events. All rights reserved.</div>
          </div>
        </div>
      </body>
    </html>`;

  const text = `
${getActionTitle()}

Dear ${name},

${details}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Update Details:
• Action By: ${performedBy} (${performedByEmail})
• Action Date: ${new Date().toLocaleString()}
${oldRole && newRole ? `• Role Change: ${oldRole} → ${newRole}` : ''}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${reason ? `Reason: ${reason}\n` : ''}

Questions? Contact: ${supportEmail}

---
© ${year} Nomeo Events. All rights reserved.`;

  await transporter.sendMail({
    from: `"Nomeo Events Admin" <${process.env.SMTP_SERVER_USERNAME}>`,
    to: email,
    subject: `Admin Account Update: ${getActionTitle()} - Nomeo Events`,
    text,
    html,
  });

  console.log(`✅ Admin action email sent to ${email}`);
  return { success: true };
}