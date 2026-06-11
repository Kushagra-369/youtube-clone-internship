import axios from "axios";
import { API_URL } from "../config/api";

export const getComments = async () => {
  const response = await axios.get(
    `${API_URL}/get_comments`
  );

  return response.data;
};

export const createComment = async (
  text: string,
  city: string
) => {
  const response = await axios.post(
    `${API_URL}/create_comments`,
    {
      text,
      city,
    }
  );

  return response.data;
};

export const likeComment = async (
  commentId: string,
  userId: string
) => {
  const response = await axios.patch(
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
) => {
  const response = await axios.patch(
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
) => {
  const response = await axios.post(
    `${API_URL}/translate`,
    {
      text,
      target,
    }
  );

  return response.data;
};