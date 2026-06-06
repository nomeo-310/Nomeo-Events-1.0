// lib/email-service.ts
import { generateBulkEmailHTML, generateBulkEmailText } from '@/lib/email/bulk-email-template';
import { generateNewsletterHTML, generateNewsletterText } from '@/lib/email/newsletter-email-template';
import { connectDB } from '@/lib/mongoose';
import { transporter } from '@/lib/transport';
import { Campaign, CampaignStatus, EmailStatus } from '@/models/campaign';
import { EmailLog } from '@/models/email-log';
import { Newsletter } from '@/models/newsletter';
import { ObjectId } from 'mongodb';

function getTrackingPixel(campaignId: string, emailLogId: string): string {
  const trackingUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/tracking/open?campaign=${campaignId}&log=${emailLogId}`;
  return `<img src="${trackingUrl}" width="1" height="1" style="display:none;" />`;
}

// Send bulk emails with batching and error handling
export async function sendBulkEmails(
  campaignId: string,
  recipients: Array<{
    email: string;
    name?: string;
    newsletterId?: any;
    isExternal?: boolean;
    recipientType?: string;
  }>,
  subject: string,
  rawContent: string,
  campaignType: 'newsletter' | 'announcement' | 'promotion' = 'newsletter',
  buttonConfig?: { text: string; url: string }
) {
  await connectDB();

  try {
    await Campaign.findByIdAndUpdate(campaignId, {
      status: CampaignStatus.SENDING,
      sentAt: new Date()
    });

    let successful = 0;
    let failed = 0;

    const batchSize = 50;
    for (let i = 0; i < recipients.length; i += batchSize) {
      const batch = recipients.slice(i, i + batchSize);

      await Promise.all(
        batch.map(async (recipient) => {
          try {
            // FIX 2: The route already created all email logs before calling this function.
            // We only look up the existing log here — never create one.
            const emailLog = await EmailLog.findOne({
              campaignId: new ObjectId(campaignId),
              email: recipient.email
            });

            if (!emailLog) {
              console.warn(`No email log found for ${recipient.email} in campaign ${campaignId}, skipping`);
              failed++;
              return;
            }

            // FIX 2: Skip Newsletter lookup entirely for external recipients.
            // unsubscribeToken stays undefined → no unsubscribe link rendered in template.
            let unsubscribeToken: string | undefined;

            if (!recipient.isExternal && recipient.newsletterId) {
              const subscriber = await Newsletter.findById(recipient.newsletterId);
              unsubscribeToken = subscriber?.unsubscribeToken ?? undefined;
            }

            // Generate email HTML/text based on campaign type
            let emailHtml: string;
            let emailText: string;

            if (campaignType === 'newsletter') {
              emailHtml = generateNewsletterHTML({
                content: rawContent,
                subject,
                subscriberEmail: recipient.email,
                subscriberName: recipient.name,
                unsubscribeToken,
                year: new Date().getFullYear()
              });
              emailText = generateNewsletterText({
                content: rawContent,
                subject,
                subscriberName: recipient.name,
                year: new Date().getFullYear()
              });
            } else {
              emailHtml = generateBulkEmailHTML({
                content: rawContent,
                subject,
                subscriberEmail: recipient.email,
                subscriberName: recipient.name,
                unsubscribeToken,
                buttonText: buttonConfig?.text,
                buttonUrl: buttonConfig?.url,
                year: new Date().getFullYear()
              });
              emailText = generateBulkEmailText({
                content: rawContent,
                subject,
                subscriberName: recipient.name,
                buttonText: buttonConfig?.text,
                buttonUrl: buttonConfig?.url,
                year: new Date().getFullYear()
              });
            }

            // Inject tracking pixel
            const trackingPixel = getTrackingPixel(campaignId, emailLog._id.toString());
            const finalHtml = emailHtml.replace('</body>', `${trackingPixel}</body>`);

            const senderName =
              campaignType === 'newsletter' ? 'Nomeo Events Newsletter' : 'Nomeo Events';

            await transporter.sendMail({
              from: `"${senderName}" <${process.env.SMTP_SERVER_USERNAME}>`,
              to: recipient.email,
              subject,
              html: finalHtml,
              text: emailText
            });

            emailLog.status = EmailStatus.SENT;
            emailLog.sentAt = new Date();
            await emailLog.save();

            successful++;
          } catch (error) {
            console.error(`Failed to send email to ${recipient.email}:`, error);

            await EmailLog.findOneAndUpdate(
              { campaignId: new ObjectId(campaignId), email: recipient.email },
              { status: EmailStatus.FAILED, error: (error as Error).message }
            );

            failed++;
          }
        })
      );

      // Throttle between batches to avoid overwhelming the SMTP server
      if (i + batchSize < recipients.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    await Campaign.findByIdAndUpdate(campaignId, {
      status: CampaignStatus.COMPLETED,
      'recipients.successful': successful,
      'recipients.failed': failed
    });

    console.log(`✅ Campaign ${campaignId} completed: ${successful} sent, ${failed} failed`);

  } catch (error) {
    console.error('Bulk email sending failed:', error);
    await Campaign.findByIdAndUpdate(campaignId, { status: CampaignStatus.FAILED });
  }
}

// Single email send for testing
export async function sendTestEmail(
  to: string,
  subject: string,
  content: string,
  type: 'newsletter' | 'announcement' = 'newsletter'
) {
  try {
    let html: string;
    let text: string;

    if (type === 'newsletter') {
      html = generateNewsletterHTML({
        content,
        subject,
        subscriberEmail: to,
        year: new Date().getFullYear()
      });
      text = generateNewsletterText({
        content,
        subject,
        year: new Date().getFullYear()
      });
    } else {
      html = generateBulkEmailHTML({
        content,
        subject,
        subscriberEmail: to,
        year: new Date().getFullYear()
      });
      text = generateBulkEmailText({
        content,
        subject,
        year: new Date().getFullYear()
      });
    }

    await transporter.sendMail({
      from: `"Nomeo Events" <${process.env.SMTP_SERVER_USERNAME}>`,
      to,
      subject,
      html,
      text
    });

    return { success: true };
  } catch (error) {
    console.error('Failed to send test email:', error);
    return { success: false, error };
  }
}