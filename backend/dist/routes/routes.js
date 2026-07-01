"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const comment_controller_1 = require("../controllers/comment_controller");
const download_controller_1 = require("../controllers/download_controller");
const video_controller_1 = require("../controllers/video_controller");
const user_controller_1 = require("../controllers/user_controller");
const channel_controller_1 = require("../controllers/channel_controller");
const multer_1 = __importDefault(require("multer"));
const upload_controller_1 = require("../controllers/upload_controller");
const router = express_1.default.Router();
const upload = (0, multer_1.default)({
    dest: "uploads/",
});
// ============ USER ROUTES ============
router.post("/create-user", user_controller_1.createUser);
router.get("/users", user_controller_1.getUsers);
router.get("/users/:userId", user_controller_1.getUserById);
router.patch("/upgrade-premium/:userId", user_controller_1.upgradeToPremium);
router.get("/user/email/:email", user_controller_1.getUserByEmail);
router.patch("/upgrade-watchplan/:userId", user_controller_1.upgradeWatchPlan);
router.get("/validate-user/:email", user_controller_1.validateUser);
router.post("/send-email-otp", user_controller_1.sendEmailOTP);
router.post("/verify-email-otp", user_controller_1.verifyEmailOTP);
router.patch("/update-phone/:userId", user_controller_1.updatePhoneNumber);
router.post("/send-phone-otp", user_controller_1.sendPhoneOTP);
router.post("/verify-phone-otp", user_controller_1.verifyPhoneOTP);
router.patch("/users/:userId/watch-time", user_controller_1.updateWatchTime); // NEW: Update watch time
router.get("/users/:userId/watch-time", user_controller_1.getUserWatchTime); // NEW: Get watch time
// ============ COMMENT ROUTES ============
router.post("/create_comments", comment_controller_1.createComment);
router.get("/get_comments", comment_controller_1.getComments);
router.patch("/like_comments/:id/like", comment_controller_1.likeComment);
router.patch("/dislike_comments/:id/dislike", comment_controller_1.dislikeComment);
router.post("/translate", comment_controller_1.translateComment);
// ============ DOWNLOAD ROUTES ============
router.post("/download-video", download_controller_1.downloadVideo);
router.get("/downloads/:userId", download_controller_1.getDownloads);
// ============ VIDEO ROUTES ============
router.post("/create_video", video_controller_1.createVideo);
router.get("/get_videos", video_controller_1.getVideos);
router.get("/get_video/:id", video_controller_1.getVideoById);
router.patch("/video_views/:id", video_controller_1.incrementViews);
router.post("/video/:id/like", video_controller_1.likeVideo);
router.post("/video/:id/dislike", video_controller_1.dislikeVideo);
// ============ CHANNEL ROUTES ============
router.post("/channel/create", channel_controller_1.createChannel);
router.get("/channel/:ownerId", channel_controller_1.getChannelByOwner);
router.get("/channel/id/:channelId", channel_controller_1.getChannelById); // NEW: Get channel by ID
router.post("/channel/:channelId/subscribe", channel_controller_1.subscribeChannel);
router.post("/channel/:channelId/unsubscribe", channel_controller_1.unsubscribeChannel);
router.get("/channel/:channelId/subscription/:userId", channel_controller_1.checkSubscription); // NEW: Check subscription status
// ============ UPLOAD ROUTES ============
router.post("/upload-video", upload.single("video"), upload_controller_1.uploadVideo);
router.post("/upload-image", upload.single("image"), upload_controller_1.uploadImage);
exports.default = router;
//# sourceMappingURL=routes.js.map