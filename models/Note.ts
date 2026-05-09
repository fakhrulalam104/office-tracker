import { Schema, models, model, type Types } from "mongoose";

const NoteSchema = new Schema(
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
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 160
    },
    body: {
      type: String,
      default: "",
      maxlength: 100000
    },
    tags: {
      type: [String],
      default: []
    },
    pinned: {
      type: Boolean,
      default: false
    },
    archived: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

NoteSchema.index({ userId: 1, updatedAt: -1 });

export type NoteDocument = {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  organizationId?: Types.ObjectId;
  title: string;
  body: string;
  tags: string[];
  pinned: boolean;
  archived: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export const Note = models.Note || model("Note", NoteSchema);
