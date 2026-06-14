import { Request, Response } from "express";
import Video from "../models/video_model";

/* ===========================
   CREATE VIDEO
=========================== */

export const createVideo = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const {
      title,
      description,
      videoUrl,
      thumbnailUrl,
      duration,
      uploadedBy,
    } = req.body;

    if (
      !title ||
      !videoUrl ||
      !thumbnailUrl ||
      !uploadedBy
    ) {
      res.status(400).json({
        success: false,
        message:
          "title, videoUrl, thumbnailUrl and uploadedBy are required",
      });
      return;
    }

    const video = await Video.create({
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
  } catch (error) {
    console.error(
      "Create Video Error:",
      error
    );

    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

/* ===========================
   GET ALL VIDEOS
=========================== */

export const getVideos = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const videos = await Video.find().sort({
      createdAt: -1,
    });

    res.status(200).json({
      success: true,
      count: videos.length,
      data: videos,
    });
  } catch (error) {
    console.error(
      "Get Videos Error:",
      error
    );

    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

/* ===========================
   GET SINGLE VIDEO
=========================== */

export const getVideoById = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    const video = await Video.findById(id);

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
  } catch (error) {
    console.error(
      "Get Video Error:",
      error
    );

    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

/* ===========================
   INCREMENT VIEWS
=========================== */

export const incrementViews = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    const video = await Video.findById(id);

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
  } catch (error) {
    console.error(
      "Increment View Error:",
      error
    );

    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

export const likeVideo = async (
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

    const video = await Video.findById(id);

    if (!video) {
      res.status(404).json({
        success: false,
        message: "Video not found",
      });
      return;
    }

    // Toggle Like Off
    if (video.likedBy.includes(userId)) {
      video.likedBy = video.likedBy.filter(
        (uid) => uid !== userId
      );

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
      video.dislikedBy = video.dislikedBy.filter(
        (uid) => uid !== userId
      );
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
  } catch (error) {
    console.error("Like Video Error:", error);

    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

export const dislikeVideo = async (
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

    const video = await Video.findById(id);

    if (!video) {
      res.status(404).json({
        success: false,
        message: "Video not found",
      });
      return;
    }

    // Toggle Dislike Off
    if (video.dislikedBy.includes(userId)) {
      video.dislikedBy = video.dislikedBy.filter(
        (uid) => uid !== userId
      );

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
      video.likedBy = video.likedBy.filter(
        (uid) => uid !== userId
      );
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
  } catch (error) {
    console.error(
      "Dislike Video Error:",
      error
    );

    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};