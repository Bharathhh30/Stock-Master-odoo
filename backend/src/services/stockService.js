// backend/src/services/stockService.js
import mongoose from "mongoose";
import Stock from "../models/Stock.js";
import Move from "../models/Move.js";
import { emitStockChange, emitLowStock } from "./socketHelper.js";
import Product from "../models/Product.js";

// create or find stock
export async function getOrCreateStock(productId, warehouseId, session = null) {
  const filter = { product: productId, warehouse: warehouseId };
  const update = { $setOnInsert: { quantity: 0 } };
  const opts = { new: true, upsert: true, setDefaultsOnInsert: true, session };

  return Stock.findOneAndUpdate(filter, update, opts);
}

// ----------------------------------------------
// INCREASE STOCK
// ----------------------------------------------
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

    // emit
    if (io) {
      console.log("DEBUG EMIT ATTEMPT incrementStock", {
        productId,
        warehouseId,
        qty: stock.quantity,
        ioPresent: !!io,
      });

      emitStockChange(io, {
        productId,
        warehouseId,
        newQty: stock.quantity,
      });
    }

    const product = await Product.findById(productId);
    if (product && stock.quantity <= product.reorderLevel) {
      if (io) {
        console.log("DEBUG LOW-ALERT incrementStock", {
          productId,
          warehouseId,
          qty: stock.quantity,
          threshold: product.reorderLevel,
        });

        emitLowStock(io, {
          productId,
          warehouseId,
          qty: stock.quantity,
          threshold: product.reorderLevel,
        });
      }
    }

    return stock;
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    throw err;
  }
}

// ----------------------------------------------
// DECREASE STOCK
// ----------------------------------------------
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
    if (!updated) throw new Error("Insufficient stock");

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
      console.log("DEBUG EMIT ATTEMPT decrementStock", {
        productId,
        warehouseId,
        qty: updated.quantity,
      });

      emitStockChange(io, {
        productId,
        warehouseId,
        newQty: updated.quantity,
      });
    }

    const product = await Product.findById(productId);
    if (product && updated.quantity <= product.reorderLevel) {
      if (io) {
        console.log("DEBUG LOW-ALERT decrementStock", {
          productId,
          warehouseId,
          qty: updated.quantity,
          threshold: product.reorderLevel,
        });

        emitLowStock(io, {
          productId,
          warehouseId,
          qty: updated.quantity,
          threshold: product.reorderLevel,
        });
      }
    }

    return updated;
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    throw err;
  }
}

// ----------------------------------------------
// TRANSFER STOCK
// ----------------------------------------------
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
    if (!dec) throw new Error("Insufficient stock in source warehouse");

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
      console.log("DEBUG EMIT ATTEMPT transferStock", {
        productId,
        fromWarehouseId,
        toWarehouseId,
        decQty: dec.quantity,
        incQty: inc.quantity,
      });

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
    }

    const product = await Product.findById(productId);
    if (product) {
      if (dec.quantity <= product.reorderLevel && io) {
        emitLowStock(io, {
          productId,
          warehouseId: fromWarehouseId,
          qty: dec.quantity,
          threshold: product.reorderLevel,
        });
      }
      if (inc.quantity <= product.reorderLevel && io) {
        emitLowStock(io, {
          productId,
          warehouseId: toWarehouseId,
          qty: inc.quantity,
          threshold: product.reorderLevel,
        });
      }
    }

    return { from: dec, to: inc };
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    throw err;
  }
}

// ----------------------------------------------
// ADJUST STOCK
// ----------------------------------------------
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
    stock.quantity = countedQty;
    await stock.save({ session });

    await Move.create(
      [
        {
          product: productId,
          fromWarehouse: prev >= countedQty ? warehouseId : null,
          toWarehouse: prev <= countedQty ? warehouseId : null,
          qty: Math.abs(countedQty - prev),
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
      console.log("DEBUG EMIT ATTEMPT adjustStock", {
        productId,
        warehouseId,
        qty: stock.quantity,
      });

      emitStockChange(io, {
        productId,
        warehouseId,
        newQty: stock.quantity,
      });
    }

    const product = await Product.findById(productId);
    if (product && stock.quantity <= product.reorderLevel) {
      if (io) {
        emitLowStock(io, {
          productId,
          warehouseId,
          qty: stock.quantity,
          threshold: product.reorderLevel,
        });
      }
    }

    return stock;
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    throw err;
  }
}
