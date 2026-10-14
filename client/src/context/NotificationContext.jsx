import { createContext, useContext, useEffect, useState } from "react";
import { io } from "socket.io-client";
import toast from "react-hot-toast";
import api from "../utils/api";
import { useAuth } from "./AuthContext";

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const { user } = useAuth();
  const userId = user?.id;
  const locked = !!user?.mustChangePassword;
  const [unread, setUnread] = useState(0);
  const [incoming, setIncoming] = useState(null);

  useEffect(() => {
    if (!userId || locked) {
      setUnread(0);
      setIncoming(null);
      return;
    }

    const loadCount = () =>
      api
        .get("/notifications/unread-count")
        .then(({ data }) => setUnread(data.unread))
        .catch(() => {});

    loadCount();

    // A fresh short-lived pass is fetched for every connection attempt
    const socket = io(import.meta.env.VITE_SOCKET_URL || undefined, {
      auth: (cb) => {
        api
          .get("/auth/socket-token")
          .then(({ data }) => cb({ token: data.token }))
          .catch(() => cb({}));
      },
    });

    let retry;
    socket.on("connect_error", () => {
      // If the server refused us (for example while waking up), try again shortly
      if (!socket.active) retry = setTimeout(() => socket.connect(), 5000);
    });

    socket.io.on("reconnect", loadCount);

    socket.on("notification", (n) => {
      setUnread((u) => u + 1);
      setIncoming(n);
      toast(
        <div>
          <p className="font-semibold">{n.title}</p>
          <p className="text-sm">{n.message}</p>
        </div>,
        { icon: "🔔", duration: 6000 }
      );
    });

    return () => {
      clearTimeout(retry);
      socket.disconnect();
    };
  }, [userId, locked]);

  return (
    <NotificationContext.Provider value={{ unread, setUnread, incoming }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => useContext(NotificationContext);