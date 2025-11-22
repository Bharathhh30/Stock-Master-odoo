// backend/src/services/stockService.js
import mongoose from "mongoose";
import Stock from "../models/Stock.js";
import Move from "../models/Move.js";
import { emitStockChange, emitLowStock } from "./socketHelper.js";
import Product from "../models/Product.js";

/**
 * Note: all mutating functions accept `io` (socket) and `performedBy` so
 * controllers can pass req.app.get('io') and req.user.id (or req.body.performedBy).
 */

export async function getOrCreateStock(productId, warehouseId, session = null) {
  const filter = { product: productId, warehouse: warehouseId };
  const update = { $setOnInsert: { quantity: 0 } };
  const opts = { new: true, upsert: true, setDefaultsOnInsert: true, session };

  if (session) {
    return Stock.findOneAndUpdate(filter, update, opts);
  } else {
    // no session: use a single findOneAndUpdate (upsert)
    return Stock.findOneAndUpdate(filter, update, {
      new: true,
      upsert: true,
      setDefaultsOnInsert: true,
    });
  }
}

export async function incrementStock({
  productId,
  warehouseId,
  qty,
  type = "receipt",
  reason,
  performedBy = null,
  io = null,
}) {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const stock = await Stock.findOneAndUpdate(
      { product: productId, warehouse: warehouseId },
      { $inc: { quantity: qty } },
      { new: true, upsert: true, session }
    );

    await Move.create(
      [
        {
          product: productId,
          fromWarehouse: null,
          toWarehouse: warehouseId,
          qty,
          type,
          reason,
          performedBy,
        },
      ],
      { session }
    );

    await session.commitTransaction();
    session.endSession();

    // Emit stock change (only if io provided)
    if (io) {
      try {
        emitStockChange(io, { productId, warehouseId, newQty: stock.quantity });
      } catch (e) {
        console.error("emitStockChange error (increment):", e);
      }
    }

    // check low stock (safe: product might be null)
    const product = await Product.findById(productId);
    if (product && stock.quantity <= (product.reorderLevel || 0)) {
      if (io) {
        try {
          emitLowStock(io, {
            productId,
            warehouseId,
            qty: stock.quantity,
            threshold: product.reorderLevel || 0,
          });
        } catch (e) {
          console.error("emitLowStock error (increment):", e);
        }
      }
    }

    return stock;
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    throw err;
  }
}

export async function decrementStock({
  productId,
  warehouseId,
  qty,
  type = "delivery",
  reason,
  performedBy = null,
  io = null,
}) {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const updated = await Stock.findOneAndUpdate(
      { product: productId, warehouse: warehouseId, quantity: { $gte: qty } },
      { $inc: { quantity: -qty } },
      { new: true, session }
    );
    if (!updated) {
      throw new Error("Insufficient stock");
    }

    await Move.create(
      [
        {
          product: productId,
          fromWarehouse: warehouseId,
          toWarehouse: null,
          qty,
          type,
          reason,
          performedBy,
        },
      ],
      { session }
    );

    await session.commitTransaction();
    session.endSession();

    if (io) {
      try {
        emitStockChange(io, {
          productId,
          warehouseId,
          newQty: updated.quantity,
        });
      } catch (e) {
        console.error("emitStockChange error (decrement):", e);
      }
    }

    const product = await Product.findById(productId);
    if (product && updated.quantity <= (product.reorderLevel || 0)) {
      if (io) {
        try {
          emitLowStock(io, {
            productId,
            warehouseId,
            qty: updated.quantity,
            threshold: product.reorderLevel || 0,
          });
        } catch (e) {
          console.error("emitLowStock error (decrement):", e);
        }
      }
    }

    return updated;
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    throw err;
  }
}

export async function transferStock({
  productId,
  fromWarehouseId,
  toWarehouseId,
  qty,
  reason,
  performedBy = null,
  io = null,
}) {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const dec = await Stock.findOneAndUpdate(
      {
        product: productId,
        warehouse: fromWarehouseId,
        quantity: { $gte: qty },
      },
      { $inc: { quantity: -qty } },
      { new: true, session }
    );
    if (!dec) throw new Error("Insufficient stock in fromWarehouse");

    const inc = await Stock.findOneAndUpdate(
      { product: productId, warehouse: toWarehouseId },
      { $inc: { quantity: qty } },
      { new: true, upsert: true, session }
    );

    await Move.create(
      [
        {
          product: productId,
          fromWarehouse: fromWarehouseId,
          toWarehouse: toWarehouseId,
          qty,
          type: "transfer",
          reason,
          performedBy,
        },
      ],
      { session }
    );

    await session.commitTransaction();
    session.endSession();

    if (io) {
      try {
        emitStockChange(io, {
          productId,
          warehouseId: fromWarehouseId,
          newQty: dec.quantity,
        });
        emitStockChange(io, {
          productId,
          warehouseId: toWarehouseId,
          newQty: inc.quantity,
        });
      } catch (e) {
        console.error("emitStockChange error (transfer):", e);
      }
    }

    const product = await Product.findById(productId);
    if (product) {
      if (dec.quantity <= (product.reorderLevel || 0) && io) {
        try {
          emitLowStock(io, {
            productId,
            warehouseId: fromWarehouseId,
            qty: dec.quantity,
            threshold: product.reorderLevel || 0,
          });
        } catch (e) {
          console.error(e);
        }
      }
      if (inc.quantity <= (product.reorderLevel || 0) && io) {
        try {
          emitLowStock(io, {
            productId,
            warehouseId: toWarehouseId,
            qty: inc.quantity,
            threshold: product.reorderLevel || 0,
          });
        } catch (e) {
          console.error(e);
        }
      }
    }

    return { from: dec, to: inc };
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    throw err;
  }
}

export async function adjustStock({
  productId,
  warehouseId,
  countedQty,
  reason,
  performedBy = null,
  io = null,
}) {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const stock = await getOrCreateStock(productId, warehouseId, session);
    const prev = stock.quantity;
    const diff = countedQty - prev;
    stock.quantity = countedQty;
    await stock.save({ session });

    await Move.create(
      [
        {
          product: productId,
          fromWarehouse: prev >= countedQty ? warehouseId : null,
          toWarehouse: prev <= countedQty ? warehouseId : null,
          qty: Math.abs(diff),
          type: "adjustment",
          reason,
          performedBy,
        },
      ],
      { session }
    );

    await session.commitTransaction();
    session.endSession();

    if (io) {
      try {
        emitStockChange(io, { productId, warehouseId, newQty: stock.quantity });
      } catch (e) {
        console.error("emitStockChange error (adjust):", e);
      }
    }

    const product = await Product.findById(productId);
    if (product && stock.quantity <= (product.reorderLevel || 0)) {
      if (io) {
        try {
          emitLowStock(io, {
            productId,
            warehouseId,
            qty: stock.quantity,
            threshold: product.reorderLevel || 0,
          });
        } catch (e) {
          console.error("emitLowStock error (adjust):", e);
        }
      }
    }

    return stock;
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    throw err;
  }
}
