import mongoose, { Document, Schema } from "mongoose";

export interface IVideo extends Document {
  title: string;
  description: string;

  videoUrl: string;
  thumbnailUrl: string;

  duration: number;

  views: number;

  uploadedBy: string;

  createdAt: Date;
  updatedAt: Date;
  likes: number;
  dislikes: number;

  likedBy: string[];
  dislikedBy: string[];
}

const videoSchema = new Schema<IVideo>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      default: "",
      trim: true,
    },

    videoUrl: {
      type: String,
      required: true,
    },

    thumbnailUrl: {
      type: String,
      required: true,
    },

    duration: {
      type: Number,
      default: 0,
    },

    views: {
      type: Number,
      default: 0,
    },
    likes: {
      type: Number,
      default: 0,
    },

    dislikes: {
      type: Number,
      default: 0,
    },

    likedBy: {
      type: [String],
      default: [],
    },

    dislikedBy: {
      type: [String],
      default: [],
    },

    uploadedBy: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const Video = mongoose.model<IVideo>(
  "Video",
  videoSchema
);

export default Video;