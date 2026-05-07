import { Schema, models, model, type Types } from "mongoose";

const ApprovalRequestSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: "Organization",
      index: true
    },
    type: {
      type: String,
      enum: ["leave", "expense", "correction"],
      required: true
    },
    date: {
      type: String,
      required: true,
      index: true
    },
    title: {
      type: String,
      required: true,
      trim: true
    },
    amount: {
      type: Number,
      default: 0,
      min: 0
    },
    note: {
      type: String,
      default: ""
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
      index: true
    },
    reviewedBy: {
      type: Schema.Types.ObjectId,
      ref: "User"
    },
    reviewedAt: {
      type: Date
    },
    reviewNote: {
      type: String,
      default: ""
    }
  },
  {
    timestamps: true
  }
);

export type ApprovalRequestDocument = {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  organizationId?: Types.ObjectId;
  type: "leave" | "expense" | "correction";
  date: string;
  title: string;
  amount: number;
  note: string;
  status: "pending" | "approved" | "rejected";
  reviewedBy?: Types.ObjectId;
  reviewedAt?: Date;
  reviewNote: string;
  createdAt: Date;
  updatedAt: Date;
};

export const ApprovalRequest = models.ApprovalRequest || model("ApprovalRequest", ApprovalRequestSchema);
