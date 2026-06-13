import express from "express";
import {
  createComment,
  getComments,
  likeComment,
  dislikeComment, translateComment
} from "../controllers/comment_controller";

import {
  downloadVideo, getDownloads
} from "../controllers/download_controller";

import {
  createVideo,
  getVideos,
  getVideoById,
  incrementViews,
} from "../controllers/video_controller";

import {
  createUser,
  getUsers,
  getUserById,
  upgradeToPremium, getUserByEmail
} from "../controllers/user_controller";

const router = express.Router();

router.post("/create-user", createUser);
router.get("/users", getUsers);
router.get("/users/:userId",getUserById);
router.patch("/upgrade-premium/:userId",upgradeToPremium);
router.get("/user/email/:email",getUserByEmail);

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

export default router;