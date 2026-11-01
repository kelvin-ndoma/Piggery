import { Schema, model, models, type Model, type Types } from "mongoose";

export type RateLimitDoc = {
  _id: Types.ObjectId;
  key: string;
  count: number;
  reset: Date;
};

const rateLimitSchema = new Schema<RateLimitDoc>({
  key: { type: String, required: true, unique: true },
  count: { type: Number, required: true, min: 0 },
  reset: { type: Date, required: true },
});

rateLimitSchema.index({ reset: 1 }, { expireAfterSeconds: 0 });

export const RateLimitBucket: Model<RateLimitDoc> =
  models.RateLimitBucket ?? model<RateLimitDoc>("RateLimitBucket", rateLimitSchema);
