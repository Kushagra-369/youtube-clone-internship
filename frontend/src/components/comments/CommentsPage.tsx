import { useEffect, useState } from "react";
import { getComments } from "../../services/comment.service";
import type { Comment } from "../../types/comment.types";
import CommentForm from "./CommentForm";
import CommentCard from "./CommentCard";
const CommentsPage = () => {
    const [comments, setComments] = useState<Comment[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchComments = async (): Promise<void> => {
        try {
            const response = await getComments();

            setComments(response.data);
        } catch (error) {
            console.error("Error fetching comments:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchComments();
    }, []);

    if (loading) {
        return <h2>Loading...</h2>;
    }

    return (
        <div className="p-5">
            <h1 className="text-3xl font-bold mb-5">
                Comments
            </h1>
            <CommentForm
                onCommentCreated={fetchComments}
            />
            {comments.length === 0 ? (
                <p>No comments found.</p>
            ) : (
                comments.map((comment) => (
                    <CommentCard
                        key={comment._id}
                        comment={comment}
                        refreshComments={fetchComments}
                    />
                ))
            )}
        </div>
    );
};

export default CommentsPage;