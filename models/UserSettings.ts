import { Schema, models, model, type Types } from "mongoose";
import type { UserSettings as UserSettingsShape } from "@/types";

const UserSettingsSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true
    },
    weeklyHolidays: {
      type: [Number],
      default: [0]
    },
    lunchPrice: {
      type: Number,
      default: 90,
      min: 0
    },
    delayLimit: {
      type: Number,
      default: 150,
      min: 1
    },
    currency: {
      type: String,
      default: "BDT",
      trim: true
    },
    reminderEnabled: {
      type: Boolean,
      default: false
    },
    reminderTime: {
      type: String,
      default: "18:00"
    }
  },
  {
    timestamps: true
  }
);

export type UserSettingsDocument = UserSettingsShape & {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};

export const UserSettings = models.UserSettings || model("UserSettings", UserSettingsSchema);
