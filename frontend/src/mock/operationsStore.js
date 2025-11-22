// Simple localStorage-backed mock store for Deliveries, Receipts & Moves

const STORE_KEY = "operations_store_v1";

function loadStore() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    return raw ? JSON.parse(raw) : { deliveries: [], receipts: [], moves: [] };
  } catch {
    return { deliveries: [], receipts: [], moves: [] };
  }
}

function saveStore(store) {
  localStorage.setItem(STORE_KEY, JSON.stringify(store));
}

export const store = {
  state: loadStore(),

  // ---- DELIVERIES ----
  getDeliveries() {
    return this.state.deliveries;
  },

  addDelivery(d) {
    d._id = crypto.randomUUID();
    d.createdAt = new Date().toISOString();
    this.state.deliveries.unshift(d);
    saveStore(this.state);
    return d;
  },

  updateDelivery(id, data) {
    const i = this.state.deliveries.findIndex(x => x._id === id);
    if (i !== -1) {
      this.state.deliveries[i] = { ...this.state.deliveries[i], ...data };
      saveStore(this.state);
    }
    return this.state.deliveries[i];
  },

  // ---- RECEIPTS ----
  getReceipts() {
    return this.state.receipts;
  },

  addReceipt(r) {
    r._id = crypto.randomUUID();
    r.createdAt = new Date().toISOString();
    this.state.receipts.unshift(r);
    saveStore(this.state);
    return r;
  },

  updateReceipt(id, data) {
    const i = this.state.receipts.findIndex(x => x._id === id);
    if (i !== -1) {
      this.state.receipts[i] = { ...this.state.receipts[i], ...data };
      saveStore(this.state);
    }
    return this.state.receipts[i];
  },

  // ---- MOVE HISTORY ----
  addMove(move) {
    move._id = crypto.randomUUID();
    move.date = new Date().toISOString();
    this.state.moves.unshift(move);
    saveStore(this.state);
  },

  getMoves() {
    return this.state.moves;
  }
};
