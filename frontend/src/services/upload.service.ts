import axios from "axios";

const API_URL =
 "http://localhost:1928";

export const uploadVideoFile =async (
 file: File
) => {

 const formData =
   new FormData();

 formData.append(
  "video",
  file
 );

 const response =
  await axios.post(
   `${API_URL}/upload-video`,
   formData
  );

 return response.data;
};

export const uploadImageFile =async (
 file: File
) => {

 const formData =
   new FormData();

 formData.append(
  "image",
  file
 );

 const response =
  await axios.post(
   `${API_URL}/upload-image`,
   formData
  );

 return response.data;
};