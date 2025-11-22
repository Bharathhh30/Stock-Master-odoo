import React, { useEffect, useState, useMemo } from "react";
import { store } from "../mock/operationsStore";

// Status labels + colors
const STATUSES = ["draft", "waiting", "ready", "done", "cancelled"];
const STATUS_LABEL = {
  draft: "Draft",
  waiting: "Waiting",
  ready: "Ready",
  done: "Done",
  cancelled: "Cancelled",
};
const STATUS_COLOR = {
  draft: "bg-gray-200 text-gray-700",
  waiting: "bg-yellow-200 text-yellow-900",
  ready: "bg-blue-200 text-blue-900",
  done: "bg-green-200 text-green-900",
  cancelled: "bg-red-200 text-red-900",
};

export default function Deliveries() {
  const [list, setList] = useState([]);
  const [q, setQ] = useState("");
  const [view, setView] = useState("list");
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    setList(store.getDeliveries());
  }, []);

  const filtered = useMemo(() => {
    return list.filter((d) => {
      if (!q) return true;
      const term = q.toLowerCase();
      return (
        d.reference?.toLowerCase().includes(term) ||
        d.contact?.toLowerCase().includes(term)
      );
    });
  }, [list, q]);

  const grouped = useMemo(() => {
    const obj = {};
    STATUSES.forEach((s) => (obj[s] = []));
    list.forEach((d) => obj[d.status || "draft"].push(d));
    return obj;
  }, [list]);

  function createDummyDelivery() {
    const d = store.addDelivery({
      reference: `DLV-${Math.floor(Math.random() * 9000 + 1000)}`,
      contact: "John Doe",
      status: "draft",
      fromWarehouse: "Main WH",
      toWarehouse: "Client",
      dateScheduled: new Date().toISOString(),
      items: [{ name: "Product A", qty: 3 }],
    });
    setList([...store.getDeliveries()]);
  }

  function updateStatus(d, status) {
    store.updateDelivery(d._id, { status });
    setList([...store.getDeliveries()]);
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-2xl font-semibold">Deliveries</h2>
          <p className="text-gray-500 text-sm">Mock Mode — no backend needed</p>
        </div>

        <div className="flex gap-2">
          <input
            className="p-2 border rounded"
            placeholder="Search..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <button
            className={`${view === "list" ? "bg-blue-600 text-white" : "border"} px-3 py-2 rounded`}
            onClick={() => setView("list")}
          >
            List
          </button>
          <button
            className={`${view === "kanban" ? "bg-blue-600 text-white" : "border"} px-3 py-2 rounded`}
            onClick={() => setView("kanban")}
          >
            Kanban
          </button>
          <button
            className="bg-green-600 text-white px-4 py-2 rounded"
            onClick={createDummyDelivery}
          >
            + New Delivery
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
              {filtered.map((d) => (
                <tr
                  key={d._id}
                  className="border-b cursor-pointer hover:bg-gray-50"
                  onClick={() => setSelected(d)}
                >
                  <td className="px-4 py-2">{d.reference}</td>
                  <td className="px-4 py-2">
                    {new Date(d.dateScheduled).toLocaleString()}
                  </td>
                  <td className="px-4 py-2">{d.contact}</td>
                  <td className="px-4 py-2">{d.fromWarehouse}</td>
                  <td className="px-4 py-2">{d.toWarehouse}</td>
                  <td className="px-4 py-2">
                    <span className={`px-2 py-1 rounded text-xs ${STATUS_COLOR[d.status]}`}>
                      {STATUS_LABEL[d.status]}
                    </span>
                  </td>
                </tr>
              ))}
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
                {grouped[s].map((d) => (
                  <div
                    key={d._id}
                    className="border rounded p-2 cursor-pointer hover:bg-gray-50"
                    onClick={() => setSelected(d)}
                  >
                    <div className="font-medium">{d.reference}</div>
                    <div className="text-xs text-gray-500">{d.contact}</div>
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
                className="text-gray-500"
                onClick={() => setSelected(null)}
              >
                ✕
              </button>
            </div>

            <div className="text-sm space-y-2">
              <div><strong>Contact:</strong> {selected.contact}</div>
              <div>
                <strong>Warehouse:</strong> {selected.fromWarehouse} →{" "}
                {selected.toWarehouse}
              </div>
              <div>
                <strong>Status:</strong>{" "}
                <span
                  className={`px-2 py-1 rounded text-xs ${STATUS_COLOR[selected.status]}`}
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

            {/* Status Update */}
            <div className="mt-4">
              <strong>Change Status</strong>
              <div className="flex gap-2 mt-2 flex-wrap">
                {STATUSES.map((s) => (
                  <button
                    key={s}
                    className={`px-3 py-1 rounded text-xs border ${
                      selected.status === s
                        ? "bg-blue-600 text-white"
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
}
