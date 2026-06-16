import express from "express";

import {createComment,getComments,likeComment,dislikeComment, translateComment} from "../controllers/comment_controller";
import {downloadVideo, getDownloads} from "../controllers/download_controller";
import {createVideo,getVideos,getVideoById,incrementViews, likeVideo,dislikeVideo} from "../controllers/video_controller";
import {createUser,getUsers,getUserById,upgradeToPremium, getUserByEmail,upgradeWatchPlan} from "../controllers/user_controller";
import {createChannel,getChannelByOwner,subscribeChannel,unsubscribeChannel} from "../controllers/channel_controller"
import multer from "multer";
import { uploadVideo } from "../controllers/upload_controller";
const router = express.Router();
const upload = multer({
  dest: "uploads/",
});
router.post("/create-user", createUser);
router.get("/users", getUsers);
router.get("/users/:userId",getUserById);
router.patch("/upgrade-premium/:userId",upgradeToPremium);
router.get("/user/email/:email",getUserByEmail);
router.patch("/upgrade-watchplan/:userId",upgradeWatchPlan);


router.post("/create_comments", createComment);
router.get("/get_comments", getComments);
router.patch("/like_comments/:id/like", likeComment);
router.patch("/dislike_comments/:id/dislike", dislikeComment);
router.post("/translate", translateComment);


router.post("/download-video", downloadVideo);
router.get("/downloads/:userId",getDownloads);

router.post("/create_video",createVideo);
router.get("/get_videos",getVideos);
router.get("/get_video/:id",getVideoById);
router.patch("/video_views/:id",incrementViews);
router.post("/video/:id/like",likeVideo);
router.post("/video/:id/dislike",dislikeVideo);


router.post("/channel/create",createChannel);
router.get("/channel/:ownerId",getChannelByOwner);
router.post("/channel/:channelId/subscribe",subscribeChannel);
router.post("/channel/:channelId/unsubscribe",unsubscribeChannel);


router.post("/upload-video",upload.single("video"),uploadVideo);
export default router;