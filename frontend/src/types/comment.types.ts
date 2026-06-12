// types/comment.types.ts
export interface Comment {
    _id: string;
    text: string;
    city: string;
    likes: number;
    dislikes: number;
    userId?: string;
    userName?: string;
    videoId?: string;
    createdAt?: string;
    updatedAt?: string;
}

export interface CreateCommentData {
    text: string;
    city: string;
    videoId?: string;
}

export interface LikeDislikeData {
    commentId: string;
    userId: string;
}

export interface TranslateData {
    text: string;
    target: string;
}