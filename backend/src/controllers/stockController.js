import Stock from "../models/Stock.js";
import { getOrCreateStock, incrementStock, decrementStock, transferStock, adjustStock } from "../services/stockService.js";

export async function getStock(req, res) {
  try {
    const { product, warehouse } = req.query;
    const filter = {};
    if (product) filter.product = product;
    if (warehouse) filter.warehouse = warehouse;
    const list = await Stock.find(filter).populate('product warehouse').lean();
    res.json({ ok: true, stock: list });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function initStock(req, res) {
  try {
    const { productId, warehouseId, quantity } = req.body;
    const s = await getOrCreateStock(productId, warehouseId);
    s.quantity = quantity;
    await s.save();
    res.json({ ok: true, stock: s });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function moveStock(req, res) {
  try {
    const { productId, fromWarehouseId, toWarehouseId, qty, reason } = req.body;
    const result = await transferStock({ productId, fromWarehouseId, toWarehouseId, qty, reason });
    res.json({ ok: true, result });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

export async function increaseStock(req, res) {
  try {
    const { productId, warehouseId, qty, reason } = req.body;
    const s = await incrementStock({ productId, warehouseId, qty, reason, type: 'receipt' });
    res.json({ ok: true, stock: s });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function decreaseStock(req, res) {
  try {
    const { productId, warehouseId, qty, reason } = req.body;
    const s = await decrementStock({ productId, warehouseId, qty, reason, type: 'delivery' });
    res.json({ ok: true, stock: s });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

export async function adjustStockHandler(req, res) {
  try {
    const { productId, warehouseId, countedQty, reason } = req.body;
    const s = await adjustStock({ productId, warehouseId, countedQty, reason });
    res.json({ ok: true, stock: s });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
