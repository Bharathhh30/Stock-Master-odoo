import dotenv from "dotenv";
dotenv.config();

import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import http from "http";
import { Server } from "socket.io";

import authRoutes from "./routes/auth.js";
import productRoutes from "./routes/product.js";
import warehouseRoutes from "./routes/warehouse.js";
import stockRoutes from "./routes/stock.js";

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// make socket.io available to controllers/services
app.set("io", io);

const PORT = process.env.PORT || 4000;
const MONGO_URI = process.env.MONGO_URI;

// MIDDLEWARE
app.use(cors());
app.use(express.json());

// ROUTES
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/products", productRoutes);
app.use("/api/v1/warehouses", warehouseRoutes);
app.use("/api/v1/stock", stockRoutes);

// HEALTH ROUTE
app.get("/api/v1/health", (req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});

//temporart
app.get('/api/v1/debug/emit', (req,res) => {
  const io = req.app.get('io');
  io.emit('stock:changed:global', { productId: 'debug', warehouseId: 'debug', newQty: 999 });
  res.json({ ok: true, emitted: true });
});


// SOCKET.IO EVENTS
io.on("connection", (socket) => {
  console.log("🟢 Client connected:", socket.id);

  // join specific warehouse room
  socket.on("join-warehouse", (warehouseId) => {
    socket.join(`warehouse_${warehouseId}`);
    console.log(`Socket ${socket.id} joined warehouse_${warehouseId}`);
  });

  socket.on("disconnect", () => {
    console.log("🔴 Client disconnected:", socket.id);
  });
});

// START
async function start() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("✅ MongoDB connected");
  } catch (e) {
    console.error("❌ MongoDB error:", e);
  }

  server.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
  });
}

start();
