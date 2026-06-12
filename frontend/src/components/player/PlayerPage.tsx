import { useEffect, useRef, useState } from "react";
import CommentsPage from "../comments/CommentsPage";
import {
    downloadVideo,
} from "../../services/download.service";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
    getVideoById,
    incrementViews,
    getVideos,
} from "../../services/video.service";
import type { Video } from "../../types/video.types";

// Extend Video type to include optional fields
interface ExtendedVideo extends Video {
    uploadDate?: string;
    video_url?: string;
    channelName?: string;
    uploadedBy?: string;
    subscribers?: number;
    likes?: number;
    dislikes?: number;
}

const PlayerPage = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [video, setVideo] = useState<ExtendedVideo | null>(null);
    const [suggestedVideos, setSuggestedVideos] = useState<Video[]>([]);
    const [loading, setLoading] = useState(true);
    const [suggestedLoading, setSuggestedLoading] = useState(true);
    const [videoError, setVideoError] = useState(false);
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [isLiked, setIsLiked] = useState(false);
    const [isDisliked, setIsDisliked] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [selectedQuality, setSelectedQuality] = useState("Auto");
    const [playbackSpeed, setPlaybackSpeed] = useState(1);
    const [isMuted, setIsMuted] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [showDownloadMenu, setShowDownloadMenu] = useState(false);
    const videoRef = useRef<HTMLVideoElement>(null);
    const hasViewed = useRef(false);
    const isLoggedIn = false;

    const qualities = ["Auto", "2160p", "1440p", "1080p", "720p", "480p", "360p", "240p", "144p"];
    const speeds = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];

    const requireLogin = () => {
        alert("Please sign in to use this feature.");
    };

    const fetchVideo = async () => {
        try {
            setLoading(true);
            if (!id) return;

            if (!hasViewed.current) {
                hasViewed.current = true;
                await incrementViews(id);
            }

            const response = await getVideoById(id);
            setVideo(response.data);
        } catch (error) {
            console.error("Player Error:", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchSuggestedVideos = async () => {
        try {
            setSuggestedLoading(true);
            const response = await getVideos();
            // Filter out current video and get random 10 videos
            const filtered = response.data.filter((v: Video) => v._id !== id);
            const shuffled = filtered.sort(() => 0.5 - Math.random());
            setSuggestedVideos(shuffled.slice(0, 10));
        } catch (error) {
            console.error("Error fetching suggested videos:", error);
        } finally {
            setSuggestedLoading(false);
        }
    };

    useEffect(() => {
        fetchVideo();
        fetchSuggestedVideos();
    }, [id]);

    useEffect(() => {
        if (videoRef.current) {
            videoRef.current.playbackRate = playbackSpeed;
        }
    }, [playbackSpeed]);

    const formatViews = (count: number = 0): string => {
        if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
        if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
        return count.toString();
    };

    const formatDate = (date?: string | Date): string => {
        if (!date) return "Recently";
        const uploadedDate = new Date(date);
        const now = new Date();
        const diffTime = Math.abs(now.getTime() - uploadedDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 0) return "Today";
        if (diffDays === 1) return "Yesterday";
        if (diffDays < 7) return `${diffDays} days ago`;
        if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
        if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
        return `${Math.floor(diffDays / 365)} years ago`;
    };

    const handleLike = () => {
        if (isLiked) {
            setIsLiked(false);
        } else {
            setIsLiked(true);
            setIsDisliked(false);
        }
    };

    const handleDislike = () => {
        if (isDisliked) {
            setIsDisliked(false);
        } else {
            setIsDisliked(true);
            setIsLiked(false);
        }
    };

    const toggleFullscreen = () => {
        if (!videoRef.current) return;

        if (!isFullscreen) {
            videoRef.current.requestFullscreen();
            setIsFullscreen(true);
        } else {
            document.exitFullscreen();
            setIsFullscreen(false);
        }
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            navigate(`/?search=${encodeURIComponent(searchQuery)}`);
        }
    };

    const handleDownload = async () => {
        try {
            const userId =
                "6a2bf406f76bc7b1f5c506ec";

            const response =
                await downloadVideo(
                    userId,
                    video!._id
                );

            alert(response.message);
        } catch (error: any) {
            alert(
                error?.response?.data?.message ||
                "Download failed"
            );
        }
    };
    
    useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
        };

        document.addEventListener('fullscreenchange', handleFullscreenChange);
        return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-white border-t-transparent"></div>
            </div>
        );
    }

    if (!video) {
        return (
            <div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center">
                <div className="text-white text-xl">Video not found</div>
            </div>
        );
    }

    const videoUrl = video.videoUrl || video.video_url;
    const isYoutube = videoUrl?.includes("youtube.com") || videoUrl?.includes("youtu.be");
    const youtubeId = isYoutube && videoUrl ? videoUrl.split("/").pop()?.split("?")[0] : null;

    return (
        <div className="min-h-screen bg-[#0f0f0f]">
            {/* Fixed Header */}
            <header className="fixed top-0 left-0 right-0 bg-[#0f0f0f] border-b border-[#272727] z-50">
                <div className="flex items-center justify-between px-4 py-2">
                    <Link to="/" className="flex items-center gap-1">
                        <svg className="w-8 h-8 text-red-600" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.376.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.376-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814z" />
                            <path d="M9.545 15.568L9.545 8.432L15.818 12L9.545 15.568z" fill="#0f0f0f" />
                        </svg>
                        <span className="text-white text-xl font-semibold">YouTube</span>
                    </Link>

                    <div className="flex-1 max-w-2xl mx-4">
                        <form onSubmit={handleSearch} className="flex">
                            <input
                                type="text"
                                placeholder="Search"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full px-4 py-2 bg-[#121212] border border-[#303030] rounded-l-full text-white placeholder:text-[#aaaaaa] focus:outline-none focus:border-blue-500"
                            />
                            <button type="submit" className="px-6 bg-[#222222] border border-[#303030] border-l-0 rounded-r-full hover:bg-[#272727]">
                                <svg className="w-5 h-5 text-[#aaaaaa]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </button>
                        </form>
                    </div>

                    <div className="flex items-center gap-2">
                        <button className="px-4 py-1.5 bg-[#222222] text-[#3ea6ff] text-sm font-medium rounded-full hover:bg-[#272727] transition">
                            Premium
                        </button>
                        <button className="flex items-center gap-2 px-4 py-1.5 bg-[#3ea6ff] text-black text-sm font-medium rounded-full hover:bg-[#65b8ff] transition">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                            </svg>
                            Sign In
                        </button>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="pt-14">
                <div className="max-w-350 mx-auto px-4 py-6">
                    <div className="flex flex-col lg:flex-row gap-6">
                        {/* Left Column - Video Player */}
                        <div className="flex-1">
                            {/* Video Player */}
                            <div className="relative bg-black rounded-xl overflow-hidden">
                                {isYoutube ? (
                                    <iframe
                                        className="w-full aspect-video"
                                        src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1`}
                                        title={video.title}
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                        allowFullScreen
                                    />
                                ) : videoError ? (
                                    <div className="aspect-video bg-gray-900 flex items-center justify-center">
                                        <div className="text-center">
                                            <p className="text-white text-lg mb-2">⚠️ Video failed to load</p>
                                            <p className="text-gray-400 text-sm break-all">URL: {videoUrl}</p>
                                            <button onClick={() => setVideoError(false)} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                                                Retry
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <video
                                            ref={videoRef}
                                            key={videoUrl}
                                            controls={false}
                                            autoPlay
                                            className="w-full aspect-video"
                                            preload="metadata"
                                            onError={() => setVideoError(true)}
                                        >
                                            <source src={videoUrl} type="video/mp4" />
                                        </video>

                                        {/* Custom Video Controls */}
                                        <div className="absolute bottom-0 left-0 right-0 bg-linear-to-t from-black/80 to-transparent p-4 opacity-0 hover:opacity-100 transition-opacity duration-300">
                                            <div className="flex items-center gap-4">
                                                <button onClick={() => videoRef.current?.play()} className="text-white hover:text-gray-300">
                                                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                                                        <path d="M8 5v14l11-7z" />
                                                    </svg>
                                                </button>
                                                <button onClick={() => videoRef.current?.pause()} className="text-white hover:text-gray-300">
                                                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                                                        <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                                                    </svg>
                                                </button>
                                                <button onClick={() => setIsMuted(!isMuted)} className="text-white hover:text-gray-300">
                                                    {isMuted ? (
                                                        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                                                            <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM9 6.17L3.06 10.1 1 8.04 5.04 4 1.06 0 0 1.06l13 13L12.94 15l-4-4v5.5L6 14l-3 2V8h.17L2 9.06v6.88l2-1.33 2 1.33V14.9l-1.21 1.21L2 16.09v3.47l3-2 2 1.33v-5.5l4 4v5.5l-2-1.33-2 1.33V20.9l3-2 2 1.33v-3.47l-1.21-1.21L9 14.9v-5.5L4.1 5.17 9 3.17v3z" />
                                                        </svg>
                                                    ) : (
                                                        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                                                            <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
                                                        </svg>
                                                    )}
                                                </button>
                                                <button onClick={toggleFullscreen} className="text-white hover:text-gray-300 ml-auto">
                                                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                                                        <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z" />
                                                    </svg>
                                                </button>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>

                            {/* Video Info */}
                            <div className="mt-4">
                                <h1 className="text-white text-xl md:text-2xl font-bold">
                                    {video.title}
                                </h1>

                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-4 pb-4 border-b border-[#272727]">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-[#272727] flex items-center justify-center">
                                            <span className="text-white font-medium">
                                                {(video.channelName || video.uploadedBy || "C").charAt(0).toUpperCase()}
                                            </span>
                                        </div>
                                        <div>
                                            <h3 className="text-white font-medium">
                                                {video.channelName || video.uploadedBy || "Unknown Channel"}
                                            </h3>
                                            <p className="text-[#aaaaaa] text-sm">
                                                {formatViews(video.subscribers || 0)} subscribers
                                            </p>
                                        </div>
                                        <button
                                            onClick={() => {
                                                if (!isLoggedIn) {
                                                    requireLogin();
                                                    return;
                                                }
                                                setIsSubscribed(!isSubscribed);
                                            }}
                                            className={`px-4 py-2 rounded-full font-medium text-sm transition ${isSubscribed
                                                ? "bg-[#272727] text-white hover:bg-[#3a3a3a]"
                                                : "bg-white text-black hover:bg-gray-200"
                                                }`}
                                        >
                                            {isSubscribed ? "Subscribed" : "Subscribe"}
                                        </button>
                                    </div>

                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => {
                                                if (!isLoggedIn) {
                                                    requireLogin();
                                                    return;
                                                }
                                                handleLike();
                                            }}
                                            className={`flex items-center gap-2 px-4 py-2 rounded-full transition ${isLiked ? "bg-blue-600 text-white" : "bg-[#272727] text-white hover:bg-[#3a3a3a]"
                                                }`}
                                        >
                                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                                <path d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
                                            </svg>
                                            <span>{formatViews((video.likes || 0) + (isLiked ? 1 : 0))}</span>
                                        </button>

                                        <button
                                            onClick={() => {
                                                if (!isLoggedIn) {
                                                    requireLogin();
                                                    return;
                                                }
                                                handleDislike();
                                            }}
                                            className={`flex items-center gap-2 px-4 py-2 rounded-full transition ${isDisliked ? "bg-red-600 text-white" : "bg-[#272727] text-white hover:bg-[#3a3a3a]"
                                                }`}
                                        >
                                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                                <path d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.736 3h4.018c.163 0 .326.02.485.06L17 4m-7 10v5a2 2 0 002 2h.095c.5 0 .905-.405.905-.905 0-.714.211-1.412.608-2.006L17 13V4m-7 10h2m5-10h2a2 2 0 012 2v6a2 2 0 01-2 2h-2.5" />
                                            </svg>
                                            <span>{formatViews((video.dislikes || 0) + (isDisliked ? 1 : 0))}</span>
                                        </button>

                                        <button className="flex items-center gap-2 bg-[#272727] hover:bg-[#3a3a3a] px-4 py-2 rounded-full transition">
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                                            </svg>
                                            <span className="text-white text-sm">Share</span>
                                        </button>

                                        {/* Download Button with Menu */}
                                        <div className="relative">
                                            <button
                                                onClick={() => setShowDownloadMenu(!showDownloadMenu)}
                                                className="bg-[#272727] hover:bg-[#3a3a3a] p-2 rounded-full transition"
                                            >
                                                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                                </svg>
                                            </button>

                                            {showDownloadMenu && (
                                                <>
                                                    <div className="fixed inset-0 z-40" onClick={() => setShowDownloadMenu(false)} />
                                                    <div className="absolute right-0 mt-2 w-48 bg-[#272727] rounded-xl shadow-lg z-50 overflow-hidden">
                                                        <div className="py-2">
                                                            <div className="px-4 py-2 text-[#aaaaaa] text-xs border-b border-[#3a3a3a]">
                                                                Download Video
                                                            </div>
                                                            <button
                                                                onClick={handleDownload}
                                                                className="w-full text-left px-4 py-2 text-white text-sm hover:bg-[#3a3a3a] transition"
                                                            >
                                                                📹 1080p (High)
                                                            </button>
                                                            <button
                                                                onClick={handleDownload}
                                                                className="w-full text-left px-4 py-2 text-white text-sm hover:bg-[#3a3a3a] transition"
                                                            >
                                                                📹 720p (Medium)
                                                            </button>
                                                            <button
                                                                onClick={handleDownload}
                                                                className="w-full text-left px-4 py-2 text-white text-sm hover:bg-[#3a3a3a] transition"
                                                            >
                                                                📹 480p (Low)
                                                            </button>
                                                        </div>
                                                    </div>
                                                </>
                                            )}
                                        </div>

                                        {/* Settings Menu */}
                                        <div className="relative">
                                            <button
                                                onClick={() => setShowSettings(!showSettings)}
                                                className="bg-[#272727] hover:bg-[#3a3a3a] p-2 rounded-full transition"
                                            >
                                                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                                                    <path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.33-.02-.64-.06-.94l2.02-1.58c.18-.14.23-.38.12-.56l-1.89-3.28c-.12-.19-.36-.26-.56-.18l-2.38.96c-.5-.38-1.06-.68-1.66-.88L14.45 3.5c-.04-.2-.2-.34-.4-.34h-3.78c-.2 0-.36.14-.4.34l-.3 2.52c-.6.2-1.16.5-1.66.88l-2.38-.96c-.2-.08-.44-.01-.56.18l-1.89 3.28c-.12.19-.07.42.12.56l2.02 1.58c-.04.3-.06.61-.06.94 0 .33.02.64.06.94l-2.02 1.58c-.18.14-.23.38-.12.56l1.89 3.28c.12.19.36.26.56.18l2.38-.96c.5.38 1.06.68 1.66.88l.3 2.52c.04.2.2.34.4.34h3.78c.2 0 .36-.14.4-.34l.3-2.52c.6-.2 1.16-.5 1.66-.88l2.38.96c.2.08.44.01.56-.18l1.89-3.28c.12-.19.07-.42-.12-.56l-2.02-1.58zM12 15c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3z" />
                                                </svg>
                                            </button>

                                            {showSettings && (
                                                <div className="absolute right-0 mt-2 w-72 bg-[#272727] rounded-xl shadow-lg z-50">
                                                    <div className="p-2">
                                                        <div className="px-3 py-2 text-white font-semibold border-b border-[#3a3a3a]">
                                                            Settings
                                                        </div>

                                                        <div className="px-3 py-2">
                                                            <div className="text-white text-sm mb-2">Quality</div>
                                                            <div className="grid grid-cols-3 gap-1">
                                                                {qualities.map((quality) => (
                                                                    <button
                                                                        key={quality}
                                                                        onClick={() => setSelectedQuality(quality)}
                                                                        className={`px-2 py-1 text-xs rounded ${selectedQuality === quality
                                                                            ? "bg-blue-600 text-white"
                                                                            : "bg-[#3a3a3a] text-gray-300 hover:bg-[#4a4a4a]"
                                                                            }`}
                                                                    >
                                                                        {quality}
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        </div>

                                                        <div className="px-3 py-2 border-t border-[#3a3a3a]">
                                                            <div className="text-white text-sm mb-2">Playback Speed</div>
                                                            <div className="grid grid-cols-4 gap-1">
                                                                {speeds.map((speed) => (
                                                                    <button
                                                                        key={speed}
                                                                        onClick={() => setPlaybackSpeed(speed)}
                                                                        className={`px-2 py-1 text-xs rounded ${playbackSpeed === speed
                                                                            ? "bg-blue-600 text-white"
                                                                            : "bg-[#3a3a3a] text-gray-300 hover:bg-[#4a4a4a]"
                                                                            }`}
                                                                    >
                                                                        {speed}x
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-[#272727] rounded-xl p-4 mt-4">
                                    <div className="flex gap-4 text-sm text-[#aaaaaa] mb-2">
                                        <span>{formatViews(video.views || 0)} views</span>
                                        <span>{formatDate(video.createdAt || video.uploadDate)}</span>
                                    </div>
                                    <p className="text-white whitespace-pre-wrap">
                                        {video.description || "No description available."}
                                    </p>
                                </div>

                                {/* Comments Section */}
                                {isLoggedIn ? (
                                    <CommentsPage videoId={id} />
                                ) : (
                                    <div className="bg-[#272727] rounded-xl p-6 mt-6">
                                        <h3 className="text-white text-lg font-semibold">
                                            Sign in to comment
                                        </h3>
                                        <p className="text-[#aaaaaa] mt-2">
                                            Join the conversation, comment on videos,
                                            and interact with creators.
                                        </p>
                                        <button
                                            onClick={requireLogin}
                                            className="mt-4 px-5 py-2 bg-[#3ea6ff] text-black rounded-full font-medium hover:bg-[#65b8ff]"
                                        >
                                            Sign In
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Right Column - Suggested Videos from Database */}
                        <div className="lg:w-100">
                            <div className="space-y-3">
                                <h3 className="text-white font-semibold mb-3">Suggested Videos</h3>

                                {suggestedLoading ? (
                                    <div className="flex justify-center py-8">
                                        <div className="animate-spin rounded-full h-8 w-8 border-2 border-white border-t-transparent"></div>
                                    </div>
                                ) : suggestedVideos.length === 0 ? (
                                    <div className="text-center py-8">
                                        <p className="text-[#aaaaaa]">No suggested videos</p>
                                    </div>
                                ) : (
                                    suggestedVideos.map((suggestedVideo) => (
                                        <Link
                                            key={suggestedVideo._id}
                                            to={`/video/${suggestedVideo._id}`}
                                            className="flex gap-3 cursor-pointer hover:bg-[#272727] rounded-xl p-2 transition group"
                                        >
                                            <div className="w-40 shrink-0">
                                                <img
                                                    src={suggestedVideo.thumbnailUrl || "https://via.placeholder.com/360x202/272727/aaaaaa"}
                                                    alt={suggestedVideo.title}
                                                    className="aspect-video rounded-lg object-cover w-full"
                                                    onError={(e) => {
                                                        (e.target as HTMLImageElement).src = "https://via.placeholder.com/360x202/272727/aaaaaa";
                                                    }}
                                                />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h4 className="text-white text-sm font-medium line-clamp-2 group-hover:text-[#3ea6ff] transition">
                                                    {suggestedVideo.title}
                                                </h4>
                                                <p className="text-[#aaaaaa] text-xs mt-1">
                                                    {suggestedVideo.channelName || "Channel"}
                                                </p>
                                                <div className="text-[#aaaaaa] text-xs mt-1">
                                                    <span>{formatViews(suggestedVideo.views || 0)} views</span>
                                                </div>
                                            </div>
                                        </Link>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default PlayerPage;