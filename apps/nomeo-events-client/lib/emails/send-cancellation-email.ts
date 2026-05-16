// lib/send-cancellation-email.ts
import { transporter } from "../transporter";
import { formatDate, formatTime } from "../date-utils";

interface SendCancellationOtpEmailParams {
  email: string;
  name: string;
  otp: string;
  eventTitle: string;
  eventDate: string;
  registrationNumber: string;
  expiresInMinutes?: number;
}

export async function sendCancellationOtpEmail(params: SendCancellationOtpEmailParams) {
  const {
    email, name, otp, eventTitle, eventDate,
    registrationNumber, expiresInMinutes = 15,
  } = params;

  if (!email || !name || !otp || !eventTitle || !registrationNumber) {
    throw new Error("Missing required parameters for cancellation OTP email");
  }

  const year = new Date().getFullYear();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://nomeo-events.com";
  const formattedDate = formatDate(eventDate);
  const formattedTime = formatTime(eventDate);

  const html = `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Cancellation OTP - ${eventTitle}</title>
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
          .greeting strong { color: #111827; font-weight: 600; }
          .message { color: #4b5563; font-size: 14px; margin-bottom: 20px; line-height: 1.6; }
          .otp-card {
            background: #fef2f2; border: 2px dashed #fca5a5;
            border-radius: 12px; padding: 24px; margin-bottom: 20px; text-align: center;
          }
          .otp-label { color: #6b7280; font-size: 13px; font-weight: 500; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 12px; }
          .otp-code { font-family: 'Courier New', monospace; font-size: 36px; font-weight: 700; letter-spacing: 8px; color: #dc2626; margin-bottom: 12px; }
          .otp-expiry { color: #9ca3af; font-size: 12px; }
          .event-card { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 12px; padding: 20px; margin-bottom: 20px; }
          .event-card h3 { color: #374151; font-size: 14px; font-weight: 600; margin-bottom: 14px; text-transform: uppercase; letter-spacing: 1px; }
          .event-detail { display: flex; justify-content: space-between; align-items: flex-start; padding: 8px 0; border-bottom: 1px solid #f3f4f6; font-size: 14px; gap: 16px; }
          .event-detail:last-child { border-bottom: none; }
          .event-detail .label { color: #6b7280; font-weight: 500; min-width: 60px; flex-shrink: 0; }
          .event-detail .value { color: #111827; font-weight: 600; text-align: right; word-break: break-word; }
          .warning { background: #fff7ed; border-left: 4px solid #f97316; padding: 12px 16px; border-radius: 0 8px 8px 0; margin-bottom: 16px; font-size: 13px; color: #9a3412; line-height: 1.6; }
          .security-note { background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 12px 16px; margin-bottom: 20px; font-size: 13px; color: #065f46; line-height: 1.6; }
          .divider { border-top: 1px solid #e5e7eb; margin: 20px 0; }
          .support { text-align: center; }
          .support p { color: #6b7280; font-size: 13px; margin-bottom: 6px; }
          .support a { color: #6366f1; font-size: 13px; font-weight: 500; text-decoration: none; }
          .footer { background-color: #f9fafb; padding: 20px 24px; text-align: center; border-top: 1px solid #e5e7eb; }
          .footer-links { margin-bottom: 8px; }
          .footer-links a { color: #6b7280; font-size: 12px; text-decoration: none; margin: 0 8px; }
          .copyright { color: #9ca3af; font-size: 12px; margin-top: 6px; }
          @media (max-width: 600px) {
            .content { padding: 16px; }
            .header { padding: 24px 16px; }
            .otp-code { font-size: 28px; letter-spacing: 6px; }
            .event-detail { flex-direction: column; gap: 4px; align-items: flex-start; }
            .event-detail .value { text-align: left; }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <table width="64" height="64" cellpadding="0" cellspacing="0" border="0"
              style="background:rgba(255,255,255,0.2);border-radius:50%;margin:0 auto 16px auto;">
              <tr>
                <td align="center" valign="middle" width="64" height="64">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none"
                    stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"
                    xmlns="http://www.w3.org/2000/svg" style="display:block;margin:0 auto;">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="15" y1="9" x2="9" y2="15"></line>
                    <line x1="9" y1="9" x2="15" y2="15"></line>
                  </svg>
                </td>
              </tr>
            </table>
            <h1>Cancellation Request</h1>
            <p>Verify your identity to cancel your registration</p>
          </div>

          <div class="content">
            <p class="greeting"><strong>Hello ${name},</strong></p>
            <p class="message">
              We received a request to cancel your registration for <strong>${eventTitle}</strong>.
              Use the one-time code below to confirm your cancellation.
            </p>

            <div class="otp-card">
              <div class="otp-label">Your Cancellation Code</div>
              <div class="otp-code">${otp}</div>
              <div class="otp-expiry">&#9201; This code expires in ${expiresInMinutes} minutes</div>
            </div>

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
                <span class="label">Reg #</span>
                <span class="value" style="font-family:monospace;font-size:12px;">${registrationNumber}</span>
              </div>
            </div>

            <div class="warning">
              <strong>&#9888;&#65039; Important:</strong> If you did not request this cancellation,
              please ignore this email. Your registration will remain active and this code will expire automatically.
            </div>

            <div class="security-note">
              &#128274; For security, never share this code with anyone, including Nomeo Events support staff.
            </div>

            <div class="divider"></div>

            <div class="support">
              <p>Questions about your registration?</p>
              <a href="mailto:support@nomeo-events.com">support@nomeo-events.com</a>
            </div>
          </div>

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
    subject: `Cancellation Code: ${eventTitle}`,
    html,
  });

  console.log(`✅ Cancellation OTP email sent to ${email} for: ${eventTitle}`);
}