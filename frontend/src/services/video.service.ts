import axios from "axios";
import type { Video } from "../types/video.types";

const API_URL = "http://localhost:1928";

// Make sure getVideos is exported in your video.service.ts
export const getVideos = async () => {
    const response = await axios.get(`${API_URL}/get_videos`);
    return response.data;
};

export const getVideoById = async (
  id: string
) => {
  const response = await axios.get<{
    success: boolean;
    data: Video;
  }>(`${API_URL}/get_video/${id}`);

  return response.data;
};

export const incrementViews = async (
  id: string
) => {
  const response = await axios.patch(
    `${API_URL}/video_views/${id}`
  );

  return response.data;
};

export const likeVideo = async (
  videoId: string,
  userId: string
) => {
  const response = await axios.post(
    `${API_URL}/video/${videoId}/like`,
    { userId }
  );

  return response.data;
};

export const dislikeVideo = async (
  videoId: string,
  userId: string
) => {
  const response = await axios.post(
    `${API_URL}/video/${videoId}/dislike`,
    { userId }
  );

  return response.data;
};