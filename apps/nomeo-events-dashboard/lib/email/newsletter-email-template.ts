// lib/email/templates/newsletter-template.ts
interface NewsletterTemplateParams {
  content: string; // The WYSIWYG editor content
  subject: string;
  newsletterName?: string;
  unsubscribeToken?: string;
  subscriberEmail?: string;
  subscriberName?: string;
  year?: number;
}

export function generateNewsletterHTML(params: NewsletterTemplateParams): string {
  const {
    content,
    subject,
    newsletterName = "Nomeo Events Newsletter",
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
        background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
        padding: 32px 24px;
        text-align: center;
      }
      .header h1 {
        color: #ffffff;
        font-size: 22px;
        font-weight: 700;
        margin: 0 0 8px 0;
      }
      .header p {
        color: rgba(255,255,255,0.9);
        font-size: 14px;
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
      .newsletter-content {
        color: #374151;
        font-size: 15px;
        line-height: 1.6;
        margin-bottom: 30px;
      }
      .newsletter-content h1,
      .newsletter-content h2,
      .newsletter-content h3 {
        color: #111827;
        margin-top: 24px;
        margin-bottom: 16px;
      }
      .newsletter-content h1 { font-size: 24px; }
      .newsletter-content h2 { font-size: 20px; }
      .newsletter-content h3 { font-size: 18px; }
      .newsletter-content p {
        margin-bottom: 16px;
      }
      .newsletter-content img {
        max-width: 100%;
        height: auto;
        border-radius: 8px;
        margin: 16px 0;
      }
      .newsletter-content a {
        color: #4f46e5;
        text-decoration: none;
      }
      .newsletter-content a:hover {
        text-decoration: underline;
      }
      .newsletter-content ul,
      .newsletter-content ol {
        margin-bottom: 16px;
        padding-left: 24px;
      }
      .newsletter-content li {
        margin-bottom: 8px;
      }
      .newsletter-content blockquote {
        border-left: 4px solid #6366f1;
        padding-left: 16px;
        margin: 16px 0;
        color: #6b7280;
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
        font-weight: 500;
      }
      .unsubscribe-box a:hover {
        text-decoration: underline;
      }
      .social-links {
        text-align: center;
        margin-bottom: 20px;
      }
      .social-links a {
        display: inline-block;
        margin: 0 6px;
        color: #9ca3af;
        font-size: 20px;
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
        .header {
          padding: 24px 16px;
        }
      }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1>${newsletterName}</h1>
        <p>Stay updated with the latest news and events</p>
      </div>

      <div class="content">
        ${subscriberName ? `
          <p class="greeting">Dear <strong>${subscriberName}</strong>,</p>
        ` : `
          <p class="greeting">Hello there,</p>
        `}

        <div class="newsletter-content">
          ${content}
        </div>

        <div class="divider"></div>

        <div class="unsubscribe-box">
          <p>You're receiving this email because you subscribed to our newsletter.</p>
          <p>Want to stop receiving these emails?</p>
          <a href="${unsubscribeUrl}">Click here to unsubscribe</a>
        </div>
      </div>

      <div class="footer">
        <a href="${appUrl}/privacy">Privacy Policy</a>
        <span style="color: #d1d5db; margin: 0 8px;">•</span>
        <a href="${appUrl}/terms">Terms of Service</a>
        <span style="color: #d1d5db; margin: 0 8px;">•</span>
        <a href="${appUrl}/contact">Contact Us</a>
        <div class="copyright">© ${year} ${newsletterName}. All rights reserved.</div>
      </div>
    </div>
  </body>
</html>`;
}

export function generateNewsletterText(params: NewsletterTemplateParams): string {
  const {
    content,
    subject,
    newsletterName = "Nomeo Events Newsletter",
    subscriberName
  } = params;

  // Strip HTML tags for plain text version
  const plainTextContent = content.replace(/<[^>]*>/g, '');

  return `${subject}

${newsletterName}
${'='.repeat(newsletterName.length)}

${subscriberName ? `Dear ${subscriberName},` : 'Hello there,'}

${plainTextContent}

${'='.repeat(40)}
You're receiving this email because you subscribed to our newsletter.
To unsubscribe, visit: ${process.env.NEXT_PUBLIC_APP_URL}/newsletter/unsubscribe

© ${new Date().getFullYear()} ${newsletterName}. All rights reserved.`;
}