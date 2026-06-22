// server.ts
import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import mongoose from "mongoose";
import router from "./routes/routes";
import { createServer } from "http";
import { Server } from "socket.io";

dotenv.config();

const app = express();

app.use(express.json());
app.use(cors());

const httpServer = createServer(app);

// Socket.IO Server with proper CORS
const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

// Store online users
const onlineUsers = new Map<string, string>(); // userId -> socketId
const userSockets = new Map<string, string>(); // socketId -> userId

// Socket connection handler
io.on("connection", (socket) => {
  console.log("🟢 User Connected:", socket.id);

  let currentUserId: string | null = null;

  // User goes online
  socket.on("user-online", (userId: string) => {
    currentUserId = userId;
    onlineUsers.set(userId, socket.id);
    userSockets.set(socket.id, userId);
    
    // Broadcast to all other users that this user is online
    socket.broadcast.emit("user-online", userId);
    console.log(`👤 User ${userId} is now online`);
  });

  // ============= CALL HANDLERS =============

  // Initiate a call
  socket.on("call-user", (data: { 
    from: string; 
    to: string; 
    type: "voice" | "video"; 
    fromName: string;
  }) => {
    console.log(`📞 Call from ${data.from} to ${data.to} (${data.type})`);
    
    const targetSocketId = onlineUsers.get(data.to);
    if (targetSocketId) {
      io.to(targetSocketId).emit("incoming-call", {
        from: data.from,
        fromName: data.fromName,
        type: data.type,
      });
    } else {
      socket.emit("call-error", { message: "User is offline" });
    }
  });

  // Accept call
  socket.on("accept-call", (data: { from: string; to: string }) => {
    console.log(`✅ Call accepted from ${data.from} to ${data.to}`);
    
    const callerSocketId = onlineUsers.get(data.to);
    if (callerSocketId) {
      io.to(callerSocketId).emit("call-accepted", { 
        from: data.from,
        to: data.to,
      });
    }
  });

  // Reject call
  socket.on("reject-call", (data: { from: string; to: string }) => {
    console.log(`❌ Call rejected from ${data.from} to ${data.to}`);
    
    const callerSocketId = onlineUsers.get(data.to);
    if (callerSocketId) {
      io.to(callerSocketId).emit("call-rejected", { 
        from: data.from,
        to: data.to,
      });
    }
  });

  // End call
  socket.on("end-call", (data: { to: string }) => {
    console.log(`🔚 Call ended with ${data.to}`);
    
    const targetSocketId = onlineUsers.get(data.to);
    if (targetSocketId) {
      io.to(targetSocketId).emit("call-ended");
    }
  });

  // ============= WEBRTC SIGNALING =============

  // Send offer
  socket.on("offer", (data: { to: string; offer: any }) => {
    console.log(`📤 Offer sent to ${data.to}`);
    
    const targetSocketId = onlineUsers.get(data.to);
    if (targetSocketId) {
      io.to(targetSocketId).emit("offer", {
        from: currentUserId,
        offer: data.offer,
      });
    }
  });

  // Send answer
  socket.on("answer", (data: { to: string; answer: any }) => {
    console.log(`📤 Answer sent to ${data.to}`);
    
    const targetSocketId = onlineUsers.get(data.to);
    if (targetSocketId) {
      io.to(targetSocketId).emit("answer", {
        from: currentUserId,
        answer: data.answer,
      });
    }
  });

  // Send ICE candidate
  socket.on("ice-candidate", (data: { to: string; candidate: any }) => {
    console.log(`🧊 ICE candidate sent to ${data.to}`);
    
    const targetSocketId = onlineUsers.get(data.to);
    if (targetSocketId) {
      io.to(targetSocketId).emit("ice-candidate", {
        from: currentUserId,
        candidate: data.candidate,
      });
    }
  });

  // ============= DISCONNECT =============

  socket.on("disconnect", () => {
    console.log("🔴 User Disconnected:", socket.id);
    
    if (currentUserId) {
      // Remove from online users
      onlineUsers.delete(currentUserId);
      userSockets.delete(socket.id);
      
      // Broadcast to all other users that this user is offline
      socket.broadcast.emit("user-offline", currentUserId);
      console.log(`👤 User ${currentUserId} is now offline`);
    }
  });
});

// MongoDB Connection
const mongoURL = process.env.MONGO_URI;
const PORT = process.env.PORT || 5000;

if (!mongoURL) {
  console.error("❌ MONGO_URI not found in environment variables");
  process.exit(1);
}

mongoose
  .connect(mongoURL)
  .then(() => console.log("🌐 MongoDB connected"))
  .catch((err) => {
    console.error("MongoDB error:", err);
    process.exit(1);
  });

// Health check
app.get("/", (req, res) => {
  res.json({
    status: "Server is running",
    socket: "Socket.IO is active",
    timestamp: new Date().toISOString(),
  });
});

// Routes
app.use("/", router);

// Start server
httpServer.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🔌 Socket.IO server is ready`);
});

export { io };