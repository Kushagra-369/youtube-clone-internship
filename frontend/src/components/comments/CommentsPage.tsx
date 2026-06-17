import { useEffect, useState } from "react";
import { getComments } from "../../services/comment.service";
import type { Comment } from "../../types/comment.types";
import CommentForm from "./CommentForm";
import CommentCard from "./CommentCard";
import { getThemeByLocationAndTime } from "../utils/theme";

interface CommentsPageProps {
    videoId?: string;
}

const CommentsPage = ({ videoId }: CommentsPageProps) => {
    const [comments, setComments] = useState<Comment[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [sortBy, setSortBy] = useState<"top" | "newest">("top");
    const [user, setUser] = useState<any>(null);
    
    const currentUser = JSON.parse(
        localStorage.getItem("user") || "null"
    );

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
    const cardBg = isLight ? "bg-white" : "bg-[#0f0f0f]";
    const spinnerBorder = isLight ? "border-gray-300" : "border-white";
    const spinnerAccent = isLight ? "border-t-gray-600" : "border-t-transparent";
    const emptyIconColor = isLight ? "text-gray-300" : "text-[#272727]";
    const emptyText = isLight ? "text-gray-500" : "text-[#aaaaaa]";
    const sortBtnActive = isLight ? "bg-black text-white" : "bg-[#3ea6ff] text-black";
    const sortBtnInactive = isLight ? "text-gray-600 hover:text-black" : "text-[#aaaaaa] hover:text-white";

    const fetchComments = async (): Promise<void> => {
        try {
            setLoading(true);
            const response = await getComments(videoId);
            const commentsData = response.data || response;
            setComments(Array.isArray(commentsData) ? commentsData : []);
        } catch (error) {
            console.error("Error fetching comments:", error);
            setComments([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchComments();
    }, [videoId]);

    const sortedComments = [...comments].sort((a, b) => {
        if (sortBy === "top") {
            return (b.likes || 0) - (a.likes || 0);
        } else {
            return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
        }
    });

    if (loading) {
        return (
            <div className="flex justify-center py-8">
                <div className={`animate-spin rounded-full h-8 w-8 border-2 ${spinnerBorder} ${spinnerAccent}`}></div>
            </div>
        );
    }

    return (
        <div className={`mt-6 ${cardBg} rounded-xl p-4 ${isLight ? 'border border-gray-200 shadow-sm' : ''}`}>
            {/* Comments Header */}
            <div className="flex items-center justify-between mb-6">
                <h3 className={`${textColor} text-xl font-bold`}>
                    Comments • {comments.length}
                </h3>

                {/* Sort Options */}
                <div className="flex items-center gap-2">
                    <span className={`${mutedText} text-sm`}>Sort by:</span>
                    <button
                        onClick={() => setSortBy("top")}
                        className={`px-3 py-1 text-sm rounded-full transition ${
                            sortBy === "top"
                                ? sortBtnActive
                                : sortBtnInactive
                        }`}
                    >
                        Top
                    </button>
                    <button
                        onClick={() => setSortBy("newest")}
                        className={`px-3 py-1 text-sm rounded-full transition ${
                            sortBy === "newest"
                                ? sortBtnActive
                                : sortBtnInactive
                        }`}
                    >
                        Newest
                    </button>
                </div>
            </div>

            {/* Comment Form */}
            <CommentForm onCommentCreated={fetchComments} videoId={videoId} />

            {/* Comments List - Max height with scroll */}
            <div className={`max-h-150 overflow-y-auto pr-2 custom-scrollbar ${isLight ? 'scrollbar-light' : ''}`}>
                {comments.length === 0 ? (
                    <div className="text-center py-12">
                        <svg className={`w-16 h-16 ${emptyIconColor} mx-auto mb-4`} fill="currentColor" viewBox="0 0 24 24">
                            <path d="M20 2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h14l4 4V4c0-1.1-.9-2-2-2z" />
                        </svg>
                        <p className={emptyText}>No comments yet. Be the first to comment!</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {sortedComments.map((comment: Comment) => (
                            <CommentCard
                                key={comment._id}
                                comment={comment}
                                refreshComments={fetchComments}
                                currentUserId={currentUser?._id}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default CommentsPage;