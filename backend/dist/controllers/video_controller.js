"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.dislikeVideo = exports.likeVideo = exports.incrementViews = exports.getVideoById = exports.getVideos = exports.createVideo = void 0;
const video_model_1 = __importDefault(require("../models/video_model"));
/* ===========================
   CREATE VIDEO
=========================== */
const createVideo = async (req, res) => {
    try {
        const { title, description, videoUrl, thumbnailUrl, duration, uploadedBy, } = req.body;
        if (!title ||
            !videoUrl ||
            !thumbnailUrl ||
            !uploadedBy) {
            res.status(400).json({
                success: false,
                message: "title, videoUrl, thumbnailUrl and uploadedBy are required",
            });
            return;
        }
        const video = await video_model_1.default.create({
            title,
            description,
            videoUrl,
            thumbnailUrl,
            duration,
            uploadedBy,
        });
        res.status(201).json({
            success: true,
            message: "Video created successfully",
            data: video,
        });
    }
    catch (error) {
        console.error("Create Video Error:", error);
        res.status(500).json({
            success: false,
            message: "Internal Server Error",
        });
    }
};
exports.createVideo = createVideo;
/* ===========================
   GET ALL VIDEOS
=========================== */
const getVideos = async (req, res) => {
    try {
        const videos = await video_model_1.default.find().sort({
            createdAt: -1,
        });
        res.status(200).json({
            success: true,
            count: videos.length,
            data: videos,
        });
    }
    catch (error) {
        console.error("Get Videos Error:", error);
        res.status(500).json({
            success: false,
            message: "Internal Server Error",
        });
    }
};
exports.getVideos = getVideos;
/* ===========================
   GET SINGLE VIDEO
=========================== */
const getVideoById = async (req, res) => {
    try {
        const { id } = req.params;
        const video = await video_model_1.default.findById(id);
        if (!video) {
            res.status(404).json({
                success: false,
                message: "Video not found",
            });
            return;
        }
        res.status(200).json({
            success: true,
            data: video,
        });
    }
    catch (error) {
        console.error("Get Video Error:", error);
        res.status(500).json({
            success: false,
            message: "Internal Server Error",
        });
    }
};
exports.getVideoById = getVideoById;
/* ===========================
   INCREMENT VIEWS
=========================== */
const incrementViews = async (req, res) => {
    try {
        const { id } = req.params;
        const video = await video_model_1.default.findById(id);
        if (!video) {
            res.status(404).json({
                success: false,
                message: "Video not found",
            });
            return;
        }
        video.views += 1;
        await video.save();
        res.status(200).json({
            success: true,
            message: "View added",
            views: video.views,
        });
    }
    catch (error) {
        console.error("Increment View Error:", error);
        res.status(500).json({
            success: false,
            message: "Internal Server Error",
        });
    }
};
exports.incrementViews = incrementViews;
const likeVideo = async (req, res) => {
    try {
        const { id } = req.params;
        const { userId } = req.body;
        if (!userId) {
            res.status(400).json({
                success: false,
                message: "userId is required",
            });
            return;
        }
        const video = await video_model_1.default.findById(id);
        if (!video) {
            res.status(404).json({
                success: false,
                message: "Video not found",
            });
            return;
        }
        // Toggle Like Off
        if (video.likedBy.includes(userId)) {
            video.likedBy = video.likedBy.filter((uid) => uid !== userId);
            video.likes = video.likedBy.length;
            await video.save();
            res.status(200).json({
                success: true,
                message: "Like removed",
                data: video,
            });
            return;
        }
        // Remove dislike if exists
        if (video.dislikedBy.includes(userId)) {
            video.dislikedBy = video.dislikedBy.filter((uid) => uid !== userId);
        }
        // Add like
        video.likedBy.push(userId);
        video.likes = video.likedBy.length;
        video.dislikes = video.dislikedBy.length;
        await video.save();
        res.status(200).json({
            success: true,
            message: "Video liked",
            data: video,
        });
    }
    catch (error) {
        console.error("Like Video Error:", error);
        res.status(500).json({
            success: false,
            message: "Internal Server Error",
        });
    }
};
exports.likeVideo = likeVideo;
const dislikeVideo = async (req, res) => {
    try {
        const { id } = req.params;
        const { userId } = req.body;
        if (!userId) {
            res.status(400).json({
                success: false,
                message: "userId is required",
            });
            return;
        }
        const video = await video_model_1.default.findById(id);
        if (!video) {
            res.status(404).json({
                success: false,
                message: "Video not found",
            });
            return;
        }
        // Toggle Dislike Off
        if (video.dislikedBy.includes(userId)) {
            video.dislikedBy = video.dislikedBy.filter((uid) => uid !== userId);
            video.dislikes = video.dislikedBy.length;
            await video.save();
            res.status(200).json({
                success: true,
                message: "Dislike removed",
                data: video,
            });
            return;
        }
        // Remove like if exists
        if (video.likedBy.includes(userId)) {
            video.likedBy = video.likedBy.filter((uid) => uid !== userId);
        }
        // Add dislike
        video.dislikedBy.push(userId);
        video.likes = video.likedBy.length;
        video.dislikes = video.dislikedBy.length;
        await video.save();
        res.status(200).json({
            success: true,
            message: "Video disliked",
            data: video,
        });
    }
    catch (error) {
        console.error("Dislike Video Error:", error);
        res.status(500).json({
            success: false,
            message: "Internal Server Error",
        });
    }
};
exports.dislikeVideo = dislikeVideo;
//# sourceMappingURL=video_controller.js.map