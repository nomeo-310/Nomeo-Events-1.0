import { transporter } from "../transport";

interface VerificationRejectionEmailParams {
  email: string;
  name: string;
  rejectedBy: string;
  reason: string;
  rejectedAt: Date;
  accountType: string;
  canResubmit?: boolean;
  supportEmail?: string;
}

export async function sendVerificationRejectionEmail(params: VerificationRejectionEmailParams) {
  const { email, name, rejectedBy, reason, rejectedAt, accountType, canResubmit = true, supportEmail = "support@nomeo-events.com" } = params;

  const year = new Date().getFullYear();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://nomeo-events.com";

  const html = `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Verification Update - Nomeo Events</title>
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
          .alert-box p { color: #b45309; font-size: 13px; margin: 0; }
          .reason-box {
            background: #fef2f2; border: 1px solid #fecaca;
            border-radius: 8px; padding: 16px; margin-bottom: 20px;
          }
          .reason-box p { color: #991b1b; font-size: 13px; margin: 0; }
          .reason-label { font-weight: 600; color: #7f1d1d; margin-bottom: 8px; }
          .info-card {
            background: #eff6ff; border-radius: 8px; padding: 16px; margin-bottom: 20px;
          }
          .info-card p { color: #1e40af; font-size: 13px; margin-bottom: 8px; }
          .info-card strong { color: #1e3a8a; }
          .action-box {
            background: linear-gradient(135deg, #fef3c7 0%, #fffbeb 100%);
            border-radius: 8px; padding: 20px; text-align: center;
            margin-bottom: 20px;
          }
          .action-button {
            display: inline-block;
            background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
            color: white !important;
            padding: 12px 24px;
            text-decoration: none;
            border-radius: 8px;
            font-weight: 600;
            font-size: 14px;
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
            <h1>Verification Update</h1>
            <p>Action Required: Please Review</p>
          </div>

          <div class="content">
            <p class="greeting">Dear <strong>${name}</strong>,</p>
            
            <div class="alert-box">
              <h3>📋 Verification Requires Attention</h3>
              <p>Your ${accountType === "organization" ? "organization" : "individual"} account verification needs to be reviewed.</p>
            </div>

            <div class="reason-box">
              <div class="reason-label">⚠️ Reason for Return:</div>
              <p>${reason}</p>
            </div>

            <div class="info-card">
              <p><strong>📊 Review Details:</strong></p>
              <p>• Reviewed By: ${rejectedBy}</p>
              <p>• Review Date: ${rejectedAt.toLocaleDateString()}</p>
              <p>• Account Type: ${accountType === "organization" ? "Organization" : "Individual"}</p>
              <p>• Resubmission Allowed: ${canResubmit ? "Yes" : "No"}</p>
            </div>

            ${canResubmit ? `
              <div class="action-box">
                <p style="color: #92400e; margin-bottom: 8px;"><strong>✅ Ready to Resubmit?</strong></p>
                <p style="color: #78350f; font-size: 13px; margin-bottom: 12px;">
                  Please review the feedback above, make the necessary changes to your documents, 
                  and resubmit for verification.
                </p>
                <a href="${appUrl}/dashboard/verification/resubmit" class="action-button">
                  Resubmit Documents
                </a>
              </div>
            ` : `
              <div class="reason-box">
                <p style="color: #991b1b;">
                  <strong>❌ Resubmission Not Allowed</strong><br>
                  Please contact support for further assistance.
                </p>
              </div>
            `}

            <div class="divider"></div>

            <div class="support">
              <p>Need help with your verification?</p>
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
Verification Update - Action Required

Dear ${name},

Your ${accountType === "organization" ? "organization" : "individual"} account verification needs to be reviewed.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
REASON FOR RETURN:
${reason}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Review Details:
• Reviewed By: ${rejectedBy}
• Review Date: ${rejectedAt.toLocaleDateString()}
• Account Type: ${accountType === "organization" ? "Organization" : "Individual"}
• Resubmission Allowed: ${canResubmit ? "Yes" : "No"}

${canResubmit ? `
Please review the feedback above, make the necessary changes to your documents, 
and resubmit for verification.

Resubmit here: ${appUrl}/dashboard/verification/resubmit
` : `
Please contact support for further assistance.
`}

Questions? Contact: ${supportEmail}

---
© ${year} Nomeo Events. All rights reserved.`;

  await transporter.sendMail({
    from: `"Nomeo Events Verification" <${process.env.SMTP_SERVER_USERNAME}>`,
    to: email,
    subject: "Verification Update Required - Nomeo Events",
    text,
    html,
  });

  console.log(`✅ Verification rejection email sent to ${email}`);
  return { success: true };
}