import Interview from "../models/Interview.js";

// GET /api/public/reports/:shareId — no auth required
export async function getPublicReport(req, res) {
  try {
    const interview = await Interview.findOne({
      shareId: req.params.shareId,
      isPublic: true,
      status: "completed",
    }).select("role difficulty persona mode answers report createdAt");

    if (!interview) return res.status(404).json({ message: "This report isn't available" });
    res.json(interview);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to load report" });
  }
}
