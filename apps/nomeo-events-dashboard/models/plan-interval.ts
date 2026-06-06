import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IPlanInterval {
  name: string;           // "Monthly", "Quarterly", "Yearly"
  slug: string;           // "monthly", "quarterly", "yearly"
  monthsCount: number;    // 1, 3, 12
  multiplier: number;     // 1, 2.7, 9.6
  sortOrder: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IPlanIntervalDocument extends IPlanInterval, Document {}

const PlanIntervalSchema = new Schema<IPlanIntervalDocument>(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    monthsCount: { type: Number, required: true, min: 0 },
    multiplier: { type: Number, required: true, min: 0, default: 1 },
    sortOrder: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

PlanIntervalSchema.pre('save', function() {
  if (!this.slug && this.name) {
    this.slug = this.name.toLowerCase().replace(/\s+/g, '-');
  }
});

export const PlanInterval = (mongoose.models.PlanInterval as Model<IPlanIntervalDocument>) ||
  mongoose.model<IPlanIntervalDocument>('PlanInterval', PlanIntervalSchema);