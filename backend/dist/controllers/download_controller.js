"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDownloads = exports.downloadVideo = void 0;
const user_model_1 = __importDefault(require("../models/user_model"));
const video_model_1 = __importDefault(require("../models/video_model"));
const download_model_1 = __importDefault(require("../models/download_model"));
const downloadVideo = async (req, res) => {
    try {
        const { userId, videoId } = req.body;
        if (!userId || !videoId) {
            res.status(400).json({
                success: false,
                message: "userId and videoId are required",
            });
            return;
        }
        const user = await user_model_1.default.findById(userId);
        if (!user) {
            res.status(404).json({
                success: false,
                message: "User not found",
            });
            return;
        }
        const video = await video_model_1.default.findById(videoId);
        if (!video) {
            res.status(404).json({
                success: false,
                message: "Video not found",
            });
            return;
        }
        // Prevent duplicate download entries
        const existingDownload = await download_model_1.default.findOne({
            userId,
            videoId,
        });
        if (existingDownload) {
            res.status(400).json({
                success: false,
                message: "Video already downloaded",
            });
            return;
        }
        // Premium User
        if (user.plan === "premium") {
            const download = await download_model_1.default.create({
                userId,
                videoId,
            });
            res.status(200).json({
                success: true,
                message: "Video downloaded successfully",
                videoUrl: video.videoUrl,
                data: download,
            });
            return;
        }
        // Free User Logic
        const today = new Date();
        const isSameDay = user.lastDownloadDate &&
            new Date(user.lastDownloadDate).toDateString() ===
                today.toDateString();
        if (!isSameDay) {
            user.downloadCount = 0;
        }
        if (user.downloadCount >= 1) {
            res.status(403).json({
                success: false,
                message: "Free users can download only 1 video per day. Upgrade to Premium.",
            });
            return;
        }
        user.downloadCount += 1;
        user.lastDownloadDate = today;
        await user.save();
        const download = await download_model_1.default.create({
            userId,
            videoId,
        });
        res.status(200).json({
            success: true,
            message: "Video downloaded successfully",
            videoUrl: video.videoUrl,
            data: download,
        });
    }
    catch (error) {
        console.error("Download Error:", error);
        res.status(500).json({
            success: false,
            message: "Internal Server Error",
        });
    }
};
exports.downloadVideo = downloadVideo;
const getDownloads = async (req, res) => {
    try {
        const { userId } = req.params;
        if (!userId) {
            res.status(400).json({
                success: false,
                message: "userId is required",
            });
            return;
        }
        const downloads = await download_model_1.default.find({
            userId,
        })
            .populate("videoId")
            .sort({
            createdAt: -1,
        });
        res.status(200).json({
            success: true,
            data: downloads,
        });
    }
    catch (error) {
        console.error("Get Downloads Error:", error);
        res.status(500).json({
            success: false,
            message: "Internal Server Error",
        });
    }
};
exports.getDownloads = getDownloads;
//# sourceMappingURL=download_controller.js.map