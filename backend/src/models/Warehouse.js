import mongoose from "mongoose";

const WarehouseSchema = new mongoose.Schema({
    code: { type: String, unique: true, sparse: true },
    name: { type: String, required: true },
    location: String,
    meta: mongoose.Schema.Types.Mixed
}, { timestamps: true });

const Warehouse = mongoose.model("Warehouse", WarehouseSchema);
export default Warehouse;