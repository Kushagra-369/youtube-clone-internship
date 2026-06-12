import { Request, Response } from "express";

import User from "../models/user_model";
import Video from "../models/video_model";
import Download from "../models/download_model";

export const downloadVideo = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { userId, videoId } = req.body;

    if (!userId || !videoId) {
      res.status(400).json({
        success: false,
        message:
          "userId and videoId are required",
      });
      return;
    }

    const user = await User.findById(
      userId
    );

    if (!user) {
      res.status(404).json({
        success: false,
        message: "User not found",
      });
      return;
    }

    const video = await Video.findById(
      videoId
    );

    if (!video) {
      res.status(404).json({
        success: false,
        message: "Video not found",
      });
      return;
    }

    // Prevent duplicate download entries
    const existingDownload =
      await Download.findOne({
        userId,
        videoId,
      });

    if (existingDownload) {
      res.status(400).json({
        success: false,
        message:
          "Video already downloaded",
      });

      return;
    }

    // Premium User
    if (user.plan === "premium") {
      const download =
        await Download.create({
          userId,
          videoId,
        });

      res.status(200).json({
        success: true,
        message:
          "Video downloaded successfully",
        videoUrl: video.videoUrl,
        data: download,
      });

      return;
    }

    // Free User Logic
    const today = new Date();

    const isSameDay =
      user.lastDownloadDate &&
      new Date(
        user.lastDownloadDate
      ).toDateString() ===
        today.toDateString();

    if (!isSameDay) {
      user.downloadCount = 0;
    }

    if (user.downloadCount >= 1) {
      res.status(403).json({
        success: false,
        message:
          "Free users can download only 1 video per day. Upgrade to Premium.",
      });

      return;
    }

    user.downloadCount += 1;
    user.lastDownloadDate = today;

    await user.save();

    const download =
      await Download.create({
        userId,
        videoId,
      });

    res.status(200).json({
      success: true,
      message:
        "Video downloaded successfully",
      videoUrl: video.videoUrl,
      data: download,
    });
  } catch (error) {
    console.error(
      "Download Error:",
      error
    );

    res.status(500).json({
      success: false,
      message:
        "Internal Server Error",
    });
  }
};

export const getDownloads = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { userId } = req.params;

    if (!userId) {
      res.status(400).json({
        success: false,
        message:
          "userId is required",
      });

      return;
    }

    const downloads =
      await Download.find({
        userId,
      })
        .populate("videoId")
        .sort({
          createdAt: -1,
        });

    res.status(200).json({
      success: true,
      data: downloads,
    });
  } catch (error) {
    console.error(
      "Get Downloads Error:",
      error
    );

    res.status(500).json({
      success: false,
      message:
        "Internal Server Error",
    });
  }
};