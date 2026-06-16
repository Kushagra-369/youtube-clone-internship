import { Request, Response } from "express";
import { v2 as cloudinary } from "cloudinary";

export const uploadVideo = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {

    const file = (req as any).file;

    if (!file) {
      res.status(400).json({
        success: false,
        message: "No file uploaded",
      });
      return;
    }

    const result =
      await cloudinary.uploader.upload(
        file.path,
        {
          resource_type: "video",
        }
      );

    res.status(200).json({
      success: true,
      videoUrl: result.secure_url,
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Upload failed",
    });
  }
};