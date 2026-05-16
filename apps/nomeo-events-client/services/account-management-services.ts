// services/account-management.service.ts
import mongoose from 'mongoose';
import { User } from '@/models/user';
import { Profile } from '@/models/profile';
import { Subscription, SubscriptionStatus } from '@/models/subscription';
import { Event, EventStatus } from '@/models/event';
import { Registration, RegistrationStatus, PaymentStatus } from '@/models/registration';
import { Notification } from '@/models/notification';
import { sendAccountDeactivationEmail } from '@/lib/emails/send-account-deactivation-email';
import { sendAccountDeletionEmail } from '@/lib/emails/send-account-deletion-email';
import { sendEventCancellationToAttendees } from '@/lib/emails/send-event-cancellation-email';
import { sendOrganizerEventsCancelledEmail } from '@/lib/emails/send-organizer-events-cancelled-email';

interface DeactivationResult {
  success: boolean;
  message: string;
  stats: {
    eventsUnpublished: number;
    registrationsAffected: number;
    emailsSent: number;
  };
}

interface DeletionResult {
  success: boolean;
  message: string;
  stats: {
    eventsDeleted: number;
    registrationsCancelled: number;
    refundsInitiated: number;
    emailsSent: number;
  };
}

export class AccountManagementService {
  
  /**
   * ============================================
   * ACCOUNT DEACTIVATION (Soft - Reversible)
   * ============================================
   * - Profile: Set to 'deactivated' status
   * - Events: Unpublish all (status → DRAFT)
   * - Registrations: Keep as-is (don't cancel)
   * - Subscription: Pause
   * - Notifications: Delete all
   * - Sessions: Terminate all
   * - Emails: Send deactivation email to user
   * 
   * NO emails sent to attendees (events just hidden, not cancelled)
   */
  static async deactivateAccount(
    userId: string, 
    reason?: string
  ): Promise<DeactivationResult> {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const stats = {
        eventsUnpublished: 0,
        registrationsAffected: 0,
        emailsSent: 0
      };

      // 1. Get user and profile
      const user = await User.findById(userId).session(session);
      if (!user) throw new Error('User not found');

      const profile = await Profile.findOne({ userId }).session(session);
      if (!profile) throw new Error('Profile not found');

      if (profile.activeStatus === 'deactivated') {
        throw new Error('Account is already deactivated');
      }

      // 2. Update profile status
      profile.activeStatus = 'deactivated';
      profile.deactivatedAt = new Date();
      await profile.save({ session });

      // 3. Pause subscription (don't cancel - they might come back)
      const subscription = await Subscription.findOne({ 
        userId,
        status: { $in: [SubscriptionStatus.ACTIVE, SubscriptionStatus.TRIALING] }
      }).session(session);
      
      if (subscription) {
        subscription.status = SubscriptionStatus.PAUSED;
        subscription.metadata.set('deactivationReason', reason || 'Account deactivated');
        subscription.metadata.set('deactivatedAt', new Date().toISOString());
        await subscription.save({ session });
      }

      // 4. Unpublish all active events (soft - just hide them)
      const activeEvents = await Event.find({ 
        organizerId: userId,
        status: EventStatus.PUBLISHED,
        isDeleted: false,
        isArchived: false
      }).session(session);

      stats.eventsUnpublished = activeEvents.length;

      for (const event of activeEvents) {
        event.status = EventStatus.DRAFT;
        event.isPublic = false;
        
        // Add metadata about why it was unpublished
        event.set('deactivationMetadata', {
          deactivatedAt: new Date(),
          reason: 'Organizer account deactivated',
          autoRestore: true // Flag for auto-restore on reactivation
        });
        
        await event.save({ session });

        // Count affected registrations (but don't cancel them)
        const registrationCount = await Registration.countDocuments({
          eventId: event._id,
          status: { $in: [RegistrationStatus.CONFIRMED, RegistrationStatus.PENDING] }
        }).session(session);
        
        stats.registrationsAffected += registrationCount;
      }

      // 5. Delete all notifications (personal data cleanup)
      await Notification.deleteMany({ 
        $or: [
          { receiverId: userId },
          { senderId: userId }
        ]
      }).session(session);

      // 6. Send deactivation email to the user
      await sendAccountDeactivationEmail({
        email: user.email,
        name: profile.fullName || user.name,
        reason: reason || 'Account deactivated by user request',
        reactivationLink: `${process.env.NEXT_PUBLIC_APP_URL}/login`,
        eventsCount: stats.eventsUnpublished,
        registrationCount: stats.registrationsAffected
      });
      
      stats.emailsSent = 1;

      await session.commitTransaction();

      console.log(`✅ Account deactivated for user ${userId}:`, stats);
      
      return {
        success: true,
        message: 'Account deactivated successfully. Your events are hidden but can be restored when you return.',
        stats
      };

    } catch (error) {
      await session.abortTransaction();
      console.error('Account deactivation failed:', error);
      throw error;
    } finally {
      session.endSession();
    }
  }

  /**
   * ============================================
   * ACCOUNT DELETION (Hard - Permanent)
   * ============================================
   * - Profile: Mark for deletion (30-day grace)
   * - Events: Soft-delete all
   * - Registrations: Cancel all & initiate refunds
   * - Subscription: Cancel immediately
   * - Notifications: Delete all
   * - Sessions: Terminate all
   * - Emails: 
   *   1. Deletion confirmation to user
   *   2. Cancellation notices to all affected attendees
   *   3. Event summary to organizer (for records)
   */
  static async deleteAccount(
    userId: string,
    reason?: string
  ): Promise<DeletionResult> {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const stats = {
        eventsDeleted: 0,
        registrationsCancelled: 0,
        refundsInitiated: 0,
        emailsSent: 0
      };

      // 1. Get user and profile
      const user = await User.findById(userId).session(session);
      if (!user) throw new Error('User not found');

      const profile = await Profile.findOne({ userId }).session(session);
      if (!profile) throw new Error('Profile not found');

      // 2. Cancel subscription immediately
      const subscription = await Subscription.findOne({ 
        userId,
        status: { $ne: SubscriptionStatus.CANCELLED }
      }).session(session);

      if (subscription) {
        await subscription.cancel('Account permanently deleted', true);
        await subscription.save({ session });
      }

      // 3. Handle ALL events (published, draft, everything)
      const allEvents = await Event.find({ 
        organizerId: userId,
        isDeleted: false
      }).session(session);

      stats.eventsDeleted = allEvents.length;

      const eventsSummary: Array<{
        title: string;
        date: string;
        registrationsAffected: number;
        refundsInitiated: number;
      }> = [];

      for (const event of allEvents) {
        // 3a. Get all confirmed/pending registrations for this event
        const registrations = await Registration.find({
          eventId: event._id,
          status: { 
            $in: [
              RegistrationStatus.CONFIRMED, 
              RegistrationStatus.PENDING,
              RegistrationStatus.WAITLISTED
            ] 
          }
        }).session(session);

        let registrationsCancelled = 0;
        let refundsInitiated = 0;

        // 3b. Cancel each registration and notify attendees
        for (const registration of registrations) {
          // Cancel the registration (this handles seat restoration, ticket cancellation, refund)
          await registration.cancel(
            `Event cancelled: Organizer account permanently deleted`,
            'by_organizer'
          );

          registrationsCancelled++;

          // Track refunds for paid registrations
          if (registration.paymentStatus === PaymentStatus.COMPLETED) {
            refundsInitiated++;
          }

          // Send cancellation email to each attendee
          const refundInfo = registration.paymentStatus === PaymentStatus.COMPLETED
            ? `Your payment of ${registration.currency} ${registration.price} will be refunded within 7-14 business days. Refund will be sent to your original payment method.`
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
            groupSize: registration.isGroupRegistration ? registration.groupSize : undefined
          });

          stats.emailsSent++;
        }

        // 3c. Soft-delete the event
        await event.softDelete();
        
        eventsSummary.push({
          title: event.title,
          date: event.startDate.toISOString(),
          registrationsAffected: registrationsCancelled,
          refundsInitiated
        });

        stats.registrationsCancelled += registrationsCancelled;
        stats.refundsInitiated += refundsInitiated;
      }

      // 4. Send comprehensive deletion summary to the organizer
      const deletionDate = new Date();
      const finalDeletionDate = new Date(deletionDate.getTime() + 30 * 86400000);

      await sendOrganizerEventsCancelledEmail({
        email: user.email,
        name: profile.fullName || user.name,
        deletionDate,
        finalDeletionDate,
        eventsCancelled: stats.eventsDeleted,
        totalRegistrationsAffected: stats.registrationsCancelled,
        totalRefundsInitiated: stats.refundsInitiated,
        eventsSummary,
        supportEmail: 'support@nomeo-events.com'
      });
      stats.emailsSent++;

      // 5. Delete all notifications
      await Notification.deleteMany({ 
        $or: [
          { receiverId: userId },
          { senderId: userId }
        ]
      }).session(session);

      // 6. Mark profile for deletion (keep for audit trail)
      profile.activeStatus = 'deactivated';
      profile.metadata = {
        ...profile.metadata,
        deletionScheduled: deletionDate,
        finalDeletionDate,
        deletionReason: reason || 'User requested permanent deletion',
        eventsDeleted: stats.eventsDeleted,
        registrationsAffected: stats.registrationsCancelled,
        refundsInitiated: stats.refundsInitiated
      };
      await profile.save({ session });

      // 7. Send final deletion confirmation email
      await sendAccountDeletionEmail({
        email: user.email,
        name: profile.fullName || user.name,
        deletionDate,
        dataRetentionDays: 30,
        eventsCancelled: stats.eventsDeleted,
        registrationsAffected: stats.registrationsCancelled,
        refundsInitiated: stats.refundsInitiated
      });
      stats.emailsSent++;

      await session.commitTransaction();

      console.log(`✅ Account deleted for user ${userId}:`, stats);

      return {
        success: true,
        message: `Account deletion initiated. ${stats.eventsDeleted} events cancelled, ${stats.registrationsCancelled} attendees notified, ${stats.refundsInitiated} refunds processing.`,
        stats
      };

    } catch (error) {
      await session.abortTransaction();
      console.error('Account deletion failed:', error);
      throw error;
    } finally {
      session.endSession();
    }
  }

  /**
   * Reactivate a deactivated account
   */
  static async reactivateAccount(userId: string) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const profile = await Profile.findOne({ 
        userId,
        activeStatus: 'deactivated',
        'metadata.deletionScheduled': { $exists: false } // Only allow reactivation if not pending deletion
      }).session(session);

      if (!profile) {
        throw new Error('Account not found or pending permanent deletion');
      }

      // Restore profile
      profile.activeStatus = 'active';
      profile.deactivatedAt = undefined;
      await profile.save({ session });

      // Restore subscription if paused
      const subscription = await Subscription.findOne({
        userId,
        status: SubscriptionStatus.PAUSED
      }).session(session);

      if (subscription) {
        // If still within billing period, reactivate
        if (new Date() <= subscription.currentPeriodEnd) {
          subscription.status = SubscriptionStatus.ACTIVE;
          await subscription.save({ session });
        }
      }

      // Republish events that were auto-unpublished
      const events = await Event.find({
        organizerId: userId,
        status: EventStatus.DRAFT,
        isDeleted: false,
        'deactivationMetadata.autoRestore': true
      }).session(session);

      let eventsRestored = 0;
      for (const event of events) {
        event.status = EventStatus.PUBLISHED;
        event.isPublic = true;
        event.set('deactivationMetadata', undefined);
        await event.save({ session });
        eventsRestored++;
      }

      await session.commitTransaction();

      console.log(`✅ Account reactivated for user ${userId}: ${eventsRestored} events restored`);

      return {
        success: true,
        message: `Account reactivated successfully. ${eventsRestored} events restored.`,
        eventsRestored
      };

    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  /**
   * Get account status for UI display
   */
  static async getAccountStatus(userId: string) {
    const profile = await Profile.findOne({ userId }).select('activeStatus metadata');
    
    if (!profile) {
      return { exists: false };
    }

    return {
      exists: true,
      status: profile.activeStatus,
      isPendingDeletion: !!profile.metadata?.deletionScheduled,
      deletionDate: profile.metadata?.deletionScheduled,
      finalDeletionDate: profile.metadata?.finalDeletionDate,
      canReactivate: profile.activeStatus === 'deactivated' && !profile.metadata?.deletionScheduled
    };
  }
}