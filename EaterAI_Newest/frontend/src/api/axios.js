import axios from "axios";

import { STORAGE_KEYS } from "../utils/constants";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(STORAGE_KEYS.authToken);

  if (token) {
    config.headers.Authorization = `Bearer ${JSON.parse(token)}`;
  }

  return config;
});

export default api;
