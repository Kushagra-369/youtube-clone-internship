import axios from "axios";
import { API_URL } from "../config/api";


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

export const validateUser = async (
  email: string
) => {
  const response = await axios.get(
    `${API_URL}/validate-user/${email}`
  );

  return response.data;
};

export const sendEmailOTP = async (
  email: string
) => {
  const response = await axios.post(
    `${API_URL}/send-email-otp`,
    {
      email,
    }
  );

  return response.data;
};

export const verifyEmailOTP = async (
  email: string,
  otp: string
) => {
  const response = await axios.post(
    `${API_URL}/verify-email-otp`,
    {
      email,
      otp,
    }
  );

  return response.data;
};

export const updatePhoneNumber = async (
  userId: string,
  phone: string
) => {
  const response = await axios.patch(
    `${API_URL}/update-phone/${userId}`,
    {
      phone,
    }
  );

  return response.data;
};

export const sendPhoneOTP = async (
  phone: string
) => {
  const response = await axios.post(
    `${API_URL}/send-phone-otp`,
    { phone }
  );

  return response.data;
};

export const verifyPhoneOTP = async (
  phone: string,
  otp: string
) => {
  const response = await axios.post(
    `${API_URL}/verify-phone-otp`,
    {
      phone,
      otp,
    }
  );

  return response.data;
};