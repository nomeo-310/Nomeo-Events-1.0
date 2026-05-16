// scripts/seed-verify-profiles.js
const mongoose = require('mongoose');
require('dotenv').config({ path: '.env' });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('MONGODB_URI is not defined in .env file');
  process.exit(1);
}

// ─── Schemas (inline to avoid TS compilation) ─────────────────────────────────

// ─── User Schema (mirrors user.ts) ─────────────────────────────────────────────
const UserSchema = new mongoose.Schema(
  {
    name: { type: String },
    email: { type: String },
    emailVerified: { type: Boolean, default: false },
    image: { type: String },
    role: { type: String, enum: ["user", "admin", "super_admin", "moderator", "support"], default: "user" },
    avatar: { type: String, default: "" },
  },
  {
    timestamps: true,
    collection: "user",
  }
);

const User = mongoose.models.User || mongoose.model("User", UserSchema);

const ImageSchema = new mongoose.Schema({
  secure_url: String,
  public_id: String,
}, { _id: false });

const VerificationDocumentSchema = new mongoose.Schema({
  documentType: {
    type: String,
    enum: ["id_card", "passport", "drivers_license", "cac_document", "proof_of_address"],
    required: true,
  },
  secure_url: { type: String, required: true },
  public_id: { type: String, required: true },
  verified: { type: Boolean, default: false },
}, { _id: false });

const LocationSchema = new mongoose.Schema({
  state: { type: String, required: true },
  city: { type: String, required: true },
  address: { type: String, required: true },
  postalCode: String,
  country: { type: String, default: "Nigeria" },
}, { _id: false });

const SocialMediaSchema = new mongoose.Schema({
  facebook: String,
  instagram: String,
  twitter: String,
  linkedin: String,
  youtube: String,
  tiktok: String,
  threads: String,
  whatsApp: String,
}, { _id: false });

const ContactSchema = new mongoose.Schema({
  phoneNumber: { type: String, required: true },
  officeNumber: String,
  email: { type: String, required: true, lowercase: true },
  supportEmail: { type: String, lowercase: true },
  website: String,
  socialMedia: { type: SocialMediaSchema, default: () => ({}) },
}, { _id: false });

const AccountDetailsSchema = new mongoose.Schema({
  bankName: String,
  accountName: String,
  accountNumber: String,
  bankCode: String,
  routingNumber: String,
  swiftCode: String,
  currency: { type: String, default: "NGN" },
}, { _id: false });

const PublicProfileSchema = new mongoose.Schema({
  slug: { type: String, unique: true, sparse: true },
  seoTitle: String,
  seoDescription: String,
  showEmail: { type: Boolean, default: false },
  showPhone: { type: Boolean, default: false },
  showLocation: { type: Boolean, default: true },
}, { _id: false });

const AnalyticsSchema = new mongoose.Schema({
  profileViews: { type: Number, default: 0 },
  eventClicks: { type: Number, default: 0 },
  conversionRate: { type: Number, default: 0 },
  lastAnalyticsUpdate: Date,
}, { _id: false });

const MetadataSchema = new mongoose.Schema({
  ipAddress: String,
  userAgent: String,
  signupSource: String,
  referrer: String,
}, { _id: false });

const ProfileSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    unique: true
  },
  verificationStatus: {
    type: String,
    enum: ["pending", "verified", "rejected", "suspended", "unverified"],
    default: "unverified"
  },
  verifiedAt: Date,
  verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  verificationDocuments: [VerificationDocumentSchema],
  profilePicture: ImageSchema,
  coverPicture: ImageSchema,
  fullName: { type: String, required: true },
  displayName: String,
  location: { type: LocationSchema, required: true },
  accountType: {
    type: String,
    enum: ["individual", "organization"],
    required: true
  },
  organizationName: String,
  organizationType: {
    type: String,
    enum: ["individual", "company", "nonprofit", "agency", "government"]
  },
  organizationRegistrationNumber: String,
  taxId: String,
  activeStatus: {
    type: String,
    enum: ["active", "deactivated", "pending", "suspended"],
    default: "pending"
  },
  suspendedAt: Date,
  suspensionReason: String,
  deactivatedAt: Date,
  lastActiveAt: { type: Date, default: Date.now },
  contact: { type: ContactSchema, required: true },
  bio: String,
  shortBio: String,
  specialties: [String],
  yearsOfExperience: Number,
  paymentMethod: {
    type: String,
    enum: ["manual", "online", "transfer", "auto"],
    default: "manual"
  },
  accountDetails: AccountDetailsSchema,
  events: [{ type: mongoose.Schema.Types.ObjectId, ref: "Event" }],
  totalEvents: { type: Number, default: 0 },
  totalAttendees: { type: Number, default: 0 },
  totalRevenue: { type: Number, default: 0 },
  averageRating: { type: Number, min: 0, max: 5, default: 0 },
  totalReviews: { type: Number, default: 0 },
  publicProfile: { type: PublicProfileSchema, default: () => ({}) },
  analytics: { type: AnalyticsSchema, default: () => ({}) },
  metadata: MetadataSchema,
}, { timestamps: true });

const Profile = mongoose.models.Profile || mongoose.model("Profile", ProfileSchema);

// ─── DB connection ─────────────────────────────────────────────────────────────

async function connectDB() {
  if (mongoose.connection.readyState === 1) return;
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to MongoDB');
}

async function disconnectDB() {
  await mongoose.disconnect();
  console.log('Disconnected from MongoDB');
}

// ─── Verification logic ────────────────────────────────────────────────────────

/**
 * Auto-verify profiles that have uploaded verification documents.
 * 
 * This finds all unverified/pending profiles that have at least one
 * verification document and marks them as verified.
 * 
 * Also marks each individual document as verified.
 * 
 * @param {Object} options
 * @param {boolean} options.dryRun - If true, only preview changes without applying them
 * @param {string} options.statusFilter - Filter by verificationStatus (default: unverified, pending)
 * @param {number} options.minDocuments - Minimum number of documents required (default: 1)
 * @returns {Promise<Object>} Summary of changes
 */
async function autoVerifyProfiles({ dryRun = false, statusFilter, minDocuments = 1 } = {}) {
  await connectDB();

  try {
    // Build query - find profiles that:
    // 1. Have at least one verification document
    // 2. Are not already verified (unless statusFilter overrides)
    const query = {
      verificationDocuments: { 
        $exists: true, 
        $not: { $size: 0 }  // Has at least one document
      }
    };

    // Default: only target unverified and pending profiles
    if (statusFilter) {
      query.verificationStatus = statusFilter;
    } else {
      query.verificationStatus = { $in: ["unverified", "pending"] };
    }

    // Also require minimum number of documents
    if (minDocuments > 1) {
      query.$expr = { 
        $gte: [{ $size: "$verificationDocuments" }, minDocuments] 
      };
    }

    const profiles = await Profile.find(query)
      .populate('userId', 'name email')
      .lean();

    console.log(`\n📋 Found ${profiles.length} profile(s) to verify:\n`);

    if (profiles.length === 0) {
      console.log('No profiles match the criteria.');
      return { verified: 0, skipped: 0, details: [] };
    }

    // Display what will be changed
    profiles.forEach((p, i) => {
      const user = p.userId || {};
      console.log(`  ${i + 1}. ${p.fullName}`);
      console.log(`     Email: ${user.email || p.contact?.email || 'N/A'}`);
      console.log(`     Status: ${p.verificationStatus}`);
      console.log(`     Documents: ${p.verificationDocuments?.length || 0}`);
      if (p.verificationDocuments?.length) {
        p.verificationDocuments.forEach((doc, j) => {
          console.log(`       ${j + 1}. ${doc.documentType} - ${doc.verified ? '✅ verified' : '⬜ not verified'}`);
        });
      }
      console.log('');
    });

    if (dryRun) {
      console.log('🏁 DRY RUN — No changes were made.');
      return { 
        verified: 0, 
        skipped: profiles.length, 
        dryRun: true,
        details: profiles.map(p => ({
          id: p._id,
          name: p.fullName,
          documents: p.verificationDocuments?.length || 0
        }))
      };
    }

    // Apply verification
    const now = new Date();
    const results = [];

    for (const profile of profiles) {
      const updates = {
        verificationStatus: "verified",
        verifiedAt: now,
        // Mark all documents as verified
        "verificationDocuments.$[].verified": true
      };

      const updated = await Profile.findByIdAndUpdate(
        profile._id,
        { $set: updates },
        { new: true }
      );

      results.push({
        id: updated._id,
        name: updated.fullName,
        status: updated.verificationStatus,
        documentsVerified: updated.verificationDocuments?.filter(d => d.verified).length || 0
      });
    }

    console.log(`\n✅ Verified ${results.length} profile(s):\n`);
    results.forEach((r, i) => {
      console.log(`  ${i + 1}. ${r.name} — ${r.status} (${r.documentsVerified} documents verified)`);
    });

    return { 
      verified: results.length, 
      skipped: 0, 
      details: results 
    };

  } finally {
    await disconnectDB();
  }
}

/**
 * Verify specific profiles by user email or profile ID
 */
async function verifySpecificProfiles(identifiers, { dryRun = false } = {}) {
  await connectDB();

  try {
    const query = {
      $or: [
        { "contact.email": { $in: identifiers } },
        { _id: { $in: identifiers.filter(id => mongoose.Types.ObjectId.isValid(id)) } }
      ]
    };

    const profiles = await Profile.find(query)
      .populate('userId', 'name email')
      .lean();

    if (profiles.length === 0) {
      console.log('No profiles found for the given identifiers.');
      return { verified: 0, skipped: 0, details: [] };
    }

    console.log(`\n📋 Found ${profiles.length} profile(s):\n`);

    profiles.forEach((p, i) => {
      console.log(`  ${i + 1}. ${p.fullName} (${p.contact?.email || 'N/A'})`);
      console.log(`     Current status: ${p.verificationStatus}`);
      console.log(`     Documents: ${p.verificationDocuments?.length || 0}`);
      console.log('');
    });

    if (dryRun) {
      console.log('🏁 DRY RUN — No changes were made.');
      return { verified: 0, skipped: profiles.length, dryRun: true };
    }

    const now = new Date();
    const results = [];

    for (const profile of profiles) {
      const updated = await Profile.findByIdAndUpdate(
        profile._id,
        {
          $set: {
            verificationStatus: "verified",
            verifiedAt: now,
            "verificationDocuments.$[].verified": true
          }
        },
        { new: true }
      );

      results.push({
        id: updated._id,
        name: updated.fullName,
        email: updated.contact?.email,
        status: updated.verificationStatus
      });
    }

    console.log(`\n✅ Verified ${results.length} profile(s):\n`);
    results.forEach(r => {
      console.log(`  • ${r.name} (${r.email}) — ${r.status}`);
    });

    return { verified: results.length, skipped: 0, details: results };

  } finally {
    await disconnectDB();
  }
}

/**
 * Show verification statistics
 */
async function showVerificationStats() {
  await connectDB();

  try {
    const stats = await Profile.aggregate([
      {
        $group: {
          _id: "$verificationStatus",
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    console.log('\n📊 Verification Statistics:\n');
    const total = stats.reduce((sum, s) => sum + s.count, 0);
    stats.forEach(s => {
      const emoji = {
        verified: '✅',
        pending: '⏳',
        unverified: '⬜',
        rejected: '❌',
        suspended: '🚫'
      }[s._id] || '📌';
      console.log(`  ${emoji} ${s._id}: ${s.count} (${((s.count / total) * 100).toFixed(1)}%)`);
    });
    console.log(`\n  Total profiles: ${total}`);

    // Show profiles with documents but not verified
    const pending = await Profile.countDocuments({
      verificationDocuments: { $exists: true, $not: { $size: 0 } },
      verificationStatus: { $in: ["unverified", "pending"] }
    });

    console.log(`\n  📄 Profiles with documents awaiting verification: ${pending}`);

    return stats;
  } finally {
    await disconnectDB();
  }
}

/**
 * Reject profiles that don't meet criteria
 */
async function rejectProfiles({ reason = "Documents insufficient", dryRun = false } = {}) {
  await connectDB();

  try {
    // Find profiles with no documents that are still pending
    const query = {
      $or: [
        { verificationDocuments: { $exists: false } },
        { verificationDocuments: { $size: 0 } }
      ],
      verificationStatus: "pending"
    };

    const profiles = await Profile.find(query).lean();

    console.log(`\n📋 Found ${profiles.length} pending profile(s) with no documents:\n`);

    if (profiles.length === 0) {
      console.log('No profiles match the criteria.');
      return { rejected: 0, details: [] };
    }

    profiles.forEach((p, i) => {
      console.log(`  ${i + 1}. ${p.fullName} (${p.contact?.email || 'N/A'})`);
    });

    if (dryRun) {
      console.log('\n🏁 DRY RUN — No changes were made.');
      return { rejected: 0, skipped: profiles.length, dryRun: true };
    }

    const results = [];
    for (const profile of profiles) {
      const updated = await Profile.findByIdAndUpdate(
        profile._id,
        {
          $set: {
            verificationStatus: "rejected",
          }
        },
        { new: true }
      );
      results.push({
        id: updated._id,
        name: updated.fullName,
        status: updated.verificationStatus
      });
    }

    console.log(`\n❌ Rejected ${results.length} profile(s)`);
    return { rejected: results.length, details: results };

  } finally {
    await disconnectDB();
  }
}

// ─── CLI ──────────────────────────────────────────────────────────────────────

async function main() {
  const [command, ...args] = process.argv.slice(2);

  // Parse flags
  const flags = {
    dryRun: args.includes('--dry-run') || args.includes('--dryRun'),
    minDocs: parseInt(args.find(a => a.startsWith('--min-docs='))?.split('=')[1] || '1'),
    email: args.find(a => a.startsWith('--email='))?.split('=')[1],
  };

  try {
    switch (command) {
      case 'verify-all':
        await autoVerifyProfiles({ 
          dryRun: flags.dryRun, 
          minDocuments: flags.minDocs 
        });
        break;

      case 'verify':
        // Verify specific profiles by email
        const emails = args.filter(a => !a.startsWith('--'));
        if (flags.email) emails.push(flags.email);
        
        if (emails.length === 0) {
          console.log('Usage: seed-verify-profiles verify <email1> [email2...] [--dry-run]');
          console.log('       seed-verify-profiles verify --email=user@example.com');
          break;
        }
        await verifySpecificProfiles(emails, { dryRun: flags.dryRun });
        break;

      case 'stats':
        await showVerificationStats();
        break;

      case 'reject':
        await rejectProfiles({ dryRun: flags.dryRun });
        break;

      case 'preview':
        // Alias for verify-all --dry-run
        await autoVerifyProfiles({ dryRun: true, minDocuments: flags.minDocs });
        break;

      default:
        console.log(`
📋 seed-verify-profiles — Profile Verification CLI (Temporary)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Commands:
  verify-all [--dry-run] [--min-docs=N]    Auto-verify profiles with documents
  verify <emails...> [--dry-run]           Verify specific profiles by email
  preview [--min-docs=N]                   Preview what would be verified
  stats                                    Show verification statistics
  reject [--dry-run]                       Reject pending profiles with no documents

Options:
  --dry-run              Preview changes without applying
  --min-docs=N           Minimum documents required (default: 1)
  --email=user@test.com  Specify email (alternative to positional args)

Examples:
  node scripts/seed-verify-profiles.js verify-all
  node scripts/seed-verify-profiles.js verify-all --dry-run
  node scripts/seed-verify-profiles.js verify-all --min-docs=2
  node scripts/seed-verify-profiles.js verify user@example.com another@test.com
  node scripts/seed-verify-profiles.js preview
  node scripts/seed-verify-profiles.js stats
  node scripts/seed-verify-profiles.js reject --dry-run
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        `);
    }
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { autoVerifyProfiles,  verifySpecificProfiles,  showVerificationStats,  rejectProfiles };