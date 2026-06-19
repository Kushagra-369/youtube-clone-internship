import {  useNavigate } from "react-router-dom";
import type { Video } from "../../types/video.types";
import { getThemeByLocationAndTime } from "../utils/theme";
import { useState, useEffect, useRef } from "react";

interface Props {
  video: Video;
  onVideoClick?: (videoId: string) => void;
  showChannelInfo?: boolean;
  layout?: 'grid' | 'list' | 'compact';
}

// Extended type for additional fields
interface ExtendedVideo extends Video {
  thumbnail_url?: string;
  uploadDate?: string;
  author?: string;
  duration?: string;
  channelName?: string;
  channelAvatar?: string;
  isLive?: boolean;
  viewsCount?: number;
  likeCount?: number;
}

const VideoCard = ({ 
  video, 
  onVideoClick, 
  showChannelInfo = true,
  layout = 'grid'
}: Props) => {
  const [user, setUser] = useState<any>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [thumbnailLoaded, setThumbnailLoaded] = useState(false);
  const [, setIsPlayingPreview] = useState(false);
  const videoPreviewRef = useRef<HTMLVideoElement>(null);
  const navigate = useNavigate();

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
  const textColor = isLight ? "text-black" : "text-white";
  const mutedText = isLight ? "text-gray-600" : "text-[#aaaaaa]";
  const mutedTextHover = isLight ? "hover:text-black" : "hover:text-white";
  const avatarBg = isLight ? "bg-gray-200" : "bg-[#272727]";
  const avatarText = isLight ? "text-gray-800" : "text-white";
  const menuHover = isLight ? "hover:bg-gray-200" : "hover:bg-[#272727]";
  const menuIcon = isLight ? "text-gray-800" : "text-white";
  const durationBg = isLight ? "bg-black/70" : "bg-black/80";
  const durationText = "text-white";
  const thumbnailBg = isLight ? "bg-gray-200" : "bg-[#272727]";
  const cardBg = isLight ? "bg-white hover:bg-gray-50" : "bg-transparent hover:bg-[#272727]";
  const borderColor = isLight ? "border border-gray-200" : "";
  const borderHover = isLight ? "hover:border-gray-400" : "";
  const thumbnailBorder = isLight ? "border-2 border-gray-200" : "";
  const avatarBorder = isLight ? "border-2 border-gray-300" : "";
  const progressBarBg = isLight ? "bg-gray-300" : "bg-gray-700";
  const progressBarFill = isLight ? "bg-black" : "bg-red-600";
  const shadowHover = isLight ? "hover:shadow-xl" : "";

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

  const formatDuration = (duration?: string | number): string => {
    if (!duration) return "0:00";
    if (typeof duration === 'string') {
      // If it's already formatted like "10:23", return as is
      if (duration.includes(':')) return duration;
      // If it's a number string, convert to seconds
      const seconds = parseInt(duration);
      if (isNaN(seconds)) return "0:00";
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return `${mins}:${secs.toString().padStart(2, '0')}`;
    }
    // If it's a number, convert to minutes:seconds
    const mins = Math.floor(duration / 60);
    const secs = Math.floor(duration % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Get channel name from various possible fields
  const channelName = extendedVideo.channelName || extendedVideo.uploadedBy || extendedVideo.author || "Channel";
  
  // Get thumbnail with fallback
  const thumbnailUrl = extendedVideo.thumbnailUrl || extendedVideo.thumbnail_url || "https://via.placeholder.com/360x202/272727/aaaaaa?text=No+Thumbnail";

  // Handle video click with gesture support
  const handleVideoClick = (e: React.MouseEvent) => {
    e.preventDefault();
    
    // Check for tap count (for gesture support)
    // This is a simplified version - full gesture support is in VideoPlayer
    if (onVideoClick) {
      onVideoClick(video._id);
    } else {
      navigate(`/video/${video._id}`);
    }
  };

  // Handle menu click
  const handleMenuClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Show options menu
    const options = [
      { label: 'Save to Watch Later', icon: '⏰' },
      { label: 'Add to Playlist', icon: '📋' },
      { label: 'Share', icon: '📤' },
      { label: 'Report', icon: '🚫' },
    ];
    // In a real implementation, show a dropdown menu
    console.log('Menu options:', options);
  };

  // Handle thumbnail hover preview
  const handleMouseEnter = () => {
    setIsHovered(true);
    // Auto-play preview if video has preview URL
    if (extendedVideo.videoUrl && videoPreviewRef.current) {
      setIsPlayingPreview(true);
      videoPreviewRef.current.play().catch(() => {});
    }
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    if (videoPreviewRef.current) {
      setIsPlayingPreview(false);
      videoPreviewRef.current.pause();
      videoPreviewRef.current.currentTime = 0;
    }
  };

  // Layout specific classes
  const getLayoutClasses = () => {
    switch(layout) {
      case 'list':
        return 'flex flex-row gap-4 items-start p-3';
      case 'compact':
        return 'flex flex-row gap-3 items-center p-2';
      default: // grid
        return 'flex flex-col p-2';
    }
  };

  const getThumbnailClasses = () => {
    switch(layout) {
      case 'list':
        return 'w-48 md:w-64 shrink-0';
      case 'compact':
        return 'w-24 md:w-32 shrink-0';
      default: // grid
        return 'w-full';
    }
  };

  const getTextContainerClasses = () => {
    switch(layout) {
      case 'list':
        return 'flex-1 min-w-0';
      case 'compact':
        return 'flex-1 min-w-0';
      default: // grid
        return 'flex-1 min-w-0';
    }
  };

  const getAvatarSizeClasses = () => {
    switch(layout) {
      case 'compact':
        return 'w-7 h-7 text-xs';
      default:
        return 'w-9 h-9 text-sm';
    }
  };

  return (
    <div 
      className={`group cursor-pointer rounded-xl transition-all duration-300 ${borderColor} ${borderHover} ${shadowHover} ${cardBg} ${getLayoutClasses()}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleVideoClick}
      role="article"
      aria-label={`Video: ${video.title || 'Untitled Video'}`}
    >
      {/* Thumbnail Container */}
      <div className={`relative rounded-xl overflow-hidden ${thumbnailBg} ${thumbnailBorder} ${getThumbnailClasses()}`}>
        {/* Main Thumbnail */}
        <img
          src={thumbnailUrl}
          alt={video.title || "Video thumbnail"}
          className={`w-full aspect-video object-cover transition-all duration-300 ${
            isHovered ? 'scale-105' : 'scale-100'
          } ${thumbnailLoaded ? 'opacity-100' : 'opacity-0'}`}
          onLoad={() => setThumbnailLoaded(true)}
          onError={(e) => {
            (e.target as HTMLImageElement).src = "https://via.placeholder.com/360x202/272727/aaaaaa?text=No+Thumbnail";
            setThumbnailLoaded(true);
          }}
          loading="lazy"
        />

        {/* Video Preview on Hover */}
        {isHovered && extendedVideo.videoUrl && (
          <video
            ref={videoPreviewRef}
            src={extendedVideo.videoUrl}
            className="absolute inset-0 w-full h-full object-cover opacity-0 group-hover:opacity-100 transition-opacity duration-300"
            muted
            playsInline
            loop
          />
        )}

        {/* Loading Skeleton */}
        {!thumbnailLoaded && (
          <div className={`absolute inset-0 ${thumbnailBg} animate-pulse flex items-center justify-center`}>
            <svg className="w-12 h-12 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </div>
        )}

        {/* Duration Badge */}
        <span className={`absolute bottom-2 right-2 ${durationBg} ${durationText} text-xs px-1.5 py-0.5 rounded font-medium z-10`}>
          {formatDuration(extendedVideo.duration)}
        </span>

        {/* Live Badge */}
        {extendedVideo.isLive && (
          <span className="absolute top-2 left-2 bg-red-600 text-white text-xs px-2 py-1 rounded-full font-medium animate-pulse z-10">
            🔴 LIVE
          </span>
        )}

        {/* Progress Bar for watched videos */}
        {video.views && video.views > 0 && (
          <div className={`absolute bottom-0 left-0 right-0 h-1 ${progressBarBg}`}>
            <div 
              className={`h-full ${progressBarFill} transition-all duration-300`}
              style={{ width: `${Math.min((video.views / 1000) * 10, 100)}%` }}
            />
          </div>
        )}

        {/* Play Button Overlay */}
        <div className={`absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300 flex items-center justify-center ${
          isHovered ? 'opacity-100' : 'opacity-0'
        }`}>
          <div className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-white/90 flex items-center justify-center transform scale-75 group-hover:scale-100 transition-all duration-300">
            <svg className="w-6 h-6 md:w-7 md:h-7 text-black ml-1" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z"/>
            </svg>
          </div>
        </div>
      </div>

      {/* Video Info Container */}
      <div className={`${getTextContainerClasses()} ${layout === 'grid' ? 'mt-3' : 'mt-0'}`}>
        <div className="flex gap-3">
          {/* Channel Avatar */}
          {showChannelInfo && (
            <div className="shrink-0 mt-1">
              <div 
                className={`rounded-full ${avatarBg} ${avatarBorder} flex items-center justify-center ${getAvatarSizeClasses()}`}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  // Navigate to channel page
                  navigate(`/channel/${extendedVideo.uploadedBy}`);
                }}
              >
                <span className={`${avatarText} font-medium`}>
                  {channelName.charAt(0).toUpperCase()}
                </span>
              </div>
            </div>
          )}

          {/* Text Content */}
          <div className="flex-1 min-w-0">
            <h3 className={`${textColor} font-medium text-sm line-clamp-2 leading-snug group-hover:text-blue-500 transition-colors`}>
              {video.title || "Untitled Video"}
            </h3>
            
            {showChannelInfo && (
              <>
                <p className={`${mutedText} text-xs ${mutedTextHover} transition-colors mt-0.5 hover:underline`}>
                  {channelName}
                </p>
                <div className={`${mutedText} text-xs mt-0.5 flex items-center gap-1 flex-wrap`}>
                  <span>{formatViews(extendedVideo.viewsCount || video.views)}</span>
                  <span className="mx-1">•</span>
                  <span>{formatDate(extendedVideo.uploadDate || video.createdAt)}</span>
                  
                  {/* Like count for extra info */}
                  {extendedVideo.likeCount && extendedVideo.likeCount > 0 && (
                    <>
                      <span className="mx-1">•</span>
                      <span>👍 {extendedVideo.likeCount}</span>
                    </>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Menu Button (3 dots) - Shows on hover */}
          <button 
            className={`shrink-0 opacity-0 group-hover:opacity-100 p-1 ${menuHover} rounded-full transition-all duration-200 hover:scale-110`}
            onClick={handleMenuClick}
            aria-label="Video options"
          >
            <svg className={`w-4 h-4 ${menuIcon}`} fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
            </svg>
          </button>
        </div>

        {/* Quick Action Buttons for List/Compact Layout */}
        {(layout === 'list' || layout === 'compact') && (
          <div className="flex gap-2 mt-2">
            <button 
              className={`${isLight ? 'bg-gray-100 hover:bg-gray-200' : 'bg-[#272727] hover:bg-[#3a3a3a]'} rounded-full px-3 py-1 text-xs ${textColor} transition-colors`}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                // Add to watch later
                console.log('Add to watch later');
              }}
            >
              Watch Later
            </button>
            <button 
              className={`${isLight ? 'bg-gray-100 hover:bg-gray-200' : 'bg-[#272727] hover:bg-[#3a3a3a]'} rounded-full px-3 py-1 text-xs ${textColor} transition-colors`}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                // Share video
                navigator.clipboard?.writeText(`${window.location.origin}/video/${video._id}`);
                alert('Video link copied to clipboard!');
              }}
            >
              Share
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default VideoCard;