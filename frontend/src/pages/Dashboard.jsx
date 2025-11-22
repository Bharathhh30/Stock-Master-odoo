import React, { useEffect, useState } from 'react'
import api from '../api/axiosClient'
import useSocket from '../hooks/useSocket'

const SOCKET_URL = import.meta.env.VITE_API_BASE || 'http://localhost:4000';

export default function Dashboard(){
  const [summary, setSummary] = useState({ totalProducts:0, totalStock:0, lowStockCount:0 });
  const { events, connected } = useSocket({ url: SOCKET_URL, warehouseId: null });

  useEffect(()=> {
    (async () => {
      try {
        const [pRes, sRes] = await Promise.all([api.get('/products'), api.get('/stock')]);
        const products = pRes.data.products || [];
        const stock = sRes.data.stock || [];
        const totalProducts = products.length;
        const totalStock = stock.reduce((acc, r) => acc + (r.quantity || 0), 0);
        const lowStockCount = stock.filter(s => s.product?.reorderLevel != null && s.quantity <= s.product.reorderLevel).length;
        setSummary({ totalProducts, totalStock, lowStockCount });
      } catch (e) {
        console.error(e);
      }
    })();
  }, []);

  return (
    <div>
      <div className="flex gap-4 mb-6">
        <div className="bg-white p-4 rounded shadow w-48">
          <div className="text-sm text-gray-500">Products</div>
          <div className="text-2xl font-bold">{summary.totalProducts}</div>
        </div>
        <div className="bg-white p-4 rounded shadow w-48">
          <div className="text-sm text-gray-500">Total On-hand</div>
          <div className="text-2xl font-bold">{summary.totalStock}</div>
        </div>
        <div className="bg-white p-4 rounded shadow w-48">
          <div className="text-sm text-gray-500">Low Stock Items</div>
          <div className="text-2xl font-bold text-red-600">{summary.lowStockCount}</div>
        </div>
        <div className="ml-auto bg-white p-4 rounded shadow w-48">
          <div className="text-sm text-gray-500">Socket</div>
          <div className={`text-lg ${connected ? 'text-green-600' : 'text-red-600'}`}>{connected ? 'Connected' : 'Disconnected'}</div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white p-4 rounded shadow">
          <h3 className="font-semibold mb-2">Recent Events</h3>
          <div className="text-sm text-gray-500">Realtime events from stock operations appear here (stock:changed, stock:low).</div>
        </div>

        <div className="bg-white p-4 rounded shadow">
          <h3 className="font-semibold mb-2">Quick Actions</h3>
          <div className="text-sm text-gray-500">Use the Stock page to perform receipts, deliveries and transfers.</div>
        </div>
      </div>
    </div>
  )
}
