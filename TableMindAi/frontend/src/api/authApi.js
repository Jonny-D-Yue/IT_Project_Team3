import api from "./axios";

export const loginRequest = async (payload) => {
  const { data } = await api.post("/auth/login", payload);
  return data.data;
};

export const getMeRequest = async () => {
  const { data } = await api.get("/auth/me");
  return data.data;
};
