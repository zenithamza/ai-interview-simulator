const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

function getModel() {
  return process.env.GROQ_MODEL || "llama-3.3-70b-versatile";
}

async function callGroq({ system, prompt, maxTokens = 1024 }) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error(
      "GROQ_API_KEY is not set. Add it to backend/.env to enable AI features (free key at https://console.groq.com/keys)."
    );
  }

  const res = await fetch(GROQ_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: getModel(),
      max_tokens: maxTokens,
      temperature: 0.7,
      messages: [
        { role: "system", content: system },
        { role: "user", content: prompt },
      ],
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Groq API error (${res.status}): ${text}`);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? "";
}

export function extractJson(raw) {
  const cleaned = raw.replace(/```json/gi, "").replace(/```/g, "").trim();
  const start = cleaned.indexOf("{");
  const arrStart = cleaned.indexOf("[");
  const jsonStart =
    start === -1 ? arrStart : arrStart === -1 ? start : Math.min(start, arrStart);
  const jsonSlice = jsonStart >= 0 ? cleaned.slice(jsonStart) : cleaned;
  return JSON.parse(jsonSlice);
}

const PERSONA_STYLES = {
  Friendly: "warm, encouraging, and patient — you want the candidate to succeed and phrase things supportively",
  Skeptical: "terse and demanding, like a tough FAANG bar-raiser — you push back and probe for depth, don't over-praise",
  "Rapid-fire": "brisk and energetic — you value concise, fast answers and keep questions short and punchy",
};

function personaStyle(persona) {
  return PERSONA_STYLES[persona] || PERSONA_STYLES.Friendly;
}

export async function generateQuestions({ role, difficulty, count = 5, persona = "Friendly", mode = "standard", resumeText = "" }) {
  const system =
    `You are a senior technical interviewer. Your interviewing style is ${personaStyle(persona)}. ` +
    "You design realistic, role-specific interview questions and tag each with a short topic label. " +
    "Respond ONLY with valid JSON — no markdown, no preamble, no commentary.";

  const modeInstruction =
    mode === "system-design"
      ? `Generate ${count} system-design / architecture questions appropriate for a "${role}" role at "${difficulty}" difficulty. Each should require designing or reasoning about a real system (scaling, data modeling, trade-offs), not a quick factual answer.`
      : `Generate ${count} interview questions for a "${role}" role at "${difficulty}" difficulty. Mix conceptual, practical, and one behavioral question. Keep each question concise (1-2 sentences).`;

  const resumeInstruction = resumeText
    ? `\n\nThe candidate's resume is below — where relevant, tailor 1-2 questions to specifically reference their real experience (a technology, project, or claim from it) instead of generic questions:\n"""${resumeText.slice(0, 3000)}"""`
    : "";

  const prompt = `${modeInstruction}${resumeInstruction}

Respond with ONLY a JSON array of objects, like:
[{"question": "...", "topic": "short topic label like 'React state' or 'System design'"}, ...]`;

  const raw = await callGroq({ system, prompt, maxTokens: 1200 });

  const parsed = extractJson(raw);
  if (!Array.isArray(parsed)) throw new Error("AI did not return a question array");
  return parsed.map((q) => (typeof q === "string" ? { question: q, topic: "General" } : q));
}

export async function generateFeedback({ role, question, answerText, persona = "Friendly" }) {
  const system =
    `You are a senior technical interviewer giving feedback on one interview answer. Your style is ${personaStyle(persona)}. ` +
    "Respond ONLY with valid JSON — no markdown, no preamble.";

  const prompt = `Role: ${role}
Question: ${question}
Candidate's spoken answer (transcribed, may include minor speech-to-text errors): "${answerText || "(no answer given)"}"

Evaluate the answer. Respond with ONLY this JSON shape:
{
  "score": <integer 0-10>,
  "feedback": "<2-4 sentences of specific, constructive feedback>"
}`;

  const raw = await callGroq({ system, prompt, maxTokens: 400 });

  return extractJson(raw);
}

export async function generateReport({ role, difficulty, answers }) {
  const system =
    "You are a senior technical interviewer writing a final performance report after a mock interview. " +
    "Respond ONLY with valid JSON — no markdown, no preamble.";

  const transcript = answers
    .map(
      (a, i) =>
        `Q${i + 1} [topic: ${a.topic || "General"}]: ${a.question}\nAnswer: ${a.answerText || "(no answer)"}\nScore given: ${a.score ?? "N/A"}`
    )
    .join("\n\n");

  const prompt = `Role: ${role}
Difficulty: ${difficulty}

Full interview transcript:
${transcript}

Write a final improvement report. Respond with ONLY this JSON shape:
{
  "overallScore": <integer 0-10>,
  "strengths": ["short bullet", "short bullet", "short bullet"],
  "weaknesses": ["short bullet", "short bullet", "short bullet"],
  "summary": "<3-5 sentence overall summary of performance>",
  "recommendation": "<2-3 sentences on what to study or practice next>"
}`;

  const raw = await callGroq({ system, prompt, maxTokens: 700 });

  return extractJson(raw);
}

// Adaptive difficulty: nudge up/down based on the score just given.
const DIFFICULTY_ORDER = ["Beginner", "Intermediate", "Advanced"];
export function nextDifficulty(currentDifficulty, lastScore) {
  const idx = DIFFICULTY_ORDER.indexOf(currentDifficulty);
  if (idx === -1 || lastScore === null || lastScore === undefined) return currentDifficulty;
  if (lastScore >= 8 && idx < DIFFICULTY_ORDER.length - 1) return DIFFICULTY_ORDER[idx + 1];
  if (lastScore <= 4 && idx > 0) return DIFFICULTY_ORDER[idx - 1];
  return currentDifficulty;
}
