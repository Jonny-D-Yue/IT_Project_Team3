import api from "./axios";

export const analyzeMenuImageRequest = async (payload) => {
  const { data } = await api.post("/ai/menu-from-image", payload);
  return data.data;
};
