import { Request, Response } from "express";
import Comment from "../models/comment_model";

// Create Comment
export const createComment = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { text, city } = req.body;

    if (!text || !city) {
      res.status(400).json({
        success: false,
        message: "Text and city are required",
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

    const comment = await Comment.create({
      text,
      city,
    });

    res.status(201).json({
      success: true,
      message: "Comment created successfully",
      data: comment,
    });
  } catch (error) {
    console.error("Create Comment Error:", error);

    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

// Get All Comments
export const getComments = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const comments = await Comment.find().sort({
      createdAt: -1,
    });

    res.status(200).json({
      success: true,
      count: comments.length,
      data: comments,
    });
  } catch (error) {
    console.error("Get Comments Error:", error);

    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

export const likeComment = async (
  req: Request,
  res: Response
): Promise<void> => {
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

    const comment = await Comment.findById(id);

    if (!comment) {
      res.status(404).json({
        success: false,
        message: "Comment not found",
      });
      return;
    }

    // Already liked -> Toggle Off
    if (comment.likedBy.includes(userId)) {
      comment.likedBy = comment.likedBy.filter(
        (uid) => uid !== userId
      );

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
      comment.dislikedBy = comment.dislikedBy.filter(
        (uid) => uid !== userId
      );
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
  } catch (error) {
    console.error("Like Comment Error:", error);

    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

export const dislikeComment = async (
  req: Request,
  res: Response
): Promise<void> => {
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

    const comment = await Comment.findById(id);

    if (!comment) {
      res.status(404).json({
        success: false,
        message: "Comment not found",
      });
      return;
    }

    // Already disliked -> Toggle Off
    if (comment.dislikedBy.includes(userId)) {
      comment.dislikedBy = comment.dislikedBy.filter(
        (uid) => uid !== userId
      );

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
      comment.likedBy = comment.likedBy.filter(
        (uid) => uid !== userId
      );
    }

    // Add Dislike
    comment.dislikedBy.push(userId);

    // Sync counts from arrays
    comment.likes = comment.likedBy.length;
    comment.dislikes = comment.dislikedBy.length;

    // Internship Requirement
    if (comment.dislikes >= 2) {
      await Comment.findByIdAndDelete(id);

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
  } catch (error) {
    console.error("Dislike Comment Error:", error);

    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

export const translateComment = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { text, target } = req.body;

    if (!text || !target) {
      res.status(400).json({
        success: false,
        message: "Text and target language are required",
      });
      return;
    }

    const response = await fetch(
      `https://api.mymemory.translated.net/get?q=${encodeURIComponent(
        text
      )}&langpair=hi|${target}`
    );

    const data = await response.json();

    res.status(200).json({
      success: true,
      translatedText:
        data.responseData?.translatedText ||
        "Translation not available",
    });
  } catch (error) {
    console.error("Translation Error:", error);

    res.status(500).json({
      success: false,
      message: "Translation failed",
    });
  }
};