import { Link } from "react-router-dom";
import type { Video } from "../../types/video.types";
import { getThemeByLocationAndTime } from "../utils/theme";
import { useState, useEffect } from "react";

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
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  // Get theme
  const theme = getThemeByLocationAndTime(user?.state || "");
  const isLight = theme === "light";

  // Theme-based classes
  const bgColor = isLight ? "bg-gray-100" : "bg-[#272727]";
  const textColor = isLight ? "text-black" : "text-white";
  const mutedText = isLight ? "text-gray-600" : "text-[#aaaaaa]";
  const mutedTextHover = isLight ? "hover:text-black" : "hover:text-white";
  const cardBg = isLight ? "bg-white" : "bg-[#0f0f0f]";
  const avatarBg = isLight ? "bg-gray-200" : "bg-[#272727]";
  const avatarText = isLight ? "text-gray-800" : "text-white";
  const menuHover = isLight ? "hover:bg-gray-200" : "hover:bg-[#272727]";
  const menuIcon = isLight ? "text-gray-800" : "text-white";
  const durationBg = isLight ? "bg-black/70" : "bg-black/80";
  const durationText = "text-white";
  const thumbnailBg = isLight ? "bg-gray-200" : "bg-[#272727]";
  
  // Border classes for light mode
  const borderColor = isLight ? "border border-gray-200" : "";
  const borderHover = isLight ? "hover:border-gray-400" : "";
  const thumbnailBorder = isLight ? "border-2 border-gray-200" : "";
  const avatarBorder = isLight ? "border-2 border-gray-300" : "";

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
    <Link 
      to={`/video/${video._id}`} 
      className={`group cursor-pointer rounded-xl transition-all duration-200 ${borderColor} ${borderHover} p-2 ${isLight ? 'hover:shadow-md' : ''}`}
    >
      {/* Thumbnail Container */}
      <div className={`relative rounded-xl overflow-hidden ${thumbnailBg} ${thumbnailBorder}`}>
        <img
          src={thumbnailUrl}
          alt={video.title || "Video thumbnail"}
          className="w-full aspect-video object-cover group-hover:rounded-none transition-all duration-200"
          onError={(e) => {
            (e.target as HTMLImageElement).src = "https://via.placeholder.com/360x202/272727/aaaaaa?text=No+Thumbnail";
          }}
        />
        {/* Duration Badge */}
        <span className={`absolute bottom-2 right-2 ${durationBg} ${durationText} text-xs px-1.5 py-0.5 rounded font-medium`}>
          {extendedVideo.duration || "10:23"}
        </span>
      </div>

      {/* Video Info Container */}
      <div className="flex gap-3 mt-3">
        {/* Channel Avatar */}
        <div className="shrink-0">
          <div className={`w-9 h-9 rounded-full ${avatarBg} ${avatarBorder} flex items-center justify-center`}>
            <span className={`${avatarText} text-sm font-medium`}>
              {channelName.charAt(0).toUpperCase()}
            </span>
          </div>
        </div>

        {/* Text Content */}
        <div className="flex-1 min-w-0">
          <h3 className={`${textColor} font-medium text-sm line-clamp-2 mb-1 leading-snug`}>
            {video.title || "Untitled Video"}
          </h3>
          <p className={`${mutedText} text-xs ${mutedTextHover} transition-colors mt-0.5`}>
            {channelName}
          </p>
          <div className={`${mutedText} text-xs mt-0.5`}>
            <span>{formatViews(video.views)}</span>
            <span className="mx-1">•</span>
            <span>{formatDate(extendedVideo.uploadDate || video.createdAt)}</span>
          </div>
        </div>

        {/* Menu Button (3 dots) - Shows on hover */}
        <button 
          className={`shrink-0 opacity-0 group-hover:opacity-100 p-1 ${menuHover} rounded-full transition-opacity`}
          onClick={(e) => {
            e.preventDefault();
            // Handle menu click
            console.log("Menu clicked for video:", video._id);
          }}
        >
          <svg className={`w-4 h-4 ${menuIcon}`} fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
          </svg>
        </button>
      </div>
    </Link>
  );
};

export default VideoCard;