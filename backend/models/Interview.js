import mongoose from "mongoose";
import crypto from "crypto";

const answerSchema = new mongoose.Schema(
  {
    question: { type: String, required: true },
    topic: { type: String, default: "General" },
    difficulty: {
      type: String,
      enum: ["Beginner", "Intermediate", "Advanced"],
      default: "Intermediate",
    },
    answerText: { type: String, default: "" },
    feedback: { type: String, default: "" },
    score: { type: Number, min: 0, max: 10, default: null },
  },
  { _id: false }
);

const interviewSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    role: { type: String, required: true },
    difficulty: {
      type: String,
      enum: ["Beginner", "Intermediate", "Advanced"],
      default: "Intermediate",
    },
    // Interviewer tone — changes the AI system prompt for questions/feedback.
    persona: {
      type: String,
      enum: ["Friendly", "Skeptical", "Rapid-fire"],
      default: "Friendly",
    },
    // "standard" = normal Q&A. "system-design" = fewer, deeper design questions.
    mode: { type: String, enum: ["standard", "system-design"], default: "standard" },
    // Sessions marked practice=true are excluded from stats/streaks and don't email a report.
    practiceMode: { type: Boolean, default: false },
    // Set when a resume was supplied at start, so questions can reference it.
    resumeProvided: { type: Boolean, default: false },
    resumeText: { type: String, default: "", select: false },
    totalQuestions: { type: Number, default: 5 },

    status: {
      type: String,
      enum: ["in_progress", "completed"],
      default: "in_progress",
    },
    answers: [answerSchema],
    report: {
      overallScore: { type: Number, default: null },
      strengths: [String],
      weaknesses: [String],
      summary: { type: String, default: "" },
      recommendation: { type: String, default: "" },
      topicBreakdown: [
        {
          topic: String,
          averageScore: Number,
        },
      ],
    },

    // Public sharing
    isPublic: { type: Boolean, default: false },
    shareId: { type: String, default: null, index: true, unique: true, sparse: true },
  },
  { timestamps: true }
);

interviewSchema.methods.generateShareId = function () {
  this.shareId = crypto.randomBytes(8).toString("hex");
  this.isPublic = true;
  return this.shareId;
};

export default mongoose.model("Interview", interviewSchema);
