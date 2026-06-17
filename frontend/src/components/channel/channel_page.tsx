import { useEffect, useState } from "react";
import {
    getChannelByOwner,
    createChannel,
} from "../../services/channel.service";
import { getVideos, incrementViews } from "../../services/video.service";
import { uploadVideo } from "../../services/upload.service";
import { getThemeByLocationAndTime } from "../utils/theme";

export interface User {
  _id: string;
  name: string;
  email: string;
  plan: string;
  watchPlan: string;
  state: string;
}

interface Channel {
    _id: string;
    ownerId: string;
    channelName: string;
    description: string;
    bannerUrl: string;
    subscribers: number;
    subscribedBy: string[];
    createdAt: string;
    updatedAt: string;
}

interface Video {
    _id: string;
    title: string;
    description: string;
    videoUrl: string;
    thumbnailUrl: string;
    duration: number;
    views: number;
    likes: number;
    dislikes: number;
    likedBy: string[];
    dislikedBy: string[];
    uploadedBy: string;
    createdAt: string;
}

interface ApiResponse<T> {
    success: boolean;
    data?: T;
    message?: string;
}

const ChannelPage = () => {
    const [channel, setChannel] = useState<Channel | null>(null);
    const [videos, setVideos] = useState<Video[]>([]);
    const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
    const [showUploadModal, setShowUploadModal] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [uploadProgress, setUploadProgress] = useState<number>(0);
    const [user, setUser] = useState<User | null>(null);
    const [formData, setFormData] = useState({
        channelName: "",
        description: "",
        bannerUrl: "",
    });
    const [uploadData, setUploadData] = useState({
        title: "",
        description: "",
        videoUrl: "",
        thumbnailUrl: "",
        duration: 0,
    });

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
    const bgColor = isLight ? "bg-white" : "bg-black";
    const bgColorSecondary = isLight ? "bg-gray-100" : "bg-gray-900";
    const textColor = isLight ? "text-black" : "text-white";
    const mutedText = isLight ? "text-gray-600" : "text-gray-400";
    const cardBg = isLight ? "bg-white" : "bg-gray-900";
    const cardBgHover = isLight ? "hover:bg-gray-50" : "hover:bg-gray-800";
    const inputBg = isLight ? "bg-white" : "bg-gray-800";
    const inputBorder = isLight ? "border-gray-300" : "border-gray-700";
    const inputFocus = isLight ? "focus:border-black" : "focus:border-red-500";
    const modalBg = isLight ? "bg-white" : "bg-gray-900";
    const buttonPrimary = isLight ? "bg-black hover:bg-gray-800" : "bg-red-600 hover:bg-red-700";
    const buttonPrimaryText = isLight ? "text-white" : "text-white";
    const buttonSecondary = isLight ? "bg-gray-200 hover:bg-gray-300" : "bg-gray-800 hover:bg-gray-700";
    const buttonSecondaryText = isLight ? "text-black" : "text-white";
    const spinnerBorder = isLight ? "border-gray-300" : "border-white";
    const bannerBg = isLight ? "bg-gradient-to-r from-gray-200 to-gray-300" : "bg-gradient-to-r from-gray-800 to-gray-900";
    const bannerText = isLight ? "text-gray-600" : "text-gray-400";
    const channelAvatarText = isLight ? "text-white" : "text-white";
    const overlayBg = isLight ? "bg-white/90" : "bg-black/80";

    useEffect(() => {
        if (!user) {
            return;
        }
        fetchChannel();
        fetchVideos();
    }, [user]);

    const fetchChannel = async (): Promise<void> => {
        if (!user) return;

        try {
            setIsLoading(true);
            const response: ApiResponse<Channel> = await getChannelByOwner(user._id);

            if (response.success && response.data) {
                setChannel(response.data);
            }
        } catch (error: any) {
            console.error("Error fetching channel:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchVideos = async (): Promise<void> => {
        try {
            const response = await getVideos();
            if (response.success && response.data) {
                // Filter videos by current user's channel
                const userVideos = response.data.filter(
                    (video: Video) => video.uploadedBy === user?._id
                );
                setVideos(userVideos);
            }
        } catch (error) {
            console.error("Error fetching videos:", error);
        }
    };

    const handleCreateChannel = async (e: React.FormEvent): Promise<void> => {
        e.preventDefault();

        if (!user) return;
        if (!formData.channelName.trim()) {
            alert("Channel name is required");
            return;
        }

        try {
            setIsLoading(true);
            const response: ApiResponse<Channel> = await createChannel(
                user._id,
                formData.channelName,
                formData.description,
                formData.bannerUrl
            );

            if (response.success && response.data) {
                setChannel(response.data);
                setShowCreateModal(false);
                setFormData({ channelName: "", description: "", bannerUrl: "" });
                alert("Channel created successfully!");
            } else {
                alert(response.message || "Failed to create channel");
            }
        } catch (error: any) {
            console.error("Error creating channel:", error);
            alert(error.response?.data?.message || "Failed to create channel");
        } finally {
            setIsLoading(false);
        }
    };

    const handleUploadVideo = async (e: React.FormEvent): Promise<void> => {
        e.preventDefault();

        if (!user) return;
        if (!uploadData.title.trim() || !uploadData.videoUrl.trim() || !uploadData.thumbnailUrl.trim()) {
            alert("Title, video URL and thumbnail URL are required");
            return;
        }

        try {
            setIsLoading(true);
            setUploadProgress(0);

            // Simulate upload progress
            const interval = setInterval(() => {
                setUploadProgress(prev => {
                    if (prev >= 90) {
                        clearInterval(interval);
                        return 90;
                    }
                    return prev + 10;
                });
            }, 500);

            const response = await uploadVideo({
                title: uploadData.title,
                description: uploadData.description,
                videoUrl: uploadData.videoUrl,
                thumbnailUrl: uploadData.thumbnailUrl,
                duration: uploadData.duration,
                uploadedBy: user._id,
            });

            clearInterval(interval);
            setUploadProgress(100);

            if (response.success) {
                alert("Video uploaded successfully!");
                setShowUploadModal(false);
                setUploadData({
                    title: "",
                    description: "",
                    videoUrl: "",
                    thumbnailUrl: "",
                    duration: 0,
                });
                await fetchVideos();
            } else {
                alert(response.message || "Failed to upload video");
            }
        } catch (error: any) {
            console.error("Error uploading video:", error);
            alert(error.response?.data?.message || "Failed to upload video");
        } finally {
            setIsLoading(false);
            setUploadProgress(0);
        }
    };

    const handleVideoClick = async (videoId: string): Promise<void> => {
        try {
            await incrementViews(videoId);
            window.location.href = `/video/${videoId}`;
        } catch (error) {
            console.error("Error updating views:", error);
        }
    };

    const formatDuration = (seconds: number): string => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const formatViews = (views: number): string => {
        if (views >= 1000000) return `${(views / 1000000).toFixed(1)}M`;
        if (views >= 1000) return `${(views / 1000).toFixed(1)}K`;
        return views.toString();
    };

    const getInitialAvatar = (name: string): string => {
        return name.charAt(0).toUpperCase();
    };

    const getRandomColor = (name: string): string => {
        const colors = [
            'bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-yellow-500',
            'bg-indigo-500', 'bg-pink-500', 'bg-purple-500', 'bg-orange-500',
            'bg-teal-500', 'bg-cyan-500'
        ];
        let hash = 0;
        for (let i = 0; i < name.length; i++) {
            hash = name.charCodeAt(i) + ((hash << 5) - hash);
        }
        return colors[Math.abs(hash) % colors.length];
    };

    const resetForm = (): void => {
        setFormData({
            channelName: "",
            description: "",
            bannerUrl: "",
        });
    };

    if (isLoading && !channel) {
        return (
            <div className={`min-h-screen ${bgColor} ${textColor} flex items-center justify-center`}>
                <div className="text-center">
                    <div className={`animate-spin rounded-full h-12 w-12 border-b-2 ${spinnerBorder} mx-auto`}></div>
                    <p className={`mt-4 ${mutedText}`}>Loading...</p>
                </div>
            </div>
        );
    }

    if (!user) {
        return (
            <div className={`min-h-screen ${bgColor} ${textColor} flex items-center justify-center`}>
                <div className="text-center">
                    <h2 className="text-2xl font-bold mb-4">Please Login</h2>
                    <p className={mutedText}>You need to be logged in to view your channel</p>
                </div>
            </div>
        );
    }

    return (
        <div className={`min-h-screen ${bgColor} ${textColor}`}>
            {channel ? (
                // Existing Channel View
                <div className="relative">
                    {/* Banner Section */}
                    <div className={`h-48 md:h-64 ${bannerBg} relative`}>
                        {channel.bannerUrl ? (
                            <img
                                src={channel.bannerUrl}
                                alt="Channel Banner"
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                    (e.target as HTMLImageElement).style.display = 'none';
                                    (e.target as HTMLImageElement).parentElement?.classList.add('bg-gradient-to-r', 'from-gray-800', 'to-gray-900');
                                }}
                            />
                        ) : (
                            <div className={`w-full h-full ${bannerBg} flex items-center justify-center`}>
                                <div className="text-center">
                                    <div className="text-6xl mb-2">🎬</div>
                                    <p className={bannerText}>Your Banner Here</p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Channel Info Section */}
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className={`${cardBg} rounded-lg p-6 shadow-xl ${isLight ? 'border border-gray-200' : ''}`}>
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                <div className="flex items-center gap-4">
                                    {/* Channel Avatar - Custom color based on channel name */}
                                    <div className={`w-24 h-24 md:w-32 md:h-32 ${getRandomColor(channel.channelName)} rounded-full flex items-center justify-center text-4xl font-bold ${channelAvatarText} shadow-lg ${isLight ? 'border-4 border-white' : ''}`}>
                                        {getInitialAvatar(channel.channelName)}
                                    </div>

                                    <div>
                                        <h1 className="text-3xl md:text-4xl font-bold">
                                            {channel.channelName}
                                        </h1>
                                        <p className={`${mutedText} mt-1`}>
                                            {channel.subscribers.toLocaleString()} subscribers
                                        </p>
                                        {channel.description && (
                                            <p className={`${isLight ? 'text-gray-700' : 'text-gray-300'} mt-2 max-w-2xl`}>
                                                {channel.description}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                <button
                                    onClick={() => setShowUploadModal(true)}
                                    className={`px-6 py-2 ${buttonPrimary} ${buttonPrimaryText} rounded-full transition-colors text-sm font-medium flex items-center gap-2`}
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                    </svg>
                                    Upload Video
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Videos Section */}
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                        <h2 className={`text-2xl font-bold mb-6 ${textColor}`}>Your Videos</h2>
                        {videos.length === 0 ? (
                            <div className={`${bgColorSecondary} rounded-lg p-12 text-center ${isLight ? 'border border-gray-200' : ''}`}>
                                <div className="text-6xl mb-4">🎥</div>
                                <p className={`${mutedText} text-lg mb-4`}>No videos uploaded yet</p>
                                <button
                                    onClick={() => setShowUploadModal(true)}
                                    className={`px-6 py-3 ${buttonPrimary} ${buttonPrimaryText} rounded-full transition-colors font-medium`}
                                >
                                    Upload Your First Video
                                </button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                {videos.map((video) => (
                                    <div
                                        key={video._id}
                                        onClick={() => handleVideoClick(video._id)}
                                        className={`${bgColorSecondary} rounded-lg overflow-hidden ${cardBgHover} transition-all cursor-pointer group ${isLight ? 'border border-gray-200 shadow-sm' : ''}`}
                                    >
                                        {/* Thumbnail */}
                                        <div className="relative">
                                            <img
                                                src={video.thumbnailUrl}
                                                alt={video.title}
                                                className="w-full aspect-video object-cover group-hover:scale-105 transition-transform duration-300"
                                                onError={(e) => {
                                                    (e.target as HTMLImageElement).src = 'https://via.placeholder.com/640x360?text=No+Thumbnail';
                                                }}
                                            />
                                            <div className="absolute bottom-2 right-2 bg-black bg-opacity-80 text-white text-xs px-2 py-1 rounded">
                                                {formatDuration(video.duration)}
                                            </div>
                                        </div>

                                        {/* Video Info */}
                                        <div className="p-4">
                                            <h3 className={`font-semibold ${textColor} line-clamp-2 mb-2`}>
                                                {video.title}
                                            </h3>
                                            <p className={`${mutedText} text-sm`}>
                                                {formatViews(video.views)} views
                                            </p>
                                            <div className={`flex items-center gap-4 mt-2 text-xs ${mutedText}`}>
                                                <span className="flex items-center gap-1">
                                                    👍 {video.likes}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    👎 {video.dislikes}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                // No Channel Found - Create Channel UI
                <div className="min-h-screen flex items-center justify-center px-4">
                    <div className="max-w-md w-full">
                        <div className={`${bgColorSecondary} rounded-2xl p-8 text-center ${isLight ? 'border border-gray-200' : ''}`}>
                            {/* Icon */}
                            <div className={`w-24 h-24 ${isLight ? 'bg-gray-200' : 'bg-gray-800'} rounded-full flex items-center justify-center mx-auto mb-6`}>
                                <svg
                                    className={`w-12 h-12 ${mutedText}`}
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                                    />
                                </svg>
                            </div>

                            <h2 className={`text-2xl font-bold mb-2 ${textColor}`}>Create Your Channel</h2>
                            <p className={`${mutedText} mb-6`}>
                                You don't have a channel yet. Create one to start uploading videos and building your audience!
                            </p>

                            <button
                                onClick={() => setShowCreateModal(true)}
                                className={`px-6 py-3 ${buttonPrimary} ${buttonPrimaryText} rounded-full font-semibold transition-colors w-full`}
                            >
                                Create Channel
                            </button>
                        </div>

                        {/* Features Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
                            <div className={`${bgColorSecondary} rounded-lg p-4 text-center ${isLight ? 'border border-gray-200' : ''}`}>
                                <div className="text-2xl mb-2">📹</div>
                                <h3 className={`font-semibold ${textColor} mb-1`}>Upload Videos</h3>
                                <p className={`text-xs ${mutedText}`}>Share your content</p>
                            </div>
                            <div className={`${bgColorSecondary} rounded-lg p-4 text-center ${isLight ? 'border border-gray-200' : ''}`}>
                                <div className="text-2xl mb-2">👥</div>
                                <h3 className={`font-semibold ${textColor} mb-1`}>Grow Audience</h3>
                                <p className={`text-xs ${mutedText}`}>Build subscribers</p>
                            </div>
                            <div className={`${bgColorSecondary} rounded-lg p-4 text-center ${isLight ? 'border border-gray-200' : ''}`}>
                                <div className="text-2xl mb-2">💰</div>
                                <h3 className={`font-semibold ${textColor} mb-1`}>Monetize</h3>
                                <p className={`text-xs ${mutedText}`}>Earn from content</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Create Channel Modal */}
            {showCreateModal && (
                <div className={`fixed inset-0 ${overlayBg} flex items-center justify-center z-50 p-4`}>
                    <div className={`${modalBg} rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto ${isLight ? 'border border-gray-200 shadow-2xl' : ''}`}>
                        <div className={`sticky top-0 ${modalBg} p-6 border-b ${isLight ? 'border-gray-200' : 'border-gray-800'}`}>
                            <div className="flex justify-between items-center">
                                <h2 className={`text-2xl font-bold ${textColor}`}>Create New Channel</h2>
                                <button
                                    onClick={() => {
                                        setShowCreateModal(false);
                                        resetForm();
                                    }}
                                    className={`${mutedText} hover:${isLight ? 'text-black' : 'text-white'} transition-colors`}
                                >
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                        </div>

                        <form onSubmit={handleCreateChannel} className="p-6 space-y-4">
                            <div>
                                <label className={`block text-sm font-medium mb-2 ${textColor}`}>
                                    Channel Name *
                                </label>
                                <input
                                    type="text"
                                    value={formData.channelName}
                                    onChange={(e) =>
                                        setFormData({ ...formData, channelName: e.target.value })
                                    }
                                    className={`w-full px-4 py-2 ${inputBg} border ${inputBorder} rounded-lg focus:outline-none ${inputFocus} ${textColor}`}
                                    placeholder="e.g., Tech Reviews, Gaming Central"
                                    required
                                    maxLength={50}
                                    disabled={isLoading}
                                />
                                <p className={`text-xs ${mutedText} mt-1`}>
                                    {formData.channelName.length}/50 characters
                                </p>
                            </div>

                            <div>
                                <label className={`block text-sm font-medium mb-2 ${textColor}`}>
                                    Description
                                </label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) =>
                                        setFormData({ ...formData, description: e.target.value })
                                    }
                                    className={`w-full px-4 py-2 ${inputBg} border ${inputBorder} rounded-lg focus:outline-none ${inputFocus} ${textColor}`}
                                    placeholder="Tell viewers what your channel is about..."
                                    rows={4}
                                    maxLength={500}
                                    disabled={isLoading}
                                />
                                <p className={`text-xs ${mutedText} mt-1`}>
                                    {formData.description.length}/500 characters
                                </p>
                            </div>

                            <div>
                                <label className={`block text-sm font-medium mb-2 ${textColor}`}>
                                    Banner URL (Optional)
                                </label>
                                <input
                                    type="url"
                                    value={formData.bannerUrl}
                                    onChange={(e) =>
                                        setFormData({ ...formData, bannerUrl: e.target.value })
                                    }
                                    className={`w-full px-4 py-2 ${inputBg} border ${inputBorder} rounded-lg focus:outline-none ${inputFocus} ${textColor}`}
                                    placeholder="https://example.com/banner.jpg"
                                    disabled={isLoading}
                                />
                                <p className={`text-xs ${mutedText} mt-1`}>
                                    Add a banner image to personalize your channel
                                </p>
                            </div>

                            <div className="pt-4 flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowCreateModal(false);
                                        resetForm();
                                    }}
                                    className={`flex-1 px-4 py-2 ${buttonSecondary} ${buttonSecondaryText} rounded-lg font-semibold transition-colors`}
                                    disabled={isLoading}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className={`flex-1 px-4 py-2 ${buttonPrimary} ${buttonPrimaryText} rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
                                >
                                    {isLoading ? "Creating..." : "Create Channel"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Upload Video Modal */}
            {showUploadModal && (
                <div className={`fixed inset-0 ${overlayBg} flex items-center justify-center z-50 p-4`}>
                    <div className={`${modalBg} rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto ${isLight ? 'border border-gray-200 shadow-2xl' : ''}`}>
                        <div className={`sticky top-0 ${modalBg} p-6 border-b ${isLight ? 'border-gray-200' : 'border-gray-800'}`}>
                            <div className="flex justify-between items-center">
                                <h2 className={`text-2xl font-bold ${textColor}`}>Upload Video</h2>
                                <button
                                    onClick={() => {
                                        setShowUploadModal(false);
                                        setUploadData({
                                            title: "",
                                            description: "",
                                            videoUrl: "",
                                            thumbnailUrl: "",
                                            duration: 0,
                                        });
                                    }}
                                    className={`${mutedText} hover:${isLight ? 'text-black' : 'text-white'} transition-colors`}
                                >
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                        </div>

                        <form onSubmit={handleUploadVideo} className="p-6 space-y-4">
                            <div>
                                <label className={`block text-sm font-medium mb-2 ${textColor}`}>
                                    Video Title *
                                </label>
                                <input
                                    type="text"
                                    value={uploadData.title}
                                    onChange={(e) =>
                                        setUploadData({ ...uploadData, title: e.target.value })
                                    }
                                    className={`w-full px-4 py-2 ${inputBg} border ${inputBorder} rounded-lg focus:outline-none ${inputFocus} ${textColor}`}
                                    placeholder="Enter video title"
                                    required
                                    maxLength={100}
                                    disabled={isLoading}
                                />
                            </div>

                            <div>
                                <label className={`block text-sm font-medium mb-2 ${textColor}`}>
                                    Description
                                </label>
                                <textarea
                                    value={uploadData.description}
                                    onChange={(e) =>
                                        setUploadData({ ...uploadData, description: e.target.value })
                                    }
                                    className={`w-full px-4 py-2 ${inputBg} border ${inputBorder} rounded-lg focus:outline-none ${inputFocus} ${textColor}`}
                                    placeholder="Enter video description"
                                    rows={4}
                                    disabled={isLoading}
                                />
                            </div>

                            <div>
                                <label className={`block text-sm font-medium mb-2 ${textColor}`}>
                                    Video URL *
                                </label>
                                <input
                                    type="url"
                                    value={uploadData.videoUrl}
                                    onChange={(e) =>
                                        setUploadData({ ...uploadData, videoUrl: e.target.value })
                                    }
                                    className={`w-full px-4 py-2 ${inputBg} border ${inputBorder} rounded-lg focus:outline-none ${inputFocus} ${textColor}`}
                                    placeholder="https://example.com/video.mp4"
                                    required
                                    disabled={isLoading}
                                />
                            </div>

                            <div>
                                <label className={`block text-sm font-medium mb-2 ${textColor}`}>
                                    Thumbnail URL *
                                </label>
                                <input
                                    type="url"
                                    value={uploadData.thumbnailUrl}
                                    onChange={(e) =>
                                        setUploadData({ ...uploadData, thumbnailUrl: e.target.value })
                                    }
                                    className={`w-full px-4 py-2 ${inputBg} border ${inputBorder} rounded-lg focus:outline-none ${inputFocus} ${textColor}`}
                                    placeholder="https://example.com/thumbnail.jpg"
                                    required
                                    disabled={isLoading}
                                />
                            </div>

                            <div>
                                <label className={`block text-sm font-medium mb-2 ${textColor}`}>
                                    Duration (seconds)
                                </label>
                                <input
                                    type="number"
                                    value={uploadData.duration}
                                    onChange={(e) =>
                                        setUploadData({ ...uploadData, duration: parseInt(e.target.value) || 0 })
                                    }
                                    className={`w-full px-4 py-2 ${inputBg} border ${inputBorder} rounded-lg focus:outline-none ${inputFocus} ${textColor}`}
                                    placeholder="Enter video duration in seconds"
                                    min={0}
                                    disabled={isLoading}
                                />
                            </div>

                            {uploadProgress > 0 && (
                                <div>
                                    <div className={`w-full ${isLight ? 'bg-gray-200' : 'bg-gray-700'} rounded-full h-2`}>
                                        <div
                                            className={`${isLight ? 'bg-black' : 'bg-red-600'} h-2 rounded-full transition-all duration-300`}
                                            style={{ width: `${uploadProgress}%` }}
                                        />
                                    </div>
                                    <p className={`text-xs ${mutedText} mt-1 text-center`}>
                                        {uploadProgress}% uploaded
                                    </p>
                                </div>
                            )}

                            <div className="pt-4 flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowUploadModal(false);
                                        setUploadData({
                                            title: "",
                                            description: "",
                                            videoUrl: "",
                                            thumbnailUrl: "",
                                            duration: 0,
                                        });
                                    }}
                                    className={`flex-1 px-4 py-2 ${buttonSecondary} ${buttonSecondaryText} rounded-lg font-semibold transition-colors`}
                                    disabled={isLoading}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className={`flex-1 px-4 py-2 ${buttonPrimary} ${buttonPrimaryText} rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
                                >
                                    {isLoading ? "Uploading..." : "Upload Video"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ChannelPage;