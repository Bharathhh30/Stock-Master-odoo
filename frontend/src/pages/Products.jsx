import React, { useEffect, useState } from 'react'
import api from '../api/axiosClient'

export default function Products(){
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState({ name:'', sku:'', uom:'pcs', unitCost:0, reorderLevel:0 });

  useEffect(() => {
    // call async inside effect body
    async function load() {
      try {
        const res = await api.get('/products');
        setProducts(res.data.products || []);
      } catch (e) {
        console.error('Failed to load products', e);
      }
    }
    load();
  }, []);

    async function create(e){
    e.preventDefault();
    try {
      const res = await api.post('/products', { ...form });
      // backend might return new product in different shapes:
      // possible shapes: { product: { ... } }  OR  { _id: '...', name: '...' }
      const created = res.data?.product ?? res.data;
      if (!created || !created._id) {
        // fallback: reload entire list if response shape unexpected
        const reload = await api.get('/products');
        setProducts(reload.data.products || []);
      } else {
        // optimistic update: insert new product into state
        setProducts(prev => [created, ...prev]);
      }
      setForm({ name:'', sku:'', uom:'pcs', unitCost:0, reorderLevel:0 });
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || err.message || 'Error creating product');
    }
  }


  return (
    <div>
      <div className="bg-white p-4 rounded shadow mb-4">
        <form onSubmit={create} className="grid grid-cols-6 gap-2">
          <input className="col-span-2 p-2 border rounded" placeholder="Name" value={form.name} onChange={e=>setForm(f=>({...f, name: e.target.value}))} required />
          <input className="p-2 border rounded" placeholder="SKU" value={form.sku} onChange={e=>setForm(f=>({...f, sku: e.target.value}))} required />
          <input className="p-2 border rounded" placeholder="UOM" value={form.uom} onChange={e=>setForm(f=>({...f, uom: e.target.value}))} />
          <input className="p-2 border rounded" type="number" placeholder="Unit cost" value={form.unitCost} onChange={e=>setForm(f=>({...f, unitCost: Number(e.target.value)}))} />
          <input className="p-2 border rounded" type="number" placeholder="Reorder" value={form.reorderLevel} onChange={e=>setForm(f=>({...f, reorderLevel: Number(e.target.value)}))} />
          <button className="col-span-1 bg-blue-600 text-black px-4 py-2 rounded">Create</button>
        </form>
      </div>

      <div className="bg-white rounded shadow overflow-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left">Name</th>
              <th className="px-4 py-2 text-left">SKU</th>
              <th className="px-4 py-2 text-left">UOM</th>
              <th className="px-4 py-2 text-left">Unit cost</th>
              <th className="px-4 py-2 text-left">Reorder</th>
            </tr>
          </thead>
          <tbody>
            {products.map(p => (
              <tr key={p._id} className="border-b">
                <td className="px-4 py-2">{p.name}</td>
                <td className="px-4 py-2">{p.sku}</td>
                <td className="px-4 py-2">{p.uom}</td>
                <td className="px-4 py-2">{p.unitCost ?? '—'}</td>
                <td className="px-4 py-2">{p.reorderLevel ?? 0}</td>
              </tr>
            ))}
            {products.length === 0 && <tr><td colSpan={5} className="p-4 text-center text-gray-500">No products yet</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  )
}
