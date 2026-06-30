import express from "express";
import { createComment, getComments, likeComment, dislikeComment, translateComment } from "../controllers/comment_controller";
import { downloadVideo, getDownloads } from "../controllers/download_controller";
import { createVideo, getVideos, getVideoById, incrementViews, likeVideo, dislikeVideo } from "../controllers/video_controller";
import { 
    createUser, 
    getUsers, 
    getUserById, 
    upgradeToPremium, 
    getUserByEmail, 
    upgradeWatchPlan, 
    validateUser, 
    sendEmailOTP, 
    verifyEmailOTP, 
    updatePhoneNumber, 
    sendPhoneOTP, 
    verifyPhoneOTP,
    updateWatchTime,
    getUserWatchTime
} from "../controllers/user_controller";
import { 
    createChannel, 
    getChannelByOwner, 
    getChannelById,
    subscribeChannel, 
    unsubscribeChannel,
    checkSubscription 
} from "../controllers/channel_controller";
import multer from "multer";
import { uploadVideo, uploadImage } from "../controllers/upload_controller";

const router = express.Router();
const upload = multer({
    dest: "uploads/",
});

// ============ USER ROUTES ============
router.post("/create-user", createUser);
router.get("/users", getUsers);
router.get("/users/:userId", getUserById);
router.patch("/upgrade-premium/:userId", upgradeToPremium);
router.get("/user/email/:email", getUserByEmail);
router.patch("/upgrade-watchplan/:userId", upgradeWatchPlan);
router.get("/validate-user/:email", validateUser);
router.post("/send-email-otp", sendEmailOTP);
router.post("/verify-email-otp", verifyEmailOTP);
router.patch("/update-phone/:userId", updatePhoneNumber);
router.post("/send-phone-otp", sendPhoneOTP);
router.post("/verify-phone-otp", verifyPhoneOTP);
router.patch("/users/:userId/watch-time", updateWatchTime);        // NEW: Update watch time
router.get("/users/:userId/watch-time", getUserWatchTime);         // NEW: Get watch time

// ============ COMMENT ROUTES ============
router.post("/create_comments", createComment);
router.get("/get_comments", getComments);
router.patch("/like_comments/:id/like", likeComment);
router.patch("/dislike_comments/:id/dislike", dislikeComment);
router.post("/translate", translateComment);

// ============ DOWNLOAD ROUTES ============
router.post("/download-video", downloadVideo);
router.get("/downloads/:userId", getDownloads);

// ============ VIDEO ROUTES ============
router.post("/create_video", createVideo);
router.get("/get_videos", getVideos);
router.get("/get_video/:id", getVideoById);
router.patch("/video_views/:id", incrementViews);
router.post("/video/:id/like", likeVideo);
router.post("/video/:id/dislike", dislikeVideo);

// ============ CHANNEL ROUTES ============
router.post("/channel/create", createChannel);
router.get("/channel/:ownerId", getChannelByOwner);
router.get("/channel/id/:channelId", getChannelById);                    // NEW: Get channel by ID
router.post("/channel/:channelId/subscribe", subscribeChannel);
router.post("/channel/:channelId/unsubscribe", unsubscribeChannel);
router.get("/channel/:channelId/subscription/:userId", checkSubscription); // NEW: Check subscription status

// ============ UPLOAD ROUTES ============
router.post("/upload-video", upload.single("video"), uploadVideo);
router.post("/upload-image", upload.single("image"), uploadImage);

export default router;