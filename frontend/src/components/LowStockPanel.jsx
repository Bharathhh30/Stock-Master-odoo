import React, { useEffect, useState } from 'react';
import api from '../api/axiosClient';

export default function LowStockPanel() {
  const [low, setLow] = useState([]);
  async function load() {
    try {
      const res = await api.get('/stock'); // expects populated product with reorderLevel
      const list = res.data.stock || res.data || [];
      const lowItems = list.filter(s => {
        const rl = s.product?.reorderLevel ?? 0;
        return rl > 0 && s.quantity <= rl;
      });
      setLow(lowItems);
    } catch (e) {
      // ignore quietly in mock-run (or show no items)
      setLow([]);
    }
  }

  useEffect(() => {
    load();
    // subscribe to mock events to refresh (works for mock mode)
    function handler() { load(); }
    window.addEventListener('operations:change', handler);
    return () => window.removeEventListener('operations:change', handler);
  }, []);

  if (low.length === 0) return null;

  return (
    <div className="bg-yellow-50 border-l-4 border-yellow-400 p-3 rounded shadow-sm">
      <div className="font-semibold text-yellow-800">Low stock alerts</div>
      <ul className="mt-2 text-sm text-yellow-900 space-y-1">
        {low.map(i => (
          <li key={i._id} className="flex justify-between">
            <div>{i.product?.name ?? i.product} <span className="text-xs text-gray-600 ml-2">({i.product?.sku || '—'})</span></div>
            <div className="font-medium">{i.quantity} / {i.product?.reorderLevel ?? 0}</div>
          </li>
        ))}
      </ul>
    </div>
  );
}
