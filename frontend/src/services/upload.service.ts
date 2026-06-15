import axios from "axios";

const API_URL = "http://localhost:1928";

export interface UploadVideoData {
  title: string;
  description: string;
  videoUrl: string;
  thumbnailUrl: string;
  duration: number;
  uploadedBy: string;
}

export const uploadVideo = async (videoData: UploadVideoData) => {
  const response = await axios.post(`${API_URL}/create_video`, videoData);
  return response.data;
};