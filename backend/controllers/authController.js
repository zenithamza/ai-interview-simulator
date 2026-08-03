import crypto from "crypto";
import { OAuth2Client } from "google-auth-library";
import User from "../models/User.js";
import { signToken } from "../utils/jwt.js";
import { sendOtpEmail } from "../services/emailService.js";

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

function hashCode(code) {
  return crypto.createHash("sha256").update(code).digest("hex");
}

function publicUser(user) {
  return { id: user._id, email: user.email, name: user.name, avatarUrl: user.avatarUrl };
}

// POST /api/auth/google
// body: { credential }  — the ID token from Google Identity Services
export async function googleLogin(req, res) {
  try {
    const { credential } = req.body;
    if (!credential) return res.status(400).json({ message: "credential is required" });
    if (!process.env.GOOGLE_CLIENT_ID) {
      return res.status(500).json({ message: "Google sign-in is not configured on the server" });
    }

    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();

    let user = await User.findOne({ $or: [{ googleId: payload.sub }, { email: payload.email }] });

    if (!user) {
      user = await User.create({
        email: payload.email,
        name: payload.name || "",
        avatarUrl: payload.picture || "",
        googleId: payload.sub,
      });
    } else if (!user.googleId) {
      user.googleId = payload.sub;
      if (!user.avatarUrl) user.avatarUrl = payload.picture || "";
      if (!user.name) user.name = payload.name || "";
      await user.save();
    }

    const token = signToken(user);
    res.json({ token, user: publicUser(user) });
  } catch (err) {
    console.error(err);
    res.status(401).json({ message: "Google sign-in failed" });
  }
}

// POST /api/auth/otp/request
// body: { email }
export async function requestOtp(req, res) {
  try {
    const email = (req.body.email || "").trim().toLowerCase();
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      return res.status(400).json({ message: "A valid email is required" });
    }

    const code = String(crypto.randomInt(100000, 999999));
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    let user = await User.findOne({ email });
    if (!user) user = new User({ email });

    user.otp = { codeHash: hashCode(code), expiresAt, attempts: 0 };
    await user.save();

    await sendOtpEmail(email, code);
    res.json({ message: "OTP sent" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to send OTP" });
  }
}

// POST /api/auth/otp/verify
// body: { email, code }
export async function verifyOtp(req, res) {
  try {
    const email = (req.body.email || "").trim().toLowerCase();
    const code = (req.body.code || "").trim();

    const user = await User.findOne({ email });
    if (!user || !user.otp?.codeHash) {
      return res.status(400).json({ message: "No pending code for this email. Request a new one." });
    }

    if (user.otp.attempts >= 5) {
      return res.status(429).json({ message: "Too many attempts. Request a new code." });
    }

    if (new Date() > new Date(user.otp.expiresAt)) {
      return res.status(400).json({ message: "Code expired. Request a new one." });
    }

    if (hashCode(code) !== user.otp.codeHash) {
      user.otp.attempts += 1;
      await user.save();
      return res.status(400).json({ message: "Incorrect code" });
    }

    user.otp = { codeHash: null, expiresAt: null, attempts: 0 };
    await user.save();

    const token = signToken(user);
    res.json({ token, user: publicUser(user) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to verify OTP" });
  }
}

// GET /api/auth/me  (protected)
export async function getMe(req, res) {
  res.json({ user: publicUser(req.user) });
}
