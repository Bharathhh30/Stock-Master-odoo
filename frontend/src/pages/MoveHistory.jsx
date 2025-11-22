import React, { useEffect, useMemo, useState } from "react";
import { store } from "../mock/operationsStore";

/**
 * Move History (Mock)
 * - reads from store.getMoves()
 * - supports search, date filter, from/to filter
 * - export visible rows to CSV
 * - quick-add demo move
 */

function downloadCSV(filename, rows) {
  if (!rows || rows.length === 0) {
    return;
  }
  const header = Object.keys(rows[0]);
  const csv = [
    header.join(","),
    ...rows.map(r =>
      header.map(h => {
        const v = r[h] ?? "";
        // escape double quotes
        const s = String(v).replace(/"/g, '""');
        return `"${s}"`;
      }).join(",")
    )
  ].join("\r\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export default function MoveHistory() {
  const [moves, setMoves] = useState([]);
  const [q, setQ] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [fromWarehouse, setFromWarehouse] = useState("");
  const [toWarehouse, setToWarehouse] = useState("");
  const [limit, setLimit] = useState(20);

  useEffect(() => {
    setMoves(store.getMoves());
  }, []);

  const filtered = useMemo(() => {
    return moves
      .filter(m => {
        if (q) {
          const term = q.toLowerCase();
          const any =
            (m.reference || "").toLowerCase().includes(term) ||
            (m.productName || "").toLowerCase().includes(term) ||
            (m.product || "").toLowerCase().includes(term) ||
            (m.fromWarehouse || "").toLowerCase().includes(term) ||
            (m.toWarehouse || "").toLowerCase().includes(term);
          if (!any) return false;
        }
        if (fromWarehouse && m.fromWarehouse !== fromWarehouse) return false;
        if (toWarehouse && m.toWarehouse !== toWarehouse) return false;
        if (dateFrom && new Date(m.date) < new Date(dateFrom)) return false;
        if (dateTo && new Date(m.date) > new Date(dateTo + "T23:59:59")) return false;
        return true;
      })
      .slice(0, limit);
  }, [moves, q, dateFrom, dateTo, fromWarehouse, toWarehouse, limit]);

  function quickAdd() {
    const demo = {
      reference: `MOVE-${Math.floor(Math.random() * 9000 + 1000)}`,
      product: "debug-product",
      productName: "Demo Product",
      fromWarehouse: "Main WH",
      toWarehouse: "Secondary WH",
      qty: Math.floor(Math.random() * 50) + 1,
      type: ["transfer", "receipt", "delivery"][Math.floor(Math.random()*3)],
      date: new Date().toISOString(),
    };
    store.addMove(demo);
    setMoves(store.getMoves());
  }

  function exportVisible() {
    // Map to flat objects suitable for CSV
    const rows = filtered.map(m => ({
      reference: m.reference || m._id,
      date: m.date,
      type: m.type,
      product: m.productName || m.product || "",
      qty: m.qty || m.quantity || "",
      from: m.fromWarehouse || "",
      to: m.toWarehouse || "",
    }));
    downloadCSV("move_history.csv", rows);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-2xl font-semibold">Move History</h2>
          {/* <div className="text-sm text-gray-500">All stock movements (mocked), latest first.</div> */}
        </div>

        <div className="flex gap-2">
          <input className="p-2 border rounded w-56" placeholder="Search product / ref / wh" value={q} onChange={e=>setQ(e.target.value)} />
          <input type="date" className="p-2 border rounded" value={dateFrom} onChange={e=>setDateFrom(e.target.value)} />
          <input type="date" className="p-2 border rounded" value={dateTo} onChange={e=>setDateTo(e.target.value)} />
          <input className="p-2 border rounded" placeholder="From warehouse" value={fromWarehouse} onChange={e=>setFromWarehouse(e.target.value)} />
          <input className="p-2 border rounded" placeholder="To warehouse" value={toWarehouse} onChange={e=>setToWarehouse(e.target.value)} />
          <button className="bg-green-600 text-black px-3 py-2 rounded" onClick={quickAdd}>+ Add Move</button>
          <button className="bg-blue-600 text-black px-3 py-2 rounded" onClick={exportVisible}>Export CSV</button>
        </div>
      </div>

      <div className="bg-white rounded shadow overflow-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left">Reference</th>
              <th className="px-4 py-2 text-left">Date</th>
              <th className="px-4 py-2 text-left">Type</th>
              <th className="px-4 py-2 text-left">Product</th>
              <th className="px-4 py-2 text-left">Qty</th>
              <th className="px-4 py-2 text-left">From</th>
              <th className="px-4 py-2 text-left">To</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={7} className="p-6 text-center text-gray-500">No moves yet</td></tr>
            ) : filtered.map(m => (
              <tr key={m._id || m.reference} className="border-b">
                <td className="px-4 py-2 font-medium">{m.reference || m._id}</td>
                <td className="px-4 py-2">{new Date(m.date).toLocaleString()}</td>
                <td className="px-4 py-2">{m.type}</td>
                <td className="px-4 py-2">{m.productName || m.product}</td>
                <td className="px-4 py-2">{m.qty || m.quantity}</td>
                <td className="px-4 py-2">{m.fromWarehouse}</td>
                <td className="px-4 py-2">{m.toWarehouse}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between mt-3">
        <div className="text-sm text-gray-500">Showing {filtered.length} of {moves.length} moves</div>
        <div>
          {limit < moves.length ? (
            <button className="px-3 py-2 border rounded" onClick={()=>setLimit(l=>l+20)}>Load more</button>
          ) : (
            <button className="px-3 py-2 border rounded" onClick={()=>setLimit(20)}>Show less</button>
          )}
        </div>
      </div>
    </div>
  );
}
