// ============================================
// lib/emails/send-event-cancellation-email.ts
// ============================================
import { transporter } from "../transport";
import { formatDate, formatTime } from "../date-utils";

interface EventCancellationEmailParams {
  email: string;
  attendeeName: string;
  organizerName: string;
  eventTitle: string;
  eventDate: string;
  registrationNumber: string;
  refundInfo: string;
  ticketType: string;
  groupSize?: number;
}

export async function sendEventCancellationToAttendees(params: EventCancellationEmailParams) {
  const {
    email, attendeeName, organizerName, eventTitle,
    eventDate, registrationNumber, refundInfo, ticketType, groupSize
  } = params;

  const year = new Date().getFullYear();
  const formattedDate = formatDate(eventDate);
  const formattedTime = formatTime(eventDate);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://nomeo-events.com";

  const html = `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Event Cancelled - ${eventTitle}</title>
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
          .message { color: #4b5563; font-size: 14px; margin-bottom: 20px; line-height: 1.6; }
          .event-details {
            background: #f3f4f6; border-radius: 12px; padding: 20px; margin-bottom: 20px;
          }
          .event-details h3 { color: #374151; font-size: 14px; font-weight: 600; margin-bottom: 16px; text-transform: uppercase; letter-spacing: 1px; }
          .detail-row {
            display: flex; justify-content: space-between; padding: 8px 0;
            border-bottom: 1px solid #e5e7eb; font-size: 14px;
          }
          .detail-row:last-child { border-bottom: none; }
          .detail-label { color: #6b7280; font-weight: 500; }
          .detail-value { color: #111827; font-weight: 600; text-align: right; }
          .cancellation-badge {
            display: inline-block; background: #fee2e2; color: #dc2626;
            padding: 4px 12px; border-radius: 20px; font-size: 13px; font-weight: 600;
            margin-bottom: 16px;
          }
          .refund-info {
            background: #f0fdf4; border: 1px solid #bbf7d0;
            border-radius: 8px; padding: 16px; margin-bottom: 16px;
          }
          .refund-info h4 { color: #065f46; font-size: 14px; margin-bottom: 8px; }
          .refund-info p { color: #065f46; font-size: 14px; line-height: 1.6; }
          .no-refund {
            background: #f9fafb; border: 1px solid #e5e7eb;
            border-radius: 8px; padding: 16px; margin-bottom: 16px;
            font-size: 14px; color: #6b7280; text-align: center;
          }
          .discover-more {
            background: #eff6ff; border-radius: 12px; padding: 20px; text-align: center; margin-bottom: 16px;
          }
          .discover-more h3 { color: #1e40af; font-size: 15px; margin-bottom: 8px; }
          .discover-more p { color: #3b82f6; font-size: 13px; margin-bottom: 16px; }
          .cta-button {
            display: inline-block; background: #2563eb; color: #ffffff;
            text-decoration: none; padding: 12px 32px; border-radius: 8px;
            font-weight: 600; font-size: 15px;
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
            .detail-row { flex-direction: column; gap: 4px; }
            .detail-value { text-align: left; }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Event Cancelled</h1>
            <p>Your registration has been cancelled</p>
          </div>

          <div class="content">
            <p class="greeting">Hello <strong>${attendeeName}</strong>,</p>
            
            <div class="cancellation-badge">⚠️ Cancelled</div>
            
            <p class="message">
              We regret to inform you that <strong>${eventTitle}</strong> organized by ${organizerName} 
              has been cancelled. Your registration is no longer valid.
            </p>

            <div class="event-details">
              <h3>📋 Cancelled Registration</h3>
              <div class="detail-row">
                <span class="detail-label">Event</span>
                <span class="detail-value">${eventTitle}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Date & Time</span>
                <span class="detail-value">${formattedDate} at ${formattedTime}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Ticket Type</span>
                <span class="detail-value">${ticketType}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Registration #</span>
                <span class="detail-value" style="font-family: monospace; font-size: 12px;">${registrationNumber}</span>
              </div>
              ${groupSize ? `
              <div class="detail-row">
                <span class="detail-label">Group Size</span>
                <span class="detail-value">${groupSize} tickets</span>
              </div>
              ` : ''}
            </div>

            ${refundInfo.includes('will be refunded') ? `
            <div class="refund-info">
              <h4>💳 Refund Information</h4>
              <p>${refundInfo}</p>
            </div>
            ` : `
            <div class="no-refund">
              <p>${refundInfo}</p>
            </div>
            `}

            <div class="discover-more">
              <h3>Find More Events</h3>
              <p>Discover other exciting events happening on Nomeo</p>
              <a href="${appUrl}/events" class="cta-button">Browse Events</a>
            </div>

            <div class="divider"></div>

            <div class="support">
              <p>Questions about your refund or registration?</p>
              <a href="mailto:support@nomeo-events.com">support@nomeo-events.com</a>
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
    subject: `Event Cancelled: ${eventTitle} - Refund Information Inside`,
    html,
  });

  console.log(`✅ Event cancellation email sent to ${email} for: ${eventTitle}`);
}