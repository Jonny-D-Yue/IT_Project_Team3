import { useEffect } from "react";

import { connectSocket, disconnectSocket, getSocket } from "../services/socket";

export const useSocket = ({ enabled = true, events = {} }) => {
  useEffect(() => {
    if (!enabled) {
      return undefined;
    }

    const socket = connectSocket();

    Object.entries(events).forEach(([eventName, handler]) => {
      if (typeof handler === "function") {
        socket.on(eventName, handler);
      }
    });

    return () => {
      Object.entries(events).forEach(([eventName, handler]) => {
        if (typeof handler === "function") {
          socket.off(eventName, handler);
        }
      });
    };
  }, [enabled, events]);

  useEffect(() => () => disconnectSocket(), []);

  return getSocket();
};
