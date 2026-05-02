// lib/send-user-cancel-email.ts
import { transporter } from "./transporter";
import { formatDate, formatTime } from "./date-utils";

interface SendUserCancelEmailParams {
  email: string;
  name: string;
  eventTitle: string;
  eventDate: string;
  registrationNumber: string;
  cancellationReason?: string;
  registrationType: "individual" | "group" | "corporate";
  refunded: boolean;
  currency: string;
  price: number;
}

export async function sendUserCancelEmail(params: SendUserCancelEmailParams) {
  const {
    email,
    name,
    eventTitle,
    eventDate,
    registrationNumber,
    cancellationReason,
    registrationType,
    refunded,
    currency,
    price,
  } = params;

  if (!email || !name || !eventTitle || !registrationNumber) {
    throw new Error("Missing required parameters for cancellation notification email");
  }

  const year = new Date().getFullYear();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://nomeo-events.com";
  const formattedDate = formatDate(eventDate);
  const formattedTime = formatTime(eventDate);

  const registrationTypeLabel =
    registrationType === "group"
      ? "Group Registration"
      : registrationType === "corporate"
      ? "Corporate Registration"
      : "Individual Registration";

  const html = `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Registration Cancelled - ${eventTitle}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            background-color: #f9fafb;
            padding: 12px;
            line-height: 1.5;
          }
          .container {
            max-width: 560px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 16px;
            overflow: hidden;
            box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06);
          }
          .header {
            background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
            padding: 32px 24px;
            text-align: center;
          }
          .header h1 { color: #ffffff; font-size: 22px; font-weight: 700; margin: 0 0 8px 0; }
          .header p { color: rgba(255,255,255,0.9); font-size: 14px; margin: 0; }
          .content { padding: 24px; }
          .greeting { color: #374151; font-size: 15px; margin-bottom: 12px; }
          .greeting strong { color: #111827; font-weight: 600; }
          .message { color: #4b5563; font-size: 14px; margin-bottom: 20px; line-height: 1.6; }
          .registration-number {
            background: #f59e0b;
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            font-family: 'Courier New', monospace;
            font-size: 18px;
            font-weight: 700;
            text-align: center;
            margin-bottom: 20px;
            letter-spacing: 2px;
          }
          .event-card {
            background: #f9fafb;
            border: 1px solid #e5e7eb;
            border-radius: 12px;
            padding: 20px;
            margin-bottom: 20px;
          }
          .event-card h3 {
            color: #374151;
            font-size: 14px;
            font-weight: 600;
            margin-bottom: 14px;
            text-transform: uppercase;
            letter-spacing: 1px;
          }
          .event-detail {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            padding: 10px 0;
            border-bottom: 1px solid #f3f4f6;
            font-size: 14px;
            gap: 16px;
          }
          .event-detail:last-child { border-bottom: none; }
          .event-detail .label { color: #6b7280; font-weight: 500; min-width: 80px; flex-shrink: 0; }
          .event-detail .value { color: #111827; font-weight: 600; text-align: right; word-break: break-word; }
          .refund-card {
            background: #f0fdf4;
            border: 1px solid #bbf7d0;
            border-radius: 12px;
            padding: 20px;
            margin-bottom: 20px;
          }
          .refund-card h3 { color: #065f46; font-size: 15px; font-weight: 600; margin-bottom: 10px; }
          .refund-card p { color: #047857; font-size: 14px; line-height: 1.6; }
          .no-refund-card {
            background: #fefce8;
            border: 1px solid #fef08a;
            border-radius: 12px;
            padding: 20px;
            margin-bottom: 20px;
          }
          .no-refund-card h3 { color: #854d0e; font-size: 15px; font-weight: 600; margin-bottom: 10px; }
          .no-refund-card p { color: #92400e; font-size: 14px; line-height: 1.6; }
          .reason-card {
            background: #fff7ed;
            border-left: 4px solid #f97316;
            padding: 12px 16px;
            border-radius: 0 8px 8px 0;
            margin-bottom: 20px;
            font-size: 13px;
            color: #9a3412;
            line-height: 1.6;
          }
          .group-note {
            background: #eff6ff;
            border: 1px solid #bfdbfe;
            border-radius: 8px;
            padding: 14px 16px;
            margin-bottom: 20px;
            font-size: 13px;
            color: #1e40af;
            line-height: 1.6;
          }
          .button-container { text-align: center; margin: 24px 0; }
          .button {
            display: inline-block;
            background-color: #6366f1;
            color: #ffffff;
            font-weight: 600;
            padding: 14px 32px;
            border-radius: 8px;
            text-decoration: none;
            font-size: 15px;
          }
          .divider { border-top: 1px solid #e5e7eb; margin: 20px 0; }
          .support { text-align: center; }
          .support p { color: #6b7280; font-size: 13px; margin-bottom: 6px; }
          .support a { color: #6366f1; font-size: 13px; font-weight: 500; text-decoration: none; }
          .footer {
            background-color: #f9fafb;
            padding: 20px 24px;
            text-align: center;
            border-top: 1px solid #e5e7eb;
          }
          .footer-links { margin-bottom: 8px; }
          .footer-links a { color: #6b7280; font-size: 12px; text-decoration: none; margin: 0 8px; }
          .copyright { color: #9ca3af; font-size: 12px; margin-top: 6px; }
          @media (max-width: 600px) {
            .content { padding: 16px; }
            .header { padding: 24px 16px; }
            .event-detail { flex-direction: column; gap: 4px; align-items: flex-start; }
            .event-detail .value { text-align: left; }
          }
        </style>
      </head>
      <body>
        <div class="container">

          <!-- Header -->
          <div class="header">
            <table width="64" height="64" cellpadding="0" cellspacing="0" border="0"
              style="background:rgba(255,255,255,0.2);border-radius:50%;margin:0 auto 16px auto;">
              <tr>
                <td align="center" valign="middle" width="64" height="64">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none"
                    stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"
                    xmlns="http://www.w3.org/2000/svg" style="display:block;margin:0 auto;">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="8" x2="12" y2="12"></line>
                    <line x1="12" y1="16" x2="12.01" y2="16"></line>
                  </svg>
                </td>
              </tr>
            </table>
            <h1>Registration Cancelled</h1>
            <p>Your registration for ${eventTitle} has been cancelled</p>
          </div>

          <!-- Content -->
          <div class="content">
            <p class="greeting"><strong>Hello ${name},</strong></p>
            <p class="message">
              We're writing to let you know that your registration for <strong>${eventTitle}</strong> 
              has been cancelled by the event organizer. We're sorry for any inconvenience this may cause.
            </p>

            <!-- Registration Number -->
            <div class="registration-number">${registrationNumber}</div>

            <!-- Event & Registration Details -->
            <div class="event-card">
              <h3>Registration Details</h3>
              <div class="event-detail">
                <span class="label">Event</span>
                <span class="value">${eventTitle}</span>
              </div>
              <div class="event-detail">
                <span class="label">Date</span>
                <span class="value">${formattedDate} at ${formattedTime}</span>
              </div>
              <div class="event-detail">
                <span class="label">Type</span>
                <span class="value">${registrationTypeLabel}</span>
              </div>
              <div class="event-detail">
                <span class="label">Amount Paid</span>
                <span class="value">${price === 0 ? "Free" : `${currency} ${price.toLocaleString()}`}</span>
              </div>
              <div class="event-detail">
                <span class="label">Cancelled By</span>
                <span class="value">Event Organizer</span>
              </div>
            </div>

            ${cancellationReason ? `
            <!-- Cancellation Reason -->
            <div class="reason-card">
              <strong>&#8505;&#65039; Reason:</strong> ${cancellationReason}
            </div>` : ""}

            ${registrationType === "group" ? `
            <!-- Group note -->
            <div class="group-note">
              &#128101; <strong>Group Registration:</strong> All members of your group registration have also been cancelled. 
              Please inform your group members of this update.
            </div>` : ""}

            ${registrationType === "corporate" ? `
            <!-- Corporate note -->
            <div class="group-note" style="background:#f0fdf4;border-color:#bbf7d0;color:#065f46;">
              &#127970; <strong>Corporate Registration:</strong> All members of your corporate registration have also been cancelled. 
              Please inform your team members of this update.
            </div>` : ""}

            <!-- Refund Info -->
            ${refunded && price > 0 ? `
            <div class="refund-card">
              <h3>&#128179; Refund Information</h3>
              <p>
                A refund of <strong>${currency} ${price.toLocaleString()}</strong> has been initiated to your original payment method. 
                Please allow 5–10 business days for the funds to reflect in your account depending on your bank or card provider.
              </p>
            </div>` : price === 0 ? "" : `
            <div class="no-refund-card">
              <h3>&#9888;&#65039; Refund Information</h3>
              <p>
                If you believe you are entitled to a refund or have questions about your payment, 
                please contact our support team directly and we'll be happy to assist you.
              </p>
            </div>`}

            <div class="button-container">
              <a href="${appUrl}/events"
                class="button"
                style="display:inline-block;background-color:#6366f1;color:#ffffff;font-weight:600;padding:14px 32px;border-radius:8px;text-decoration:none;font-size:15px;">
                Browse Other Events
              </a>
            </div>

            <div class="divider"></div>

            <div class="support">
              <p>Have questions or need further assistance?</p>
              <a href="mailto:support@nomeo-events.com">support@nomeo-events.com</a>
            </div>
          </div>

          <!-- Footer -->
          <div class="footer">
            <div class="footer-links">
              <a href="${appUrl}/privacy">Privacy Policy</a>
              <span>&#8226;</span>
              <a href="${appUrl}/terms">Terms of Use</a>
              <span>&#8226;</span>
              <a href="${appUrl}/help">Help Center</a>
            </div>
            <div class="copyright">&#169; ${year} Nomeo Events. All rights reserved.</div>
          </div>

        </div>
      </body>
    </html>`;

  await transporter.sendMail({
    from: `"Nomeo Events" <${process.env.SMTP_SERVER_USERNAME}>`,
    to: email,
    subject: `Your Registration Has Been Cancelled: ${eventTitle}`,
    html,
  });

  console.log(`✅ Cancellation notification email sent to ${email} for: ${eventTitle}`);
}