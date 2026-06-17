import axios from "axios";

const API_URL =
  "http://localhost:1928";

export const createUser = async (
  name: string,
  email: string,
  state: string

) => {
  const response = await axios.post(
    `${API_URL}/create-user`,
    {
      name,
      email,state
    }
  );

  return response.data;
};

export const getUserByEmail = async (
  email: string
) => {
  const response = await axios.get(
    `${API_URL}/user/email/${email}`
  );

  return response.data;
};

export const upgradeToPremium = async (
  userId: string
) => {
  const response = await axios.patch(
    `${API_URL}/upgrade-premium/${userId}`
  );

  return response.data;
};

// frontend/src/services/user.service.ts

export const upgradeWatchPlan = async (
  userId: string,
  watchPlan: string
) => {
  const response = await axios.patch(
    `${API_URL}/upgrade-watchplan/${userId}`,
    {
      watchPlan,
    }
  );

  return response.data;
};
