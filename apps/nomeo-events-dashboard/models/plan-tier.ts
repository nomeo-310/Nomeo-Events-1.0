import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IPlanTier {
  name: string;
  slug: string;
  description?: string;
  sortOrder: number;
  isActive: boolean;
}

export interface IPlanTierDocument extends IPlanTier, Document {}

// Important: Same pattern as your Plan model
interface IPlanTierModel extends Model<IPlanTierDocument> {}

// Schema
const PlanTierSchema = new Schema<IPlanTierDocument>(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    description: { type: String },
    sortOrder: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

// Pre-save hook
PlanTierSchema.pre('save', function () {
  if (!this.slug && this.name) {
    this.slug = this.name.toLowerCase().replace(/\s+/g, '-');
  }
});

// Export - Using the EXACT same pattern as your working Plan model
export const PlanTier = (mongoose.models.PlanTier as IPlanTierModel) ||
  mongoose.model<IPlanTierDocument, IPlanTierModel>('PlanTier', PlanTierSchema);