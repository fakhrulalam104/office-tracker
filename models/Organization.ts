import { Schema, models, model, type Types } from "mongoose";

const OrganizationSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    ownerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      index: true
    },
    plan: {
      type: String,
      enum: ["trial", "starter", "team", "enterprise"],
      default: "trial"
    }
  },
  {
    timestamps: true
  }
);

export type OrganizationDocument = {
  _id: Types.ObjectId;
  name: string;
  ownerId?: Types.ObjectId;
  plan: "trial" | "starter" | "team" | "enterprise";
  createdAt: Date;
  updatedAt: Date;
};

export const Organization = models.Organization || model("Organization", OrganizationSchema);
