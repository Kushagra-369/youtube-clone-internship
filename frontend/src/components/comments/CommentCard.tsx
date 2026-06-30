import { useState, useEffect } from "react";
import {
    likeComment,
    dislikeComment,
    translateComment,
} from "../../services/comment.service";
import type { Comment } from "../../types/comment.types";
import { getThemeByLocationAndTime } from "../utils/theme";

interface Props {
    comment: Comment;
    refreshComments: () => Promise<void>;
    currentUserId?: string;
}

const CommentCard = ({
    comment,
    refreshComments,
    currentUserId
}: Props) => {
    const [translatedText, setTranslatedText] = useState<string>("");
    const [targetLanguage, setTargetLanguage] = useState<string>("en");
    const [isTranslating, setIsTranslating] = useState<boolean>(false);
    const [isLiked, setIsLiked] = useState<boolean>(false);
    const [isDisliked, setIsDisliked] = useState<boolean>(false);
    const [localLikes, setLocalLikes] = useState<number>(comment.likes || 0);
    const [localDislikes, setLocalDislikes] = useState<number>(comment.dislikes || 0);
    const [showReplyForm, setShowReplyForm] = useState<boolean>(false);
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
    const textColor = isLight ? "text-black" : "text-white";
    const mutedText = isLight ? "text-gray-600" : "text-[#aaaaaa]";
    const borderColor = isLight ? "border-gray-200" : "border-[#272727]";
    const hoverBg = isLight ? "hover:bg-gray-50" : "hover:bg-[#1a1a1a]";
    const avatarBg = isLight ? "bg-gray-200" : "bg-[#272727]";
    const avatarText = isLight ? "text-gray-800" : "text-white";
    const avatarBorder = isLight ? "border-2 border-gray-300" : "";
    const translateBg = isLight ? "bg-gray-100" : "bg-[#1a1a1a]";
    const translateBorder = isLight ? "border-gray-300" : "border-[#272727]";
    const translateText = isLight ? "text-blue-600" : "text-[#3ea6ff]";
    const likeColor = isLiked ? (isLight ? "text-blue-600" : "text-[#3ea6ff]") : (isLight ? "text-gray-500" : "text-[#aaaaaa]");
    const likeHover = isLight ? "hover:text-black" : "hover:text-white";
    const dislikeColor = isDisliked ? "text-red-500" : (isLight ? "text-gray-500" : "text-[#aaaaaa]");
    const dislikeHover = isLight ? "hover:text-black" : "hover:text-white";
    const selectBg = isLight ? "bg-white" : "bg-[#272727]";
    const selectBorder = isLight ? "border-gray-300" : "border-[#3a3a3a]";
    const selectText = isLight ? "text-gray-800" : "text-white";
    const selectFocus = isLight ? "focus:border-black" : "focus:border-[#3ea6ff]";
    const replyInputBg = isLight ? "bg-white" : "bg-transparent";
    const replyBorder = isLight ? "border-gray-300" : "border-[#3a3a3a]";
    const replyFocus = isLight ? "focus:border-black" : "focus:border-[#3ea6ff]";

    const handleLike = async (): Promise<void> => {
        if (!currentUserId) {
            alert("Please sign in first");
            return;
        }
        try {
            if (isLiked) {
                setLocalLikes(localLikes - 1);
                setIsLiked(false);
            } else {
                setLocalLikes(localLikes + 1);
                setIsLiked(true);
                if (isDisliked) {
                    setLocalDislikes(localDislikes - 1);
                    setIsDisliked(false);
                }
            }
            await likeComment(comment._id, currentUserId);
            await refreshComments();
        } catch (error) {
            console.error("Like Error:", error);
        }
    };

    const handleDislike = async (): Promise<void> => {
        if (!currentUserId) {
            alert("Please sign in first");
            return;
        }
        try {
            if (isDisliked) {
                setLocalDislikes(localDislikes - 1);
                setIsDisliked(false);
            } else {
                setLocalDislikes(localDislikes + 1);
                setIsDisliked(true);
                if (isLiked) {
                    setLocalLikes(localLikes - 1);
                    setIsLiked(false);
                }
            }
            await dislikeComment(comment._id, currentUserId);
            await refreshComments();
        } catch (error) {
            console.error("Dislike Error:", error);
        }
    };

    const handleTranslate = async (): Promise<void> => {
        try {
            setIsTranslating(true);

            const response = await translateComment(
                comment.text,
                targetLanguage
            );

            console.log(response);

            setTranslatedText(
                response.translatedText || "Translation unavailable"
            );

        } catch (error) {
            console.error("Translation Error:", error);
        } finally {
            setIsTranslating(false);
        }
    };

    const formatDate = (date?: string): string => {
        if (!date) return "Recently";
        const commentDate = new Date(date);
        const now = new Date();
        const diffDays = Math.floor((now.getTime() - commentDate.getTime()) / (1000 * 60 * 60 * 24));

        if (diffDays === 0) return "Today";
        if (diffDays === 1) return "Yesterday";
        if (diffDays < 7) return `${diffDays} days ago`;
        if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
        if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
        return `${Math.floor(diffDays / 365)} years ago`;
    };

    return (
        <div className={`flex gap-4 py-4 border-b ${borderColor} ${hoverBg} transition px-2 rounded-lg ${isLight ? 'border-l-2 border-l-transparent hover:border-l-gray-400' : ''}`}>
            {/* Avatar */}
            <div className="shrink-0">
                <div className={`w-10 h-10 rounded-full ${avatarBg} ${avatarBorder} flex items-center justify-center`}>
                    <span className={`${avatarText} text-sm font-medium`}>
                        {comment.userName?.[0] || comment.city?.[0] || "U"}
                    </span>
                </div>
            </div>

            {/* Comment Content */}
            <div className="flex-1 min-w-0">
                {/* Header */}
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className={`${textColor} text-sm font-medium hover:underline cursor-pointer`}>
                        {comment.userName || "Anonymous User"}
                    </span>
                    <span className={`${mutedText} text-xs`}>
                        {formatDate(comment.createdAt)}
                    </span>
                </div>

                {/* Comment Text */}
                <p className={`${textColor} text-sm mb-2 wrap-break-words`}>
                    {comment.text}
                </p>

                {/* Location */}
                {comment.city && (
                    <p className={`${mutedText} text-xs mb-2 flex items-center gap-1`}>
                        <span>📍</span> {comment.city}
                    </p>
                )}

                {/* Translated Text */}
                {translatedText && (
                    <div className={`${translateBg} rounded-lg p-2 mb-2 border ${translateBorder}`}>
                        <p className={`${translateText} text-xs mb-1`}>🌐 Translated ({targetLanguage.toUpperCase()}):</p>
                        <p className={`${textColor} text-sm`}>{translatedText}</p>
                    </div>
                )}

                {/* Action Buttons */}
                <div className="flex items-center gap-4 mt-2 flex-wrap">
                    {/* Like Button */}
                    <button
                        onClick={handleLike}
                        className={`flex items-center gap-1 transition ${likeColor} ${likeHover}`}
                    >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
                        </svg>
                        <span className="text-xs">{localLikes}</span>
                    </button>

                    {/* Dislike Button */}
                    <button
                        onClick={handleDislike}
                        className={`flex items-center gap-1 transition ${dislikeColor} ${dislikeHover}`}
                    >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.736 3h4.018c.163 0 .326.02.485.06L17 4m-7 10v5a2 2 0 002 2h.095c.5 0 .905-.405.905-.905 0-.714.211-1.412.608-2.006L17 13V4m-7 10h2m5-10h2a2 2 0 012 2v6a2 2 0 01-2 2h-2.5" />
                        </svg>
                        <span className="text-xs">{localDislikes}</span>
                    </button>

                    {/* Reply Button */}
                    <button
                        onClick={() => setShowReplyForm(!showReplyForm)}
                        className={`${mutedText} text-xs hover:${isLight ? 'text-black' : 'text-white'} transition font-medium`}
                    >
                        Reply
                    </button>

                    {/* Translate Section */}
                    <div className="flex items-center gap-2 ml-auto">
                        <select
                            value={targetLanguage}
                            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setTargetLanguage(e.target.value)}
                            className={`${selectBg} ${selectText} text-xs px-2 py-1 rounded border ${selectBorder} ${selectFocus} focus:outline-none cursor-pointer`}
                        >
                            <option value="en">English</option>
                            <option value="hi">Hindi</option>
                            <option value="fr">French</option>
                            <option value="de">German</option>
                            <option value="es">Spanish</option>
                            <option value="ar">Arabic</option>
                            <option value="zh">Chinese</option>
                            <option value="ja">Japanese</option>
                        </select>

                        <button
                            onClick={handleTranslate}
                            disabled={isTranslating}
                            className={`${translateText} text-xs hover:${isLight ? 'text-blue-800' : 'text-[#65b8ff]'} transition disabled:opacity-50`}
                        >
                            {isTranslating ? "..." : "Translate"}
                        </button>
                    </div>
                </div>

                {/* Reply Form */}
                {showReplyForm && (
                    <div className="mt-4 pl-10">
                        <div className="flex gap-3">
                            <div className={`w-8 h-8 rounded-full ${avatarBg} ${isLight ? 'border-2 border-gray-300' : ''} flex items-center justify-center shrink-0`}>
                                <svg className={`w-4 h-4 ${isLight ? 'text-gray-600' : 'text-[#aaaaaa]'}`} fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                                </svg>
                            </div>
                            <div className="flex-1">
                                <input
                                    type="text"
                                    placeholder="Add a reply..."
                                    className={`w-full ${replyInputBg} border-b ${replyBorder} ${textColor} py-1 text-sm focus:outline-none ${replyFocus} placeholder:${isLight ? 'text-gray-400' : 'text-[#aaaaaa]'}`}
                                />
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CommentCard;