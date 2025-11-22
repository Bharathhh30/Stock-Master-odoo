import Location from '../models/Location.js';
import Warehouse from '../models/Warehouse.js'; // ensure path matches your project

// GET /api/v1/locations
export async function listLocations(req, res) {
  try {
    const list = await Location.find().populate('warehouse').sort({ createdAt: -1 }).lean();
    return res.json({ ok: true, locations: list });
  } catch (err) {
    console.error('listLocations error', err);
    return res.status(500).json({ ok: false, error: err.message });
  }
}

// POST /api/v1/locations
export async function createLocation(req, res) {
  try {
    const { code, name, warehouseId } = req.body;
    if (!code || !name) return res.status(400).json({ ok: false, error: 'code and name are required' });

    const location = new Location({
      code,
      name,
      warehouse: warehouseId || null,
    });
    await location.save();
    const populated = await Location.findById(location._id).populate('warehouse').lean();
    return res.status(201).json({ ok: true, location: populated });
  } catch (err) {
    console.error('createLocation error', err);
    return res.status(500).json({ ok: false, error: err.message });
  }
}

// PUT /api/v1/locations/:id
export async function updateLocation(req, res) {
  try {
    const { id } = req.params;
    const { code, name, warehouseId } = req.body;
    const update = {};
    if (code !== undefined) update.code = code;
    if (name !== undefined) update.name = name;
    if (warehouseId !== undefined) update.warehouse = warehouseId;

    const loc = await Location.findByIdAndUpdate(id, update, { new: true }).populate('warehouse').lean();
    if (!loc) return res.status(404).json({ ok: false, error: 'Not found' });
    return res.json({ ok: true, location: loc });
  } catch (err) {
    console.error('updateLocation error', err);
    return res.status(500).json({ ok: false, error: err.message });
  }
}

// DELETE /api/v1/locations/:id
export async function deleteLocation(req, res) {
  try {
    const { id } = req.params;
    const loc = await Location.findByIdAndDelete(id);
    if (!loc) return res.status(404).json({ ok: false, error: 'Not found' });
    return res.json({ ok: true, deletedId: id });
  } catch (err) {
    console.error('deleteLocation error', err);
    return res.status(500).json({ ok: false, error: err.message });
  }
}
