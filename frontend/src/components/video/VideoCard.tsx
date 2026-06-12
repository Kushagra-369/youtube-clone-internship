import { Link } from "react-router-dom";
import type { Video } from "../../types/video.types";

interface Props {
  video: Video;
}

// Extended type for additional fields
interface ExtendedVideo extends Video {
  thumbnail_url?: string;
  uploadDate?: string;
  author?: string;
  duration?: string;
  channelName?: string;
}

const VideoCard = ({ video }: Props) => {
  // Cast to extended type for additional fields
  const extendedVideo = video as ExtendedVideo;
  
  const formatViews = (views?: number): string => {
    if (!views) return "0 views";
    if (views >= 1000000) return `${(views / 1000000).toFixed(1)}M views`;
    if (views >= 1000) return `${(views / 1000).toFixed(1)}K views`;
    return `${views} views`;
  };

  const formatDate = (date?: string): string => {
    if (!date) return "Recently";
    const uploadedDate = new Date(date);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - uploadedDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    return `${Math.floor(diffDays / 365)} years ago`;
  };

  // Get channel name from various possible fields
  const channelName = extendedVideo.channelName || extendedVideo.uploadedBy || extendedVideo.author || "Channel";
  
  // Get thumbnail with fallback
  const thumbnailUrl = extendedVideo.thumbnailUrl || extendedVideo.thumbnail_url || "https://via.placeholder.com/360x202/272727/aaaaaa?text=No+Thumbnail";

  return (
    <Link to={`/video/${video._id}`} className="group cursor-pointer">
      {/* Thumbnail Container */}
      <div className="relative rounded-xl overflow-hidden bg-[#272727]">
        <img
          src={thumbnailUrl}
          alt={video.title || "Video thumbnail"}
          className="w-full aspect-video object-cover group-hover:rounded-none transition-all duration-200"
          onError={(e) => {
            (e.target as HTMLImageElement).src = "https://via.placeholder.com/360x202/272727/aaaaaa?text=No+Thumbnail";
          }}
        />
        {/* Duration Badge */}
        <span className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-1.5 py-0.5 rounded font-medium">
          {extendedVideo.duration || "10:23"}
        </span>
      </div>

      {/* Video Info Container */}
      <div className="flex gap-3 mt-3">
        {/* Channel Avatar */}
        <div className="shrink-0">
          <div className="w-9 h-9 rounded-full bg-[#272727] flex items-center justify-center">
            <span className="text-white text-sm font-medium">
              {channelName.charAt(0).toUpperCase()}
            </span>
          </div>
        </div>

        {/* Text Content */}
        <div className="flex-1 min-w-0">
          <h3 className="text-white font-medium text-sm line-clamp-2 mb-1 leading-snug">
            {video.title || "Untitled Video"}
          </h3>
          <p className="text-[#aaaaaa] text-xs hover:text-white transition-colors mt-0.5">
            {channelName}
          </p>
          <div className="text-[#aaaaaa] text-xs mt-0.5">
            <span>{formatViews(video.views)}</span>
            <span className="mx-1">•</span>
            <span>{formatDate(extendedVideo.uploadDate || video.createdAt)}</span>
          </div>
        </div>

        {/* Menu Button (3 dots) - Shows on hover */}
        <button 
          className="shrink-0 opacity-0 group-hover:opacity-100 p-1 hover:bg-[#272727] rounded-full transition-opacity"
          onClick={(e) => {
            e.preventDefault();
            // Handle menu click
            console.log("Menu clicked for video:", video._id);
          }}
        >
          <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
          </svg>
        </button>
      </div>
    </Link>
  );
};

export default VideoCard;