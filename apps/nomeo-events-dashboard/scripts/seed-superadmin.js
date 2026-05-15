// scripts/seed-superadmin.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: '.env' });

const { hashPassword: betterAuthHashPassword, verifyPassword } = require('better-auth/crypto');
const { generateId } = require('better-auth');
const { betterAuth } = require('better-auth');
const { mongodbAdapter } = require('better-auth/adapters/mongodb');

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI is not defined in .env.local');
  process.exit(1);
}

// ─── Minimal schemas for Admin and Seedphrase only ────────────────────────────
// We do NOT define User/Account schemas — Better Auth owns those collections.
// We only need Mongoose for the two custom collections Better Auth doesn't know about.


const AdminSchema = new mongoose.Schema(
  {
    name: String,
    displayName: String,
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    role: {
      type: String,
      enum: ['super_admin', 'admin', 'moderator', 'support'],
      default: 'admin',
    },
    isActive: { type: Boolean, default: true },
    isOnboarded: { type: Boolean, default: false },
    useSeedPhrase: { type: Boolean, default: true },
    lastLoginAt: Date,
    lastLoginIP: String,
    loginCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);


const SeedphraseSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    seedphrase: { type: String, required: true },
    isActive: { type: Boolean, default: true },
    failedAttempts: { type: Number, default: 0 },
    expiresAt: { type: Date , default: () => new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)},
    lastUsedAt: Date,
  },
  { timestamps: true }
);

const Admin = mongoose.models.Admin || mongoose.model('Admin', AdminSchema);
const Seedphrase = mongoose.models.Seedphrase || mongoose.model('Seedphrase', SeedphraseSchema);

// ─── Bootstrap Better Auth with the live DB connection ───────────────────────

function createAuth(db) {
  return betterAuth({
    secret: process.env.BETTER_AUTH_SECRET,
    baseURL: process.env.BETTER_AUTH_URL || 'http://localhost:3000',
    database: mongodbAdapter(db),
    user: {
      additionalFields: {
        role: { type: 'string', required: false, defaultValue: 'user' },
        avatar: { type: 'string', required: false, defaultValue: '' },
      },
    },
    emailAndPassword: { enabled: true, requireEmailVerification: false },
    socialProviders: {},
    plugins: [],
  });
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function generateSecurePassword(length = 16) {
  const lower = 'abcdefghijklmnopqrstuvwxyz';
  const upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const digits = '0123456789';
  const special = '!@#$%^&*';
  const all = lower + upper + digits + special;
  const rand = (str) => str[Math.floor(Math.random() * str.length)];
  let password = [rand(lower), rand(upper), rand(digits), rand(special)];
  for (let i = password.length; i < length; i++) password.push(rand(all));
  return password.sort(() => Math.random() - 0.5).join('');
}

function generateSeedPhrase(wordCount = 12) {
  const wordList = [
    'abandon','ability','able','about','above','absent','absorb','abstract','absurd','accident',
    'account','accuse','achieve','acid','acoustic','acquire','across','action','actor','actress',
    'actual','adapt','addict','address','adjust','admit','adult','advance','advice','aerobic',
    'affair','afford','afraid','africa','agent','agree','ahead','airport','aisle','alarm',
    'album','alcohol','alert','alien','alley','allow','almost','alone','alpha','already',
    'alter','always','amazing','amount','amused','analyst','anchor','ancient','anger','angle',
    'animal','ankle','announce','annual','answer','antenna','antique','anxiety','apology','appear',
    'apple','approve','arctic','area','arena','argue','armor','army','around','arrange',
    'arrest','arrive','arrow','artifact','artist','aspect','assault','asset','assist','assume',
    'athlete','atom','attack','attend','attitude','attract','auction','audit','august','aunt',
    'author','autumn','average','avocado','aware','awesome','awful','awkward','axis','balance',
  ];
  if (wordCount > wordList.length) throw new Error(`wordCount exceeds word list size`);
  return [...wordList].sort(() => Math.random() - 0.5).slice(0, wordCount).join(' ');
}

async function superadminExists(db) {
  const user = await db.collection('user').findOne({
    $or: [
      { role: 'super_admin' },
      { email: (process.env.SUPERADMIN_EMAIL || 'superadmin@example.com').toLowerCase() },
    ],
  });
  return user || null;
}

// ─── Core Creation ────────────────────────────────────────────────────────────

async function createSuperAdmin({ auth, db, email, name, displayName, password, seedPhrase }) {
  const normalizedEmail = email.toLowerCase();
  const now = new Date();

  // Step 1: Use Better Auth's internal adapter to create the user.
  // This ensures the ID format, field names, and account record are
  // exactly what Better Auth expects — no manual ObjectId or schema guessing.
  const hashedPassword = await betterAuthHashPassword(password);

  const user = await auth.api.signUpEmail({
    body: {
      email: normalizedEmail,
      password,
      name,
      role: 'super_admin'
    },
    asResponse: false,
  });

  if (!user?.user?.id) {
    throw new Error('Failed to create user via Better Auth signUpEmail');
  }

  const userId = user.user.id;
  console.log(`   Created user with ID: ${userId} (${typeof userId})`);

  // Step 2: Update the user's role to super_admin directly in MongoDB.
  // signUpEmail always creates with the default role ("user").
  await db.collection('user').updateOne(
    { _id: userId },
    { $set: { role: 'super_admin', emailVerified: true, avatar: '' } }
  );

  // Step 3: Create Admin profile in our custom collection
  const admin = new Admin({
    userId,
    email: normalizedEmail,
    name,
    displayName,
    role: 'super_admin',
    isActive: true,
    isOnboarded: true,
    useSeedPhrase: true,
    createdAt: now,
    updatedAt: now,
  });
  await admin.save();

  // Step 4: Create Seedphrase in our custom collection
  const hashedSeedPhrase = await bcrypt.hash(seedPhrase, 12);
  const seedphraseDoc = new Seedphrase({
    userId,
    seedphrase: hashedSeedPhrase,
    isActive: true,
    failedAttempts: 0,
    expiresAt: new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000),
    createdAt: now,
    updatedAt: now,
  });
  await seedphraseDoc.save();

  return { success: true, userId, email: normalizedEmail, name, displayName, password, seedPhrase };
}

// ─── Verification ─────────────────────────────────────────────────────────────

async function verifySetup(db, email, password) {
  console.log('\n🔍 Verifying setup...');

  const user = await db.collection('user').findOne({ email: email.toLowerCase() });
  if (!user) return fail('User not found in DB');

  const userId = user._id?.toString?.() ?? user._id;

  const account = await db.collection('account').findOne({ userId, providerId: 'credential' });
  if (!account) return fail(`No credential account found for userId: ${userId}`);
  if (!account.password) return fail('Password hash missing from account');

  const passwordOk = await verifyPassword({ hash: account.password, password });
  if (!passwordOk) return fail('verifyPassword failed — hash mismatch');

  const admin = await Admin.findOne({ userId });
  if (!admin) return fail('Admin record not found');

  const seed = await Seedphrase.findOne({ userId });
  if (!seed) return fail('Seedphrase record not found');

  console.log('✅ All records verified:');
  console.log(`   User       → _id: ${user._id} (${typeof user._id}), role: ${user.role}`);
  console.log(`   Account    → userId: ${account.userId}, provider: ${account.providerId}`);
  console.log(`   Account    → hash: ${account.password.slice(0, 20)}...`);
  console.log(`   Password   → verifyPassword: ✓`);
  console.log(`   Admin      → active: ${admin.isActive}`);
  console.log(`   Seedphrase → active: ${seed.isActive}, expires: ${seed.expiresAt?.toDateString()}`);

  return true;
}

function fail(msg) {
  console.log(`❌ ${msg}`);
  return false;
}

// ─── Display ──────────────────────────────────────────────────────────────────

function displayCredentials(creds) {
  const line = '═'.repeat(70);
  const dash = '─'.repeat(70);
  console.log(`\n${line}`);
  console.log('🔐  SUPER ADMIN CREATED SUCCESSFULLY');
  console.log(`${line}\n`);
  console.log('📋  CREDENTIALS — SAVE THESE NOW, THEY WILL NOT BE SHOWN AGAIN:\n');
  console.log(`   📧  Email:        ${creds.email}`);
  console.log(`   👤  Name:         ${creds.name}`);
  console.log(`   🏷️   Display Name: ${creds.displayName}`);
  console.log(`   🔑  Password:     ${creds.password}`);
  console.log(`   🎫  Seed Phrase:  ${creds.seedPhrase}`);
  console.log(`\n${dash}`);
  console.log('⚠️   SECURITY NOTES:');
  console.log(`${dash}`);
  console.log('   • Store in a secure password manager immediately');
  console.log('   • Seed phrase required for every login (3-factor auth)');
  console.log('   • Change the password after first login');
  console.log('   • Seed phrase expires in 1 year');
  console.log(`${line}\n`);
}

function displayEnvHint(creds) {
  console.log('📝  Optional .env.local variables:\n');
  console.log(`   SUPERADMIN_EMAIL="${creds.email}"`);
  console.log(`   SUPERADMIN_PASSWORD="${creds.password}"`);
  console.log(`   SUPERADMIN_SEED_PHRASE="${creds.seedPhrase}"\n`);
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('\n🚀  Seeding Super Admin\n');

  const args = process.argv.slice(2);
  const flag = (name) => args.includes(name);
  const opt = (name) => args.find((a) => a.startsWith(`${name}=`))?.split('=').slice(1).join('=');

  const options = {
    force: flag('--force'),
    email: opt('--email'),
    name: opt('--name'),
    displayName: opt('--display-name'),
    password: opt('--password'),
    seedPhrase: opt('--seed'),
    wordCount: parseInt(opt('--words') || '12', 10),
  };

  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅  Connected to MongoDB');

    const db = mongoose.connection.db;
    const existing = await superadminExists(db);

    if (existing && !options.force) {
      console.log('\n⚠️   A super admin already exists:');
      console.log(`    Email: ${existing.email}, ID: ${existing._id}`);
      console.log('\n    Re-run with --force to replace it.\n');
      return;
    }

    if (existing && options.force) {
      console.log('⚠️   --force: removing existing super admin...');
      const existingId = existing._id?.toString?.() ?? existing._id;
      await Promise.all([
        db.collection('user').deleteOne({ _id: existing._id }),
        db.collection('account').deleteMany({ userId: existingId }),
        db.collection('session').deleteMany({ userId: existingId }),
        Admin.deleteOne({ userId: existingId }),
        Seedphrase.deleteOne({ userId: existingId }),
      ]);
      console.log('✅  Removed existing super admin\n');
    }

    const email = options.email || process.env.SUPERADMIN_EMAIL || 'superadmin@example.com';
    const name = options.name || 'System Super Administrator';
    const displayName = options.displayName || 'Super Admin';
    const password = options.password || generateSecurePassword(16);
    const seedPhrase = options.seedPhrase || generateSeedPhrase(options.wordCount);

    if (!email.includes('@')) throw new Error(`Invalid email: ${email}`);
    if (password.length < 12) throw new Error('Password must be at least 12 characters');
    if (seedPhrase.trim().split(/\s+/).length < 12) throw new Error('Seed phrase must have at least 12 words');

    // Bootstrap Better Auth with the live connection
    const auth = createAuth(db);

    const result = await createSuperAdmin({ auth, db, email, name, displayName, password, seedPhrase });

    displayCredentials(result);
    displayEnvHint(result);

    await verifySetup(db, email, password);

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    console.log(`\n🔗  Login at: ${baseUrl}/admin/login`);
    console.log('✅  Done!\n');
  } catch (error) {
    console.error('\n❌  Seeding failed:', error.message);
    if (process.env.DEBUG) console.error(error.stack);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

if (require.main === module) {
  main();
}

module.exports = { createSuperAdmin, superadminExists, generateSeedPhrase, generateSecurePassword };