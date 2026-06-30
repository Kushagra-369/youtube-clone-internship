import mongoose, { Document, Schema } from "mongoose";

export interface IChannel extends Document {
  ownerId: mongoose.Types.ObjectId;
  channelName: string;
  description: string;
  bannerUrl: string;
  subscribers: number;
  subscribedBy: string[];
  createdAt: Date;
  updatedAt: Date;
}

const channelSchema = new Schema<IChannel>(
  {
    ownerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    channelName: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: "",
    },
    bannerUrl: {
      type: String,
      default: "",
    },
    subscribers: {
      type: Number,
      default: 0,
    },
    subscribedBy: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
channelSchema.index({ subscribers: -1 });

const Channel = mongoose.model<IChannel>("Channel", channelSchema);
export default Channel;