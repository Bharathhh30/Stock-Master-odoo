import mongoose from "mongoose";

const StockSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
  warehouse: { type: mongoose.Schema.Types.ObjectId, ref: "Warehouse", required: true },
  quantity: { type: Number, default: 0 },
  reserved: { type: Number, default: 0 },
}, { timestamps: true });

StockSchema.index({ product: 1, warehouse: 1 }, { unique: true });

const Stock = mongoose.model("Stock", StockSchema);
export default Stock;