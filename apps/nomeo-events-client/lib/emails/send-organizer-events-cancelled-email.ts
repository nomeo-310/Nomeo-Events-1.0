// ============================================
// lib/emails/send-organizer-events-cancelled-email.ts
// ============================================
import { transporter } from "../transporter";
import { formatDate } from "../date-utils";

interface OrganizerEventsCancelledParams {
  email: string;
  name: string;
  deletionDate: Date;
  finalDeletionDate: Date;
  eventsCancelled: number;
  totalRegistrationsAffected: number;
  totalRefundsInitiated: number;
  eventsSummary: Array<{
    title: string;
    date: string;
    registrationsAffected: number;
    refundsInitiated: number;
  }>;
  supportEmail?: string;
}

export async function sendOrganizerEventsCancelledEmail(params: OrganizerEventsCancelledParams) {
  const {
    email, name, deletionDate, finalDeletionDate,
    eventsCancelled, totalRegistrationsAffected, totalRefundsInitiated,
    eventsSummary, supportEmail = "support@nomeo-events.com"
  } = params;

  const year = new Date().getFullYear();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://nomeo-events.com";

  // Generate events table HTML
  const eventsTableHtml = eventsSummary.length > 0 ? eventsSummary.map(event => `
    <tr style="border-bottom: 1px solid #e5e7eb;">
      <td style="padding: 12px 10px; font-size: 14px; color: #111827; font-weight: 500;">${event.title}</td>
      <td style="padding: 12px 10px; font-size: 13px; color: #6b7280;">${formatDate(event.date)}</td>
      <td style="padding: 12px 10px; font-size: 13px; color: #6b7280; text-align: center;">${event.registrationsAffected}</td>
      <td style="padding: 12px 10px; font-size: 13px; text-align: center;">
        ${event.refundsInitiated > 0 
          ? `<span style="color: #059669; font-weight: 600;">₦${event.refundsInitiated}</span>` 
          : '<span style="color: #9ca3af;">—</span>'}
      </td>
    </tr>
  `).join('') : '<tr><td colspan="4" style="padding: 20px; text-align: center; color: #9ca3af;">No events were active</td></tr>';

  const html = `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Account Deletion & Event Cancellation Summary</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            background-color: #f9fafb; padding: 12px; line-height: 1.5;
          }
          .container {
            max-width: 600px; margin: 0 auto; background-color: #ffffff;
            border-radius: 16px; overflow: hidden;
            box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06);
          }
          .header { background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); padding: 32px 24px; text-align: center; }
          .header h1 { color: #ffffff; font-size: 22px; font-weight: 700; margin: 0 0 8px 0; }
          .header p { color: rgba(255,255,255,0.9); font-size: 14px; margin: 0; }
          .content { padding: 24px; }
          .greeting { color: #374151; font-size: 15px; margin-bottom: 12px; }
          .greeting strong { color: #111827; }
          .message { color: #4b5563; font-size: 14px; margin-bottom: 24px; line-height: 1.6; }
          .stats-grid {
            display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; margin-bottom: 24px;
          }
          .stat-card {
            border-radius: 10px; padding: 16px; text-align: center;
          }
          .stat-value { font-size: 28px; font-weight: 700; margin-bottom: 4px; }
          .stat-label { font-size: 12px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; }
          .stat-card.red { background: #fef2f2; }
          .stat-card.red .stat-value { color: #dc2626; }
          .stat-card.blue { background: #eff6ff; }
          .stat-card.blue .stat-value { color: #2563eb; }
          .stat-card.green { background: #f0fdf4; }
          .stat-card.green .stat-value { color: #059669; }
          .stat-card.purple { background: #faf5ff; }
          .stat-card.purple .stat-value { color: #7c3aed; }
          .events-table-container {
            border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden; margin-bottom: 24px;
          }
          .events-table-header {
            background: #f9fafb; padding: 12px 10px; display: grid;
            grid-template-columns: 2fr 1fr 1fr 1fr; gap: 8px;
          }
          .events-table-header span {
            font-size: 12px; font-weight: 600; color: #6b7280;
            text-transform: uppercase; letter-spacing: 0.5px;
          }
          .events-table-body { max-height: 300px; overflow-y: auto; }
          .events-table-body table { width: 100%; border-collapse: collapse; }
          .events-table-body table tr:last-child td { border-bottom: none; }
          .timeline {
            background: #fefce8; border: 1px solid #fde68a; border-radius: 8px; padding: 16px;
            margin-bottom: 20px;
          }
          .timeline h3 { color: #92400e; font-size: 15px; margin-bottom: 12px; }
          .timeline-item {
            display: flex; gap: 10px; padding: 6px 0; font-size: 13px; color: #78350f;
          }
          .timeline-icon { flex-shrink: 0; width: 20px; }
          .warning-note {
            background: #fff7ed; border-left: 4px solid #f97316;
            padding: 12px 16px; border-radius: 0 8px 8px 0;
            margin-bottom: 16px; font-size: 13px; color: #9a3412; line-height: 1.6;
          }
          .divider { border-top: 1px solid #e5e7eb; margin: 20px 0; }
          .contact-info {
            background: #f3f4f6; border-radius: 8px; padding: 16px; margin-bottom: 16px;
          }
          .contact-info p { color: #374151; font-size: 14px; margin: 4px 0; }
          .footer { background-color: #f9fafb; padding: 20px 24px; text-align: center; border-top: 1px solid #e5e7eb; }
          .footer a { color: #6b7280; font-size: 12px; text-decoration: none; margin: 0 8px; }
          .copyright { color: #9ca3af; font-size: 12px; margin-top: 8px; }
          @media (max-width: 600px) {
            .content { padding: 16px; }
            .header { padding: 24px 16px; }
            .stats-grid { grid-template-columns: 1fr; }
            .events-table-header { grid-template-columns: 1fr 1fr; }
            .events-table-header span:nth-child(3),
            .events-table-header span:nth-child(4) { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Account Deletion Complete</h1>
            <p>Summary of all cancelled events and affected registrations</p>
          </div>

          <div class="content">
            <p class="greeting">Hello <strong>${name}</strong>,</p>
            <p class="message">
              Your account deletion has been processed. All your events have been cancelled, 
              attendees notified, and refunds initiated. Here's a complete summary:
            </p>

            <!-- Stats Overview -->
            <div class="stats-grid">
              <div class="stat-card red">
                <div class="stat-value">${eventsCancelled}</div>
                <div class="stat-label">Events Cancelled</div>
              </div>
              <div class="stat-card blue">
                <div class="stat-value">${totalRegistrationsAffected}</div>
                <div class="stat-label">Registrations Affected</div>
              </div>
              <div class="stat-card green">
                <div class="stat-value">${totalRefundsInitiated}</div>
                <div class="stat-label">Refunds Processing</div>
              </div>
              <div class="stat-card purple">
                <div class="stat-value">${eventsSummary.length || 0}</div>
                <div class="stat-label">Emails Sent to Attendees</div>
              </div>
            </div>

            <!-- Events Table -->
            <h3 style="color: #374151; font-size: 15px; font-weight: 600; margin-bottom: 12px;">
              📋 Cancelled Events Detail
            </h3>
            <div class="events-table-container">
              <div class="events-table-header">
                <span>Event</span>
                <span>Date</span>
                <span>Registrations</span>
                <span>Refunds</span>
              </div>
              <div class="events-table-body">
                <table>
                  ${eventsTableHtml}
                </table>
              </div>
            </div>

            <!-- Timeline -->
            <div class="timeline">
              <h3>⏰ What Happens Next</h3>
              <div class="timeline-item">
                <span class="timeline-icon">✅</span>
                <span>Today: All events cancelled and attendees notified via email</span>
              </div>
              <div class="timeline-item">
                <span class="timeline-icon">💳</span>
                <span>7-14 days: All ${totalRefundsInitiated} refunds will be completed</span>
              </div>
              <div class="timeline-item">
                <span class="timeline-icon">⚠️</span>
                <span>${finalDeletionDate.toLocaleDateString()}: All data permanently erased</span>
              </div>
            </div>

            <div class="warning-note">
              <strong>🔄 Want to undo this?</strong> You have until ${finalDeletionDate.toLocaleDateString()} 
              to contact support and restore your account. After this date, recovery is impossible.
            </div>

            <div class="contact-info">
              <p><strong>📧 Email:</strong> ${supportEmail}</p>
              <p><strong>📞 Phone:</strong> +234 800 000 0000</p>
              <p style="font-size: 12px; color: #6b7280; margin-top: 8px;">Please reference your account email when contacting us.</p>
            </div>

            <div class="divider"></div>
          </div>

          <div class="footer">
            <a href="${appUrl}/privacy">Privacy Policy</a>
            <span style="color: #d1d5db; margin: 0 8px;">•</span>
            <a href="${appUrl}/terms">Terms of Use</a>
            <span style="color: #d1d5db; margin: 0 8px;">•</span>
            <a href="${appUrl}/help">Help Center</a>
            <div class="copyright">© ${year} Nomeo Events. All rights reserved.</div>
          </div>
        </div>
      </body>
    </html>`;

  await transporter.sendMail({
    from: `"Nomeo Events" <${process.env.SMTP_SERVER_USERNAME}>`,
    to: email,
    subject: `Account Deletion Complete - ${eventsCancelled} Events Cancelled, ${totalRegistrationsAffected} Attendees Notified`,
    html,
  });

  console.log(`✅ Organizer events cancellation summary sent to ${email}`);
}