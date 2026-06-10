import express from "express";
import {
  createComment,
  getComments,
  likeComment,
  dislikeComment,
} from "../controllers/comment_controller";

const router = express.Router();

// Comments
router.post("/create_comments", createComment);
router.get("/get_comments", getComments);
router.patch("/like_comments/:id/like", likeComment);
router.patch("/dislike_comments/:id/dislike", dislikeComment);

export default router;