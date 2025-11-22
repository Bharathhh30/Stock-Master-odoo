import mongoose from "mongoose";
import Stock from "../models/Stock.js";
import Move from "../models/Move.js";

export async function getOrCreateStock(productId, warehouseId, session = null) {
  const filter = { product: productId, warehouse: warehouseId };
  const update = {};
  const opts = { upsert: true, new: true, setDefaultsOnInsert: true, session };
  // try find first
  let stock = await Stock.findOne(filter).session(session);
  if (!stock) {
    stock = await Stock.findOneAndUpdate(filter, { $setOnInsert: { quantity: 0 } }, opts);
  }
  return stock;
}

export async function incrementStock({ productId, warehouseId, qty, type='receipt', reason, performedBy=null }) {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const stock = await Stock.findOneAndUpdate(
      { product: productId, warehouse: warehouseId },
      { $inc: { quantity: qty } },
      { new: true, upsert: true, session }
    );

    await Move.create([{
      product: productId, fromWarehouse: null, toWarehouse: warehouseId,
      qty, type, reason, performedBy
    }], { session });

    await session.commitTransaction();
    session.endSession();
    return stock;
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    throw err;
  }
}

export async function decrementStock({ productId, warehouseId, qty, type='delivery', reason, performedBy=null }) {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    // conditional decrement
    const updated = await Stock.findOneAndUpdate(
      { product: productId, warehouse: warehouseId, quantity: { $gte: qty } },
      { $inc: { quantity: -qty } },
      { new: true, session }
    );
    if (!updated) {
      throw new Error("Insufficient stock");
    }

    await Move.create([{
      product: productId, fromWarehouse: warehouseId, toWarehouse: null,
      qty, type, reason, performedBy
    }], { session });

    await session.commitTransaction();
    session.endSession();
    return updated;
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    throw err;
  }
}

export async function transferStock({ productId, fromWarehouseId, toWarehouseId, qty, reason, performedBy=null }) {
  // use transaction to move between warehouses
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const dec = await Stock.findOneAndUpdate(
      { product: productId, warehouse: fromWarehouseId, quantity: { $gte: qty } },
      { $inc: { quantity: -qty } },
      { new: true, session }
    );
    if (!dec) throw new Error("Insufficient stock in fromWarehouse");

    const inc = await Stock.findOneAndUpdate(
      { product: productId, warehouse: toWarehouseId },
      { $inc: { quantity: qty } },
      { new: true, upsert: true, session }
    );

    await Move.create([{
      product: productId,
      fromWarehouse: fromWarehouseId,
      toWarehouse: toWarehouseId,
      qty,
      type: 'transfer',
      reason,
      performedBy
    }], { session });

    await session.commitTransaction();
    session.endSession();
    return { from: dec, to: inc };
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    throw err;
  }
}

export async function adjustStock({ productId, warehouseId, countedQty, reason, performedBy=null }) {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const stock = await getOrCreateStock(productId, warehouseId, session);
    const prev = stock.quantity;
    const diff = countedQty - prev;
    stock.quantity = countedQty;
    await stock.save({ session });

    await Move.create([{
      product: productId,
      fromWarehouse: prev >= countedQty ? warehouseId : null,
      toWarehouse: prev <= countedQty ? warehouseId : null,
      qty: Math.abs(diff),
      type: 'adjustment',
      reason,
      performedBy
    }], { session });

    await session.commitTransaction();
    session.endSession();
    return stock;
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    throw err;
  }
}
