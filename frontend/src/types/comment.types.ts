// types/comment.types.ts
export interface Comment {
    _id: string;
    text: string;
    city: string;
    likes: number;
    dislikes: number;
    userId: string;      // Required (not optional)
    userName: string;    // Required (not optional)
    videoId: string;     // Required (not optional)
    likedBy: string[];
    dislikedBy: string[];
    createdAt: string;
    updatedAt: string;
}

export interface CreateCommentData {
    text: string;
    city: string;
    userId: string;      // Required
    videoId: string;     // Required
}

export interface LikeDislikeData {
    commentId: string;
    userId: string;
}

export interface TranslateData {
    text: string;
    target: string;
}

// For API responses
export interface CommentsResponse {
    success: boolean;
    count?: number;
    data: Comment[];
    message?: string;
}

export interface CommentResponse {
    success: boolean;
    data: Comment;
    message?: string;
}

export interface TranslateResponse {
    success: boolean;
    translatedText: string;
    message?: string;
}