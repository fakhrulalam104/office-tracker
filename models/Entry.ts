import { Schema, models, model, type Types } from "mongoose";
import { DAY_STATUSES } from "@/lib/utils";
import type { DailyExpenseItem, DayStatus, LeaveType } from "@/types";

const leaveTypeSchema = {
  type: String,
  enum: ["regular", "adjustment"],
  default: "regular"
};

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
    leaveType: leaveTypeSchema,
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
  leaveType: LeaveType;
  comment: string;
  dailyExpenseAmount: number;
  dailyExpenseNote: string;
  dailyExpenses: DailyExpenseItem[];
  createdAt: Date;
  updatedAt: Date;
};

const existingEntryModel = models.Entry;

if (existingEntryModel && !existingEntryModel.schema.path("leaveType")) {
  existingEntryModel.schema.add({ leaveType: leaveTypeSchema });
}

export const Entry = existingEntryModel || model("Entry", EntrySchema);
