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
  };
}

export class AdminAccountManagementService {
  
  /**
   * ============================================
   * ADMIN ACCOUNT DEACTIVATION
   * ============================================
   * - Bypasses user ownership check
   * - Adds admin authorization
   * - Sends admin-specific email
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
        emailsSent: 0
      };

      // 1. Get user and profile (NO ownership check - admin bypass)
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

      // 2. Update profile status
      profile.activeStatus = 'deactivated';
      profile.deactivatedAt = new Date();
      profile.metadata = {
        ...profile.metadata,
        deactivatedBy: adminId,
        deactivatedByEmail: adminEmail,
        deactivationReason: reason || 'Deactivated by administrator',
        deactivatedAt: new Date()
      };
      await profile.save({ session });

      // 3. Pause subscription
      const subscription = await Subscription.findOne({ 
        userId,
        status: { $in: [SubscriptionStatus.ACTIVE, SubscriptionStatus.TRIALING] }
      }).session(session);
      
      if (subscription) {
        subscription.status = SubscriptionStatus.PAUSED;
        subscription.metadata.set('deactivationReason', reason || 'Account deactivated by admin');
        subscription.metadata.set('deactivatedBy', adminEmail);
        subscription.metadata.set('deactivatedAt', new Date().toISOString());
        await subscription.save({ session });
      }

      // 4. Unpublish all active events
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
        
        event.set('deactivationMetadata', {
          deactivatedAt: new Date(),
          reason: 'Account deactivated by administrator',
          deactivatedBy: adminEmail,
          autoRestore: true
        });
        
        await event.save({ session });

        const registrationCount = await Registration.countDocuments({
          eventId: event._id,
          status: { $in: [RegistrationStatus.CONFIRMED, RegistrationStatus.PENDING] }
        }).session(session);
        
        stats.registrationsAffected += registrationCount;
      }

      // 5. Delete all notifications
      await Notification.deleteMany({ 
        $or: [
          { receiverId: userId },
          { senderId: userId }
        ]
      }).session(session);

      // 6. Send admin deactivation email
      if (sendEmail && user.email) {
        await sendAccountDeactivationEmail({
          email: user.email,
          name: profile.fullName || user.name,
          reason: reason || `Your account was deactivated by an administrator: ${adminEmail}`,
          deactivatedBy: adminEmail,
          reactivationPossible: true,
          reactivationInstructions: "Contact support to request account reactivation after addressing the violation.",
          supportEmail: "support@nomeo-events.com"
        });
        stats.emailsSent++;
      }

      await session.commitTransaction();

      console.log(`✅ Admin deactivated account for user ${userId}:`, stats);
      
      return {
        success: true,
        message: 'Account deactivated successfully by admin. Events are hidden but can be restored.',
        stats
      };

    } catch (error) {
      await session.abortTransaction();
      console.error('Admin account deactivation failed:', error);
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
        emailsSent: 0
      };

      const profile = await Profile.findOne({ 
        userId,
        activeStatus: 'deactivated',
        'metadata.deletionScheduled': { $exists: false }
      }).session(session);

      if (!profile) {
        throw new Error('Account not found or pending permanent deletion');
      }

      // Restore profile
      profile.activeStatus = 'active';
      profile.deactivatedAt = undefined;
      profile.metadata = {
        ...profile.metadata,
        deactivatedAt: undefined,
        deactivatedBy: undefined,
        deactivatedByEmail: undefined,
        deactivationReason: undefined,
        reactivatedBy: adminEmail,
        reactivatedAt: new Date()
      };
      await profile.save({ session });

      // Restore subscription if paused
      const subscription = await Subscription.findOne({
        userId,
        status: SubscriptionStatus.PAUSED
      }).session(session);

      if (subscription) {
        if (new Date() <= subscription.currentPeriodEnd) {
          subscription.status = SubscriptionStatus.ACTIVE;
          await subscription.save({ session });
        }
      }

      // Republish events
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
      stats.eventsUnpublished = eventsRestored;

      await session.commitTransaction();

      console.log(`✅ Admin reactivated account for user ${userId}: ${eventsRestored} events restored`);

      return {
        success: true,
        message: `Account reactivated successfully by admin. ${eventsRestored} events restored.`,
        stats
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
        emailsSent: 0
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

      // Update profile to suspended
      profile.activeStatus = 'suspended';
      profile.suspendedAt = new Date();
      profile.suspensionReason = reason;
      
      const expectedReactivation = duration ? new Date(Date.now() + duration * 24 * 60 * 60 * 1000) : undefined;
      
      profile.metadata = {
        ...profile.metadata,
        suspensionDuration: duration,
        expectedReactivation,
        suspendedBy: adminId,
        suspendedByEmail: adminEmail,
        suspensionReason: reason,
        suspendedAt: new Date()
      };
      
      await profile.save({ session });

      // Update user status
      await User.findByIdAndUpdate(userId, { status: 'suspended' }).session(session);

      // Unpublish events (optional - can keep hidden during suspension)
      const activeEvents = await Event.find({ 
        organizerId: userId,
        status: EventStatus.PUBLISHED,
        isDeleted: false
      }).session(session);

      stats.eventsUnpublished = activeEvents.length;

      for (const event of activeEvents) {
        event.status = EventStatus.DRAFT;
        event.isPublic = false;
        event.set('deactivationMetadata', {
          deactivatedAt: new Date(),
          reason: 'Account suspended by administrator',
          deactivatedBy: adminEmail,
          autoRestore: true
        });
        await event.save({ session });
      }

      // Send suspension email
      if (sendEmail && user.email) {
        await sendAccountSuspensionEmail({
          email: user.email,
          name: profile.fullName || user.name,
          reason: reason,
          duration,
          expectedReactivation,
          suspendedBy: adminEmail,
          appealDeadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
          supportEmail: "support@nomeo-events.com"
        });
        stats.emailsSent++;
      }

      await session.commitTransaction();

      return {
        success: true,
        message: `Account suspended successfully by admin${duration ? ` for ${duration} days` : ''}`,
        stats
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
        emailsSent: 0
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

      // Restore profile to active
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
        suspensionLiftedReason: 'Administrative action'
      };
      await profile.save({ session });

      // Update user status
      await User.findByIdAndUpdate(userId, { status: 'active' }).session(session);

      // Restore subscription if it was affected
      const subscription = await Subscription.findOne({
        userId,
        status: SubscriptionStatus.PAUSED,
        'metadata.suspensionLifted': { $exists: false }
      }).session(session);

      if (subscription) {
        if (new Date() <= subscription.currentPeriodEnd) {
          subscription.status = SubscriptionStatus.ACTIVE;
          subscription.metadata.set('suspensionLifted', true);
          subscription.metadata.set('suspensionLiftedAt', new Date().toISOString());
          subscription.metadata.set('suspensionLiftedBy', adminEmail);
          await subscription.save({ session });
        }
      }

      // Republish events that were unpublished during suspension
      const events = await Event.find({
        organizerId: userId,
        status: EventStatus.DRAFT,
        isDeleted: false,
        isArchived: false,
        'deactivationMetadata.autoRestore': true,
        'deactivationMetadata.reason': 'Account suspended by administrator'
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

      // Send notification email about suspension being lifted
      if (sendEmail && user.email) {
        await this.sendSuspensionLiftedEmail({
          email: user.email,
          name: profile.fullName || user.name,
          liftedBy: adminEmail,
          liftedAt: new Date(),
          eventsRestored: eventsRestored,
          supportEmail: "support@nomeo-events.com"
        });
        stats.emailsSent++;
      }

      await session.commitTransaction();

      console.log(`✅ Admin lifted suspension for user ${userId}: ${eventsRestored} events restored`);

      return {
        success: true,
        message: `Suspension lifted successfully by admin. ${eventsRestored} events restored.`,
        stats
      };

    } catch (error) {
      await session.abortTransaction();
      console.error('Admin lift suspension failed:', error);
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
        emailsSent: 0
      };

      const user = await User.findById(userId).session(session);
      if (!user) throw new Error('User not found');

      const profile = await Profile.findOne({ userId }).session(session);
      if (!profile) throw new Error('Profile not found');

      if (hardDelete) {
        // HARD DELETE - Immediate permanent deletion
        // Cancel subscription
        const subscription = await Subscription.findOne({ 
          userId,
          status: { $ne: SubscriptionStatus.CANCELLED }
        }).session(session);

        if (subscription) {
          await subscription.cancel('Account permanently deleted by admin', true);
          await subscription.save({ session });
        }

        // Handle all events
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

          for (const registration of registrations) {
            await registration.cancel(
              `Event cancelled: Organizer account permanently deleted by admin`,
              'by_admin'
            );

            registrationsCancelled++;

            if (registration.paymentStatus === PaymentStatus.COMPLETED) {
              refundsInitiated++;
            }

            // Send cancellation email to attendee
            const refundInfo = registration.paymentStatus === PaymentStatus.COMPLETED
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
              groupSize: registration.isGroupRegistration ? registration.groupSize : undefined
            });

            stats.emailsSent++;
          }

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

        // Send summary to organizer
        await sendOrganizerEventsCancelledEmail({
          email: user.email,
          name: profile.fullName || user.name,
          deletionDate: new Date(),
          finalDeletionDate: new Date(),
          eventsCancelled: stats.eventsDeleted,
          totalRegistrationsAffected: stats.registrationsCancelled,
          totalRefundsInitiated: stats.refundsInitiated,
          eventsSummary,
          supportEmail: 'support@nomeo-events.com'
        });
        stats.emailsSent++;

        // Delete notifications
        await Notification.deleteMany({ 
          $or: [
            { receiverId: userId },
            { senderId: userId }
          ]
        }).session(session);

        // Delete user and profile
        await profile.deleteOne({ session });
        await user.deleteOne({ session });

        if (sendEmail) {
          await sendAccountDeletionEmail({
            email: user.email,
            name: profile.fullName || user.name,
            reason: reason || `Permanently deleted by administrator: ${adminEmail}`,
            deletionType: "hard",
            affectedEvents: stats.eventsDeleted,
            affectedRegistrations: stats.registrationsCancelled,
            initiatedBy: adminEmail,
            supportEmail: "support@nomeo-events.com"
          });
          stats.emailsSent++;
        }

        await session.commitTransaction();

        return {
          success: true,
          message: `Account permanently deleted by admin. ${stats.eventsDeleted} events cancelled, ${stats.registrationsCancelled} attendees notified.`,
          stats
        };

      } else {
        // SOFT DELETE - 30-day grace period
        if (profile.metadata?.deletionScheduled) {
          throw new Error('Account is already scheduled for deletion');
        }

        const deletionDate = new Date();
        const finalDeletionDate = new Date(deletionDate.getTime() + 30 * 86400000);

        profile.activeStatus = 'deactivated';
        profile.metadata = {
          ...profile.metadata,
          deletionScheduled: deletionDate,
          finalDeletionDate,
          deletionReason: reason || `Scheduled for deletion by admin (${adminEmail})`,
          deletedBy: adminId,
          deletedByEmail: adminEmail
        };
        await profile.save({ session });

        if (sendEmail && user.email) {
          await sendAccountDeletionEmail({
            email: user.email,
            name: profile.fullName || user.name,
            reason: reason || `Scheduled for deletion by administrator: ${adminEmail}`,
            deletionType: "soft",
            scheduledDeletionDate: finalDeletionDate,
            initiatedBy: adminEmail,
            supportEmail: "support@nomeo-events.com"
          });
          stats.emailsSent++;
        }

        await session.commitTransaction();

        return {
          success: true,
          message: "Account scheduled for permanent deletion by admin. 30-day grace period started.",
          stats
        };
      }

    } catch (error) {
      await session.abortTransaction();
      console.error('Admin account deletion failed:', error);
      throw error;
    } finally {
      session.endSession();
    }
  }

  /**
   * Get account status for admin view
   */
  static async getAdminAccountStatus(userId: string) {
    const profile = await Profile.findOne({ userId }).select('activeStatus metadata suspensionReason suspendedAt');
    
    if (!profile) {
      return { exists: false };
    }

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
      canReactivate: profile.activeStatus === 'deactivated' && !profile.metadata?.deletionScheduled,
      canLiftSuspension: profile.activeStatus === 'suspended'
    };
  }

  /**
   * Helper method to send suspension lifted email
   */
  private static async sendSuspensionLiftedEmail(params: {
    email: string;
    name: string;
    liftedBy: string;
    liftedAt: Date;
    eventsRestored: number;
    supportEmail: string;
  }) {
    // Implementation for sending suspension lifted email
    // You can create a separate email function or use an existing email service
    console.log(`Sending suspension lifted email to ${params.email}`);
    
    // Example implementation (you'll need to create the actual email function):
    /*
    await sendAccountSuspensionLiftedEmail({
      email: params.email,
      name: params.name,
      liftedBy: params.liftedBy,
      liftedAt: params.liftedAt,
      eventsRestored: params.eventsRestored,
      supportEmail: params.supportEmail
    });
    */
  }
}