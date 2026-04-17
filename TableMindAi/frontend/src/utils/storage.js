export const getStorageValue = (key, fallback = null) => {
  try {
    const rawValue = localStorage.getItem(key);
    return rawValue ? JSON.parse(rawValue) : fallback;
  } catch (error) {
    return fallback;
  }
};

export const setStorageValue = (key, value) => {
  localStorage.setItem(key, JSON.stringify(value));
};

export const removeStorageValue = (key) => {
  localStorage.removeItem(key);
};
