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

const io = new Server(httpServer, {
  cors: {
    origin: "*",
  },
});

io.on("connection", (socket) => {
  console.log(
    "🟢 User Connected:",
    socket.id
  );

  socket.on("disconnect", () => {
    console.log(
      "🔴 User Disconnected:",
      socket.id
    );
  });
});

const mongoURL = process.env.MONGO_URI;
const PORT = process.env.PORT;

if (!mongoURL) {
  console.error(
    "❌ MONGO_URI not found"
  );
  process.exit(1);
}

mongoose
  .connect(mongoURL)
  .then(() =>
    console.log("🌐 MongoDB connected")
  )
  .catch((err) => {
    console.error(
      "MongoDB error:",
      err
    );
    process.exit(1);
  });

app.get("/", (req, res) => {
  res.send("Server is running");
});

app.use("/", router);

httpServer.listen(PORT, () => {
  console.log(
    `🚀 Server running on port ${PORT}`
  );
});