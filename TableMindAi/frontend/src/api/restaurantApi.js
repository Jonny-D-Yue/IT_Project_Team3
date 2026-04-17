import api from "./axios";

export const getRestaurantRequest = async () => {
  const { data } = await api.get("/restaurant");
  return data.data;
};

export const updateRestaurantRequest = async (payload) => {
  const { data } = await api.put("/restaurant/settings", payload);
  return data.data;
};
