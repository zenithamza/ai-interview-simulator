import { PDFParse } from "pdf-parse";

// Extracts plain text from an uploaded resume PDF buffer.
// Truncated hard at a generous length — only the first couple thousand
// characters are ever sent to the AI anyway (see aiService.generateQuestions).
export async function extractResumeText(buffer) {
  const parser = new PDFParse({ data: buffer });
  try {
    const result = await parser.getText();
    return (result.text || "").trim().slice(0, 8000);
  } finally {
    await parser.destroy();
  }
}
