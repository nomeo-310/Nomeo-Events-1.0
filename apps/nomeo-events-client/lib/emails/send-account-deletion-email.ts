// ============================================
// lib/emails/send-account-deletion-email.ts
// ============================================
import { transporter } from "../transporter";

interface DeletionEmailParams {
  email: string;
  name: string;
  deletionDate: Date;
  dataRetentionDays: number;
  eventsCancelled: number;
  registrationsAffected: number;
  refundsInitiated: number;
  supportEmail?: string;
}

export async function sendAccountDeletionEmail(params: DeletionEmailParams) {
  const {
    email, name, deletionDate, dataRetentionDays,
    eventsCancelled, registrationsAffected, refundsInitiated,
    supportEmail = "support@nomeo-events.com"
  } = params;

  const year = new Date().getFullYear();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://nomeo-events.com";
  const finalDeletionDate = new Date(deletionDate.getTime() + dataRetentionDays * 86400000);

  const html = `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Account Deleted - Nomeo Events</title>
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
          .header { background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); padding: 32px 24px; text-align: center; }
          .header h1 { color: #ffffff; font-size: 22px; font-weight: 700; margin: 0 0 8px 0; }
          .header p { color: rgba(255,255,255,0.9); font-size: 14px; margin: 0; }
          .content { padding: 24px; }
          .greeting { color: #374151; font-size: 15px; margin-bottom: 12px; }
          .greeting strong { color: #111827; }
          .message { color: #4b5563; font-size: 14px; margin-bottom: 20px; line-height: 1.6; }
          .summary-grid {
            display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 24px;
          }
          .summary-card {
            border-radius: 8px; padding: 16px; text-align: center;
          }
          .summary-card.red { background: #fef2f2; }
          .summary-card.blue { background: #eff6ff; }
          .summary-card.green { background: #f0fdf4; }
          .summary-number { font-size: 28px; font-weight: 700; margin-bottom: 4px; }
          .summary-card.red .summary-number { color: #dc2626; }
          .summary-card.blue .summary-number { color: #2563eb; }
          .summary-card.green .summary-number { color: #059669; }
          .summary-label { font-size: 12px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; }
          .timeline {
            background: #fef2f2; border: 1px solid #fecaca;
            border-radius: 12px; padding: 20px; margin-bottom: 20px;
          }
          .timeline h3 { color: #991b1b; font-size: 15px; font-weight: 600; margin-bottom: 12px; }
          .timeline-item {
            display: flex; align-items: flex-start; gap: 12px;
            padding: 10px 0; font-size: 14px; border-bottom: 1px solid #fecaca;
          }
          .timeline-item:last-child { border-bottom: none; }
          .timeline-dot {
            width: 10px; height: 10px; border-radius: 50%;
            background: #ef4444; margin-top: 5px; flex-shrink: 0;
          }
          .timeline-item.completed .timeline-dot { background: #10b981; }
          .timeline-text { color: #374151; flex: 1; }
          .timeline-date { color: #6b7280; font-size: 12px; }
          .warning-box {
            background: #fff7ed; border-left: 4px solid #f97316;
            padding: 12px 16px; border-radius: 0 8px 8px 0;
            margin-bottom: 16px; font-size: 13px; color: #9a3412; line-height: 1.6;
          }
          .important-note {
            background: #f0fdf4; border: 1px solid #bbf7d0;
            border-radius: 8px; padding: 16px; margin-bottom: 16px;
            font-size: 13px; color: #065f46; line-height: 1.6;
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
            .summary-grid { grid-template-columns: 1fr; }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Account Permanently Deleted</h1>
            <p>Your account deletion has been processed</p>
          </div>

          <div class="content">
            <p class="greeting">Hello <strong>${name}</strong>,</p>
            <p class="message">
              Your Nomeo Events account has been permanently deleted. We're sorry to see you go. 
              Here's a summary of what was processed:
            </p>

            <div class="summary-grid">
              <div class="summary-card red">
                <div class="summary-number">${eventsCancelled}</div>
                <div class="summary-label">Events Cancelled</div>
              </div>
              <div class="summary-card blue">
                <div class="summary-number">${registrationsAffected}</div>
                <div class="summary-label">Registrations Affected</div>
              </div>
              <div class="summary-card green">
                <div class="summary-number">${refundsInitiated}</div>
                <div class="summary-label">Refunds Processing</div>
              </div>
            </div>

            <div class="timeline">
              <h3>⏰ Deletion Timeline</h3>
              <div class="timeline-item completed">
                <div class="timeline-dot"></div>
                <div>
                  <div class="timeline-text">Account deactivated & events cancelled</div>
                  <div class="timeline-date">${deletionDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
                </div>
              </div>
              <div class="timeline-item completed">
                <div class="timeline-dot"></div>
                <div>
                  <div class="timeline-text">All attendees notified & refunds initiated</div>
                  <div class="timeline-date">Today</div>
                </div>
              </div>
              <div class="timeline-item">
                <div class="timeline-dot"></div>
                <div>
                  <div class="timeline-text">Refunds completed (7-14 business days)</div>
                  <div class="timeline-date">Processing</div>
                </div>
              </div>
              <div class="timeline-item">
                <div class="timeline-dot"></div>
                <div>
                  <div class="timeline-text"><strong>All data permanently erased</strong></div>
                  <div class="timeline-date">${finalDeletionDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
                </div>
              </div>
            </div>

            <div class="important-note">
              <strong>💳 Refund Information:</strong> All ${refundsInitiated} paid registrations are being refunded. 
              Attendees will receive their refunds within 7-14 business days to their original payment methods.
            </div>

            <div class="warning-box">
              <strong>⚠️ Can you undo this?</strong> You have until ${finalDeletionDate.toLocaleDateString()} 
              to contact support and request account restoration. After this date, all data will be permanently erased 
              and cannot be recovered.
            </div>

            <div class="divider"></div>

            <div class="support">
              <p>Need to restore your account or have questions?</p>
              <a href="mailto:${supportEmail}">${supportEmail}</a>
              <p style="margin-top: 8px; font-size: 12px;">Please include your account email for faster assistance.</p>
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
    subject: `Account Permanently Deleted - Final Confirmation`,
    html,
  });

  console.log(`✅ Account deletion confirmation sent to ${email}`);
}