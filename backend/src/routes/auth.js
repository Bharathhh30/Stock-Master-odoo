import { Router } from "express";
import { signup, login, requestOtp, verifyOtp } from "../controllers/authController.js";

const router = Router();

router.post("/signup", signup);
router.post("/login", login);
router.post("/request-otp", requestOtp);
router.post("/verify-otp", verifyOtp);

export default router;
