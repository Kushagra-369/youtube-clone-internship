import mongoose, { Document, Schema } from "mongoose";

export interface IUser extends Document {
    name: string;
    email: string;
    phone?: string;
    state?: string;
    plan: string;
    watchPlan: string;
    downloadCount: number;
    lastDownloadDate: Date;
    otp?: string;
    otpExpiry?: Date | null;
    totalWatchTime: number;        // Track total watch time in seconds
    lastWatchDate: Date;           // Track last watch date to reset daily
    createdAt: Date;
    updatedAt: Date;
    isOtpVerified: boolean;
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
        phone: {
            type: String,
            trim: true,
        },
        state: {
            type: String,
            trim: true,
        },
        plan: {
            type: String,
            enum: ["free", "premium"],
            default: "free",
        },
        watchPlan: {
            type: String,
            enum: ["free", "bronze", "silver", "gold"],
            default: "free",
        },
        downloadCount: {
            type: Number,
            default: 0,
        },
        lastDownloadDate: {
            type: Date,
            default: Date.now,
        },
        otp: {
            type: String,
        },
        otpExpiry: {
            type: Date,
            default: null
        },
        isOtpVerified: {
            type: Boolean,
            default: false,
        },
        totalWatchTime: {
            type: Number,
            default: 0,
        },
        lastWatchDate: {
            type: Date,
            default: Date.now,
        },
    },
    {
        timestamps: true,
    }
);

const User = mongoose.model<IUser>("User", userSchema);
export default User;