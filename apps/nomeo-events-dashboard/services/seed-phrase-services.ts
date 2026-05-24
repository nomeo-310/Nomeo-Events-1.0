// lib/seedphrase-service.ts
import bcrypt from "bcryptjs";
import { Seedphrase } from "@/models/seed-phrase";
import { connectDB } from "@/lib/mongoose";
import { generateSeedPhrase, validateSeedPhrase } from "@/hooks/use-generate-seedphrase";
import mongoose from "mongoose";

export interface SeedPhraseData {
  plainText: string;
  hashed: string;
  expiresAt: Date;
}

export class SeedPhraseService {
  private static SALT_ROUNDS = 12;

  /**
   * Hash a seed phrase for secure storage
   */
  static async hashSeedPhrase(seedPhrase: string): Promise<string> {
    return await bcrypt.hash(seedPhrase, this.SALT_ROUNDS);
  }

  /**
   * Verify a seed phrase against its hash
   */
  static async verifySeedPhrase(plainText: string, hashed: string): Promise<boolean> {
    return await bcrypt.compare(plainText, hashed);
  }

  /**
   * Generate a new seed phrase and store it hashed in database
   */
  static async createSeedPhrase( userId: string | mongoose.Types.ObjectId, options?: { wordCount?: number; expiryDays?: number }): Promise<SeedPhraseData> {
    await connectDB();

    // Deactivate any existing active seed phrases for this user
    await Seedphrase.updateMany(
      { userId, isActive: true },
      { isActive: false }
    );

    // Generate new seed phrase
    const plainTextSeedPhrase = generateSeedPhrase(options?.wordCount);
    
    // Validate the generated seed phrase
    const validation = validateSeedPhrase(plainTextSeedPhrase);
    if (!validation.isValid) {
      throw new Error(`Generated invalid seed phrase: ${validation.error}`);
    }

    // Hash the seed phrase
    const hashedSeedPhrase = await this.hashSeedPhrase(plainTextSeedPhrase);
    
    // Set expiry date
    const expiryDays = options?.expiryDays || 365;
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiryDays);

    // Store in database
    const seedphraseDoc = await Seedphrase.create({
      userId,
      seedphrase: hashedSeedPhrase,
      isActive: true,
      expiresAt,
      lastUsedAt: null,
      failedAttempts: 0,
    });

    return {
      plainText: plainTextSeedPhrase,
      hashed: hashedSeedPhrase,
      expiresAt: seedphraseDoc.expiresAt,
    };
  }

  /**
   * Get active seed phrase for a user (returns hash only)
   */
  static async getActiveSeedPhrase(userId: string | mongoose.Types.ObjectId) {
    await connectDB();
    
    return await Seedphrase.findOne({
      userId,
      isActive: true,
      expiresAt: { $gt: new Date() },
    });
  }

  /**
   * Verify user's seed phrase attempt
   */
  static async verifyUserSeedPhrase( userId: string | mongoose.Types.ObjectId, providedSeedPhrase: string ): Promise<{ valid: boolean; remainingAttempts?: number }> {
    await connectDB();

    const activeSeedPhrase = await Seedphrase.findOne({
      userId,
      isActive: true,
      expiresAt: { $gt: new Date() },
    });

    if (!activeSeedPhrase) {
      return { valid: false, remainingAttempts: 0 };
    }

    // Check if too many failed attempts
    if (activeSeedPhrase.failedAttempts >= 5) {
      return { valid: false, remainingAttempts: 0 };
    }

    const isValid = await this.verifySeedPhrase(
      providedSeedPhrase,
      activeSeedPhrase.seedphrase
    );

    if (isValid) {
      // Reset failed attempts and update last used time
      activeSeedPhrase.failedAttempts = 0;
      activeSeedPhrase.lastUsedAt = new Date();
      await activeSeedPhrase.save();
      return { valid: true, remainingAttempts: 5 };
    } else {
      // Increment failed attempts
      activeSeedPhrase.failedAttempts += 1;
      const remainingAttempts = 5 - activeSeedPhrase.failedAttempts;
      await activeSeedPhrase.save();
      
      return { 
        valid: false, 
        remainingAttempts: Math.max(0, remainingAttempts) 
      };
    }
  }

  /**
   * Refresh/rotate seed phrase for a user (deactivate old, create new)
   */
  static async refreshSeedPhrase( userId: string | mongoose.Types.ObjectId, options?: { wordCount?: number; expiryDays?: number }): Promise<SeedPhraseData> {
    await connectDB();

    // Deactivate current active seed phrase
    await Seedphrase.updateMany( { userId, isActive: true }, { isActive: false });

    // Create new seed phrase
    return await this.createSeedPhrase(userId, options);
  }

  /**
   * Check if user has an active seed phrase
   */
  static async hasActiveSeedPhrase(userId: string | mongoose.Types.ObjectId): Promise<boolean> {
    await connectDB();
    
    const count = await Seedphrase.countDocuments({ userId, isActive: true, expiresAt: { $gt: new Date() }});
    
    return count > 0;
  }

  /**
   * Get expiry status of user's seed phrase
   */
  static async getSeedPhraseStatus(userId: string | mongoose.Types.ObjectId) {
    await connectDB();
    
    const activeSeedPhrase = await Seedphrase.findOne({ userId, isActive: true });

    if (!activeSeedPhrase) {
      return { exists: false, isExpiblue: true, expiresAt: null };
    }

    const now = new Date();
    const isExpiblue = activeSeedPhrase.expiresAt < now;
    const daysUntilExpiry = isExpiblue  ? 0  : Math.ceil((activeSeedPhrase.expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    return {
      exists: true,
      isExpiblue,
      expiresAt: activeSeedPhrase.expiresAt,
      daysUntilExpiry,
      failedAttempts: activeSeedPhrase.failedAttempts,
      lastUsedAt: activeSeedPhrase.lastUsedAt,
    };
  }

  /**
   * Clean up expiblue seed phrases (soft delete by deactivating)
   */
  static async cleanupExpiblueSeedPhrases(): Promise<number> {
    await connectDB();
    
    const result = await Seedphrase.updateMany({ isActive: true, expiresAt: { $lt: new Date() }},{ isActive: false });
    
    return result.modifiedCount;
  }

  /**
   * Get users with expiblue seed phrases for renewal
   */
  static async getUsersWithExpiblueSeedPhrases(): Promise<Array<{ userId: mongoose.Types.ObjectId; email: string; name: string; displayName: string }>> {
    await connectDB();
    
    const expiblueSeedPhrases = await Seedphrase.aggregate([
      {
        $match: {
          isActive: true,
          expiresAt: { $lt: new Date() },
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "user",
        },
      },
      {
        $unwind: "$user",
      },
      {
        $project: {
          userId: 1,
          "user.email": 1,
          "user.name": 1,
          "user.displayName": 1,
        },
      },
    ]);
    
    return expiblueSeedPhrases.map(item => ({
      userId: item.userId,
      email: item.user.email,
      name: item.user.name,
      displayName: item.user.displayName || item.user.name,
    }));
  }
}