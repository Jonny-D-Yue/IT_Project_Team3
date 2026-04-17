import { createContext, useState } from "react";

import { STORAGE_KEYS } from "../utils/constants";
import { getStorageValue, removeStorageValue, setStorageValue } from "../utils/storage";

export const TableContext = createContext(null);

export function TableProvider({ children }) {
  const [restaurantId, setRestaurantId] = useState(getStorageValue(STORAGE_KEYS.restaurantId, ""));
  const [tableNumber, setTableNumber] = useState(getStorageValue(STORAGE_KEYS.tableNumber, ""));
  const [sessionToken, setSessionToken] = useState(getStorageValue(STORAGE_KEYS.sessionToken, ""));

  const setTableSession = ({
    restaurantId: nextRestaurantId,
    tableNumber: nextTableNumber,
    sessionToken: nextSessionToken,
  }) => {
    setRestaurantId(nextRestaurantId);
    setTableNumber(nextTableNumber);
    setSessionToken(nextSessionToken);
    setStorageValue(STORAGE_KEYS.restaurantId, nextRestaurantId);
    setStorageValue(STORAGE_KEYS.tableNumber, nextTableNumber);
    setStorageValue(STORAGE_KEYS.sessionToken, nextSessionToken);
  };

  const clearTableSession = () => {
    setRestaurantId("");
    setTableNumber("");
    setSessionToken("");
    removeStorageValue(STORAGE_KEYS.restaurantId);
    removeStorageValue(STORAGE_KEYS.tableNumber);
    removeStorageValue(STORAGE_KEYS.sessionToken);
  };

  return (
    <TableContext.Provider
      value={{
        restaurantId,
        tableNumber,
        sessionToken,
        hasTableSession: Boolean(restaurantId && tableNumber && sessionToken),
        setTableSession,
        clearTableSession,
      }}
    >
      {children}
    </TableContext.Provider>
  );
}
