import { Router } from "express";
import multer from "multer";
import rateLimit from "express-rate-limit";
import {
  startInterview,
  submitAnswer,
  retryQuestion,
  finishInterview,
  listInterviews,
  getInterview,
  shareInterview,
  unshareInterview,
} from "../controllers/interviewController.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype !== "application/pdf") return cb(new Error("Resume must be a PDF"));
    cb(null, true);
  },
});

// Protects Groq quota from abuse — generous enough for real use, tight enough to matter.
const aiLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 40,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many AI requests this hour. Try again shortly." },
});

router.use(requireAuth);

router.post("/start", aiLimiter, upload.single("resume"), startInterview);
router.post("/:id/answer", aiLimiter, submitAnswer);
router.post("/:id/retry-question", aiLimiter, retryQuestion);
router.post("/:id/finish", aiLimiter, finishInterview);
router.post("/:id/share", shareInterview);
router.post("/:id/unshare", unshareInterview);
router.get("/", listInterviews);
router.get("/:id", getInterview);

export default router;
