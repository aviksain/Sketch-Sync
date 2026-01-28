import http from "http";
import SocketService from "./services/socket.service.js";
import dotenv from "dotenv";
import express from "express";

dotenv.config();

const startServer = async () => {
  try {
    const app = express();
    const httpServer = http.createServer(app);

    const socketService = new SocketService();
    socketService.io.attach(httpServer);
    socketService.initListeners();

    httpServer.on("error", (error) => {
      console.error("❌ Server Error:", error);
      process.exit(1);
    });

    const PORT = process.env.PORT || "8080";

    httpServer.listen(Number(PORT), () => {
      console.log(`🚀 Server running at PORT ${PORT}`);
    });
  } catch (error) {
    console.error("❌ Server Error:", error);
    process.exit(1);
  }
};

startServer();
