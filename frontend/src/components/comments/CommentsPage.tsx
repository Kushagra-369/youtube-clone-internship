import { useEffect, useState } from "react";
import { getComments } from "../../services/comment.service";
import type { Comment } from "../../types/comment.types";
import CommentForm from "./CommentForm";
import CommentCard from "./CommentCard";

interface CommentsPageProps {
    videoId?: string;
}

const CommentsPage = ({ videoId }: CommentsPageProps) => {
    const [comments, setComments] = useState<Comment[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [sortBy, setSortBy] = useState<"top" | "newest">("top");

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
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-white border-t-transparent"></div>
            </div>
        );
    }

    return (
        <div className="mt-6">
            {/* Comments Header */}
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-white text-xl font-bold">
                    Comments • {comments.length}
                </h3>
                
                {/* Sort Options */}
                <div className="flex items-center gap-2">
                    <span className="text-[#aaaaaa] text-sm">Sort by:</span>
                    <button
                        onClick={() => setSortBy("top")}
                        className={`px-3 py-1 text-sm rounded-full transition ${
                            sortBy === "top" 
                                ? "bg-[#3ea6ff] text-black" 
                                : "text-[#aaaaaa] hover:text-white"
                        }`}
                    >
                        Top
                    </button>
                    <button
                        onClick={() => setSortBy("newest")}
                        className={`px-3 py-1 text-sm rounded-full transition ${
                            sortBy === "newest" 
                                ? "bg-[#3ea6ff] text-black" 
                                : "text-[#aaaaaa] hover:text-white"
                        }`}
                    >
                        Newest
                    </button>
                </div>
            </div>

            {/* Comment Form */}
            <CommentForm onCommentCreated={fetchComments} videoId={videoId} />

            {/* Comments List - Max height with scroll */}
            <div className="max-h-150 overflow-y-auto pr-2 custom-scrollbar">
                {comments.length === 0 ? (
                    <div className="text-center py-12">
                        <svg className="w-16 h-16 text-[#272727] mx-auto mb-4" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M20 2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h14l4 4V4c0-1.1-.9-2-2-2z"/>
                        </svg>
                        <p className="text-[#aaaaaa]">No comments yet. Be the first to comment!</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {sortedComments.map((comment: Comment) => (
                            <CommentCard
                                key={comment._id}
                                comment={comment}
                                refreshComments={fetchComments}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default CommentsPage;