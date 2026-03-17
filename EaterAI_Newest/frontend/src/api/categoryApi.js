import api from "./axios";

export const getCategoriesRequest = async () => {
  const { data } = await api.get("/categories");
  return data.data;
};

export const createCategoryRequest = async (payload) => {
  const { data } = await api.post("/categories", payload);
  return data.data;
};

export const updateCategoryRequest = async (id, payload) => {
  const { data } = await api.put(`/categories/${id}`, payload);
  return data.data;
};

export const deleteCategoryRequest = async (id) => {
  const { data } = await api.delete(`/categories/${id}`);
  return data.data;
};
