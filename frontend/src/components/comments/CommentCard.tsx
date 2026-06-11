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
}

const CommentCard = ({
    comment,
    refreshComments,
}: Props) => {
    const [translatedText, setTranslatedText] =
        useState("");

    const [targetLanguage, setTargetLanguage] =
        useState("en");

    const [isTranslating, setIsTranslating] =
        useState(false);

    const handleLike = async () => {
        try {
            await likeComment(comment._id, "user1");

            await refreshComments();
        } catch (error) {
            console.error("Like Error:", error);
        }
    };

    const handleDislike = async () => {
        try {
            await dislikeComment(comment._id, "user1");

            await refreshComments();
        } catch (error) {
            console.error("Dislike Error:", error);
        }
    };

    const handleTranslate = async () => {
        try {
            setIsTranslating(true);

            const response = await translateComment(
                comment.text,
                targetLanguage
            );

            setTranslatedText(
                response.translatedText
            );
        } catch (error) {
            console.error(
                "Translation Error:",
                error
            );
        } finally {
            setIsTranslating(false);
        }
    };

    return (
        <div className="border p-4 rounded-lg mb-4">
            <h3 className="font-medium text-lg">
                {comment.text}
            </h3>

            {translatedText && (
                <p className="mt-2 text-blue-600">
                    🌐 {translatedText}
                </p>
            )}

            <p className="text-sm text-gray-500 mt-2">
                📍 {comment.city}
            </p>

            <div className="flex gap-2 mt-3">
                <select
                    value={targetLanguage}
                    onChange={(e) =>
                        setTargetLanguage(
                            e.target.value
                        )
                    }
                    className="border p-1 rounded"
                >
                    <option value="en">
                        English
                    </option>

                    <option value="hi">
                        Hindi
                    </option>

                    <option value="fr">
                        French
                    </option>

                    <option value="de">
                        German
                    </option>
                </select>

                <button
                    onClick={handleTranslate}
                    disabled={isTranslating}
                    className="border px-3 py-1 rounded"
                >
                    {isTranslating
                        ? "Translating..."
                        : "Translate"}
                </button>
            </div>

            <div className="flex gap-4 mt-4">
                <button
                    onClick={handleLike}
                    className="border px-3 py-1 rounded"
                >
                    👍 {comment.likes}
                </button>

                <button
                    onClick={handleDislike}
                    className="border px-3 py-1 rounded"
                >
                    👎 {comment.dislikes}
                </button>
            </div>
        </div>
    );
};

export default CommentCard;