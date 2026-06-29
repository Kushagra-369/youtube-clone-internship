import { useEffect, useRef, useState } from "react";
import CommentsPage from "../comments/CommentsPage";
import { likeVideo, dislikeVideo } from "../../services/video.service";
import { downloadVideo } from "../../services/download.service";
import { useParams, Link } from "react-router-dom";
import { getVideoById, getVideos } from "../../services/video.service";
import type { Video } from "../../types/video.types";
import { getUserByEmail } from "../../services/user.service";
import { getThemeByLocationAndTime } from "../utils/theme";
import { useNavigate } from "react-router-dom";
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
    const [showDownloadMenu, setShowDownloadMenu] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const [watchTime, setWatchTime] = useState(0);
    const [watchLimitReached, setWatchLimitReached] = useState(false);
    const [showControls, setShowControls] = useState(true);
    const [tapCount, setTapCount] = useState(0);
    const [tapTimeout, setTapTimeout] =
        useState<ReturnType<typeof setTimeout> | null>(null);
    const [lastTapTime, setLastTapTime] = useState(0);
    const [tapPosition, setTapPosition] = useState<'center' | 'left' | 'right' | null>(null);
    const [showSeekFeedback, setShowSeekFeedback] = useState<string | null>(null);
    const [showComments, setShowComments] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const navigate = useNavigate();
    const videoRef = useRef<HTMLVideoElement>(null);
    const watchTimeInterval = useRef<ReturnType<typeof setInterval> | null>(null);
    const controlsTimeout =
        useRef<ReturnType<typeof setTimeout> | null>(null);
    const [user, setUser] = useState<any>(JSON.parse(localStorage.getItem("user") || "null"));

    useEffect(() => {
        const savedUser = localStorage.getItem("user");
        if (savedUser) {
            const parsedUser = JSON.parse(savedUser);
            setUser(parsedUser);
        }
    }, []);

    const isLoggedIn = !!user;

    const qualities = ["Auto", "2160p", "1440p", "1080p", "720p", "480p", "360p", "240p", "144p"];
    const speeds = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];

    // Get theme
    const theme = getThemeByLocationAndTime(user?.state || "");
    const isLight = theme === "light";

    // Theme-based classes
    const bgColor = isLight ? "bg-white" : "bg-[#0f0f0f]";
    const textColor = isLight ? "text-black" : "text-white";
    const borderColor = isLight ? "border-gray-200" : "border-[#272727]";
    const cardBg = isLight ? "bg-gray-100" : "bg-[#272727]";
    const cardBgHover = isLight ? "hover:bg-gray-200" : "hover:bg-[#3a3a3a]";
    const mutedText = isLight ? "text-gray-600" : "text-[#aaaaaa]";
    const buttonBg = isLight ? "bg-gray-200" : "bg-[#272727]";
    const buttonBgHover = isLight ? "hover:bg-gray-300" : "hover:bg-[#3a3a3a]";
    const subscribeBg = isSubscribed ? (isLight ? "bg-gray-200" : "bg-[#272727]") : (isLight ? "bg-black" : "bg-white");
    const subscribeText = isSubscribed ? (isLight ? "text-black" : "text-white") : (isLight ? "text-white" : "text-black");
    const subscribeHover = isSubscribed ? (isLight ? "hover:bg-gray-300" : "hover:bg-[#3a3a3a]") : (isLight ? "hover:bg-gray-800" : "hover:bg-gray-200");
    const spinnerBorder = isLight ? "border-gray-300" : "border-white";
    const spinnerAccent = isLight ? "border-t-gray-600" : "border-t-transparent";
    const overlayBg = isLight ? "bg-black/70" : "bg-black/80";
    const modalBg = isLight ? "bg-white" : "bg-[#272727]";
    const modalText = isLight ? "text-gray-800" : "text-white";
    const modalMuted = isLight ? "text-gray-600" : "text-gray-400";
    const settingsBg = isLight ? "bg-white" : "bg-[#272727]";
    const settingsBorder = isLight ? "border-gray-200" : "border-[#3a3a3a]";
    const qualityBtnBg = isLight ? "bg-gray-200" : "bg-[#3a3a3a]";
    const qualityBtnHover = isLight ? "hover:bg-gray-300" : "hover:bg-[#4a4a4a]";
    const qualityBtnActive = isLight ? "bg-black" : "bg-blue-600";
    const qualityBtnText = isLight ? "text-gray-800" : "text-gray-300";
    const qualityBtnActiveText = isLight ? "text-white" : "text-white";
    const downloadMenuBg = isLight ? "bg-white" : "bg-[#272727]";
    const downloadMenuBorder = isLight ? "border-gray-200" : "border-[#3a3a3a]";
    const downloadItemHover = isLight ? "hover:bg-gray-100" : "hover:bg-[#3a3a3a]";

    const requireLogin = () => {
        alert("Please sign in to use this feature.");
    };

    // Watch Timer Functions
    const startWatchTimer = () => {
        if (watchTimeInterval.current) return;

        watchTimeInterval.current = setInterval(() => {
            setWatchTime((prev) => {
                const newTime = prev + 1;
                if (user) {
                    const limits: Record<string, number> = {
                        guest: 120,     // 2 minutes
                        free: 300,      // 5 minutes
                        bronze: 420,    // 7 minutes
                        silver: 600,    // 10 minutes
                        gold: Infinity,
                    };

                    const currentPlan = user
                        ? (user.watchPlan || "free")
                        : "guest";

                    const limit = limits[currentPlan];

                    if (newTime >= limit && limit !== Infinity) {

                        setWatchLimitReached(true);

                        if (videoRef.current) {
                            videoRef.current.pause();
                            setIsPlaying(false);
                        }

                        if (watchTimeInterval.current) {
                            clearInterval(watchTimeInterval.current);
                            watchTimeInterval.current = null;
                        }
                    }

                    return newTime;
                }
                return newTime;
            });
        }, 1000);
    };

    const stopWatchTimer = () => {
        if (watchTimeInterval.current) {
            clearInterval(watchTimeInterval.current);
            watchTimeInterval.current = null;
        }
    };

    // Video Controls
    const togglePlay = () => {
        if (!videoRef.current) return;

        if (watchLimitReached) {
            alert("Watch limit reached. Please upgrade your plan.");
            return;
        }

        if (isPlaying) {
            videoRef.current.pause();
            setIsPlaying(false);
            stopWatchTimer();
        } else {
            videoRef.current.play();
            setIsPlaying(true);
            startWatchTimer();
        }
    };

    const handleSeek = (seconds: number) => {
        if (!videoRef.current) return;
        const newTime = Math.max(0, Math.min(videoRef.current.duration, videoRef.current.currentTime + seconds));
        videoRef.current.currentTime = newTime;
        setCurrentTime(newTime);
        showSeekFeedbackText(seconds > 0 ? `⏩ +${seconds}s` : `⏪ ${seconds}s`);
    };

    const showSeekFeedbackText = (text: string) => {
        setShowSeekFeedback(text);
        setTimeout(() => setShowSeekFeedback(null), 1000);
    };

    // Tap/Gesture Handling
    const handleTap = (e: React.MouseEvent<HTMLDivElement>) => {
        console.log("CLICK");
        e.preventDefault();
        const now = Date.now();
        const timeSinceLastTap = now - lastTapTime;
        console.log("TIME:", timeSinceLastTap);
        setLastTapTime(now);

        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const width = rect.width;
        let position: 'center' | 'left' | 'right';

        if (x < width / 3) position = 'left';
        else if (x > (2 * width) / 3) position = 'right';
        else position = 'center';

        if (timeSinceLastTap > 1000 || (tapPosition && tapPosition !== position)) {
            setTapCount(0);
        }

        const newTapCount = tapCount + 1;

        console.log(
            "tapCount:",
            tapCount,
            "newTapCount:",
            newTapCount
        );
        setTapCount(newTapCount);
        setTapPosition(position);

        if (tapTimeout) {
            clearTimeout(tapTimeout);
            setTapTimeout(null);
        }

        // Handle based on tap count and position
        if (newTapCount === 1) {
            // Single tap - check if center for play/pause
            if (position === 'center') {
                const timeout = setTimeout(() => {
                    togglePlay();
                    setTapCount(0);
                    setTapPosition(null);
                }, 400);
                setTapTimeout(timeout);
            } else {
                // Single tap on sides - show controls
                setShowControls(true);
                const timeout = setTimeout(() => {
                    setTapCount(0);
                    setTapPosition(null);
                }, 800);
                setTapTimeout(timeout);
            }
        } else if (newTapCount === 2) {

            if (tapTimeout) {
                clearTimeout(tapTimeout);
                setTapTimeout(null);
            }

            if (position === "left") {
                handleSeek(-10);
            }
            else if (position === "right") {
                handleSeek(10);
            }
            else {
                togglePlay();
            }

            // Triple tap ke liye wait karo
            const timeout = setTimeout(() => {
                setTapCount(0);
                setTapPosition(null);
            }, 500);

            setTapTimeout(timeout);
        } else if (newTapCount >= 3) {
            setTapCount(0);
            setTapPosition(null);
            // Triple tap
            console.log("TRIPLE TAP DETECTED", position);
            if (tapTimeout) {
                clearTimeout(tapTimeout);
                setTapTimeout(null);
            }

            if (position === "center") {

                console.log(
                    "NEXT VIDEO:",
                    suggestedVideos[0]?._id
                );

                if (suggestedVideos.length > 0) {
                    navigate(
                        `/video/${suggestedVideos[0]._id}`
                    );
                }

                showSeekFeedbackText(
                    "⏭️ Next Video"
                );
            } else if (position === 'left') {
                // Triple tap left - toggle comments
                setShowComments(!showComments);
                showSeekFeedbackText(showComments ? '💬 Comments Closed' : '💬 Comments Opened');
            } else if (position === 'right') {
                // Triple tap right - close website
                showSeekFeedbackText('👋 Goodbye!');
                setTimeout(() => {
                    window.close();
                    // Fallback
                    window.location.href = '/';
                }, 500);
            }
            setTapCount(0);
            setTapPosition(null);
        }
    };

    // Auto-hide controls
    const handleMouseMove = () => {
        setShowControls(true);
        if (controlsTimeout.current) {
            clearTimeout(controlsTimeout.current);
        }
        controlsTimeout.current = setTimeout(() => {
            if (isPlaying) {
                setShowControls(false);
            }
        }, 3000);
    };

    // Fetch video and suggestions
    const fetchVideo = async () => {
        try {
            setLoading(true);
            setWatchTime(0);
            setWatchLimitReached(false);
            const response = await getVideoById(id!);
            setVideo(response.data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const fetchSuggestedVideos = async () => {
        try {
            setSuggestedLoading(true);
            const response = await getVideos();
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

    // Cleanup
    useEffect(() => {
        return () => {
            stopWatchTimer();
            if (controlsTimeout.current) {
                clearTimeout(controlsTimeout.current);
            }
            if (tapTimeout) {
                clearTimeout(tapTimeout);
            }
        };
    }, []);

    const handleQualityChange = (quality: string) => {
        setSelectedQuality(quality);
        if (quality !== "Auto" && videoRef.current) {
            console.log(`Quality changed to ${quality}`);
        }
    };

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

    const handleLike = async () => {
        try {
            if (!user || !video) return;
            const response = await likeVideo(video._id, user.email);
            setVideo(response.data);
            setIsLiked(!isLiked);
        } catch (error) {
            console.error(error);
        }
    };

    const handleDislike = async () => {
        try {
            if (!user || !video) return;
            const response = await dislikeVideo(video._id, user.email);
            setVideo(response.data);
            setIsDisliked(!isDisliked);
        } catch (error) {
            console.error(error);
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

    const handleDownload = async () => {
        try {
            const userResponse = await getUserByEmail(user.email);
            const userId = userResponse.data._id;
            const response = await downloadVideo(userId, video!._id);
            alert(response.message);
        } catch (error: any) {
            alert(error?.response?.data?.message || "Download failed");
        }
    };

    useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
        };
        document.addEventListener('fullscreenchange', handleFullscreenChange);
        return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
    }, []);

    const formatWatchTime = (seconds: number): string => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const formatDuration = (seconds: number): string => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const getWatchLimitDisplay = () => {

        const limits: Record<string, number> = {
            guest: 120,
            free: 300,
            bronze: 420,
            silver: 600,
            gold: Infinity,
        };

        const currentPlan = user
            ? (user.watchPlan || "free")
            : "guest";

        const limit = limits[currentPlan];

        if (limit === Infinity) {
            return "Unlimited";
        }

        return formatWatchTime(limit);
    };

    // Handle video progress
    const handleTimeUpdate = () => {
        if (videoRef.current) {
            setCurrentTime(videoRef.current.currentTime);
            setDuration(videoRef.current.duration);
        }
    };

    // Handle progress bar click
    const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (videoRef.current) {
            const rect = e.currentTarget.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const percentage = x / rect.width;
            videoRef.current.currentTime = percentage * videoRef.current.duration;
            setCurrentTime(videoRef.current.currentTime);
        }
    };

    if (loading) {
        return (
            <div className={`min-h-screen ${bgColor} flex items-center justify-center`}>
                <div className={`animate-spin rounded-full h-12 w-12 border-4 ${spinnerBorder} ${spinnerAccent}`}></div>
            </div>
        );
    }

    if (!video) {
        return (
            <div className={`min-h-screen ${bgColor} flex items-center justify-center`}>
                <div className={`${textColor} text-xl`}>Video not found</div>
            </div>
        );
    }

    const videoUrl = video.videoUrl || video.video_url;
    const isYoutube = videoUrl?.includes("youtube.com") || videoUrl?.includes("youtu.be");
    const youtubeId = isYoutube && videoUrl ? videoUrl.split("/").pop()?.split("?")[0] : null;

    return (
        <div className={`min-h-screen ${bgColor}`}>
            <main className="pt-14">
                <div className="max-w-350 mx-auto px-4 py-6">
                    <div className="flex flex-col lg:flex-row gap-6">
                        {/* Left Column - Video Player */}
                        <div className="flex-1">
                            {/* Video Player */}
                            <div
                                className="relative bg-black rounded-xl overflow-hidden"
                                onMouseMove={handleMouseMove}
                                onMouseLeave={() => setShowControls(false)}
                                onClick={handleTap}
                            >
                                {isYoutube ? (
                                    <iframe
                                        className="w-full aspect-video"
                                        src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1`}
                                        title={video.title}
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                        allowFullScreen
                                    />
                                ) : videoError ? (
                                    <div className={`aspect-video ${isLight ? 'bg-gray-200' : 'bg-gray-900'} flex items-center justify-center`}>
                                        <div className="text-center">
                                            <p className={`${textColor} text-lg mb-2`}>⚠️ Video failed to load</p>
                                            <p className={`${mutedText} text-sm break-all`}>URL: {videoUrl}</p>
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
                                            src={videoUrl}
                                            className="w-full aspect-video"
                                            preload="metadata"
                                            onTimeUpdate={handleTimeUpdate}
                                            onLoadedMetadata={() => {
                                                if (videoRef.current) {
                                                    setDuration(videoRef.current.duration);
                                                }
                                            }}
                                            onPlay={() => {
                                                setIsPlaying(true);
                                                startWatchTimer();
                                            }}
                                            onPause={() => {
                                                setIsPlaying(false);
                                                stopWatchTimer();
                                            }}
                                            onEnded={() => {
                                                setIsPlaying(false);
                                                stopWatchTimer();
                                            }}
                                            onError={() => setVideoError(true)}
                                            playsInline
                                        />

                                        {/* Gesture Feedback */}
                                        {showSeekFeedback && (
                                            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-black/70 text-white text-4xl md:text-5xl font-bold px-6 py-4 rounded-xl pointer-events-none z-20 animate-fade-in-out">
                                                {showSeekFeedback}
                                            </div>
                                        )}

                                        {/* Tap Indicator */}
                                        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none z-10">
                                            {tapCount === 1 && <div className="text-white text-6xl opacity-50">●</div>}
                                            {tapCount === 2 && <div className="text-white text-6xl opacity-50">●●</div>}
                                            {tapCount >= 3 && <div className="text-white text-6xl opacity-50">●●●</div>}
                                        </div>

                                        {/* Watch Time Indicator */}
                                        {user && user.watchPlan !== "gold" && (
                                            <div className="absolute top-4 right-4 bg-black/70 text-white text-xs px-3 py-1.5 rounded-full z-10">
                                                ⏱ {formatWatchTime(watchTime)} / {getWatchLimitDisplay()}
                                            </div>
                                        )}

                                        {/* Gesture Hints */}
                                        <div className={`absolute bottom-20 left-1/2 transform -translate-x-1/2 text-white/50 text-xs text-center transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0'} pointer-events-none z-10`}>
                                            <div className="bg-black/50 px-4 py-2 rounded-lg backdrop-blur-sm">
                                                Tap center: Play/Pause | Double-tap left/right: +/-10s | Triple tap: Next/Close/Comments
                                            </div>
                                        </div>

                                        {/* Custom Video Controls */}
                                        <div className={`absolute bottom-0 left-0 right-0 bg-linear-to-t from-black/80 to-transparent p-4 transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0'} z-10`}>
                                            {/* Progress Bar */}
                                            <div
                                                className="relative w-full h-1 bg-gray-600 rounded-full cursor-pointer mb-3"
                                                onClick={handleProgressClick}
                                            >
                                                <div
                                                    className="absolute top-0 left-0 h-full bg-red-600 rounded-full transition-all"
                                                    style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }}
                                                />
                                                <div
                                                    className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-red-600 rounded-full"
                                                    style={{ left: `${duration ? (currentTime / duration) * 100 : 0}%`, transform: 'translate(-50%, -50%)' }}
                                                />
                                            </div>

                                            <div className="flex items-center gap-4">
                                                <button onClick={togglePlay} className="text-white hover:text-gray-300 transition-colors">
                                                    {isPlaying ? (
                                                        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                                                            <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                                                        </svg>
                                                    ) : (
                                                        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                                                            <path d="M8 5v14l11-7z" />
                                                        </svg>
                                                    )}
                                                </button>

                                                <span className="text-white text-sm">
                                                    {formatDuration(currentTime)} / {formatDuration(duration)}
                                                </span>

                                                <button
                                                    onClick={() => {
                                                        if (videoRef.current) {
                                                            videoRef.current.muted = !isMuted;
                                                            setIsMuted(!isMuted);
                                                        }
                                                    }}
                                                    className="text-white hover:text-gray-300 transition-colors"
                                                >
                                                    {isMuted ? (
                                                        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                                                            <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM9 6.17L3.06 10.1 1 8.04 5.04 4 1.06 0 0 1.06l13 13L12.94 15l-4-4v5.5L6 14l-3 2V8h.17L2 9.06v6.88l2-1.33 2 1.33V14.9l-1.21 1.21L2 16.09v3.47l3-2 2 1.33v-5.5l4 4v5.5l-2-1.33-2 1.33V20.9l3-2 2 1.33v-3.47l-1.21-1.21L9 14.9v-5.5L4.1 5.17 9 3.17v3z" />
                                                        </svg>
                                                    ) : (
                                                        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                                                            <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77z" />
                                                        </svg>
                                                    )}
                                                </button>

                                                <div className="flex-1" />

                                                <button onClick={toggleFullscreen} className="text-white hover:text-gray-300 transition-colors">
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
                                <h1 className={`${textColor} text-xl md:text-2xl font-bold`}>
                                    {video.title}
                                </h1>

                                <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-4 pb-4 border-b ${borderColor}`}>
                                    <div className="flex items-center gap-3">
                                        <div className={`w-10 h-10 rounded-full ${cardBg} flex items-center justify-center`}>
                                            <span className={`${textColor} font-medium`}>
                                                {(video.channelName || video.uploadedBy || "C").charAt(0).toUpperCase()}
                                            </span>
                                        </div>
                                        <div>
                                            <h3 className={`${textColor} font-medium`}>
                                                {video.channelName || video.uploadedBy || "Unknown Channel"}
                                            </h3>
                                            <p className={`${mutedText} text-sm`}>
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
                                            className={`px-4 py-2 rounded-full font-medium text-sm transition ${subscribeBg} ${subscribeText} ${subscribeHover}`}
                                        >
                                            {isSubscribed ? "Subscribed" : "Subscribe"}
                                        </button>
                                    </div>

                                    <div className="flex gap-2 flex-wrap">
                                        <button
                                            onClick={() => {
                                                if (!isLoggedIn) {
                                                    requireLogin();
                                                    return;
                                                }
                                                handleLike();
                                            }}
                                            className={`flex items-center gap-2 px-4 py-2 rounded-full transition ${isLiked ? "bg-blue-600 text-white" : `${buttonBg} ${textColor} ${buttonBgHover}`}`}
                                        >
                                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                                <path d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
                                            </svg>
                                            <span>{video.likes || 0}</span>
                                        </button>

                                        <button
                                            onClick={() => {
                                                if (!isLoggedIn) {
                                                    requireLogin();
                                                    return;
                                                }
                                                handleDislike();
                                            }}
                                            className={`flex items-center gap-2 px-4 py-2 rounded-full transition ${isDisliked ? "bg-red-600 text-white" : `${buttonBg} ${textColor} ${buttonBgHover}`}`}
                                        >
                                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                                <path d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.736 3h4.018c.163 0 .326.02.485.06L17 4m-7 10v5a2 2 0 002 2h.095c.5 0 .905-.405.905-.905 0-.714.211-1.412.608-2.006L17 13V4m-7 10h2m5-10h2a2 2 0 012 2v6a2 2 0 01-2 2h-2.5" />
                                            </svg>
                                            <span>{video.dislikes || 0}</span>
                                        </button>

                                        <button className={`flex items-center gap-2 ${buttonBg} ${buttonBgHover} px-4 py-2 rounded-full transition`}>
                                            <svg className={`w-5 h-5 ${textColor}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                                            </svg>
                                            <span className={`${textColor} text-sm`}>Share</span>
                                        </button>

                                        {/* Download Button */}
                                        <div className="relative">
                                            <button
                                                onClick={() => setShowDownloadMenu(!showDownloadMenu)}
                                                className={`${buttonBg} ${buttonBgHover} p-2 rounded-full transition`}
                                            >
                                                <svg className={`w-5 h-5 ${textColor}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                                </svg>
                                            </button>

                                            {showDownloadMenu && (
                                                <>
                                                    <div className="fixed inset-0 z-40" onClick={() => setShowDownloadMenu(false)} />
                                                    <div className={`absolute right-0 mt-2 w-48 ${downloadMenuBg} rounded-xl shadow-lg z-50 overflow-hidden border ${downloadMenuBorder}`}>
                                                        <div className="py-2">
                                                            <div className={`px-4 py-2 ${mutedText} text-xs border-b ${downloadMenuBorder}`}>
                                                                Download Video
                                                            </div>
                                                            <button
                                                                onClick={handleDownload}
                                                                className={`w-full text-left px-4 py-2 ${textColor} text-sm ${downloadItemHover} transition`}
                                                            >
                                                                📹 1080p (High)
                                                            </button>
                                                            <button
                                                                onClick={handleDownload}
                                                                className={`w-full text-left px-4 py-2 ${textColor} text-sm ${downloadItemHover} transition`}
                                                            >
                                                                📹 720p (Medium)
                                                            </button>
                                                            <button
                                                                onClick={handleDownload}
                                                                className={`w-full text-left px-4 py-2 ${textColor} text-sm ${downloadItemHover} transition`}
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
                                                className={`${buttonBg} ${buttonBgHover} p-2 rounded-full transition`}
                                            >
                                                <svg className={`w-5 h-5 ${textColor}`} fill="currentColor" viewBox="0 0 24 24">
                                                    <path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.33-.02-.64-.06-.94l2.02-1.58c.18-.14.23-.38.12-.56l-1.89-3.28c-.12-.19-.36-.26-.56-.18l-2.38.96c-.5-.38-1.06-.68-1.66-.88L14.45 3.5c-.04-.2-.2-.34-.4-.34h-3.78c-.2 0-.36.14-.4.34l-.3 2.52c-.6.2-1.16.5-1.66.88l-2.38-.96c-.2-.08-.44-.01-.56.18l-1.89 3.28c-.12.19-.07.42.12.56l2.02 1.58c-.04.3-.06.61-.06.94 0 .33.02.64.06.94l-2.02 1.58c-.18.14-.23.38-.12.56l1.89 3.28c.12.19.36.26.56.18l2.38-.96c.5.38 1.06.68 1.66.88l.3 2.52c.04.2.2.34.4.34h3.78c.2 0 .36-.14.4-.34l.3-2.52c.6-.2 1.16-.5 1.66-.88l2.38.96c.2.08.44.01.56-.18l1.89-3.28c.12-.19.07-.42-.12-.56l-2.02-1.58zM12 15c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3z" />
                                                </svg>
                                            </button>

                                            {showSettings && (
                                                <div className={`absolute right-0 mt-2 w-72 ${settingsBg} rounded-xl shadow-lg z-50 border ${settingsBorder}`}>
                                                    <div className="p-2">
                                                        <div className={`px-3 py-2 ${textColor} font-semibold border-b ${settingsBorder}`}>
                                                            Settings
                                                        </div>

                                                        <div className="px-3 py-2">
                                                            <div className={`${textColor} text-sm mb-2`}>Quality</div>
                                                            <div className="grid grid-cols-3 gap-1">
                                                                {qualities.map((quality) => (
                                                                    <button
                                                                        key={quality}
                                                                        onClick={() => handleQualityChange(quality)}
                                                                        className={`px-2 py-1 text-xs rounded ${selectedQuality === quality
                                                                            ? `${qualityBtnActive} ${qualityBtnActiveText}`
                                                                            : `${qualityBtnBg} ${qualityBtnText} ${qualityBtnHover}`
                                                                            }`}
                                                                    >
                                                                        {quality}
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        </div>

                                                        <div className={`px-3 py-2 border-t ${settingsBorder}`}>
                                                            <div className={`${textColor} text-sm mb-2`}>Playback Speed</div>
                                                            <div className="grid grid-cols-4 gap-1">
                                                                {speeds.map((speed) => (
                                                                    <button
                                                                        key={speed}
                                                                        onClick={() => setPlaybackSpeed(speed)}
                                                                        className={`px-2 py-1 text-xs rounded ${playbackSpeed === speed
                                                                            ? `${qualityBtnActive} ${qualityBtnActiveText}`
                                                                            : `${qualityBtnBg} ${qualityBtnText} ${qualityBtnHover}`
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

                                <div className={`${cardBg} rounded-xl p-4 mt-4`}>
                                    <div className={`flex gap-4 text-sm ${mutedText} mb-2`}>
                                        <span>{formatViews(video.views || 0)} views</span>
                                        <span>{formatDate(video.createdAt || video.uploadDate)}</span>
                                    </div>
                                    <p className={`${textColor} whitespace-pre-wrap`}>
                                        {video.description || "No description available."}
                                    </p>
                                </div>

                                {/* Comments Section */}
                                {showComments && (
                                    <div className="mt-4">
                                        {isLoggedIn ? (
                                            <CommentsPage videoId={id} />
                                        ) : (
                                            <div className={`${cardBg} rounded-xl p-6`}>
                                                <h3 className={`${textColor} text-lg font-semibold`}>
                                                    Sign in to comment
                                                </h3>
                                                <p className={`${mutedText} mt-2`}>
                                                    Join the conversation, comment on videos, and interact with creators.
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
                                )}
                            </div>
                        </div>

                        {/* Right Column - Suggested Videos */}
                        <div className="lg:w-100">
                            <div className="space-y-3">
                                <h3 className={`${textColor} font-semibold mb-3`}>Suggested Videos</h3>

                                {suggestedLoading ? (
                                    <div className="flex justify-center py-8">
                                        <div className={`animate-spin rounded-full h-8 w-8 border-2 ${spinnerBorder} ${spinnerAccent}`}></div>
                                    </div>
                                ) : suggestedVideos.length === 0 ? (
                                    <div className="text-center py-8">
                                        <p className={mutedText}>No suggested videos</p>
                                    </div>
                                ) : (
                                    suggestedVideos.map((suggestedVideo) => (
                                        <Link
                                            key={suggestedVideo._id}
                                            to={`/video/${suggestedVideo._id}`}
                                            className={`flex gap-3 cursor-pointer ${cardBg} ${cardBgHover} rounded-xl p-2 transition group`}
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
                                                <h4 className={`${textColor} text-sm font-medium line-clamp-2 group-hover:text-[#3ea6ff] transition`}>
                                                    {suggestedVideo.title}
                                                </h4>
                                                <p className={`${mutedText} text-xs mt-1`}>
                                                    {suggestedVideo.channelName || "Channel"}
                                                </p>
                                                <div className={`${mutedText} text-xs mt-1`}>
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

            {/* Watch Limit Reached Modal */}
            {watchLimitReached && (
                <div className={`fixed inset-0 ${overlayBg} flex items-center justify-center z-50`}>
                    <div className={`${modalBg} p-6 rounded-xl w-100 text-center`}>
                        <h2 className={`text-2xl font-bold ${modalText}`}>
                            ⏱️ Watch Limit Reached
                        </h2>
                        <p className={`${modalMuted} mt-3`}>
                            You've watched {formatWatchTime(watchTime)} of your {getWatchLimitDisplay()} limit.
                            <br />
                            Upgrade your plan to continue watching videos.
                        </p>
                        <div className="mt-6 flex justify-center gap-3">
                            <Link to="/watch-plans">
                                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
                                    Upgrade Plan
                                </button>
                            </Link>
                        </div>
                    </div>
                </div>
            )}

            {/* Add custom CSS for animations */}
            <style>{`
                @keyframes fadeInOut {
                    0% { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
                    20% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
                    80% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
                    100% { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
                }
                .animate-fade-in-out {
                    animation: fadeInOut 1s ease-in-out forwards;
                }
            `}</style>
        </div>
    );
};

export default PlayerPage;