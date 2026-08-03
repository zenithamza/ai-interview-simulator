import Interview from "../models/Interview.js";
import {
  generateQuestions,
  generateFeedback,
  generateReport,
  nextDifficulty,
} from "../services/aiService.js";
import { sendReportEmail } from "../services/emailService.js";
import { extractResumeText } from "../services/resumeService.js";
import { computeTopicBreakdown } from "../utils/topicBreakdown.js";

// POST /api/interviews/start  (multipart/form-data — resume file optional)
export async function startInterview(req, res) {
  try {
    const { role, difficulty = "Intermediate", persona = "Friendly", mode = "standard" } = req.body;
    const practiceMode = req.body.practiceMode === "true" || req.body.practiceMode === true;

    if (!role) return res.status(400).json({ message: "role is required" });

    let resumeText = "";
    if (req.file) {
      try {
        resumeText = await extractResumeText(req.file.buffer);
      } catch (err) {
        console.warn("Resume parse failed, continuing without it:", err.message);
      }
    }

    const totalQuestions = mode === "system-design" ? 3 : 5;

    const [firstQuestion] = await generateQuestions({
      role,
      difficulty,
      persona,
      mode,
      resumeText,
      count: 1,
    });

    const interview = await Interview.create({
      user: req.user._id,
      role,
      difficulty,
      persona,
      mode,
      practiceMode,
      totalQuestions,
      resumeProvided: Boolean(resumeText),
      resumeText,
      status: "in_progress",
      answers: [
        {
          question: firstQuestion.question,
          topic: firstQuestion.topic || "General",
          difficulty,
          answerText: "",
          feedback: "",
          score: null,
        },
      ],
    });

    const obj = interview.toObject();
    delete obj.resumeText;
    res.status(201).json(obj);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message || "Failed to start interview" });
  }
}

async function loadOwnedInterview(id, userId, { withResume = false } = {}) {
  const query = Interview.findById(id);
  if (withResume) query.select("+resumeText");
  const interview = await query;
  if (!interview) return { error: 404, message: "Interview not found" };
  if (interview.user.toString() !== userId.toString()) {
    return { error: 403, message: "This interview doesn't belong to your account" };
  }
  return { interview };
}

// POST /api/interviews/:id/answer
// body: { questionIndex, answerText }
export async function submitAnswer(req, res) {
  try {
    const { id } = req.params;
    const { questionIndex, answerText } = req.body;

    const { interview, error, message } = await loadOwnedInterview(id, req.user._id, {
      withResume: true,
    });
    if (error) return res.status(error).json({ message });

    const qa = interview.answers[questionIndex];
    if (!qa) return res.status(400).json({ message: "Invalid questionIndex" });

    const { score, feedback } = await generateFeedback({
      role: interview.role,
      question: qa.question,
      answerText,
      persona: interview.persona,
    });

    qa.answerText = answerText;
    qa.feedback = feedback;
    qa.score = score;

    // Adaptive difficulty: generate the next question only once this one is
    // answered, calibrated to how well the candidate just did.
    const isLastGenerated = Number(questionIndex) === interview.answers.length - 1;
    if (isLastGenerated && interview.answers.length < interview.totalQuestions) {
      const nextDiff = nextDifficulty(interview.difficulty, score);
      interview.difficulty = nextDiff;

      const [nextQ] = await generateQuestions({
        role: interview.role,
        difficulty: nextDiff,
        persona: interview.persona,
        mode: interview.mode,
        resumeText: interview.resumeText,
        count: 1,
      });

      interview.answers.push({
        question: nextQ.question,
        topic: nextQ.topic || "General",
        difficulty: nextDiff,
        answerText: "",
        feedback: "",
        score: null,
      });
    }

    await interview.save();
    const obj = interview.toObject();
    delete obj.resumeText;
    res.json(obj);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message || "Failed to submit answer" });
  }
}

// POST /api/interviews/:id/retry-question
// body: { questionIndex }
export async function retryQuestion(req, res) {
  try {
    const { id } = req.params;
    const { questionIndex } = req.body;

    const { interview, error, message } = await loadOwnedInterview(id, req.user._id, {
      withResume: true,
    });
    if (error) return res.status(error).json({ message });

    const qa = interview.answers[questionIndex];
    if (!qa) return res.status(400).json({ message: "Invalid questionIndex" });

    const [newQ] = await generateQuestions({
      role: interview.role,
      difficulty: qa.difficulty,
      persona: interview.persona,
      mode: interview.mode,
      resumeText: interview.resumeText,
      count: 1,
    });

    qa.question = newQ.question;
    qa.topic = newQ.topic || "General";
    qa.answerText = "";
    qa.feedback = "";
    qa.score = null;

    await interview.save();
    const obj = interview.toObject();
    delete obj.resumeText;
    res.json(obj);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message || "Failed to regenerate question" });
  }
}

// POST /api/interviews/:id/finish
export async function finishInterview(req, res) {
  try {
    const { id } = req.params;
    const { interview, error, message } = await loadOwnedInterview(id, req.user._id);
    if (error) return res.status(error).json({ message });

    const report = await generateReport({
      role: interview.role,
      difficulty: interview.difficulty,
      answers: interview.answers,
    });
    report.topicBreakdown = computeTopicBreakdown(interview.answers);

    interview.report = report;
    interview.status = "completed";
    await interview.save();

    res.json(interview);

    if (!interview.practiceMode) {
      sendReportEmail(req.user.email, interview).catch((err) =>
        console.error("Failed to send report email:", err.message)
      );
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message || "Failed to finish interview" });
  }
}

// POST /api/interviews/:id/share
export async function shareInterview(req, res) {
  try {
    const { interview, error, message } = await loadOwnedInterview(req.params.id, req.user._id);
    if (error) return res.status(error).json({ message });
    if (interview.status !== "completed") {
      return res.status(400).json({ message: "Only completed interviews can be shared" });
    }

    if (!interview.shareId) interview.generateShareId();
    else interview.isPublic = true;
    await interview.save();

    res.json({ shareId: interview.shareId, isPublic: interview.isPublic });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message || "Failed to share interview" });
  }
}

// POST /api/interviews/:id/unshare
export async function unshareInterview(req, res) {
  try {
    const { interview, error, message } = await loadOwnedInterview(req.params.id, req.user._id);
    if (error) return res.status(error).json({ message });

    interview.isPublic = false;
    await interview.save();
    res.json({ isPublic: false });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message || "Failed to unshare interview" });
  }
}

// GET /api/interviews
export async function listInterviews(req, res) {
  try {
    const interviews = await Interview.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .select("role difficulty persona mode practiceMode status report.overallScore createdAt");

    res.json(interviews);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message || "Failed to load history" });
  }
}

// GET /api/interviews/:id
export async function getInterview(req, res) {
  try {
    const { interview, error, message } = await loadOwnedInterview(req.params.id, req.user._id);
    if (error) return res.status(error).json({ message });
    res.json(interview);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message || "Failed to load interview" });
  }
}
