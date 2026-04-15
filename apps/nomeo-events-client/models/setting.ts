import { Schema, model, models, Types, Document, Model } from "mongoose";

export interface ISetting extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  
  notifications: {
    email: {
      newRegistration: boolean;
      eventReminder: boolean;
      weeklyReport: boolean;
      monthlyDigest: boolean;
      marketing: boolean;
      paymentReceived: boolean;
      eventCancelled: boolean;
    };
    sms: {
      alerts: boolean;
      reminders: boolean;
      otpVerification: boolean;
    };
    push: {
      updates: boolean;
      messages: boolean;
      reminders: boolean;
    };
    inApp: {
      newRegistration: boolean;
      eventUpdates: boolean;
      teamInvites: boolean;
    };
  };
  
  display: {
    timezone: string;
    dateFormat: "DD/MM/YYYY" | "MM/DD/YYYY" | "YYYY-MM-DD";
    timeFormat: "12h" | "24h";
    language: string;
    currency: "NGN" | "USD" | "EUR" | "GBP";
    theme: "light" | "dark" | "system";
    compactView: boolean;
  };
  
  payment: {
    currency: "NGN" | "USD" | "EUR" | "GBP";
    minimumPayout: number;
    payoutSchedule: "daily" | "weekly" | "biweekly" | "monthly";
    autoPayout: boolean;
    payoutMethod: "bank" | "paypal" | "stripe";
    taxRate: number;
    taxId?: string;
    invoicePrefix: string;
  };
  
  eventDefaults: {
    defaultTimezone: string;
    defaultReminderTime: number;
    defaultTicketTypes: {
      name: string;
      price: number;
      quantity: number;
    }[];
    defaultRefundPolicy: string;
    autoApproveRegistrations: boolean;
    sendReminderEmail: boolean;
    sendThankYouEmail: boolean;
    defaultCoverImage?: string;
  };
  
  privacy: {
    showEmailOnPublicProfile: boolean;
    showPhoneOnPublicProfile: boolean;
    showLocationOnPublicProfile: boolean;
    showEventHistory: boolean;
    allowDirectMessages: boolean;
    allowEventSharing: boolean;
    dataRetentionDays: number;
    allowAnalyticsTracking: boolean;
  };
  
  security: {
    twoFactorEnabled: boolean;
    twoFactorMethod: "authenticator" | "sms" | "email";
    sessionTimeout: number;
    loginAlerts: boolean;
    ipWhitelist: string[];
    allowedDomains: string[];
  };
  
  integrations: {
    googleCalendar: {
      connected: boolean;
      syncEnabled: boolean;
      calendarId?: string;
    };
    zoom: {
      connected: boolean;
      defaultSettings?: {
        autoRecord: boolean;
        waitingRoom: boolean;
        muteParticipants: boolean;
      };
    };
    mailchimp: {
      connected: boolean;
      audienceId?: string;
      syncEnabled: boolean;
    };
    webhooks: {
      url?: string;
      events: string[];
      secret?: string;
    }[];
  };
  
  teamSettings: {
    allowTeamMembers: boolean;
    maxTeamMembers: number;
    defaultRole: "admin" | "editor" | "viewer";
    requireApproval: boolean;
    auditLog: boolean;
  };
  
  billing: {
    autoRenew: boolean;
    invoiceEmail: string;
    billingAddress: {
      line1: string;
      line2?: string;
      city: string;
      state: string;
      postalCode: string;
      country: string;
    };
    vatNumber?: string;
  };
  
  features: {
    earlyAccess: boolean;
    betaFeatures: boolean;
    analyticsEnabled: boolean;
    customBranding: boolean;
    apiAccess: boolean;
  };
  
  createdAt: Date;
  updatedAt: Date;
  
  // Methods
  getDefaultTicketTypes(): { name: string; price: number; quantity: number }[];
}

// Interface for static methods
interface ISettingModel extends Model<ISetting> {
  getByProfileId(userId: Types.ObjectId | string): Promise<ISetting>;
}

const SettingSchema = new Schema<ISetting, ISettingModel>(
  {
    userId: { 
      type: Schema.Types.ObjectId, 
      ref: "user", 
      required: true, 
      unique: true,
      index: true 
    },
    
    notifications: {
      email: {
        newRegistration: { type: Boolean, default: true },
        eventReminder: { type: Boolean, default: true },
        weeklyReport: { type: Boolean, default: true },
        monthlyDigest: { type: Boolean, default: false },
        marketing: { type: Boolean, default: false },
        paymentReceived: { type: Boolean, default: true },
        eventCancelled: { type: Boolean, default: true },
      },
      sms: {
        alerts: { type: Boolean, default: false },
        reminders: { type: Boolean, default: true },
        otpVerification: { type: Boolean, default: true },
      },
      push: {
        updates: { type: Boolean, default: true },
        messages: { type: Boolean, default: true },
        reminders: { type: Boolean, default: true },
      },
      inApp: {
        newRegistration: { type: Boolean, default: true },
        eventUpdates: { type: Boolean, default: true },
        teamInvites: { type: Boolean, default: true },
      },
    },
    
    display: {
      timezone: { type: String, default: "Africa/Lagos" },
      dateFormat: { 
        type: String, 
        enum: ["DD/MM/YYYY", "MM/DD/YYYY", "YYYY-MM-DD"], 
        default: "DD/MM/YYYY" 
      },
      timeFormat: { type: String, enum: ["12h", "24h"], default: "12h" },
      language: { type: String, default: "en" },
      currency: { type: String, enum: ["NGN", "USD", "EUR", "GBP"], default: "NGN" },
      theme: { type: String, enum: ["light", "dark", "system"], default: "system" },
      compactView: { type: Boolean, default: false },
    },
    
    payment: {
      currency: { type: String, enum: ["NGN", "USD", "EUR", "GBP"], default: "NGN" },
      minimumPayout: { type: Number, default: 1000 },
      payoutSchedule: { 
        type: String, 
        enum: ["daily", "weekly", "biweekly", "monthly"], 
        default: "weekly" 
      },
      autoPayout: { type: Boolean, default: false },
      payoutMethod: { type: String, enum: ["bank", "paypal", "stripe"], default: "bank" },
      taxRate: { type: Number, default: 0 },
      taxId: { type: String },
      invoicePrefix: { type: String, default: "INV-" },
    },
    
    eventDefaults: {
      defaultTimezone: { type: String, default: "Africa/Lagos" },
      defaultReminderTime: { type: Number, default: 24 },
      defaultTicketTypes: {
        type: [{
          name: { type: String, required: true },
          price: { type: Number, required: true },
          quantity: { type: Number, required: true },
        }],
        default: [{ name: "Regular", price: 0, quantity: 100 }]
      },
      defaultRefundPolicy: { type: String, default: "Full refund available up to 7 days before event" },
      autoApproveRegistrations: { type: Boolean, default: true },
      sendReminderEmail: { type: Boolean, default: true },
      sendThankYouEmail: { type: Boolean, default: true },
      defaultCoverImage: { type: String },
    },
    
    privacy: {
      showEmailOnPublicProfile: { type: Boolean, default: false },
      showPhoneOnPublicProfile: { type: Boolean, default: false },
      showLocationOnPublicProfile: { type: Boolean, default: true },
      showEventHistory: { type: Boolean, default: true },
      allowDirectMessages: { type: Boolean, default: true },
      allowEventSharing: { type: Boolean, default: true },
      dataRetentionDays: { type: Number, default: 730 },
      allowAnalyticsTracking: { type: Boolean, default: true },
    },
    
    security: {
      twoFactorEnabled: { type: Boolean, default: false },
      twoFactorMethod: { type: String, enum: ["authenticator", "sms", "email"], default: "authenticator" },
      sessionTimeout: { type: Number, default: 60 },
      loginAlerts: { type: Boolean, default: true },
      ipWhitelist: { type: [String], default: [] },
      allowedDomains: { type: [String], default: [] },
    },
    
    integrations: {
      googleCalendar: {
        connected: { type: Boolean, default: false },
        syncEnabled: { type: Boolean, default: false },
        calendarId: { type: String },
      },
      zoom: {
        connected: { type: Boolean, default: false },
        defaultSettings: {
          autoRecord: { type: Boolean, default: false },
          waitingRoom: { type: Boolean, default: true },
          muteParticipants: { type: Boolean, default: true },
        },
      },
      mailchimp: {
        connected: { type: Boolean, default: false },
        audienceId: { type: String },
        syncEnabled: { type: Boolean, default: false },
      },
      webhooks: { type: [{
        url: { type: String },
        events: { type: [String], default: [] },
        secret: { type: String },
      }], default: [] },
    },
    
    teamSettings: {
      allowTeamMembers: { type: Boolean, default: true },
      maxTeamMembers: { type: Number, default: 5 },
      defaultRole: { type: String, enum: ["admin", "editor", "viewer"], default: "viewer" },
      requireApproval: { type: Boolean, default: true },
      auditLog: { type: Boolean, default: true },
    },
    
    billing: {
      autoRenew: { type: Boolean, default: true },
      invoiceEmail: { type: String },
      billingAddress: {
        line1: { type: String, default: "" },
        line2: { type: String },
        city: { type: String, default: "" },
        state: { type: String, default: "" },
        postalCode: { type: String, default: "" },
        country: { type: String, default: "Nigeria" },
      },
      vatNumber: { type: String },
    },
    
    features: {
      earlyAccess: { type: Boolean, default: false },
      betaFeatures: { type: Boolean, default: false },
      analyticsEnabled: { type: Boolean, default: true },
      customBranding: { type: Boolean, default: false },
      apiAccess: { type: Boolean, default: false },
    },
  },
  { timestamps: true }
);

// Indexes
SettingSchema.index({ profileId: 1 });
SettingSchema.index({ "display.timezone": 1 });

// Instance method
SettingSchema.methods.getDefaultTicketTypes = function(): { name: string; price: number; quantity: number }[] {
  if (this.eventDefaults?.defaultTicketTypes?.length) {
    return this.eventDefaults.defaultTicketTypes;
  }
  return [{ name: "Regular", price: 0, quantity: 100 }];
};

// Static method - creates settings if doesn't exist
SettingSchema.statics.getByProfileId = async function(profileId: Types.ObjectId | string): Promise<ISetting> {
  let settings = await this.findOne({ profileId });
  
  if (!settings) {
    // Create minimal settings with all defaults
    settings = await this.create({ 
      userId: new Types.ObjectId(profileId.toString())
    });
  }
  
  return settings;
};

// Create and export model
const SettingModel = models.Setting as ISettingModel;

export const Setting = SettingModel || model<ISetting, ISettingModel>("Setting", SettingSchema);