import dotenv from "dotenv";
dotenv.config();

import express from "express";
import mongoose from "mongoose";
import cors from "cors";


import authRoutes from "./routes/auth.js";
import productRoutes from "./routes/product.js";
import warehouseRoutes from "./routes/warehouse.js";
import stockRoutes from "./routes/stock.js";


// dummy , have to change accordingly
const PORT = process.env.PORT || 4000;
const MONGO_URI = process.env.MONGO_URI;
console.log(MONGO_URI)

const app = express();
app.use(cors());
app.use(express.json());

// checking health
app.get("/api/v1/health",(req,res)=>{
    res.json({status: 'ok', time: new Date().toISOString() })
})

//mounting routes
app.use("/api/v1/auth",authRoutes);
app.use("/api/v1/products", productRoutes);
app.use("/api/v1/warehouses", warehouseRoutes);
app.use("/api/v1/stock", stockRoutes);

// basic DB connect
async function start() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log(' MongoDB connected');
  } catch (err) {
    console.error(' MongoDB connection error:', err.message);
    // still start server so health endpoint works for now (useful if dev DB not ready)
  }

  app.listen(PORT, () => {
    console.log(`🚀 Backend running at http://localhost:${PORT}`);
  });
}

start();