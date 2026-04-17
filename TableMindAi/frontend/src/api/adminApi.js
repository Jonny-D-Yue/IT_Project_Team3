import api from "./axios";

export const getAnalyticsRequest = async () => {
  const { data } = await api.get("/admin/analytics");
  return data.data;
};

export const closeBusinessDayRequest = async (payload = {}) => {
  const { data } = await api.post("/admin/daily-checkouts/close", payload);
  return data.data;
};

export const getDailyCheckoutsRequest = async () => {
  const { data } = await api.get("/admin/daily-checkouts");
  return data.data;
};

export const getHistoryEntriesRequest = async (params = {}) => {
  const { data } = await api.get("/admin/history", { params });
  return data.data;
};
