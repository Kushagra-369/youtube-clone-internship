import { useState } from "react";
import {
    likeComment,
    dislikeComment,
    translateComment,
} from "../../services/comment.service";
import type { Comment } from "../../types/comment.types";

interface Props {
    comment: Comment;
    refreshComments: () => Promise<void>;
    currentUserId?: string;
}

const CommentCard = ({ comment, refreshComments, currentUserId = "user1" }: Props) => {
    const [translatedText, setTranslatedText] = useState<string>("");
    const [targetLanguage, setTargetLanguage] = useState<string>("en");
    const [isTranslating, setIsTranslating] = useState<boolean>(false);
    const [isLiked, setIsLiked] = useState<boolean>(false);
    const [isDisliked, setIsDisliked] = useState<boolean>(false);
    const [localLikes, setLocalLikes] = useState<number>(comment.likes || 0);
    const [localDislikes, setLocalDislikes] = useState<number>(comment.dislikes || 0);
    const [showReplyForm, setShowReplyForm] = useState<boolean>(false);

    const handleLike = async (): Promise<void> => {
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
            const response = await translateComment(comment.text, targetLanguage);
            setTranslatedText(response.translatedText);
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
        <div className="flex gap-4 py-4 border-b border-[#272727] hover:bg-[#1a1a1a] transition px-2 rounded-lg">
            {/* Avatar */}
            <div className="shrink-0">
                <div className="w-10 h-10 rounded-full bg-[#272727] flex items-center justify-center">
                    <span className="text-white text-sm font-medium">
                        {comment.userName?.[0] || comment.city?.[0] || "U"}
                    </span>
                </div>
            </div>

            {/* Comment Content */}
            <div className="flex-1 min-w-0">
                {/* Header */}
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="text-white text-sm font-medium hover:underline cursor-pointer">
                        {comment.userName || "Anonymous User"}
                    </span>
                    <span className="text-[#aaaaaa] text-xs">
                        {formatDate(comment.createdAt)}
                    </span>
                </div>

                {/* Comment Text */}
                <p className="text-white text-sm mb-2 wrap-break-words">
                    {comment.text}
                </p>

                {/* Location */}
                {comment.city && (
                    <p className="text-[#aaaaaa] text-xs mb-2 flex items-center gap-1">
                        <span>📍</span> {comment.city}
                    </p>
                )}

                {/* Translated Text */}
                {translatedText && (
                    <div className="bg-[#1a1a1a] rounded-lg p-2 mb-2 border border-[#272727]">
                        <p className="text-[#3ea6ff] text-xs mb-1">🌐 Translated ({targetLanguage.toUpperCase()}):</p>
                        <p className="text-white text-sm">{translatedText}</p>
                    </div>
                )}

                {/* Action Buttons */}
                <div className="flex items-center gap-4 mt-2 flex-wrap">
                    {/* Like Button */}
                    <button
                        onClick={handleLike}
                        className={`flex items-center gap-1 transition ${
                            isLiked ? "text-[#3ea6ff]" : "text-[#aaaaaa] hover:text-white"
                        }`}
                    >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
                        </svg>
                        <span className="text-xs">{localLikes}</span>
                    </button>

                    {/* Dislike Button */}
                    <button
                        onClick={handleDislike}
                        className={`flex items-center gap-1 transition ${
                            isDisliked ? "text-red-500" : "text-[#aaaaaa] hover:text-white"
                        }`}
                    >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.736 3h4.018c.163 0 .326.02.485.06L17 4m-7 10v5a2 2 0 002 2h.095c.5 0 .905-.405.905-.905 0-.714.211-1.412.608-2.006L17 13V4m-7 10h2m5-10h2a2 2 0 012 2v6a2 2 0 01-2 2h-2.5" />
                        </svg>
                        <span className="text-xs">{localDislikes}</span>
                    </button>

                    {/* Reply Button */}
                    <button
                        onClick={() => setShowReplyForm(!showReplyForm)}
                        className="text-[#aaaaaa] text-xs hover:text-white transition font-medium"
                    >
                        Reply
                    </button>

                    {/* Translate Section */}
                    <div className="flex items-center gap-2 ml-auto">
                        <select
                            value={targetLanguage}
                            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setTargetLanguage(e.target.value)}
                            className="bg-[#272727] text-white text-xs px-2 py-1 rounded border border-[#3a3a3a] focus:outline-none focus:border-[#3ea6ff] cursor-pointer"
                        >
                            <option value="en">English</option>
                            <option value="hi">हिंदी</option>
                            <option value="fr">Français</option>
                            <option value="de">Deutsch</option>
                            <option value="es">Español</option>
                            <option value="ar">العربية</option>
                            <option value="zh">中文</option>
                            <option value="ja">日本語</option>
                        </select>
                        
                        <button
                            onClick={handleTranslate}
                            disabled={isTranslating}
                            className="text-[#3ea6ff] text-xs hover:text-[#65b8ff] transition disabled:opacity-50"
                        >
                            {isTranslating ? "..." : "Translate"}
                        </button>
                    </div>
                </div>

                {/* Reply Form */}
                {showReplyForm && (
                    <div className="mt-4 pl-10">
                        <div className="flex gap-3">
                            <div className="w-8 h-8 rounded-full bg-[#272727] flex items-center justify-center shrink-0">
                                <svg className="w-4 h-4 text-[#aaaaaa]" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                                </svg>
                            </div>
                            <div className="flex-1">
                                <input
                                    type="text"
                                    placeholder="Add a reply..."
                                    className="w-full bg-transparent border-b border-[#3a3a3a] text-white py-1 text-sm focus:outline-none focus:border-[#3ea6ff] placeholder:text-[#aaaaaa]"
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