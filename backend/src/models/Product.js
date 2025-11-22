import mongoose from "mongoose";

const ProductSchema = new mongoose.Schema({
  name: { type: String, required: true },
  sku: { type: String, required: true, unique: true },
  category: String,
  uom: String,
  reorderLevel: { type: Number, default: 0 }, // low-stock threshold
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
}, { timestamps: true });

const Product = mongoose.model("Product", ProductSchema);
export default Product;