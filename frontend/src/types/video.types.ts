export interface Video {
  _id: string;
  title: string;
  description?: string;
  videoUrl?: string;
  video_url?: string;
  thumbnailUrl?: string;
  views?: number;
  likes?: number;
  dislikes?: number;
  createdAt?: string;
  uploadDate?: string;
  channelName?: string;
  uploadedBy?: string;
  userId?: string;
  tags?: string[];
}