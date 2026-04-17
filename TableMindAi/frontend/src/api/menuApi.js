import api from "./axios";

export const getMenuRequest = async (params = {}) => {
  const { data } = await api.get("/menu", { params });
  return data.data;
};

export const getMenuItemRequest = async (id) => {
  const { data } = await api.get(`/menu/${id}`);
  return data.data;
};

export const createMenuItemRequest = async (payload) => {
  const { data } = await api.post("/menu", payload);
  return data.data;
};

export const uploadMenuImageRequest = async (payload) => {
  const { data } = await api.post("/menu/upload-image", payload);
  return data.data;
};

export const updateMenuItemRequest = async (id, payload) => {
  const { data } = await api.put(`/menu/${id}`, payload);
  return data.data;
};

export const deleteMenuItemRequest = async (id) => {
  const { data } = await api.delete(`/menu/${id}`);
  return data.data;
};
