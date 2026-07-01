"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadImage = exports.uploadVideo = void 0;
const cloudinary_1 = __importDefault(require("../config/cloudinary"));
const uploadVideo = async (req, res) => {
    try {
        const file = req.file;
        if (!file) {
            res.status(400).json({
                success: false,
                message: "No file uploaded",
            });
            return;
        }
        const result = await cloudinary_1.default.uploader.upload(file.path, {
            resource_type: "video",
        });
        res.status(200).json({
            success: true,
            videoUrl: result.secure_url,
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Upload failed",
        });
    }
};
exports.uploadVideo = uploadVideo;
const uploadImage = async (req, res) => {
    const file = req.file;
    const result = await cloudinary_1.default.uploader.upload(file.path, {
        resource_type: "image",
    });
    res.json({
        success: true,
        imageUrl: result.secure_url,
    });
};
exports.uploadImage = uploadImage;
//# sourceMappingURL=upload_controller.js.map