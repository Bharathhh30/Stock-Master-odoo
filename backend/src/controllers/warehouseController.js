import Warehouse from "../models/Warehouse.js";

export async function createWarehouse(req, res) {
  try {
    const { code, name, location } = req.body;
    const w = await Warehouse.create({ code, name, location });
    res.json({ ok: true, warehouse: w });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function listWarehouses(req, res) {
  try {
    const ws = await Warehouse.find().lean();
    res.json({ ok: true, warehouses: ws });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
