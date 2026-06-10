import mongoose, { Document, Schema } from "mongoose";

export interface IComment extends Document {
    text: string;
    city: string;
    likes: number;
    dislikes: number;
    createdAt: Date;
    updatedAt: Date;
    likedBy: string[];
    dislikedBy: string[];
}

const commentSchema = new Schema<IComment>(
    {
        text: {
            type: String,
            required: true,
            trim: true,
        },

        city: {
            type: String,
            required: true,
            trim: true,
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
    },
    {
        timestamps: true,
    }
);

const Comment = mongoose.model<IComment>("Comment", commentSchema);

export default Comment;