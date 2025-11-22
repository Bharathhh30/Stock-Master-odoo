import React, { useEffect, useState } from 'react'
import api from '../api/axiosClient'

export default function Warehouses(){
  const [list, setList] = useState([]);
  const [form, setForm] = useState({ code:'', name:'', location:'' });

  useEffect(() => {
    async function load() {
      try {
        const res = await api.get('/warehouses');
        setList(res.data.warehouses || []);
      } catch (e) {
        console.error('Failed to load warehouses', e);
      }
    }
    load();
  }, []);

  async function create(e){
    e.preventDefault();
    try {
      await api.post('/warehouses', form);
      setForm({ code:'', name:'', location:'' });
      const res = await api.get('/warehouses');
      setList(res.data.warehouses || []);
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || 'Error creating warehouse');
    }
  }

  return (
    <div>
      <div className="bg-white p-4 rounded shadow mb-4">
        <form className="flex gap-2" onSubmit={create}>
          <input className="p-2 border rounded" placeholder="Code" value={form.code} onChange={e=>setForm(f=>({...f,code:e.target.value}))} required />
          <input className="p-2 border rounded" placeholder="Name" value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} required />
          <input className="p-2 border rounded" placeholder="Location" value={form.location} onChange={e=>setForm(f=>({...f,location:e.target.value}))} />
          <button className="bg-blue-600 text-black px-4 py-2 rounded">Create</button>
        </form>
      </div>

      <div className="bg-white rounded shadow overflow-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left">Code</th>
              <th className="px-4 py-2 text-left">Name</th>
              <th className="px-4 py-2 text-left">Location</th>
            </tr>
          </thead>
          <tbody>
            {list.map(w => (
              <tr key={w._id} className="border-b">
                <td className="px-4 py-2">{w.code}</td>
                <td className="px-4 py-2">{w.name}</td>
                <td className="px-4 py-2">{w.location}</td>
              </tr>
            ))}
            {list.length === 0 && <tr><td colSpan={3} className="p-4 text-center text-gray-500">No warehouses yet</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  )
}
