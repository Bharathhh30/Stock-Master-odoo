import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true, sparse: true },
  phone: { type: String, unique: true, sparse: true },
  passwordHash: String,
  role: { type: String, enum: ['admin','manager','staff'], default: 'staff' },

  otp: String,
  otpExpires: Date
}, { timestamps: true });

const User = mongoose.model("User", UserSchema);
export default User;
