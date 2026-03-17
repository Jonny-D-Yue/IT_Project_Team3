import api from "./axios";

export const validateTableRequest = async (payload) => {
  const { data } = await api.post("/tables/validate", payload);
  return data.data;
};

export const createTableSessionRequest = async (payload) => {
  const { data } = await api.post("/tables/session", payload);
  return data.data;
};

export const getTableConfigRequest = async () => {
  const { data } = await api.get("/tables/config");
  return data.data;
};
