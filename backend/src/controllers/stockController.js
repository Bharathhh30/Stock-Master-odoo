// backend/src/controllers/stockController.js
import Stock from "../models/Stock.js";
import {
  getOrCreateStock,
  incrementStock,
  decrementStock,
  transferStock,
  adjustStock
} from "../services/stockService.js";

/**
 * Helper to determine the performing user id.
 * If you later add auth, set req.user = { id: ... } in middleware.
 */
function getPerformedBy(req) {
  if (req.user && req.user.id) return req.user.id;
  if (req.body && req.body.performedBy) return req.body.performedBy;
  return null;
}

export async function getStock(req, res) {
  try {
    const { product, warehouse } = req.query;
    const filter = {};
    if (product) filter.product = product;
    if (warehouse) filter.warehouse = warehouse;
    const list = await Stock.find(filter).populate("product warehouse").lean();
    return res.json({ ok: true, stock: list });
  } catch (err) {
    console.error("getStock error:", err);
    return res.status(500).json({ error: err.message });
  }
}

export async function initStock(req, res) {
  try {
    const { productId, warehouseId, quantity } = req.body;
    if (!productId || !warehouseId || typeof quantity !== "number") {
      return res.status(400).json({ error: "productId, warehouseId and numeric quantity required" });
    }
    const s = await getOrCreateStock(productId, warehouseId);
    s.quantity = quantity;
    await s.save();
    // emit stock change via io if available
    const io = req.app.get("io");
    if (io) {
      io.emit("stock:changed:global", { productId, warehouseId, newQty: s.quantity });
      io.to(`warehouse_${warehouseId}`).emit("stock:changed", { productId, warehouseId, newQty: s.quantity });
    }
    return res.json({ ok: true, stock: s });
  } catch (err) {
    console.error("initStock error:", err);
    return res.status(500).json({ error: err.message });
  }
}

export async function moveStock(req, res) {
  try {
    const { productId, fromWarehouseId, toWarehouseId, qty, reason } = req.body;
    if (!productId || !fromWarehouseId || !toWarehouseId || typeof qty !== "number") {
      return res.status(400).json({ error: "productId, fromWarehouseId, toWarehouseId and numeric qty required" });
    }
    const io = req.app.get("io");
    const performedBy = getPerformedBy(req);

    const result = await transferStock({
      productId,
      fromWarehouseId,
      toWarehouseId,
      qty,
      reason,
      performedBy,
      io
    });

    return res.json({ ok: true, result });
  } catch (err) {
    console.error("moveStock error:", err);
    return res.status(400).json({ error: err.message });
  }
}

export async function increaseStock(req, res) {
  try {
    const { productId, warehouseId, qty, reason } = req.body;
    if (!productId || !warehouseId || typeof qty !== "number") {
      return res.status(400).json({ error: "productId, warehouseId and numeric qty required" });
    }
    const io = req.app.get("io");
    const performedBy = getPerformedBy(req);

    const s = await incrementStock({
      productId,
      warehouseId,
      qty,
      reason,
      type: "receipt",
      performedBy,
      io
    });

    return res.json({ ok: true, stock: s });
  } catch (err) {
    console.error("increaseStock error:", err);
    return res.status(500).json({ error: err.message });
  }
}

export async function decreaseStock(req, res) {
  try {
    const { productId, warehouseId, qty, reason } = req.body;
    if (!productId || !warehouseId || typeof qty !== "number") {
      return res.status(400).json({ error: "productId, warehouseId and numeric qty required" });
    }
    const io = req.app.get("io");
    const performedBy = getPerformedBy(req);

    const s = await decrementStock({
      productId,
      warehouseId,
      qty,
      reason,
      type: "delivery",
      performedBy,
      io
    });

    return res.json({ ok: true, stock: s });
  } catch (err) {
    console.error("decreaseStock error:", err);
    // insufficient stock returns thrown error from service; map to 400
    const msg = err && err.message ? err.message : "Error";
    return res.status(400).json({ error: msg });
  }
}

export async function adjustStockHandler(req, res) {
  try {
    const { productId, warehouseId, countedQty, reason } = req.body;
    if (!productId || !warehouseId || typeof countedQty !== "number") {
      return res.status(400).json({ error: "productId, warehouseId and numeric countedQty required" });
    }
    const io = req.app.get("io");
    const performedBy = getPerformedBy(req);

    const s = await adjustStock({
      productId,
      warehouseId,
      countedQty,
      reason,
      performedBy,
      io
    });

    return res.json({ ok: true, stock: s });
  } catch (err) {
    console.error("adjustStockHandler error:", err);
    return res.status(500).json({ error: err.message });
  }
}
