"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.translateComment = exports.dislikeComment = exports.likeComment = exports.getComments = exports.createComment = void 0;
const comment_model_1 = __importDefault(require("../models/comment_model"));
const user_model_1 = __importDefault(require("../models/user_model"));
const google_translate_api_x_1 = require("google-translate-api-x");
// Create Comment
const createComment = async (req, res) => {
    try {
        const { text, city, userId, videoId } = req.body; // Accept userId AND videoId
        // Validate required fields
        if (!text || !city || !userId || !videoId) {
            res.status(400).json({
                success: false,
                message: "Text, city, userId, and videoId are required",
            });
            return;
        }
        // Special Character Validation
        const specialCharRegex = /[<>{}[\]\\$%^*_=+|~`]/;
        if (specialCharRegex.test(text)) {
            res.status(400).json({
                success: false,
                message: "Special characters are not allowed",
            });
            return;
        }
        // Find the user to get the name
        const user = await user_model_1.default.findById(userId);
        if (!user) {
            res.status(404).json({
                success: false,
                message: "User not found",
            });
            return;
        }
        const comment = await comment_model_1.default.create({
            text,
            city,
            userId,
            userName: user.name, // Store the user's name
            videoId, // Store the video ID
        });
        res.status(201).json({
            success: true,
            message: "Comment created successfully",
            data: comment,
        });
    }
    catch (error) {
        console.error("Create Comment Error:", error);
        res.status(500).json({
            success: false,
            message: "Internal Server Error",
        });
    }
};
exports.createComment = createComment;
// Get Comments (filtered by videoId)
const getComments = async (req, res) => {
    try {
        const { videoId } = req.query;
        // Build query
        const query = {};
        if (videoId) {
            query.videoId = videoId;
        }
        const comments = await comment_model_1.default.find(query)
            .sort({ createdAt: -1 });
        res.status(200).json({
            success: true,
            count: comments.length,
            data: comments,
        });
    }
    catch (error) {
        console.error("Get Comments Error:", error);
        res.status(500).json({
            success: false,
            message: "Internal Server Error",
        });
    }
};
exports.getComments = getComments;
// Like Comment
const likeComment = async (req, res) => {
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
        const comment = await comment_model_1.default.findById(id);
        if (!comment) {
            res.status(404).json({
                success: false,
                message: "Comment not found",
            });
            return;
        }
        // Already liked -> Toggle Off
        if (comment.likedBy.includes(userId)) {
            comment.likedBy = comment.likedBy.filter((uid) => uid !== userId);
            comment.likes = comment.likedBy.length;
            await comment.save();
            res.status(200).json({
                success: true,
                message: "Like removed",
                data: comment,
            });
            return;
        }
        // Previously disliked -> remove dislike first
        if (comment.dislikedBy.includes(userId)) {
            comment.dislikedBy = comment.dislikedBy.filter((uid) => uid !== userId);
        }
        // Add Like
        comment.likedBy.push(userId);
        // Sync counts from arrays
        comment.likes = comment.likedBy.length;
        comment.dislikes = comment.dislikedBy.length;
        await comment.save();
        res.status(200).json({
            success: true,
            message: "Comment liked",
            data: comment,
        });
    }
    catch (error) {
        console.error("Like Comment Error:", error);
        res.status(500).json({
            success: false,
            message: "Internal Server Error",
        });
    }
};
exports.likeComment = likeComment;
// Dislike Comment
const dislikeComment = async (req, res) => {
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
        const comment = await comment_model_1.default.findById(id);
        if (!comment) {
            res.status(404).json({
                success: false,
                message: "Comment not found",
            });
            return;
        }
        // Already disliked -> Toggle Off
        if (comment.dislikedBy.includes(userId)) {
            comment.dislikedBy = comment.dislikedBy.filter((uid) => uid !== userId);
            comment.dislikes = comment.dislikedBy.length;
            await comment.save();
            res.status(200).json({
                success: true,
                message: "Dislike removed",
                data: comment,
            });
            return;
        }
        // Previously liked -> remove like first
        if (comment.likedBy.includes(userId)) {
            comment.likedBy = comment.likedBy.filter((uid) => uid !== userId);
        }
        // Add Dislike
        comment.dislikedBy.push(userId);
        // Sync counts from arrays
        comment.likes = comment.likedBy.length;
        comment.dislikes = comment.dislikedBy.length;
        // Internship Requirement: Delete comment if it receives 2 dislikes
        if (comment.dislikes >= 2) {
            await comment_model_1.default.findByIdAndDelete(id);
            res.status(200).json({
                success: true,
                message: "Comment removed after receiving 2 dislikes",
            });
            return;
        }
        await comment.save();
        res.status(200).json({
            success: true,
            message: "Comment disliked",
            data: comment,
        });
    }
    catch (error) {
        console.error("Dislike Comment Error:", error);
        res.status(500).json({
            success: false,
            message: "Internal Server Error",
        });
    }
};
exports.dislikeComment = dislikeComment;
const translateComment = async (req, res) => {
    try {
        const { text, target } = req.body;
        const result = await (0, google_translate_api_x_1.translate)(text, {
            to: target,
        });
        const translated = result;
        res.json({
            success: true,
            translatedText: translated.text,
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Translation failed",
        });
    }
};
exports.translateComment = translateComment;
//# sourceMappingURL=comment_controller.js.map