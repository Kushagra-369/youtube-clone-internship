import { Request, Response } from "express";
import cloudinary from "../config/cloudinary";

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

export const uploadImage =async (
 req: Request,
 res: Response
) => {

 const file =
   (req as any).file;

 const result =
  await cloudinary.uploader.upload(
   file.path,
   {
    resource_type:
      "image",
   }
  );

 res.json({
   success: true,
   imageUrl:
    result.secure_url,
 });
};