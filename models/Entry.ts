import { Schema, models, model, type Types } from "mongoose";
import { DAY_STATUSES } from "@/lib/utils";
import type { DailyExpenseItem, DayStatus } from "@/types";

const EntrySchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    date: {
      type: String,
      required: true,
      index: true
    },
    delayMinutes: {
      type: Number,
      default: 0,
      min: 0
    },
    hadLunch: {
      type: Boolean,
      default: false
    },
    dayStatus: {
      type: String,
      enum: DAY_STATUSES,
      default: "work"
    },
    comment: {
      type: String,
      default: ""
    },
    dailyExpenseAmount: {
      type: Number,
      default: 0,
      min: 0
    },
    dailyExpenseNote: {
      type: String,
      default: ""
    },
    dailyExpenses: {
      type: [
        {
          id: {
            type: String,
            required: true
          },
          amount: {
            type: Number,
            default: 0,
            min: 0
          },
          category: {
            type: String,
            enum: ["transport", "food", "supplies", "personal", "other"],
            default: "other"
          },
          note: {
            type: String,
            default: ""
          }
        }
      ],
      default: []
    }
  },
  {
    timestamps: true
  }
);

EntrySchema.index({ userId: 1, date: 1 }, { unique: true });

export type EntryDocument = {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  date: string;
  delayMinutes: number;
  hadLunch: boolean;
  dayStatus: DayStatus;
  comment: string;
  dailyExpenseAmount: number;
  dailyExpenseNote: string;
  dailyExpenses: DailyExpenseItem[];
  createdAt: Date;
  updatedAt: Date;
};

export const Entry = models.Entry || model("Entry", EntrySchema);
