import axios from "axios";

const API_URL = "http://localhost:1928";

export const createChannel = async (
  ownerId: string,
  channelName: string,
  description: string,
  bannerUrl: string
) => {
  const response = await axios.post(
    `${API_URL}/channel/create`,
    {
      ownerId,
      channelName,
      description,
      bannerUrl,
    }
  );

  return response.data;
};

export const getChannelByOwner = async (
  ownerId: string
) => {
  const response = await axios.get(
    `${API_URL}/channel/${ownerId}`
  );

  return response.data;
};

export const subscribeChannel = async (
  channelId: string,
  userId: string
) => {
  const response = await axios.post(
    `${API_URL}/channel/${channelId}/subscribe`,
    { userId }
  );

  return response.data;
};

export const unsubscribeChannel = async (
  channelId: string,
  userId: string
) => {
  const response = await axios.post(
    `${API_URL}/channel/${channelId}/unsubscribe`,
    { userId }
  );

  return response.data;
};