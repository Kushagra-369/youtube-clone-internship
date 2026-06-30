import axios from "axios";
import { API_URL } from "../config/api";
import type { Comment } from "../types/comment.types";

interface CreateCommentResponse {
    success: boolean;
    data: Comment;
    message?: string;
}

interface LikeDislikeResponse {
    success: boolean;
    data: Comment;
    message?: string;
}

interface TranslateResponse {
    translatedText: string;
    originalText: string;
    targetLanguage: string;
}

interface GetCommentsResponse {
    success: boolean;
    data: Comment[];
    total?: number;
}

export const getComments = async (videoId?: string): Promise<GetCommentsResponse> => {
    const url = videoId 
        ? `${API_URL}/get_comments?videoId=${videoId}`
        : `${API_URL}/get_comments`;
    
    const response = await axios.get<GetCommentsResponse>(url);
    return response.data;
};

export const createComment = async (
    text: string,
    city: string,
    videoId?: string,
    userId?: string
): Promise<CreateCommentResponse> => {
    const response = await axios.post<CreateCommentResponse>(
        `${API_URL}/create_comments`,
        {
            text,
            city,
            videoId,
            userId,  // Send userId to the backend
        }
    );
    return response.data;
};

export const likeComment = async (
    commentId: string,
    userId: string
): Promise<LikeDislikeResponse> => {
    const response = await axios.patch<LikeDislikeResponse>(
        `${API_URL}/like_comments/${commentId}/like`,
        {
            userId,
        }
    );
    return response.data;
};

export const dislikeComment = async (
    commentId: string,
    userId: string
): Promise<LikeDislikeResponse> => {
    const response = await axios.patch<LikeDislikeResponse>(
        `${API_URL}/dislike_comments/${commentId}/dislike`,
        {
            userId,
        }
    );
    return response.data;
};

export const translateComment = async (
    text: string,
    target: string
): Promise<TranslateResponse> => {

    const response = await axios.post(
        `${API_URL}/translate`,
        {
            text,
            target,
        }
    );

    console.log("Axios Response:", response.data);

    return response.data;
};