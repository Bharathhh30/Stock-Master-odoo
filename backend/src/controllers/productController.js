
import Product from "../models/Product.js";

export async function createProduct(req, res) {
  try {
    const { name, sku, category, uom, reorderLevel } = req.body;
    const p = await Product.create({ name, sku, category, uom, reorderLevel });
    res.json({ ok: true, product: p });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
}

export async function listProducts(req, res) {
  try {
    const products = await Product.find().limit(200).lean();
    res.json({ ok: true, products });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function getProduct(req, res) {
  try {
    const p = await Product.findById(req.params.id);
    if (!p) return res.status(404).json({ error: "Product not found" });
    res.json({ ok: true, product: p });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
