import axios from "axios";

const API_URL =
  "http://localhost:1928";

export const createUser = async (
  name: string,
  email: string
) => {
  const response = await axios.post(
    `${API_URL}/create-user`,
    {
      name,
      email,
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