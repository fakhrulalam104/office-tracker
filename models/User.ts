import { Schema, models, model } from "mongoose";

const UserSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },
    password: {
      type: String,
      required: true
    },
    role: {
      type: String,
      enum: ["super_admin", "owner", "admin", "manager", "hr", "coordinator", "member"],
      default: "member"
    },
    designation: {
      type: String,
      default: "User",
      trim: true
    },
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: "Organization",
      index: true
    },
    active: {
      type: Boolean,
      default: true
    },
    phone: {
      type: String,
      default: "",
      trim: true
    },
    jobTitle: {
      type: String,
      default: "",
      trim: true
    },
    department: {
      type: String,
      default: "",
      trim: true
    },
    employeeCode: {
      type: String,
      default: "",
      trim: true
    },
    location: {
      type: String,
      default: "",
      trim: true
    },
    bio: {
      type: String,
      default: "",
      trim: true
    },
    emergencyContactName: {
      type: String,
      default: "",
      trim: true
    },
    emergencyContactPhone: {
      type: String,
      default: "",
      trim: true
    },
    socialLinks: {
      type: Schema.Types.Mixed,
      default: {}
    }
  },
  {
    timestamps: { createdAt: true, updatedAt: false }
  }
);

export const User = models.User || model("User", UserSchema);
