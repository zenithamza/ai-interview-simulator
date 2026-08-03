import { Router } from "express";
import rateLimit from "express-rate-limit";
import { googleLogin, requestOtp, verifyOtp, getMe } from "../controllers/authController.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

// Tight limit — prevents OTP-spam abuse of your email sending quota.
const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many code requests. Wait a few minutes and try again." },
});

router.post("/google", googleLogin);
router.post("/otp/request", otpLimiter, requestOtp);
router.post("/otp/verify", otpLimiter, verifyOtp);
router.get("/me", requireAuth, getMe);

export default router;
