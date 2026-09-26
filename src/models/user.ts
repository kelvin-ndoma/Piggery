import { Schema, model, models, type Model, type Types } from "mongoose";
import { ROLES, type Role } from "@/types/domain";

export type Membership = {
  farmId: Types.ObjectId;
  role: Role;
  status: "ACTIVE" | "DISABLED";
};

export type UserDoc = {
  _id: Types.ObjectId;
  name: string;
  email: string;
  passwordHash: string;
  phone?: string;
  isActive: boolean;
  activeFarmId?: Types.ObjectId | null;
  memberships: Membership[];
  createdAt: Date;
  updatedAt: Date;
};

const membershipSchema = new Schema<Membership>(
  {
    farmId: { type: Schema.Types.ObjectId, ref: "Farm", required: true },
    role: { type: String, enum: ROLES, required: true },
    status: { type: String, enum: ["ACTIVE", "DISABLED"], default: "ACTIVE" },
  },
  { _id: false },
);

const userSchema = new Schema<UserDoc>(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    phone: { type: String, trim: true },
    isActive: { type: Boolean, default: true },
    activeFarmId: { type: Schema.Types.ObjectId, ref: "Farm" },
    memberships: { type: [membershipSchema], default: [] },
  },
  { timestamps: true },
);

userSchema.index({ "memberships.farmId": 1 });

export const User: Model<UserDoc> = (models.User as Model<UserDoc> | undefined) ?? model<UserDoc>("User", userSchema);
