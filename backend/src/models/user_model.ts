import mongoose, { Document, Schema } from "mongoose";

export interface IUser extends Document {
  name: string;
  email: string;

  plan: "free" | "premium";

  downloadCount: number;
  lastDownloadDate: Date | null;

  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },

    plan: {
      type: String,
      enum: ["free", "premium"],
      default: "free",
    },

    downloadCount: {
      type: Number,
      default: 0,
    },

    lastDownloadDate: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

const User = mongoose.model<IUser>(
  "User",
  userSchema
);

export default User;