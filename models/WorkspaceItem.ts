import { Schema, models, model, type Types } from "mongoose";

export const workspaceItemTypes = [
  "leave",
  "task",
  "announcement",
  "asset",
  "document",
  "project",
  "ticket",
  "calendar"
] as const;

const WorkspaceItemSchema = new Schema(
  {
    type: {
      type: String,
      enum: workspaceItemTypes,
      required: true,
      index: true
    },
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: "Organization",
      index: true
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    assigneeId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      index: true
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 180
    },
    description: {
      type: String,
      default: "",
      maxlength: 12000
    },
    status: {
      type: String,
      default: "open",
      trim: true,
      maxlength: 40,
      index: true
    },
    priority: {
      type: String,
      default: "normal",
      trim: true,
      maxlength: 40
    },
    startDate: {
      type: Date
    },
    dueDate: {
      type: Date
    },
    amount: {
      type: Number,
      default: 0
    },
    tags: {
      type: [String],
      default: []
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {}
    }
  },
  {
    timestamps: true
  }
);

WorkspaceItemSchema.index({ organizationId: 1, type: 1, updatedAt: -1 });
WorkspaceItemSchema.index({ createdBy: 1, type: 1, updatedAt: -1 });

export type WorkspaceItemDocument = {
  _id: Types.ObjectId;
  type: (typeof workspaceItemTypes)[number];
  organizationId?: Types.ObjectId;
  createdBy: Types.ObjectId;
  assigneeId?: Types.ObjectId;
  title: string;
  description: string;
  status: string;
  priority: string;
  startDate?: Date;
  dueDate?: Date;
  amount: number;
  tags: string[];
  metadata: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
};

export const WorkspaceItem = models.WorkspaceItem || model("WorkspaceItem", WorkspaceItemSchema);
