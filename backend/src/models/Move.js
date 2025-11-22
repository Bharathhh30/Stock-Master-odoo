import mongoose from "mongoose";

const MoveSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
  fromWarehouse: { type: mongoose.Schema.Types.ObjectId, ref: "Warehouse" },
  toWarehouse: { type: mongoose.Schema.Types.ObjectId, ref: "Warehouse" },
  qty: Number,
  type: { type: String, enum: ['receipt','delivery','transfer','adjustment'] },
  reason: String,
  performedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
}, { timestamps: true });

const Move = mongoose.model("Move", MoveSchema);
export default Move;