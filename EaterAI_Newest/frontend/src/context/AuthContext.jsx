import { createContext, useEffect, useState } from "react";

import { getMeRequest, loginRequest } from "../api/authApi";
import { STORAGE_KEYS } from "../utils/constants";
import { getStorageValue, removeStorageValue, setStorageValue } from "../utils/storage";

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(getStorageValue(STORAGE_KEYS.authToken, ""));
  const [user, setUser] = useState(getStorageValue(STORAGE_KEYS.authUser, null));
  const [loading, setLoading] = useState(Boolean(getStorageValue(STORAGE_KEYS.authToken, "")));

  useEffect(() => {
    const bootstrapUser = async () => {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const currentUser = await getMeRequest();
        setUser(currentUser);
        setStorageValue(STORAGE_KEYS.authUser, currentUser);
      } catch (error) {
        logout();
      } finally {
        setLoading(false);
      }
    };

    bootstrapUser();
  }, [token]);

  const login = async (payload) => {
    const response = await loginRequest(payload);
    setToken(response.token);
    setUser(response.user);
    setStorageValue(STORAGE_KEYS.authToken, response.token);
    setStorageValue(STORAGE_KEYS.authUser, response.user);
    return response.user;
  };

  const logout = () => {
    setToken("");
    setUser(null);
    removeStorageValue(STORAGE_KEYS.authToken);
    removeStorageValue(STORAGE_KEYS.authUser);
  };

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        loading,
        isAuthenticated: Boolean(token),
        login,
        logout,
        setUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
