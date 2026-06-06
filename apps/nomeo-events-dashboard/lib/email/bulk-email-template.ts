// lib/email/templates/bulk-email-template.ts
interface BulkEmailTemplateParams {
  content: string;
  subject: string;
  senderName?: string;
  buttonText?: string;
  buttonUrl?: string;
  unsubscribeToken?: string;
  subscriberEmail?: string;
  subscriberName?: string;
  year?: number;
}

export function generateBulkEmailHTML(params: BulkEmailTemplateParams): string {
  const {
    content,
    subject,
    senderName = "Nomeo Events Team",
    buttonText,
    buttonUrl,
    unsubscribeToken,
    subscriberEmail,
    subscriberName,
    year = new Date().getFullYear()
  } = params;

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://nomeo-events.com";
  const unsubscribeUrl = unsubscribeToken && subscriberEmail
    ? `${appUrl}/api/newsletter/unsubscribe?token=${unsubscribeToken}&email=${encodeURIComponent(subscriberEmail)}`
    : `${appUrl}/newsletter/unsubscribe?email=${encodeURIComponent(subscriberEmail || '')}`;

  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${subject}</title>
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
        background-color: #f9fafb;
        padding: 12px;
        line-height: 1.5;
      }
      .container {
        max-width: 600px;
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
      .header h1 {
        color: #ffffff;
        font-size: 22px;
        font-weight: 700;
        margin: 0;
      }
      .content {
        padding: 32px 24px;
      }
      .greeting {
        color: #374151;
        font-size: 15px;
        margin-bottom: 20px;
      }
      .greeting strong {
        color: #111827;
      }
      .email-content {
        color: #374151;
        font-size: 15px;
        line-height: 1.6;
        margin-bottom: 30px;
      }
      .email-content h1,
      .email-content h2,
      .email-content h3 {
        color: #111827;
        margin-top: 24px;
        margin-bottom: 16px;
      }
      .email-content p {
        margin-bottom: 16px;
      }
      .email-content img {
        max-width: 100%;
        height: auto;
        border-radius: 8px;
        margin: 16px 0;
      }
      .email-content a {
        color: #d97706;
        text-decoration: none;
      }
      .button-container {
        text-align: center;
        margin: 30px 0;
      }
      .button {
        display: inline-block;
        background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
        color: #ffffff !important;
        text-decoration: none;
        padding: 12px 32px;
        border-radius: 8px;
        font-weight: 600;
        font-size: 16px;
        transition: transform 0.2s;
      }
      .button:hover {
        transform: translateY(-2px);
      }
      .divider {
        border-top: 1px solid #e5e7eb;
        margin: 24px 0;
      }
      .unsubscribe-box {
        background: #f3f4f6;
        border-radius: 8px;
        padding: 16px;
        text-align: center;
        margin-bottom: 20px;
      }
      .unsubscribe-box p {
        color: #6b7280;
        font-size: 12px;
        margin-bottom: 8px;
      }
      .unsubscribe-box a {
        color: #6366f1;
        font-size: 12px;
        text-decoration: none;
      }
      .footer {
        background-color: #f9fafb;
        padding: 20px 24px;
        text-align: center;
        border-top: 1px solid #e5e7eb;
      }
      .footer a {
        color: #6b7280;
        font-size: 12px;
        text-decoration: none;
        margin: 0 8px;
      }
      .copyright {
        color: #9ca3af;
        font-size: 12px;
        margin-top: 8px;
      }
      @media (max-width: 600px) {
        .content {
          padding: 20px 16px;
        }
        .button {
          padding: 10px 24px;
          font-size: 14px;
        }
      }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1>✨ Special Announcement ✨</h1>
      </div>

      <div class="content">
        ${subscriberName ? `
          <p class="greeting">Dear <strong>${subscriberName}</strong>,</p>
        ` : `
          <p class="greeting">Hello there,</p>
        `}

        <div class="email-content">
          ${content}
        </div>

        ${buttonText && buttonUrl ? `
          <div class="button-container">
            <a href="${buttonUrl}" class="button">${buttonText}</a>
          </div>
        ` : ''}

        <div class="divider"></div>

        <div class="unsubscribe-box">
          <p>You're receiving this email because you're subscribed to our updates.</p>
          <p><a href="${unsubscribeUrl}">Unsubscribe here</a> if you no longer wish to receive these emails.</p>
        </div>
      </div>

      <div class="footer">
        <p style="color: #6b7280; font-size: 12px; margin-bottom: 8px;">Sent with ❤️ by ${senderName}</p>
        <a href="${appUrl}/privacy">Privacy Policy</a>
        <span style="color: #d1d5db; margin: 0 8px;">•</span>
        <a href="${appUrl}/terms">Terms of Service</a>
        <div class="copyright">© ${year} Nomeo Events. All rights reserved.</div>
      </div>
    </div>
  </body>
</html>`;
}

export function generateBulkEmailText(params: BulkEmailTemplateParams): string {
  const {
    content,
    subject,
    buttonText,
    buttonUrl,
    subscriberName
  } = params;

  const plainTextContent = content.replace(/<[^>]*>/g, '');
  const buttonTextLine = buttonText && buttonUrl ? `\n\n${buttonText}: ${buttonUrl}` : '';

  return `${subject}
${'='.repeat(subject.length)}

${subscriberName ? `Dear ${subscriberName},` : 'Hello there,'}

${plainTextContent}${buttonTextLine}

${'='.repeat(40)}
You're receiving this email because you're subscribed to our updates.
To unsubscribe, visit: ${process.env.NEXT_PUBLIC_APP_URL}/newsletter/unsubscribe

© ${new Date().getFullYear()} Nomeo Events. All rights reserved.`;
}