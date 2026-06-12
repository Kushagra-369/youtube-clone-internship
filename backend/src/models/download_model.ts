import mongoose, { Document, Schema } from "mongoose";

export interface IDownload extends Document {
  userId: mongoose.Types.ObjectId;
  videoId: mongoose.Types.ObjectId;

  downloadedAt: Date;

  createdAt: Date;
  updatedAt: Date;
}

const downloadSchema = new Schema<IDownload>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    videoId: {
      type: Schema.Types.ObjectId,
      ref: "Video",
      required: true,
    },

    downloadedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

const Download = mongoose.model<IDownload>(
  "Download",
  downloadSchema
);

export default Download;