// config/socket.ts
import { io } from "socket.io-client";
import { API_URL } from "./config/api";

// Create socket instance with proper configuration
export const socket = io(API_URL, {
  autoConnect: true,
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
  transports: ["websocket", "polling"],
});

// Connection event handlers
socket.on("connect", () => {
  console.log("🟢 Socket connected:", socket.id);
});

socket.on("connect_error", (error) => {
  console.error("❌ Socket connection error:", error);
});

socket.on("disconnect", (reason) => {
  console.log("🔴 Socket disconnected:", reason);
});

socket.on("reconnect", (attemptNumber) => {
  console.log(`🔄 Socket reconnected after ${attemptNumber} attempts`);
});