// lib/send-registration-email.ts

import { transporter } from "./transporter";
import { formatDate, formatTime } from "./date-utils";

interface SendRegistrationEmailParams {
  email: string;
  name: string;
  registrationNumber: string;
  eventTitle: string;
  eventDate: string;
  eventEndDate?: string;
  eventVenue: string;
  eventType: "physical" | "virtual";
  planName: string;
  planType: string;
  price: number;
  currency: string;
  ticketNumber?: string;
  qrCode?: string;
  paymentReference?: string;
  paymentAmount?: number;
  isFree: boolean;
  isGroupRegistration?: boolean;
  groupSize?: number;
  groupName?: string;
  registrationType?: "individual" | "group" | "corporate";
  specialInstructions?: string;
}

export interface SendParentalConsentEmailInput {
  parentName: string;
  parentEmail: string;
  attendeeName: string;
  attendeeAge?: number;
  eventTitle: string;
  eventDate: string;
  eventVenue: string;
  registrationNumber: string;
  ticketNumber: string;
}

export async function sendRegistrationEmail(params: SendRegistrationEmailParams) {
  const {
    email, name, registrationNumber, eventTitle, eventDate, eventEndDate,
    eventVenue, eventType, planName, planType, price, currency,
    ticketNumber, qrCode, paymentReference, paymentAmount, isFree,
    isGroupRegistration, groupSize, groupName,
    registrationType = "individual", specialInstructions,
  } = params;

  if (!email || !name || !eventTitle || !registrationNumber) {
    throw new Error("Missing required parameters for registration email");
  }

  const year = new Date().getFullYear();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://nomeo-events.com";
  const formattedDate = formatDate(eventDate);
  const formattedTime = formatTime(eventDate);
  const formattedEndDate = eventEndDate ? formatDate(eventEndDate) : null;
  const formattedEndTime = eventEndDate ? formatTime(eventEndDate) : null;

  const html = `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Registration Confirmed - ${eventTitle}</title>
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
          .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 32px 24px; text-align: center; }
          .header h1 { color: #ffffff; font-size: 22px; font-weight: 700; margin: 0 0 8px 0; }
          .header p { color: rgba(255,255,255,0.9); font-size: 14px; margin: 0; }
          .content { padding: 24px; }
          .greeting { color: #374151; font-size: 15px; margin-bottom: 12px; }
          .greeting strong { color: #111827; font-weight: 600; }
          .message { color: #4b5563; font-size: 14px; margin-bottom: 20px; line-height: 1.6; }
          .registration-number {
            background: #6366f1; color: white; padding: 12px 20px; border-radius: 8px;
            font-family: 'Courier New', monospace; font-size: 18px; font-weight: 700;
            text-align: center; margin-bottom: 16px; letter-spacing: 2px;
          }
          .ticket-section {
            background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
            border-radius: 12px; padding: 24px; margin-bottom: 20px; color: white; text-align: center;
          }
          .ticket-section h3 { font-size: 15px; font-weight: 600; margin-bottom: 16px; }
          .ticket-number { font-family: 'Courier New', monospace; font-size: 20px; font-weight: 700; margin-bottom: 16px; letter-spacing: 1px; }
          .qr-note { font-size: 12px; color: rgba(255,255,255,0.9); margin-top: 8px; }
          .event-card { background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 20px; margin-bottom: 20px; }
          .event-card h3 { color: #065f46; font-size: 16px; font-weight: 600; margin-bottom: 16px; }
          .registration-card { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 12px; padding: 20px; margin-bottom: 20px; }
          .registration-card h3 { color: #374151; font-size: 15px; font-weight: 600; margin-bottom: 16px; text-transform: uppercase; letter-spacing: 1px; }
          .event-detail { display: flex; justify-content: space-between; align-items: flex-start; padding: 10px 0; border-bottom: 1px solid #dcfce7; font-size: 14px; gap: 16px; }
          .event-detail:last-child { border-bottom: none; }
          .event-detail .label { color: #6b7280; font-weight: 500; min-width: 60px; flex-shrink: 0; }
          .event-detail .value { color: #111827; font-weight: 600; text-align: right; word-break: break-word; }
          .group-info { background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 14px; margin-bottom: 16px; color: #1e40af; font-size: 14px; line-height: 1.6; }
          .payment-info { background: #fefce8; border: 1px solid #fef08a; border-radius: 8px; padding: 14px; margin-bottom: 16px; color: #854d0e; font-size: 14px; line-height: 1.6; }
          .instructions { background: #fff7ed; border-left: 4px solid #f97316; padding: 12px 16px; border-radius: 0 8px 8px 0; margin-bottom: 16px; font-size: 13px; color: #9a3412; line-height: 1.5; }
          .consent-notice { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 12px 16px; border-radius: 0 8px 8px 0; margin-bottom: 16px; font-size: 13px; color: #92400e; line-height: 1.5; }
          .button-container { text-align: center; margin: 24px 0; }
          .button { display: inline-block; background-color: #6366f1; color: #ffffff; font-weight: 600; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-size: 15px; }
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
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                </td>
              </tr>
            </table>
            <h1>Registration Confirmed!</h1>
            <p>You're all set for ${eventTitle}</p>
          </div>

          <div class="content">
            <p class="greeting"><strong>Hello ${name},</strong></p>
            <p class="message">
              Your registration for <strong>${eventTitle}</strong> has been confirmed!
              We're excited to have you join us. Here are your registration details:
            </p>

            <div class="registration-number">${registrationNumber}</div>

            ${ticketNumber ? `
            <div class="ticket-section">
              <h3>&#127903;&#65039; Your Digital Ticket</h3>
              <div class="ticket-number">${ticketNumber}</div>
              ${qrCode ? `
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="center">
                    <table cellpadding="20" cellspacing="0" border="0"
                      style="background:#ffffff;border-radius:12px;display:inline-table;margin-bottom:12px;box-shadow:0 2px 8px rgba(0,0,0,0.1);">
                      <tr>
                        <td align="center" valign="middle">
                          <img src="${qrCode}" alt="Ticket QR Code" width="160" height="160" border="0"
                            style="width:160px;height:160px;display:block;max-width:160px;" />
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>` : ""}
              <p class="qr-note">Present this QR code at the event entrance for quick check-in</p>
            </div>` : ""}

            ${isGroupRegistration && groupSize ? `
            <div class="group-info">
              <strong>&#128101; Group Registration</strong><br>
              ${groupName ? `Group Name: ${groupName}<br>` : ""}
              Total Tickets: ${groupSize}
            </div>` : ""}

            ${registrationType === "corporate" && groupSize ? `
            <div class="group-info" style="background:#f0fdf4;border-color:#bbf7d0;color:#065f46;">
              <strong>&#127970; Corporate Registration</strong><br>
              ${groupName ? `Company: ${groupName}<br>` : ""}
              Total Tickets: ${groupSize}
            </div>` : ""}

            <div class="event-card">
              <h3>&#128197; Event Details</h3>
              <div class="event-detail">
                <span class="label">Event</span>
                <span class="value">${eventTitle}</span>
              </div>
              <div class="event-detail">
                <span class="label">Date</span>
                <span class="value">${formattedDate}${formattedEndDate && formattedEndDate !== formattedDate ? ` – ${formattedEndDate}` : ""}</span>
              </div>
              <div class="event-detail">
                <span class="label">Time</span>
                <span class="value">${formattedTime}${formattedEndTime ? ` – ${formattedEndTime}` : ""}</span>
              </div>
              <div class="event-detail">
                <span class="label">Venue</span>
                <span class="value">${eventVenue}</span>
              </div>
              <div class="event-detail">
                <span class="label">Type</span>
                <span class="value">${eventType === "virtual" ? "&#128187; Virtual Event" : "&#128205; Physical Event"}</span>
              </div>
            </div>

            <div class="registration-card">
              <h3>Registration Details</h3>
              <div class="event-detail">
                <span class="label">Plan</span>
                <span class="value">${planName} (${planType})</span>
              </div>
              <div class="event-detail">
                <span class="label">Price</span>
                <span class="value">${isFree ? "Free" : `${currency} ${price.toLocaleString()}`}</span>
              </div>
              ${!isFree && paymentReference ? `
              <div class="event-detail">
                <span class="label">Payment Ref</span>
                <span class="value" style="font-family:monospace;font-size:12px;">${paymentReference}</span>
              </div>` : ""}
            </div>

            ${!isFree && paymentAmount ? `
            <div class="payment-info">
              <strong>&#128179; Payment Received</strong><br>
              Amount: ${currency} ${(paymentAmount / 100).toLocaleString()}<br>
              Reference: ${paymentReference ?? "N/A"}<br>
              Status: Confirmed
            </div>` : ""}

            ${specialInstructions ? `
            <div class="instructions">
              <strong>&#9888;&#65039; Important:</strong> ${specialInstructions}
            </div>` : ""}

            ${eventType === "virtual" ? `
            <div class="instructions" style="background:#eff6ff;border-left:4px solid #6366f1;color:#1e40af;padding:12px 16px;border-radius:0 8px 8px 0;margin-bottom:16px;font-size:13px;line-height:1.5;">
              <strong>&#128187; Virtual Event:</strong> A link to join the event will be sent closer to the event date. Please keep an eye on your email.
            </div>` : ""}

            <div class="button-container">
              <a href="${appUrl}/my-tickets" class="button"
                style="display:inline-block;background-color:#6366f1;color:#ffffff;font-weight:600;padding:14px 32px;border-radius:8px;text-decoration:none;font-size:15px;">
                View My Tickets
              </a>
            </div>

            <div class="divider"></div>

            <div class="support">
              <p>Need help or have questions?</p>
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
    subject: `Registration Confirmed: ${eventTitle}`,
    html,
  });

  console.log(`✅ Registration email sent to ${email} for: ${eventTitle}`);
}

// ─── Parental Consent Email Function ─────────────────────────────────────────
export async function sendParentalConsentEmail(input: SendParentalConsentEmailInput) {
  const {
    parentName,
    parentEmail,
    attendeeName,
    attendeeAge,
    eventTitle,
    eventDate,
    eventVenue,
    registrationNumber,
    ticketNumber,
  } = input;

  if (!parentEmail || !parentName || !attendeeName || !eventTitle || !registrationNumber) {
    throw new Error("Missing required parameters for parental consent email");
  }

  const year = new Date().getFullYear();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://nomeo-events.com";
  const formattedDate = new Date(eventDate).toLocaleDateString("en-NG", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const formattedTime = new Date(eventDate).toLocaleTimeString("en-NG", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const html = `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Parental Consent Confirmation - ${eventTitle}</title>
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
          .header { background: linear-gradient(135deg, #4f46e5 0%, #6366f1 100%); padding: 32px 24px; text-align: center; }
          .header h1 { color: #ffffff; font-size: 22px; font-weight: 700; margin: 0 0 8px 0; }
          .header p { color: rgba(255,255,255,0.9); font-size: 14px; margin: 0; }
          .content { padding: 24px; }
          .greeting { color: #374151; font-size: 15px; margin-bottom: 12px; }
          .greeting strong { color: #111827; font-weight: 600; }
          .message { color: #4b5563; font-size: 14px; margin-bottom: 20px; line-height: 1.6; }
          .consent-card {
            background: #fef3c7; border: 2px solid #f59e0b; border-radius: 12px;
            padding: 20px; margin-bottom: 20px;
          }
          .consent-card h3 { color: #92400e; font-size: 16px; font-weight: 600; margin-bottom: 16px; }
          .event-detail { 
            display: flex; justify-content: space-between; align-items: flex-start; 
            padding: 12px 0; border-bottom: 1px solid #fde68a; font-size: 14px; gap: 16px;
          }
          .event-detail:last-child { border-bottom: none; }
          .event-detail .label { color: #92400e; font-weight: 500; min-width: 120px; flex-shrink: 0; }
          .event-detail .value { color: #78350f; font-weight: 600; text-align: right; word-break: break-word; }
          .registration-number {
            background: #4f46e5; color: white; padding: 12px 20px; border-radius: 8px;
            font-family: 'Courier New', monospace; font-size: 16px; font-weight: 700;
            text-align: center; margin-bottom: 16px; letter-spacing: 1px;
          }
          .consent-statement {
            background: #f0fdf4; border-left: 4px solid #10b981;
            padding: 16px; border-radius: 8px; margin: 20px 0;
            font-size: 14px; color: #065f46; line-height: 1.6;
          }
          .warning-box {
            background: #fef2f2; border-left: 4px solid #ef4444;
            padding: 12px 16px; border-radius: 8px; margin: 16px 0;
            font-size: 13px; color: #991b1b; line-height: 1.5;
          }
          .button-container { text-align: center; margin: 24px 0; }
          .button { display: inline-block; background-color: #4f46e5; color: #ffffff; font-weight: 600; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-size: 14px; }
          .divider { border-top: 1px solid #e5e7eb; margin: 20px 0; }
          .support { text-align: center; }
          .support p { color: #6b7280; font-size: 13px; margin-bottom: 6px; }
          .support a { color: #4f46e5; font-size: 13px; font-weight: 500; text-decoration: none; }
          .footer { background-color: #f9fafb; padding: 20px 24px; text-align: center; border-top: 1px solid #e5e7eb; }
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
          <div class="header">
            <table width="64" height="64" cellpadding="0" cellspacing="0" border="0"
              style="background:rgba(255,255,255,0.2);border-radius:50%;margin:0 auto 16px auto;">
              <tr>
                <td align="center" valign="middle" width="64" height="64">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none"
                    stroke="white" stroke-width="2" xmlns="http://www.w3.org/2000/svg">
                    <path d="M20 12V8H4V12M20 12L4 12M20 12L20 16M4 12L4 16" stroke="white" stroke-width="2" stroke-linecap="round"/>
                    <rect x="2" y="4" width="20" height="16" rx="2" stroke="white" stroke-width="2"/>
                    <path d="M8 12H16" stroke="white" stroke-width="2" stroke-linecap="round"/>
                  </svg>
                </td>
              </tr>
            </table>
            <h1>Parental Consent Confirmed</h1>
            <p>You have granted permission for ${attendeeName} to attend ${eventTitle}</p>
          </div>

          <div class="content">
            <p class="greeting"><strong>Dear ${parentName},</strong></p>
            
            <p class="message">
              This email confirms that you have provided parental consent for 
              <strong>${attendeeName}</strong>${attendeeAge ? ` (age ${attendeeAge})` : ''} 
              to attend the following event:
            </p>

            <div class="consent-card">
              <h3>&#128197; Event Information</h3>
              <div class="event-detail">
                <span class="label">Event Title</span>
                <span class="value">${eventTitle}</span>
              </div>
              <div class="event-detail">
                <span class="label">Date & Time</span>
                <span class="value">${formattedDate} at ${formattedTime}</span>
              </div>
              <div class="event-detail">
                <span class="label">Venue</span>
                <span class="value">${eventVenue}</span>
              </div>
              <div class="event-detail">
                <span class="label">Registration No.</span>
                <span class="value">${registrationNumber}</span>
              </div>
              <div class="event-detail">
                <span class="label">Ticket No.</span>
                <span class="value">${ticketNumber}</span>
              </div>
            </div>

            <div class="consent-statement">
              <strong>&#10004; Consent Acknowledged</strong><br><br>
              By providing this consent, you have acknowledged that ${attendeeName} has permission 
              to participate in this event. You understand the nature of the event and confirm 
              that ${attendeeName} meets any age requirements set by the organizer.
            </div>

            <div class="warning-box">
              <strong>&#9432; Important Information</strong><br><br>
              • Please keep this email for your records as proof of consent.<br>
              • The attendee will check in using their ticket QR code.<br>
              • For any concerns or questions, please contact the event organizer.<br>
              • You may withdraw consent by contacting the organizer before the event starts.
            </div>

            <div class="button-container">
              <a href="${appUrl}/contact-support" class="button">
                Contact Support
              </a>
            </div>

            <div class="divider"></div>

            <div class="support">
              <p>If you did not provide this consent or have any concerns,</p>
              <p>please contact the event organizer immediately by replying to this email.</p>
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
            <div class="copyright" style="margin-top: 8px; font-size: 10px;">
              Consent recorded on ${new Date().toLocaleDateString("en-NG", { dateStyle: "full" })} at ${new Date().toLocaleTimeString()}
            </div>
          </div>
        </div>
      </body>
    </html>`;

  const text = `
Parental Consent Confirmation - ${eventTitle}

Dear ${parentName},

This email confirms that you have provided parental consent for ${attendeeName}${attendeeAge ? ` (age ${attendeeAge})` : ''} to attend the following event:

Event: ${eventTitle}
Date: ${formattedDate}
Venue: ${eventVenue}
Registration No: ${registrationNumber}
Ticket No: ${ticketNumber}

By providing this consent, you have acknowledged that ${attendeeName} has permission to participate in this event.

Please keep this email for your records. If you did not provide this consent or have any concerns, please contact the event organizer immediately.

---
Nomeo Events
${appUrl}
  `;

  await transporter.sendMail({
    from: `"Nomeo Events" <${process.env.SMTP_SERVER_USERNAME}>`,
    to: parentEmail,
    subject: `Parental Consent Confirmation: ${attendeeName} - ${eventTitle}`,
    html,
    text,
  });

  console.log(`✅ Parental consent email sent to ${parentEmail} for attendee: ${attendeeName}`);
}