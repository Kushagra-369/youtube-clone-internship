import axios from "axios";
import { API_URL } from "../config/api";

export const downloadVideo = async (
  userId: string,
  videoId: string
) => {
  const response = await axios.post(
    `${API_URL}/download-video`,
    {
      userId,
      videoId,
    }
  );

  return response.data;
};

export const getDownloads = async (
  userId: string
) => {
  const response = await axios.get(
    `${API_URL}/downloads/${userId}`
  );

  return response.data;
};