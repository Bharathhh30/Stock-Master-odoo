import React, { useEffect, useState } from 'react'
import api from '../api/axiosClient'

/**
 * Locations page
 * - create location (code, name) and assign to a warehouse
 * - list locations grouped by warehouse
 * - delete (simple) and inline edit name/code
 *
 * Backend expectations:
 * GET  /locations           => { ok:true, locations: [ { _id, code, name, warehouse: { _id, name } } ] }
 * POST /locations          => create new location (body: { code, name, warehouseId })
 * PUT  /locations/:id      => update location (body: { code, name })
 * DELETE /locations/:id    => delete location
 * GET  /warehouses         => { ok:true, warehouses: [...] } (already used elsewhere)
 *
 * If your backend uses different paths, update the api calls below.
 */

export default function Locations(){
  const [warehouses, setWarehouses] = useState([]);
  const [locations, setLocations] = useState([]);
  const [form, setForm] = useState({ code: '', name: '', warehouseId: '' });
  const [editing, setEditing] = useState({}); // { [id]: { code, name } }
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function loadAll(){
      setLoading(true);
      try {
        const [wRes, lRes] = await Promise.all([api.get('/warehouses'), api.get('/locations')]);
        setWarehouses(wRes.data.warehouses || []);
        setLocations(lRes.data.locations || lRes.data || []);
      } catch (e) {
        console.error('Failed to load locations/warehouses', e);
        alert('Failed to load locations/warehouses (check backend endpoints)');
      } finally {
        setLoading(false);
      }
    }
    loadAll();
  }, []);

  async function createLocation(e){
    e.preventDefault();
    if (!form.code || !form.name || !form.warehouseId) {
      alert('Fill code, name and warehouse');
      return;
    }
    try {
      const res = await api.post('/locations', {
        code: form.code, name: form.name, warehouseId: form.warehouseId
      });
      const created = res.data?.location ?? res.data;
      if (created && created._id) {
        setLocations(prev => [created, ...prev]);
      } else {
        // fallback: reload list
        const l = await api.get('/locations');
        setLocations(l.data.locations || l.data || []);
      }
      setForm({ code: '', name: '', warehouseId: '' });
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || 'Error creating location');
    }
  }

  async function startEdit(id){
    const loc = locations.find(l=>l._id === id);
    if (!loc) return;
    setEditing(e => ({ ...e, [id]: { code: loc.code || '', name: loc.name || '' } }));
  }

  async function cancelEdit(id){
    setEditing(e => {
      const copy = { ...e };
      delete copy[id];
      return copy;
    });
  }

  async function saveEdit(id){
    const payload = editing[id];
    if (!payload) return;
    try {
      await api.put(`/locations/${id}`, payload);
      // optimistic update
      setLocations(prev => prev.map(l => l._id === id ? { ...l, ...payload } : l));
      cancelEdit(id);
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || 'Failed to save');
    }
  }

  async function removeLocation(id){
    if (!confirm('Delete this location?')) return;
    try {
      await api.delete(`/locations/${id}`);
      setLocations(prev => prev.filter(l => l._id !== id));
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || 'Failed to delete');
    }
  }

  // group by warehouse for display:
  const grouped = warehouses.map(w => ({
    warehouse: w,
    locations: locations.filter(l => (l.warehouse?._id || l.warehouse) === w._id)
  }));

  // also show unassigned locations (if any)
  const unassigned = locations.filter(l => !(l.warehouse && (l.warehouse._id || l.warehouse)));

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-2xl font-semibold">Locations</h2>
          <div className="text-sm text-gray-500">Define pick/pack/storage locations inside warehouses</div>
        </div>
      </div>

      <div className="bg-white p-4 rounded shadow mb-6">
        <form onSubmit={createLocation} className="grid grid-cols-6 gap-2 items-end">
          <input className="col-span-1 p-2 border rounded" placeholder="Code" value={form.code} onChange={e=>setForm(f=>({...f,code:e.target.value}))} required />
          <input className="col-span-2 p-2 border rounded" placeholder="Name (e.g. Aisle 1 - Shelf B)" value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} required />
          <select className="col-span-2 p-2 border rounded" value={form.warehouseId} onChange={e=>setForm(f=>({...f,warehouseId:e.target.value}))} required>
            <option value="">Select warehouse</option>
            {warehouses.map(w => <option key={w._id} value={w._id}>{w.name}</option>)}
          </select>
          <button className="col-span-1 bg-blue-600 text-white px-4 py-2 rounded">Create</button>
        </form>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white p-4 rounded shadow">
          <h3 className="font-semibold mb-3">Warehouses & Locations</h3>
          {loading && <div className="text-sm text-gray-500">Loading...</div>}

          {grouped.map(group => (
            <div key={group.warehouse._id} className="mb-4">
              <div className="font-medium">{group.warehouse.name}</div>
              <div className="text-xs text-gray-500 mb-2">{group.locations.length} locations</div>
              <div className="space-y-2">
                {group.locations.length === 0 && <div className="text-sm text-gray-400">No locations</div>}
                {group.locations.map(loc => (
                  <div key={loc._id} className="flex items-center justify-between p-2 border rounded">
                    <div>
                      {editing[loc._id] ? (
                        <>
                          <input className="p-1 border rounded mr-2" value={editing[loc._id].code} onChange={e=>setEditing(ed=>({...ed,[loc._id]:{...ed[loc._id], code:e.target.value}}))} />
                          <input className="p-1 border rounded" value={editing[loc._id].name} onChange={e=>setEditing(ed=>({...ed,[loc._id]:{...ed[loc._id], name:e.target.value}}))} />
                        </>
                      ) : (
                        <>
                          <div className="font-medium">{loc.code} <span className="text-sm text-gray-600 ml-2">{loc.name}</span></div>
                        </>
                      )}
                    </div>

                    <div className="flex gap-2">
                      {editing[loc._id] ? (
                        <>
                          <button className="bg-green-600 text-white px-3 py-1 rounded" onClick={()=>saveEdit(loc._id)}>Save</button>
                          <button className="px-3 py-1 border rounded" onClick={()=>cancelEdit(loc._id)}>Cancel</button>
                        </>
                      ) : (
                        <>
                          <button className="px-3 py-1 border rounded" onClick={()=>startEdit(loc._id)}>Edit</button>
                          <button className="px-3 py-1 border rounded text-red-600" onClick={()=>removeLocation(loc._id)}>Delete</button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {unassigned.length > 0 && (
            <div>
              <div className="font-medium">Unassigned</div>
              {unassigned.map(loc => (
                <div key={loc._id} className="flex items-center justify-between p-2 border rounded">
                  <div><div className="font-medium">{loc.code} <span className="text-sm text-gray-600 ml-2">{loc.name}</span></div></div>
                  <div className="flex gap-2">
                    <button className="px-3 py-1 border rounded" onClick={()=>startEdit(loc._id)}>Edit</button>
                    <button className="px-3 py-1 border rounded text-red-600" onClick={()=>removeLocation(loc._1d)}>Delete</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white p-4 rounded shadow">
          <h3 className="font-semibold mb-3">All locations (latest first)</h3>
          <div className="overflow-auto max-h-[60vh]">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left">Code</th>
                  <th className="px-4 py-2 text-left">Name</th>
                  <th className="px-4 py-2 text-left">Warehouse</th>
                  <th className="px-4 py-2 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {locations.length === 0 && (<tr><td colSpan={4} className="p-4 text-center text-gray-500">No locations</td></tr>)}
                {locations.map(loc => (
                  <tr key={loc._id} className="border-b">
                    <td className="px-4 py-2">{loc.code}</td>
                    <td className="px-4 py-2">{loc.name}</td>
                    <td className="px-4 py-2">{loc.warehouse?.name ?? (loc.warehouse || '—')}</td>
                    <td className="px-4 py-2">
                      <div className="flex gap-2">
                        <button className="px-3 py-1 border rounded" onClick={()=>startEdit(loc._id)}>Edit</button>
                        <button className="px-3 py-1 border rounded text-red-600" onClick={()=>removeLocation(loc._id)}>Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
