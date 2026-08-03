import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { computeTopicBreakdown } from "../utils/topicBreakdown.js";

describe("computeTopicBreakdown", () => {
  test("averages scores per topic", () => {
    const answers = [
      { topic: "React", score: 8 },
      { topic: "React", score: 6 },
      { topic: "System design", score: 4 },
    ];
    const result = computeTopicBreakdown(answers);
    const react = result.find((r) => r.topic === "React");
    const sysDesign = result.find((r) => r.topic === "System design");
    assert.equal(react.averageScore, 7);
    assert.equal(sysDesign.averageScore, 4);
  });

  test("ignores unanswered questions (null score)", () => {
    const answers = [
      { topic: "React", score: 8 },
      { topic: "React", score: null },
    ];
    const result = computeTopicBreakdown(answers);
    assert.equal(result.find((r) => r.topic === "React").averageScore, 8);
  });

  test("defaults missing topic to General", () => {
    const answers = [{ score: 5 }];
    const result = computeTopicBreakdown(answers);
    assert.equal(result[0].topic, "General");
  });

  test("returns empty array for no scored answers", () => {
    assert.deepEqual(computeTopicBreakdown([]), []);
  });
});
