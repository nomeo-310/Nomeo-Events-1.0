import nodemailer from "nodemailer";

export const transporter = nodemailer.createTransport({
  host: process.env.SMTP_SERVER_HOST,
  port: Number(process.env.SMTP_PORT),
  auth: {
    user: process.env.SMTP_SERVER_USERNAME,
    pass: process.env.SMTP_SERVER_PASSWORD,
  },
});

export type OTPType = "sign-in" | "email-verification" | "forget-password" | "change-email";

interface SendOTPEmailParams {
  email: string;
  otp: string;
  name: string;
  type: OTPType;
  newEmail?: string; // Optional: for change-email type
}

export async function sendOTPEmail({ email, otp, name, type, newEmail }: SendOTPEmailParams) {
  if (!email || !otp || !name || !type) {
    throw new Error("Missing required parameters");
  }

  const year = new Date().getFullYear();

  // Dynamic content based on OTP type
  const getEmailContent = () => {
    switch (type) {
      case "sign-in":
        return {
          title: "Sign In to Your Account",
          greeting: `Welcome back, ${name}!`,
          message: "We received a request to sign in to your Nomeo Events account. Use the verification code below to complete your sign-in process.",
          expiryNote: "For security, this code will expire in 15 minutes. If you didn't attempt to sign in, please change your password immediately.",
          buttonText: "Sign In to Your Account",
          buttonAction: "https://nomeo-events.com/signin",
          showNextSteps: false,
        };
      
      case "email-verification":
        return {
          title: "Verify Your Email Address",
          greeting: `Hello ${name},`,
          message: "Thanks for joining Nomeo Events! We're excited to have you on board. Please verify your email address to get started with creating and managing amazing events.",
          expiryNote: "For security, this OTP will expire in 15 minutes. If you didn't create an account, please ignore this email.",
          buttonText: "Verify Your Email",
          buttonAction: "https://nomeo-events.com/verify",
          showNextSteps: true,
        };
      
      case "forget-password":
        return {
          title: "Reset Your Password",
          greeting: `Hello ${name},`,
          message: "We received a request to reset the password for your Nomeo Events account. Use the verification code below to proceed with password reset.",
          expiryNote: "For security, this code will expire in 15 minutes. If you didn't request a password reset, please ignore this email or contact support.",
          buttonText: "Reset Password",
          buttonAction: "https://nomeo-events.com/reset-password",
          showNextSteps: false,
          additionalInfo: "After verification, you'll be able to create a new secure password for your account."
        };
      
      case "change-email":
        return {
          title: "Change Email Address",
          greeting: `Hello ${name},`,
          message: `We received a request to change the email address associated with your Nomeo Events account${newEmail ? ` to ${newEmail}` : ''}. Use the verification code below to confirm this change.`,
          expiryNote: "For security, this code will expire in 15 minutes. If you didn't request this change, please contact our support team immediately.",
          buttonText: "Confirm Email Change",
          buttonAction: "https://nomeo-events.com/change-email",
          showNextSteps: false,
        };
      
      default:
        throw new Error("Invalid OTP type");
    }
  };

  const content = getEmailContent();

  const html = `
    <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${content.title} - Nomeo Events</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }

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
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
          }

          /* Header */
          .header {
            background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
            padding: 24px;
            text-align: center;
          }

          .logo {
            max-width: 140px;
            margin-bottom: 6px;
          }

          .header h1 {
            color: #ffffff;
            font-size: 20px;
            font-weight: 700;
            margin: 0;
          }

          /* Content */
          .content {
            padding: 20px 24px;
          }

          .greeting {
            color: #374151;
            font-size: 14px;
            margin-bottom: 10px;
          }

          .greeting strong {
            color: #111827;
            font-weight: 600;
          }

          .message {
            color: #4b5563;
            font-size: 14px;
            margin-bottom: 14px;
            line-height: 1.5;
          }

          /* OTP Box */
          .otp-box {
            background-color: #f9fafb;
            border-radius: 10px;
            padding: 14px;
            text-align: center;
            margin-bottom: 14px;
            border: 1px solid #e5e7eb;
          }

          .otp-label {
            color: #6b7280;
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-bottom: 6px;
          }

          .otp-code {
            font-family: 'Courier New', monospace;
            font-size: 32px;
            font-weight: 700;
            color: #6366f1;
            letter-spacing: 8px;
            margin-bottom: 6px;
          }

          .expiry {
            color: #9ca3af;
            font-size: 11px;
          }

          /* Button */
          .button-container {
            text-align: center;
            margin-bottom: 12px;
          }

          .button {
            display: inline-block;
            background-color: #6366f1;
            color: #ffffff;
            font-weight: 600;
            padding: 10px 28px;
            border-radius: 8px;
            text-decoration: none;
            font-size: 13px;
          }

          .button:hover {
            background-color: #4f46e5;
          }

          /* Link */
          .link-container {
            text-align: center;
            margin-bottom: 12px;
          }

          .link {
            color: #6366f1;
            font-size: 11px;
            word-break: break-all;
            text-decoration: none;
          }

          .link:hover {
            text-decoration: underline;
          }

          /* Security Note */
          .security-note {
            background-color: #fffbeb;
            border-left: 4px solid #f59e0b;
            padding: 10px 12px;
            border-radius: 0 6px 6px 0;
            margin-bottom: 12px;
          }

          .security-note p {
            color: #92400e;
            font-size: 12px;
            margin: 0;
          }

          /* Next Steps */
          .next-steps {
            margin-bottom: 12px;
          }

          .next-steps h3 {
            color: #374151;
            font-size: 12px;
            font-weight: 600;
            margin-bottom: 6px;
          }

          .next-steps ul {
            color: #4b5563;
            font-size: 12px;
            padding-left: 16px;
            margin: 0;
          }

          .next-steps li {
            margin-bottom: 3px;
          }

          /* Divider */
          .divider {
            border-top: 1px solid #e5e7eb;
            margin: 12px 0;
          }

          /* Support */
          .support {
            text-align: center;
            margin-bottom: 0;
          }

          .support p {
            color: #6b7280;
            font-size: 12px;
            margin-bottom: 4px;
          }

          .support a {
            color: #6366f1;
            font-size: 12px;
            font-weight: 500;
            text-decoration: none;
          }

          /* Footer */
          .footer {
            background-color: #f9fafb;
            padding: 14px 24px;
            text-align: center;
            border-top: 1px solid #e5e7eb;
          }

          .footer-links {
            margin-bottom: 6px;
          }

          .footer-links a {
            color: #6b7280;
            font-size: 11px;
            text-decoration: none;
            margin: 0 6px;
          }

          .footer-links a:hover {
            color: #6366f1;
          }

          .copyright {
            color: #9ca3af;
            font-size: 11px;
            margin-top: 4px;
          }

          /* Responsive */
          @media (max-width: 600px) {
            .content {
              padding: 16px 16px;
            }

            .header {
              padding: 20px 16px;
            }

            .otp-code {
              font-size: 26px;
              letter-spacing: 4px;
            }

            .button {
              padding: 9px 20px;
              font-size: 13px;
            }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <!-- Header -->
          <div class="header">
            <svg class="logo" viewBox="0 0 200 50" fill="none" xmlns="http://www.w3.org/2000/svg">
              <text x="0" y="35" font-family="Arial, sans-serif" font-size="28" font-weight="bold" fill="white">Nomeo Events</text>
            </svg>
            <h1>${content.title}</h1>
          </div>

          <!-- Content -->
          <div class="content">
            <p class="greeting"><strong>${content.greeting}</strong></p>

            <p class="message">${content.message}</p>

            ${content.additionalInfo ? `<p class="message" style="margin-top: -8px;">${content.additionalInfo}</p>` : ''}

            <!-- OTP Box -->
            <div class="otp-box">
              <div class="otp-label">Your Verification Code</div>
              <div class="otp-code">${otp}</div>
              <div class="expiry">This code expires in 15 minutes</div>
            </div>

            <!-- Security Note -->
            <div class="security-note">
              <p>${content.expiryNote}</p>
            </div>

            <!-- Next Steps (only for email-verification) -->
            ${content.showNextSteps ? `
            <div class="next-steps">
              <h3>What's next after verification?</h3>
              <ul>
                <li>Create your first event (seminar, webinar, or party)</li>
                <li>Start selling tickets or managing RSVPs</li>
                <li>Track attendance and analytics</li>
                <li>Get access to our event management tools</li>
              </ul>
            </div>
            ` : ''}

            <div class="button-container">
              <a href="${content.buttonAction}" class="button">${content.buttonText}</a>
            </div>

            <div class="divider"></div>

            <!-- Support -->
            <div class="support">
              <p>Need help? Contact our support team</p>
              <a href="mailto:support@nomeo-events.com">support@nomeo-events.com</a>
            </div>
          </div>

          <!-- Footer -->
          <div class="footer">
            <div class="footer-links">
              <a href="https://nomeo-events.com/privacy">Privacy Policy</a>
              <span>•</span>
              <a href="https://nomeo-events.com/terms">Terms of Use</a>
              <span>•</span>
              <a href="https://nomeo-events.com/help">Help Center</a>
            </div>
            <div class="copyright">© ${year} Nomeo Events. All rights reserved.</div>
            <div class="copyright" style="margin-top: 4px;">123 Event Street, San Francisco, CA 94105</div>
          </div>
        </div>
      </body>
    </html>`;

  // Generate appropriate subject line
  const getSubject = () => {
    switch (type) {
      case "sign-in":
        return "Your sign-in verification code - Nomeo Events";
      case "email-verification":
        return "Verify your email address - Nomeo Events";
      case "forget-password":
        return "Reset your password - Nomeo Events";
      case "change-email":
        return "Confirm your email change - Nomeo Events";
      default:
        return "Your verification code - Nomeo Events";
    }
  };

  await transporter.sendMail({
    from: `"Nomeo Events" <${process.env.SMTP_USER || process.env.SMTP_SERVER_USERNAME}>`,
    to: email,
    subject: getSubject(),
    html,
  });

  console.log(`✅ ${type} OTP email sent to ${email}`);
}