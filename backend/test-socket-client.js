// backend/test-socket-client.js
import { io } from "socket.io-client";

const SERVER = "http://localhost:4000";
const WAREHOUSE_ID = "69214aceed4cace5e7a429bf"; // replace with actual id

const socket = io(SERVER, { transports: ["websocket", "polling"] });

socket.on("connect", () => {
  console.log("🟢 Client connected:", socket.id);
  if (WAREHOUSE_ID) {
    socket.emit("join-warehouse", WAREHOUSE_ID);
    console.log("➡️ Joined warehouse room:", `warehouse_${WAREHOUSE_ID}`);
  }
});

socket.on("stock:changed", (data) => {
  console.log("📦 stock:changed", data);
});
socket.on("stock:changed:global", (data) => {
  console.log("🌍 stock:changed:global", data);
});
socket.on("stock:low", (data) => {
  console.log("⚠️ LOW STOCK ALERT", data);
});
socket.on("disconnect", () => console.log("🔴 socket disconnected"));
socket.on("connect_error", (err) => console.error("connect_error:", err));
