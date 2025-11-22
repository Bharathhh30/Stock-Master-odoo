import mongoose from 'mongoose';

const { Schema } = mongoose;

const LocationSchema = new Schema({
  code: { type: String, required: true },
  name: { type: String, required: true },
  warehouse: { type: Schema.Types.ObjectId, ref: 'Warehouse', required: false },
}, { timestamps: true });

export default mongoose.model('Location', LocationSchema);
