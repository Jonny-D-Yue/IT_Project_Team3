import api from "./axios";

export const sendChatRequest = async (payload) => {
  const { data } = await api.post("/ai/chat", payload);
  return data.data;
};

export const getChatHistoryRequest = async (params) => {
  const { data } = await api.get("/ai/chat", { params });
  return data.data;
};

export const getRecommendationRequest = async (payload) => {
  const { data } = await api.post("/ai/recommend", payload);
  return data.data;
};
