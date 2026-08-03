import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { extractJson, nextDifficulty } from "../services/aiService.js";

describe("extractJson", () => {
  test("parses plain JSON object", () => {
    const result = extractJson('{"score": 8, "feedback": "Good"}');
    assert.deepEqual(result, { score: 8, feedback: "Good" });
  });

  test("parses plain JSON array", () => {
    const result = extractJson('[{"question":"Q1"},{"question":"Q2"}]');
    assert.equal(result.length, 2);
  });

  test("strips markdown code fences", () => {
    const raw = '```json\n{"overallScore": 7}\n```';
    const result = extractJson(raw);
    assert.equal(result.overallScore, 7);
  });

  test("ignores preamble text before the JSON", () => {
    const raw = 'Here is the result:\n{"score": 5, "feedback": "ok"}';
    const result = extractJson(raw);
    assert.equal(result.score, 5);
  });

  test("throws on genuinely invalid content", () => {
    assert.throws(() => extractJson("not json at all, sorry"));
  });
});

describe("nextDifficulty", () => {
  test("bumps up after a high score", () => {
    assert.equal(nextDifficulty("Beginner", 9), "Intermediate");
    assert.equal(nextDifficulty("Intermediate", 8), "Advanced");
  });

  test("does not bump past Advanced", () => {
    assert.equal(nextDifficulty("Advanced", 10), "Advanced");
  });

  test("drops down after a low score", () => {
    assert.equal(nextDifficulty("Advanced", 3), "Intermediate");
    assert.equal(nextDifficulty("Intermediate", 2), "Beginner");
  });

  test("does not drop below Beginner", () => {
    assert.equal(nextDifficulty("Beginner", 0), "Beginner");
  });

  test("holds steady for a middling score", () => {
    assert.equal(nextDifficulty("Intermediate", 6), "Intermediate");
  });

  test("holds steady when score is missing", () => {
    assert.equal(nextDifficulty("Intermediate", null), "Intermediate");
    assert.equal(nextDifficulty("Intermediate", undefined), "Intermediate");
  });
});
