export function emitStockChange(io, { productId, warehouseId, newQty }) {
  io.to(`warehouse_${warehouseId}`).emit("stock:changed", {
    productId,
    warehouseId,
    newQty
  });

  io.emit("stock:changed:global", {
    productId,
    warehouseId,
    newQty
  });
}

export function emitLowStock(io, { productId, warehouseId, qty, threshold }) {
  io.emit("stock:low", {
    productId,
    warehouseId,
    qty,
    threshold,
    time: new Date().toISOString()
  });
}
