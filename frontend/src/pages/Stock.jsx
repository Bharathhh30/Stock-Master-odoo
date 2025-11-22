import React, { useEffect, useState } from "react";
import api from "../api/axiosClient";
import useSocket from "../hooks/useSocket";

/**
 * Stock page (matches wireframe)
 * - table: Product | per unit cost | On hand | free to use | warehouse
 * - search
 * - row click -> Update modal (increase/decrease/adjust)
 * - Transfer modal
 * - realtime refresh via socket events
 */

/* ----------------- Small helpers (local) ----------------- */

function Toast({ msg, type = "info", onClose }) {
  if (!msg) return null;
  const bg =
    type === "error"
      ? "bg-red-500"
      : type === "success"
      ? "bg-green-500"
      : "bg-gray-700";
  return (
    <div
      className={`fixed right-6 bottom-6 z-50 ${bg} text-white px-4 py-2 rounded shadow-lg`}
      onClick={onClose}
    >
      {msg}
    </div>
  );
}

function Modal({ title, show, onClose, children }) {
  if (!show) return null;
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center">
      <div className="absolute inset-0 bg-black opacity-30" onClick={onClose} />
      <div className="bg-white rounded shadow-lg z-50 w-full max-w-2xl p-4">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-lg font-semibold">{title}</h3>
          <button className="text-gray-600" onClick={onClose}>
            ✕
          </button>
        </div>
        <div>{children}</div>
      </div>
    </div>
  );
}

/* ----------------- Stock page ----------------- */

const SOCKET_URL = import.meta.env.VITE_API_BASE || "http://localhost:4000";

export default function StockPage() {
  const [products, setProducts] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [stockList, setStockList] = useState([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);

  // modal & form state
  const [toast, setToast] = useState(null);
  const [selected, setSelected] = useState(null); // selected stock row for update
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [updateForm, setUpdateForm] = useState({ qty: 0, type: "increase" }); // increase | decrease | adjust
  const [transferForm, setTransferForm] = useState({
    productId: "",
    fromWarehouseId: "",
    toWarehouseId: "",
    qty: 0,
  });

  // socket hook
  const { events, connected } = useSocket({ url: SOCKET_URL });
  useEffect(() => {
    async function handler() {
      // reload quickly when operations change
      await loadStock();
    }
    window.addEventListener("operations:change", handler);
    return () => window.removeEventListener("operations:change", handler);
  }, []);

  useEffect(() => {
    async function loadAll() {
      setLoading(true);
      try {
        const [pRes, wRes] = await Promise.all([
          api.get("/products"),
          api.get("/warehouses"),
        ]);
        setProducts(pRes.data.products || []);
        setWarehouses(wRes.data.warehouses || []);
        await loadStock(); // load stock after products/warehouses
      } catch (e) {
        console.error("Failed to load initial data", e);
        setToast({ msg: "Failed to load initial data", type: "error" });
      } finally {
        setLoading(false);
      }
    }
    loadAll();
    // eslint-disable-next-line
  }, []);

  // refresh on socket events
  useEffect(() => {
    if (events.length > 0) {
      // small debounce: call once per burst of events
      const t = setTimeout(() => loadStock().catch(() => {}), 120);
      return () => clearTimeout(t);
    }
    // eslint-disable-next-line
  }, [events]);

  async function loadStock() {
    try {
      const res = await api.get("/stock");
      // server returns { ok:true, stock: [...] } in your backend. adapt if shape differs
      const list = res.data.stock || res.data || [];
      setStockList(list);
    } catch (e) {
      console.error("Failed to load stock", e);
      setToast({ msg: "Failed to load stock", type: "error" });
    }
  }

  // filter by search q (product name or sku)
  const filtered = stockList.filter((s) => {
    if (!q) return true;
    const name = s.product?.name || "";
    const sku = s.product?.sku || "";
    return (
      name.toLowerCase().includes(q.toLowerCase()) ||
      sku.toLowerCase().includes(q.toLowerCase())
    );
  });

  function freeToUse(s) {
    // reserved field fallback, adapt if different
    const reserved = s.reserved || 0;
    return (s.quantity || 0) - reserved;
  }

  /* ----------------- update modal actions ----------------- */

  function openUpdateModal(stockRow, defaultType = "increase") {
    setSelected(stockRow);
    setUpdateForm({ qty: 0, type: defaultType });
    setShowUpdateModal(true);
  }

  async function submitUpdate(e) {
    e.preventDefault();
    if (!selected) return;
    const { product, warehouse } = selected;
    const productId = product?._id || product;
    const warehouseId = warehouse?._id || warehouse;
    const qty = Number(updateForm.qty || 0);
    if (qty <= 0) {
      setToast({ msg: "Quantity must be greater than 0", type: "error" });
      return;
    }

    try {
      if (updateForm.type === "increase") {
        await api.post("/stock/increase", {
          productId,
          warehouseId,
          qty,
          reason: "ui_increase",
        });
        setToast({
          msg: `Increased ${product?.name || ""} by ${qty}`,
          type: "success",
        });
      } else if (updateForm.type === "decrease") {
        await api.post("/stock/decrease", {
          productId,
          warehouseId,
          qty,
          reason: "ui_decrease",
        });
        setToast({
          msg: `Decreased ${product?.name || ""} by ${qty}`,
          type: "success",
        });
      } else if (updateForm.type === "adjust") {
        // adjust sets absolute countedQty
        await api.post("/stock/adjust", {
          productId,
          warehouseId,
          countedQty: qty,
          reason: "ui_adjust",
        });
        setToast({
          msg: `Adjusted ${product?.name || ""} to ${qty}`,
          type: "success",
        });
      }
      setShowUpdateModal(false);
      setSelected(null);
      await loadStock();
    } catch (err) {
      console.error(err);
      const msg =
        err?.response?.data?.error || err.message || "Operation failed";
      setToast({ msg, type: "error" });
    }
  }

  /* ----------------- transfer modal actions ----------------- */

  function openTransferModal() {
    setTransferForm({
      productId: "",
      fromWarehouseId: "",
      toWarehouseId: "",
      qty: 0,
    });
    setShowTransferModal(true);
  }

  async function submitTransfer(e) {
    e.preventDefault();
    try {
      const { productId, fromWarehouseId, toWarehouseId, qty } = transferForm;
      if (
        !productId ||
        !fromWarehouseId ||
        !toWarehouseId ||
        Number(qty) <= 0
      ) {
        setToast({ msg: "Fill all transfer fields", type: "error" });
        return;
      }
      if (fromWarehouseId === toWarehouseId) {
        setToast({ msg: "From and To warehouses must differ", type: "error" });
        return;
      }
      await api.post("/stock/move", {
        productId,
        fromWarehouseId,
        toWarehouseId,
        qty: Number(qty),
        reason: "ui_transfer",
      });
      setToast({ msg: "Transfer done", type: "success" });
      setShowTransferModal(false);
      await loadStock();
    } catch (err) {
      console.error(err);
      setToast({
        msg: err?.response?.data?.error || "Transfer failed",
        type: "error",
      });
    }
  }

  /* ----------------- small util UI renderers ----------------- */

  function rowLowStockClass(s) {
    const rl = s.product?.reorderLevel;
    if (rl == null) return "";
    return s.quantity <= rl ? "bg-red-50" : "";
  }

  return (
    <div>
      <div className="flex gap-4 mb-4 items-center">
        <div className="flex-1">
          <div className="text-2xl font-semibold mb-1">Stock</div>
          <div className="text-sm text-gray-500">
            Manually update stock or perform transfers
          </div>
        </div>

        <div className="flex gap-2 items-center">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search product name or SKU..."
            className="p-2 border rounded w-64"
          />
          <button
            className="bg-blue-600 text-white px-4 py-2 rounded"
            onClick={openTransferModal}
          >
            Transfer
          </button>
          <div className="text-sm text-gray-600">
            {connected ? "Socket: connected" : "Socket: disconnected"}
          </div>
        </div>
      </div>

      <div className="bg-white p-4 rounded shadow overflow-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left">Product</th>
              <th className="px-4 py-2 text-left">Per unit cost</th>
              <th className="px-4 py-2 text-left">On hand</th>
              <th className="px-4 py-2 text-left">Free to use</th>
              <th className="px-4 py-2 text-left">Warehouse</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-gray-500">
                  Loading...
                </td>
              </tr>
            )}
            {!loading && filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-gray-500">
                  No stock rows yet. Use Increase to create stock.
                </td>
              </tr>
            )}
            {!loading &&
              filtered.map((s) => (
                <tr
                  key={s._id}
                  className={`border-b cursor-pointer ${rowLowStockClass(s)}`}
                  onClick={() => openUpdateModal(s)}
                >
                  <td className="px-4 py-3">
                    <div className="font-medium">{s.product?.name ?? "—"}</div>
                    <div className="text-xs text-gray-500">
                      {s.product?.sku ?? ""}
                    </div>
                  </td>
                  <td className="px-4 py-3">{s.product?.unitCost ?? "—"}</td>
                  <td className="px-4 py-3">{s.quantity ?? 0}</td>
                  <td className="px-4 py-3">{freeToUse(s)}</td>
                  <td className="px-4 py-3">{s.warehouse?.name ?? "—"}</td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {/* Update modal */}
      <Modal
        title={
          selected ? `Update: ${selected.product?.name || ""}` : "Update stock"
        }
        show={showUpdateModal}
        onClose={() => {
          setShowUpdateModal(false);
          setSelected(null);
        }}
      >
        <form onSubmit={submitUpdate}>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-sm block mb-1">Operation</label>
              <select
                value={updateForm.type}
                onChange={(e) =>
                  setUpdateForm((f) => ({ ...f, type: e.target.value }))
                }
                className="p-2 border rounded w-full"
              >
                <option value="increase">Increase (Receipt)</option>
                <option value="decrease">Decrease (Delivery)</option>
                <option value="adjust">Adjust (Counted qty)</option>
              </select>
            </div>

            <div>
              <label className="text-sm block mb-1">Quantity</label>
              <input
                type="number"
                min="0"
                value={updateForm.qty}
                onChange={(e) =>
                  setUpdateForm((f) => ({ ...f, qty: e.target.value }))
                }
                className="p-2 border rounded w-full"
              />
            </div>

            <div className="flex items-end">
              <button
                type="submit"
                className="bg-blue-600 text-white px-4 py-2 rounded"
              >
                Submit
              </button>
              <button
                type="button"
                className="ml-2 px-4 py-2 border rounded"
                onClick={() => {
                  setShowUpdateModal(false);
                  setSelected(null);
                }}
              >
                Cancel
              </button>
            </div>
          </div>
          <div className="mt-3 text-sm text-gray-500">
            On submit we call the corresponding API and refresh the table.
          </div>
        </form>
      </Modal>

      {/* Transfer modal */}
      <Modal
        title="Transfer stock between warehouses"
        show={showTransferModal}
        onClose={() => setShowTransferModal(false)}
      >
        <form onSubmit={submitTransfer}>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm block mb-1">Product</label>
              <select
                className="p-2 border rounded w-full"
                value={transferForm.productId}
                onChange={(e) =>
                  setTransferForm((t) => ({ ...t, productId: e.target.value }))
                }
              >
                <option value="">Select product</option>
                {products.map((p) => (
                  <option key={p._id} value={p._id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm block mb-1">Qty</label>
              <input
                className="p-2 border rounded w-full"
                type="number"
                value={transferForm.qty}
                onChange={(e) =>
                  setTransferForm((t) => ({ ...t, qty: e.target.value }))
                }
              />
            </div>

            <div>
              <label className="text-sm block mb-1">From (warehouse)</label>
              <select
                className="p-2 border rounded w-full"
                value={transferForm.fromWarehouseId}
                onChange={(e) =>
                  setTransferForm((t) => ({
                    ...t,
                    fromWarehouseId: e.target.value,
                  }))
                }
              >
                <option value="">From</option>
                {warehouses.map((w) => (
                  <option key={w._id} value={w._id}>
                    {w.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm block mb-1">To (warehouse)</label>
              <select
                className="p-2 border rounded w-full"
                value={transferForm.toWarehouseId}
                onChange={(e) =>
                  setTransferForm((t) => ({
                    ...t,
                    toWarehouseId: e.target.value,
                  }))
                }
              >
                <option value="">To</option>
                {warehouses.map((w) => (
                  <option key={w._id} value={w._id}>
                    {w.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-4 flex gap-2">
            <button
              className="bg-blue-600 text-white px-4 py-2 rounded"
              type="submit"
            >
              Transfer
            </button>
            <button
              className="px-4 py-2 border rounded"
              type="button"
              onClick={() => setShowTransferModal(false)}
            >
              Cancel
            </button>
          </div>
        </form>
      </Modal>

      <Toast
        msg={toast?.msg}
        type={toast?.type}
        onClose={() => setToast(null)}
      />
    </div>
  );
}
