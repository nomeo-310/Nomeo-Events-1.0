import mongoose from 'mongoose';
import { User } from '@/models/user';
import { Profile } from '@/models/profile';
import { Subscription, SubscriptionStatus } from '@/models/subscription';
import { Event, EventStatus } from '@/models/event';
import { Registration, RegistrationStatus, PaymentStatus } from '@/models/registration';
import { Notification } from '@/models/notification';
import { sendAccountDeactivationEmail } from '@/lib/email/send-account-deactivation-email';
import { sendAccountDeletionEmail } from '@/lib/email/send-account-deletion-email';
import { sendAccountSuspensionEmail } from '@/lib/email/send-account-suspension-email';
import { sendEventCancellationToAttendees } from '@/lib/email/send-event-cancellation-email';
import { sendOrganizerEventsCancelledEmail } from '@/lib/email/send-organizer-events-cancelled-email';

interface AdminActionResult {
  success: boolean;
  message: string;
  stats: {
    eventsUnpublished?: number;
    registrationsAffected?: number;
    eventsDeleted?: number;
    registrationsCancelled?: number;
    refundsInitiated?: number;
    emailsSent: number;
    subscriptionDaysExtended?: number;
  };
}

// ─── Shared helpers ────────────────────────────────────────────────────────────

/**
 * Pause a subscription and record the exact timestamp so we can calculate
 * how many days to add back when restored.
 */
async function pauseSubscription(
  userId: string,
  reason: string,
  pausedBy: string,
  pauseType: 'deactivation' | 'suspension',
  session: mongoose.ClientSession
): Promise<void> {
  const subscription = await Subscription.findOne({
    userId,
    status: { $in: [SubscriptionStatus.ACTIVE, SubscriptionStatus.TRIALING] },
  }).session(session);

  if (!subscription) return;

  subscription.metadata.set('statusBeforePause', subscription.status);
  subscription.metadata.set('pausedAt', new Date().toISOString());
  subscription.metadata.set('pauseType', pauseType);
  subscription.metadata.set('pauseReason', reason);
  subscription.metadata.set('pausedBy', pausedBy);
  subscription.status = SubscriptionStatus.PAUSED;
  await subscription.save({ session });
}

/**
 * Restore a paused subscription.
 * Extends currentPeriodEnd (and trialEnd if in trial) by the exact number of
 * milliseconds the subscription was paused, so the user never loses time they
 * already paid for.
 */
async function restoreSubscription(
  userId: string,
  restoredBy: string,
  session: mongoose.ClientSession
): Promise<{ restored: boolean; daysExtended: number }> {
  const subscription = await Subscription.findOne({
    userId,
    status: SubscriptionStatus.PAUSED,
  }).session(session);

  if (!subscription) return { restored: false, daysExtended: 0 };

  const pausedAtRaw = subscription.metadata.get('pausedAt');
  const statusBeforePause = subscription.metadata.get('statusBeforePause') as SubscriptionStatus | undefined;

  const pausedAt = pausedAtRaw ? new Date(pausedAtRaw) : null;
  const now = new Date();

  // Calculate how long the subscription was paused (in ms)
  const pausedDurationMs = pausedAt ? now.getTime() - pausedAt.getTime() : 0;
  const daysExtended = Math.ceil(pausedDurationMs / 86_400_000);

  // Extend the billing period by the paused duration so the user doesn't
  // lose days they couldn't use the product.
  const newPeriodEnd = new Date(subscription.currentPeriodEnd.getTime() + pausedDurationMs);

  // If the extended period end is still in the past the subscription effectively
  // lapsed during the pause — cancel rather than silently restore an expired sub.
  if (newPeriodEnd <= now) {
    subscription.status = SubscriptionStatus.CANCELLED;
    subscription.cancelledAt = now;
    subscription.metadata.set('cancellationReason', 'Subscription period lapsed during pause');
    await subscription.save({ session });
    return { restored: false, daysExtended: 0 };
  }

  subscription.currentPeriodEnd = newPeriodEnd;

  // If the subscription was in a trial, also extend the trial end
  if (
    statusBeforePause === SubscriptionStatus.TRIALING &&
    subscription.trialEnd
  ) {
    subscription.trialEnd = new Date(subscription.trialEnd.getTime() + pausedDurationMs);
  }

  // Restore to whichever status it had before pausing
  subscription.status =
    statusBeforePause === SubscriptionStatus.TRIALING
      ? SubscriptionStatus.TRIALING
      : SubscriptionStatus.ACTIVE;

  // Clean up pause metadata
  subscription.metadata.delete('statusBeforePause');
  subscription.metadata.delete('pausedAt');
  subscription.metadata.delete('pauseType');
  subscription.metadata.delete('pauseReason');
  subscription.metadata.delete('pausedBy');

  // Audit trail
  subscription.metadata.set('lastRestoredBy', restoredBy);
  subscription.metadata.set('lastRestoredAt', now.toISOString());
  subscription.metadata.set('lastExtensionDays', daysExtended.toString());

  await subscription.save({ session });
  return { restored: true, daysExtended };
}

// ─── Service ───────────────────────────────────────────────────────────────────

export class AdminAccountManagementService {

  /**
   * ============================================
   * ADMIN ACCOUNT DEACTIVATION
   * ============================================
   */
  static async adminDeactivateAccount(
    userId: string,
    adminId: string,
    adminEmail: string,
    reason?: string,
    sendEmail: boolean = true
  ): Promise<AdminActionResult> {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const stats = {
        eventsUnpublished: 0,
        registrationsAffected: 0,
        emailsSent: 0,
        subscriptionDaysExtended: 0,
      };

      const user = await User.findById(userId).session(session);
      if (!user) throw new Error('User not found');

      const profile = await Profile.findOne({ userId }).session(session);
      if (!profile) throw new Error('Profile not found');

      if (profile.activeStatus === 'deactivated') {
        throw new Error('Account is already deactivated');
      }

      if (profile.metadata?.deletionScheduled) {
        throw new Error('Account is pending deletion. Cannot deactivate.');
      }

      // 1. Update profile status
      profile.activeStatus = 'deactivated';
      profile.deactivatedAt = new Date();
      profile.metadata = {
        ...profile.metadata,
        deactivatedBy: adminId,
        deactivatedByEmail: adminEmail,
        deactivationReason: reason || 'Deactivated by administrator',
        deactivatedAt: new Date(),
      };
      await profile.save({ session });

      // 2. Pause subscription — records pausedAt so restoration can extend the period
      await pauseSubscription(
        userId,
        reason || 'Account deactivated by admin',
        adminEmail,
        'deactivation',
        session
      );

      // 3. Unpublish all active events
      const activeEvents = await Event.find({
        organizerId: userId,
        status: EventStatus.PUBLISHED,
        isDeleted: false,
        isArchived: false,
      }).session(session);

      stats.eventsUnpublished = activeEvents.length;

      for (const event of activeEvents) {
        event.status = EventStatus.DRAFT;
        event.isPublic = false;
        event.set('deactivationMetadata', {
          deactivatedAt: new Date(),
          reason: 'Account deactivated by administrator',
          deactivatedBy: adminEmail,
          autoRestore: true,
        });
        await event.save({ session });

        const registrationCount = await Registration.countDocuments({
          eventId: event._id,
          status: { $in: [RegistrationStatus.CONFIRMED, RegistrationStatus.PENDING] },
        }).session(session);

        stats.registrationsAffected += registrationCount;
      }

      // 4. Clear notifications
      await Notification.deleteMany({
        $or: [{ receiverId: userId }, { senderId: userId }],
      }).session(session);

      // 5. Email
      if (sendEmail && user.email) {
        await sendAccountDeactivationEmail({
          email: user.email,
          name: profile.fullName || user.name,
          reason: reason || `Your account was deactivated by an administrator: ${adminEmail}`,
          deactivatedBy: adminEmail,
          reactivationPossible: true,
          reactivationInstructions:
            'Contact support to request account reactivation after addressing the violation.',
          supportEmail: 'support@nomeo-events.com',
        });
        stats.emailsSent++;
      }

      await session.commitTransaction();

      return {
        success: true,
        message: 'Account deactivated. Subscription paused — time will be extended on restoration.',
        stats,
      };
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  /**
   * ============================================
   * ADMIN ACCOUNT REACTIVATION
   * ============================================
   */
  static async adminReactivateAccount(
    userId: string,
    adminId: string,
    adminEmail: string
  ): Promise<AdminActionResult> {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const stats = {
        eventsUnpublished: 0,
        registrationsAffected: 0,
        emailsSent: 0,
        subscriptionDaysExtended: 0,
      };

      const profile = await Profile.findOne({
        userId,
        activeStatus: 'deactivated',
        'metadata.deletionScheduled': { $exists: false },
      }).session(session);

      if (!profile) {
        throw new Error('Account not found or pending permanent deletion');
      }

      // 1. Restore profile
      profile.activeStatus = 'active';
      profile.deactivatedAt = undefined;
      profile.metadata = {
        ...profile.metadata,
        deactivatedAt: undefined,
        deactivatedBy: undefined,
        deactivatedByEmail: undefined,
        deactivationReason: undefined,
        reactivatedBy: adminEmail,
        reactivatedAt: new Date(),
      };
      await profile.save({ session });

      // 2. Restore subscription + extend period by paused duration
      const { restored, daysExtended } = await restoreSubscription(userId, adminEmail, session);
      stats.subscriptionDaysExtended = daysExtended;

      if (!restored && daysExtended === 0) {
        // Subscription lapsed during deactivation — nothing to restore but that's fine,
        // the user can re-subscribe. We log but don't fail the reactivation.
        console.warn(`[adminReactivateAccount] Subscription for ${userId} lapsed during deactivation — not restored.`);
      }

      // 3. Republish events that were auto-hidden on deactivation
      const events = await Event.find({
        organizerId: userId,
        status: EventStatus.DRAFT,
        isDeleted: false,
        'deactivationMetadata.autoRestore': true,
      }).session(session);

      let eventsRestored = 0;
      for (const event of events) {
        event.status = EventStatus.PUBLISHED;
        event.isPublic = true;
        event.set('deactivationMetadata', undefined);
        await event.save({ session });
        eventsRestored++;
      }
      stats.eventsUnpublished = eventsRestored;

      await session.commitTransaction();

      return {
        success: true,
        message: `Account reactivated. ${eventsRestored} events restored. Subscription extended by ${daysExtended} days.`,
        stats,
      };
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  /**
   * ============================================
   * ADMIN ACCOUNT SUSPENSION
   * ============================================
   */
  static async adminSuspendAccount(
    userId: string,
    adminId: string,
    adminEmail: string,
    reason: string,
    duration?: number,
    sendEmail: boolean = true
  ): Promise<AdminActionResult> {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const stats = {
        eventsUnpublished: 0,
        registrationsAffected: 0,
        emailsSent: 0,
        subscriptionDaysExtended: 0,
      };

      const user = await User.findById(userId).session(session);
      if (!user) throw new Error('User not found');

      const profile = await Profile.findOne({ userId }).session(session);
      if (!profile) throw new Error('Profile not found');

      if (profile.activeStatus === 'suspended') {
        throw new Error('Account is already suspended');
      }

      if (profile.activeStatus === 'deactivated') {
        throw new Error('Cannot suspend a deactivated account');
      }

      // 1. Update profile
      const expectedReactivation = duration
        ? new Date(Date.now() + duration * 86_400_000)
        : undefined;

      profile.activeStatus = 'suspended';
      profile.suspendedAt = new Date();
      profile.suspensionReason = reason;
      profile.metadata = {
        ...profile.metadata,
        suspensionDuration: duration,
        expectedReactivation,
        suspendedBy: adminId,
        suspendedByEmail: adminEmail,
        suspensionReason: reason,
        suspendedAt: new Date(),
      };
      await profile.save({ session });

      // 2. Update user status
      await User.findByIdAndUpdate(userId, { status: 'suspended' }).session(session);

      // 3. Pause subscription — records pausedAt for later extension calculation
      await pauseSubscription(userId, reason, adminEmail, 'suspension', session);

      // 4. Unpublish events
      const activeEvents = await Event.find({
        organizerId: userId,
        status: EventStatus.PUBLISHED,
        isDeleted: false,
      }).session(session);

      stats.eventsUnpublished = activeEvents.length;

      for (const event of activeEvents) {
        event.status = EventStatus.DRAFT;
        event.isPublic = false;
        event.set('deactivationMetadata', {
          deactivatedAt: new Date(),
          reason: 'Account suspended by administrator',
          deactivatedBy: adminEmail,
          autoRestore: true,
        });
        await event.save({ session });
      }

      // 5. Email
      if (sendEmail && user.email) {
        await sendAccountSuspensionEmail({
          email: user.email,
          name: profile.fullName || user.name,
          reason,
          duration,
          expectedReactivation,
          suspendedBy: adminEmail,
          appealDeadline: new Date(Date.now() + 14 * 86_400_000),
          supportEmail: 'support@nomeo-events.com',
        });
        stats.emailsSent++;
      }

      await session.commitTransaction();

      return {
        success: true,
        message: `Account suspended${duration ? ` for ${duration} days` : ''}. Subscription paused — time will be extended on lift.`,
        stats,
      };
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  /**
   * ============================================
   * ADMIN LIFT SUSPENSION
   * ============================================
   */
  static async adminLiftSuspension(
    userId: string,
    adminId: string,
    adminEmail: string,
    sendEmail: boolean = true
  ): Promise<AdminActionResult> {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const stats = {
        eventsUnpublished: 0,
        registrationsAffected: 0,
        emailsSent: 0,
        subscriptionDaysExtended: 0,
      };

      const user = await User.findById(userId).session(session);
      if (!user) throw new Error('User not found');

      const profile = await Profile.findOne({ userId }).session(session);
      if (!profile) throw new Error('Profile not found');

      if (profile.activeStatus !== 'suspended') {
        throw new Error('Account is not currently suspended');
      }

      if (profile.metadata?.deletionScheduled) {
        throw new Error('Account is pending deletion. Cannot lift suspension.');
      }

      // 1. Restore profile
      profile.activeStatus = 'active';
      profile.suspendedAt = undefined;
      profile.suspensionReason = undefined;
      profile.metadata = {
        ...profile.metadata,
        suspensionDuration: undefined,
        expectedReactivation: undefined,
        suspendedBy: undefined,
        suspendedByEmail: undefined,
        suspensionReason: undefined,
        suspendedAt: undefined,
        suspensionLiftedBy: adminEmail,
        suspensionLiftedAt: new Date(),
        suspensionLiftedReason: 'Administrative action',
      };
      await profile.save({ session });

      // 2. Update user status
      await User.findByIdAndUpdate(userId, { status: 'active' }).session(session);

      // 3. Restore subscription + extend period by exact pause duration
      const { restored, daysExtended } = await restoreSubscription(userId, adminEmail, session);
      stats.subscriptionDaysExtended = daysExtended;

      if (!restored && daysExtended === 0) {
        console.warn(`[adminLiftSuspension] Subscription for ${userId} lapsed during suspension — not restored.`);
      }

      // 4. Republish events that were auto-hidden during suspension
      const events = await Event.find({
        organizerId: userId,
        status: EventStatus.DRAFT,
        isDeleted: false,
        isArchived: false,
        'deactivationMetadata.autoRestore': true,
        'deactivationMetadata.reason': 'Account suspended by administrator',
      }).session(session);

      let eventsRestored = 0;
      for (const event of events) {
        event.status = EventStatus.PUBLISHED;
        event.isPublic = true;
        event.set('deactivationMetadata', undefined);
        await event.save({ session });
        eventsRestored++;
      }
      stats.eventsUnpublished = eventsRestored;

      // 5. Email
      if (sendEmail && user.email) {
        await this.sendSuspensionLiftedEmail({
          email: user.email,
          name: profile.fullName || user.name,
          liftedBy: adminEmail,
          liftedAt: new Date(),
          eventsRestored,
          daysExtended,
          supportEmail: 'support@nomeo-events.com',
        });
        stats.emailsSent++;
      }

      await session.commitTransaction();

      return {
        success: true,
        message: `Suspension lifted. ${eventsRestored} events restored. Subscription extended by ${daysExtended} days.`,
        stats,
      };
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  /**
   * ============================================
   * ADMIN ACCOUNT DELETION (Permanent)
   * ============================================
   */
  static async adminDeleteAccount(
    userId: string,
    adminId: string,
    adminEmail: string,
    reason?: string,
    hardDelete: boolean = false,
    sendEmail: boolean = true
  ): Promise<AdminActionResult> {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const stats = {
        eventsDeleted: 0,
        registrationsCancelled: 0,
        refundsInitiated: 0,
        emailsSent: 0,
      };

      const user = await User.findById(userId).session(session);
      if (!user) throw new Error('User not found');

      const profile = await Profile.findOne({ userId }).session(session);
      if (!profile) throw new Error('Profile not found');

      if (hardDelete) {
        // Cancel subscription outright — no restoration needed
        const subscription = await Subscription.findOne({
          userId,
          status: { $ne: SubscriptionStatus.CANCELLED },
        }).session(session);

        if (subscription) {
          await subscription.cancel('Account permanently deleted by admin', true);
          await subscription.save({ session });
        }

        const allEvents = await Event.find({
          organizerId: userId,
          isDeleted: false,
        }).session(session);

        stats.eventsDeleted = allEvents.length;

        const eventsSummary: Array<{
          title: string;
          date: string;
          registrationsAffected: number;
          refundsInitiated: number;
        }> = [];

        for (const event of allEvents) {
          const registrations = await Registration.find({
            eventId: event._id,
            status: {
              $in: [
                RegistrationStatus.CONFIRMED,
                RegistrationStatus.PENDING,
                RegistrationStatus.WAITLISTED,
              ],
            },
          }).session(session);

          let registrationsCancelled = 0;
          let refundsInitiated = 0;

          for (const registration of registrations) {
            await registration.cancel(
              'Event cancelled: Organizer account permanently deleted by admin',
              'by_admin'
            );
            registrationsCancelled++;

            if (registration.paymentStatus === PaymentStatus.COMPLETED) {
              refundsInitiated++;
            }

            const refundInfo =
              registration.paymentStatus === PaymentStatus.COMPLETED
                ? `Your payment of ${registration.currency} ${registration.price} will be refunded within 7-14 business days.`
                : 'No payment was made for this registration.';

            await sendEventCancellationToAttendees({
              email: registration.attendeeEmail,
              attendeeName: registration.attendeeName,
              organizerName: profile.fullName || user.name,
              eventTitle: event.title,
              eventDate: event.startDate.toISOString(),
              registrationNumber: registration.registrationNumber,
              refundInfo,
              ticketType: registration.planName,
              groupSize: registration.isGroupRegistration ? registration.groupSize : undefined,
            });

            stats.emailsSent++;
          }

          await event.softDelete();

          eventsSummary.push({
            title: event.title,
            date: event.startDate.toISOString(),
            registrationsAffected: registrationsCancelled,
            refundsInitiated,
          });

          stats.registrationsCancelled += registrationsCancelled;
          stats.refundsInitiated += refundsInitiated;
        }

        await sendOrganizerEventsCancelledEmail({
          email: user.email,
          name: profile.fullName || user.name,
          deletionDate: new Date(),
          finalDeletionDate: new Date(),
          eventsCancelled: stats.eventsDeleted,
          totalRegistrationsAffected: stats.registrationsCancelled,
          totalRefundsInitiated: stats.refundsInitiated,
          eventsSummary,
          supportEmail: 'support@nomeo-events.com',
        });
        stats.emailsSent++;

        await Notification.deleteMany({
          $or: [{ receiverId: userId }, { senderId: userId }],
        }).session(session);

        await profile.deleteOne({ session });
        await user.deleteOne({ session });

        if (sendEmail) {
          await sendAccountDeletionEmail({
            email: user.email,
            name: profile.fullName || user.name,
            reason: reason || `Permanently deleted by administrator: ${adminEmail}`,
            deletionType: 'hard',
            affectedEvents: stats.eventsDeleted,
            affectedRegistrations: stats.registrationsCancelled,
            initiatedBy: adminEmail,
            supportEmail: 'support@nomeo-events.com',
          });
          stats.emailsSent++;
        }

        await session.commitTransaction();

        return {
          success: true,
          message: `Account permanently deleted. ${stats.eventsDeleted} events cancelled, ${stats.registrationsCancelled} attendees notified.`,
          stats,
        };
      } else {
        // SOFT DELETE — 30-day grace period
        if (profile.metadata?.deletionScheduled) {
          throw new Error('Account is already scheduled for deletion');
        }

        const deletionDate = new Date();
        const finalDeletionDate = new Date(deletionDate.getTime() + 30 * 86_400_000);

        profile.activeStatus = 'deactivated';
        profile.metadata = {
          ...profile.metadata,
          deletionScheduled: deletionDate,
          finalDeletionDate,
          deletionReason: reason || `Scheduled for deletion by admin (${adminEmail})`,
          deletedBy: adminId,
          deletedByEmail: adminEmail,
        };
        await profile.save({ session });

        if (sendEmail && user.email) {
          await sendAccountDeletionEmail({
            email: user.email,
            name: profile.fullName || user.name,
            reason: reason || `Scheduled for deletion by administrator: ${adminEmail}`,
            deletionType: 'soft',
            scheduledDeletionDate: finalDeletionDate,
            initiatedBy: adminEmail,
            supportEmail: 'support@nomeo-events.com',
          });
          stats.emailsSent++;
        }

        await session.commitTransaction();

        return {
          success: true,
          message: 'Account scheduled for permanent deletion. 30-day grace period started.',
          stats,
        };
      }
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  /**
   * Get account status for admin view
   */
  static async getAdminAccountStatus(userId: string) {
    const profile = await Profile.findOne({ userId }).select(
      'activeStatus metadata suspensionReason suspendedAt'
    );

    if (!profile) return { exists: false };

    return {
      exists: true,
      status: profile.activeStatus,
      isPendingDeletion: !!profile.metadata?.deletionScheduled,
      deletionDate: profile.metadata?.deletionScheduled,
      finalDeletionDate: profile.metadata?.finalDeletionDate,
      deactivatedBy: profile.metadata?.deactivatedByEmail,
      suspendedBy: profile.metadata?.suspendedByEmail,
      suspendedAt: profile.suspendedAt,
      suspensionReason: profile.suspensionReason,
      expectedReactivation: profile.metadata?.expectedReactivation,
      deletedBy: profile.metadata?.deletedByEmail,
      canReactivate:
        profile.activeStatus === 'deactivated' && !profile.metadata?.deletionScheduled,
      canLiftSuspension: profile.activeStatus === 'suspended',
    };
  }

  /**
   * Helper — suspension lifted email
   */
  private static async sendSuspensionLiftedEmail(params: {
    email: string;
    name: string;
    liftedBy: string;
    liftedAt: Date;
    eventsRestored: number;
    daysExtended: number;
    supportEmail: string;
  }) {
    console.log(`Sending suspension lifted email to ${params.email} — ${params.daysExtended} days added back`);
    // TODO: replace with your actual email function, e.g.:
    // await sendAccountSuspensionLiftedEmail({ ...params });
  }
}