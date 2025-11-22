import dotenv from "dotenv";
dotenv.config();

import { validationResult } from "express-validator";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

import User from "../models/User.js";
import { sendOtpSms } from "../services/twilioService.js";

const JWT_SECRET = process.env.JWT_SECRET || "dev_secret";
const JWT_EXPIRES = "8h";

function signToken(user) {
  return jwt.sign({
    id: user._id,
    role: user.role,
    email: user.email
  }, JWT_SECRET, { expiresIn: JWT_EXPIRES });
}

export async function signup(req, res) {
  try {
    const { name, email, phone, password } = req.body;

    const existing = await User.findOne({ $or: [{ email }, { phone }] });
    if (existing) return res.status(400).json({ error: "User exists" });

    const hash = await bcrypt.hash(password, 10);

    const user = await User.create({
      name, email, phone, passwordHash: hash, role: "manager"
    });

    const token = signToken(user);

    res.json({
      token,
      user: {
        id: user._id, name: user.name, email: user.email,
        phone: user.phone, role: user.role
      }
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Server error" });
  }
}

export async function login(req, res) {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ error: "Invalid credentials" });

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(401).json({ error: "Invalid credentials" });

    const token = signToken(user);

    res.json({
      token,
      user: {
        id: user._id, name: user.name, email: user.email,
        phone: user.phone, role: user.role
      }
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Server error" });
  }
}

export async function requestOtp(req, res) {
  try {
    const { phone } = req.body;

    const user = await User.findOne({ phone });
    if (!user) return res.status(404).json({ error: "User not found" });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expires = new Date(Date.now() + 10 * 60 * 1000);

    user.otp = otp;
    user.otpExpires = expires;
    await user.save();

    await sendOtpSms(phone, otp);

    res.json({ ok: true, message: "OTP sent" });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Server error" });
  }
}

export async function verifyOtp(req, res) {
  try {
    const { phone, otp, newPassword } = req.body;

    const user = await User.findOne({ phone });
    if (!user) return res.status(404).json({ error: "User not found" });

    if (!user.otp || user.otpExpires < new Date())
      return res.status(400).json({ error: "OTP expired" });

    if (user.otp !== otp)
      return res.status(400).json({ error: "Invalid OTP" });

    const hash = await bcrypt.hash(newPassword, 10);
    user.passwordHash = hash;
    user.otp = undefined;
    user.otpExpires = undefined;

    await user.save();

    const token = signToken(user);

    res.json({ ok: true, message: "Password reset success", token });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Server error" });
  }
}
