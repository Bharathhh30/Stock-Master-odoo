import React, { useEffect, useMemo, useState } from "react";
import { store } from "../mock/operationsStore";

// Status pipeline (similar to deliveries)
const STATUSES = ["draft", "waiting", "ready", "done", "cancelled"];
const STATUS_LABEL = {
  draft: "Draft",
  waiting: "Waiting",
  ready: "Ready",
  done: "Done",
  cancelled: "Cancelled",
};
const STATUS_COLOR = {
  draft: "inline-block bg-gray-200 text-gray-700",
  waiting: "inline-block bg-yellow-200 text-yellow-900",
  ready: "inline-block bg-blue-200 text-blue-900",
  done: "inline-block bg-green-200 text-green-900",
  cancelled: "inline-block bg-red-200 text-red-900",
};

export default function Receipts() {
  const [list, setList] = useState([]);
  const [q, setQ] = useState("");
  const [view, setView] = useState("list");
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    setList(store.getReceipts());
  }, []);

  const filtered = useMemo(() => {
    return list.filter((r) => {
      if (!q) return true;
      const term = q.toLowerCase();
      return (
        r.reference?.toLowerCase().includes(term) ||
        r.contact?.toLowerCase().includes(term)
      );
    });
  }, [list, q]);

  const grouped = useMemo(() => {
    const obj = {};
    STATUSES.forEach((s) => (obj[s] = []));
    list.forEach((r) => obj[r.status || "draft"].push(r));
    return obj;
  }, [list]);

  function createDummyReceipt() {
    const r = store.addReceipt({
      reference: `RCT-${Math.floor(Math.random() * 9000 + 1000)}`,
      contact: "Supplier X",
      status: "draft",
      toWarehouse: "Main WH",
      fromWarehouse: "Supplier",
      dateScheduled: new Date().toISOString(),
      items: [{ name: "Product B", qty: 10 }],
    });
    setList([...store.getReceipts()]);
  }

  function updateStatus(r, status) {
    store.updateReceipt(r._id, { status });
    setList([...store.getReceipts()]);
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-2xl font-semibold">Receipts</h2>
          <p className="text-gray-500 text-sm">
            
          </p>
        </div>

        <div className="flex gap-2">
          <input
            className="p-2 border rounded"
            placeholder="Search..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <button
            className={`${
              view === "list" ? "bg-blue-600 text-black" : "border"
            } px-3 py-2 rounded`}
            onClick={() => setView("list")}
          >
            List
          </button>
          <button
            className={`${
              view === "kanban" ? "bg-blue-600 text-black" : "border"
            } px-3 py-2 rounded`}
            onClick={() => setView("kanban")}
          >
            Kanban
          </button>
          <button
            className="bg-green-600 text-black px-4 py-2 rounded"
            onClick={createDummyReceipt}
          >
            + New Receipt
          </button>
        </div>
      </div>

      {/* LIST VIEW */}
      {view === "list" && (
        <div className="bg-white rounded shadow overflow-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left">Reference</th>
                <th className="px-4 py-2 text-left">Date</th>
                <th className="px-4 py-2 text-left">Contact</th>
                <th className="px-4 py-2 text-left">From</th>
                <th className="px-4 py-2 text-left">To</th>
                <th className="px-4 py-2 text-left">Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr
                  key={r._id}
                  className="border-b cursor-pointer hover:bg-gray-50"
                  onClick={() => setSelected(r)}
                >
                  <td className="px-4 py-2">{r.reference}</td>
                  <td className="px-4 py-2">
                    {new Date(r.dateScheduled).toLocaleString()}
                  </td>
                  <td className="px-4 py-2">{r.contact}</td>
                  <td className="px-4 py-2">{r.fromWarehouse}</td>
                  <td className="px-4 py-2">{r.toWarehouse}</td>
                  <td className="px-4 py-2">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        STATUS_COLOR[r.status] ??
                        "inline-block bg-gray-200 text-gray-700"
                      }`}
                    >
                      {STATUS_LABEL[r.status] ?? r.status}
                    </span>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-gray-500">
                    No receipts yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* KANBAN VIEW */}
      {view === "kanban" && (
        <div className="grid grid-cols-5 gap-4">
          {STATUSES.map((s) => (
            <div key={s} className="bg-white rounded shadow p-3">
              <div className="font-semibold mb-2 flex justify-between">
                <span>{STATUS_LABEL[s]}</span>
                <span className="text-sm text-gray-500">
                  {grouped[s].length}
                </span>
              </div>
              <div className="space-y-3">
                {grouped[s].map((r) => (
                  <div
                    key={r._id}
                    className="border rounded p-2 cursor-pointer hover:bg-gray-500"
                    onClick={() => setSelected(r)}
                  >
                    <div className="font-medium">{r.reference}</div>
                    <div className="text-xs text-gray-500">{r.contact}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* DETAIL MODAL */}
      {selected && (
        <div className="fixed inset-0 flex items-center justify-center z-40">
          <div
            className="absolute inset-0 bg-black opacity-30"
            onClick={() => setSelected(null)}
          />

          <div className="bg-white rounded shadow-lg p-4 w-full max-w-xl z-50">
            <div className="flex justify-between mb-3">
              <h3 className="text-lg font-semibold">{selected.reference}</h3>
              <button
                className="text-blue-500"
                onClick={() => setSelected(null)}
              >
                ✕
              </button>
            </div>

            <div className="text-sm space-y-2">
              <div>
                <strong>Supplier:</strong> {selected.contact}
              </div>
              <div>
                <strong>Warehouse:</strong> {selected.fromWarehouse} →{" "}
                {selected.toWarehouse}
              </div>
              <div>
                <strong>Status:</strong>{" "}
                <span
                  className={`px-2 py-1 rounded text-xs ${
                    STATUS_COLOR[selected.status]
                  }`}
                >
                  {STATUS_LABEL[selected.status]}
                </span>
              </div>
              <div>
                <strong>Date:</strong>{" "}
                {new Date(selected.dateScheduled).toLocaleString()}
              </div>
            </div>

            <div className="mt-4">
              <strong>Items</strong>
              <div className="mt-2 border p-2 rounded bg-gray-50">
                {selected.items.map((i, idx) => (
                  <div key={idx} className="flex justify-between">
                    <span>{i.name}</span>
                    <span>{i.qty}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-4">
              <strong>Change Status</strong>
              <div className="flex gap-2 mt-2 flex-wrap">
                {STATUSES.map((s) => (
                  <button
                    key={s}
                    className={`px-3 py-1 rounded text-xs border ${
                      selected.status === s
                        ? "bg-blue-600 text-blue"
                        : "bg-gray-100"
                    }`}
                    onClick={() => updateStatus(selected, s)}
                  >
                    {STATUS_LABEL[s]}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-4 text-right">
              <button
                className="px-4 py-2 border rounded"
                onClick={() => setSelected(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  function updateStatus(selectedItem, status) {
    // small helper defined after return to keep UI code compact above
    store.updateReceipt(selectedItem._id, { status });
    setList([...store.getReceipts()]);
    setSelected(store.getReceipts().find((x) => x._id === selectedItem._id));
  }
}
