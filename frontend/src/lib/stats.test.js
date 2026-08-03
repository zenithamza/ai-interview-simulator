import { describe, it, expect } from "vitest";
import { computeStats } from "../lib/stats.js";

const today = new Date();
const yesterday = new Date(Date.now() - 86400000);
const twoDaysAgo = new Date(Date.now() - 2 * 86400000);

function completedItem(overrides = {}) {
  return {
    status: "completed",
    role: "Frontend Engineer",
    report: { overallScore: 7 },
    createdAt: today.toISOString(),
    ...overrides,
  };
}

describe("computeStats", () => {
  it("returns null when there are no completed sessions", () => {
    expect(computeStats([{ status: "in_progress" }])).toBeNull();
  });

  it("computes the average score across completed sessions", () => {
    const items = [
      completedItem({ report: { overallScore: 6 } }),
      completedItem({ report: { overallScore: 8 } }),
    ];
    expect(computeStats(items).avg).toBe("7.0");
  });

  it("picks the role with the highest average score", () => {
    const items = [
      completedItem({ role: "Backend Engineer", report: { overallScore: 9 } }),
      completedItem({ role: "Frontend Engineer", report: { overallScore: 4 } }),
    ];
    expect(computeStats(items).bestRole).toBe("Backend Engineer");
  });

  it("counts total sessions including in-progress ones", () => {
    const items = [completedItem(), { status: "in_progress" }];
    expect(computeStats(items).total).toBe(2);
  });

  it("computes a streak for consecutive days including today", () => {
    const items = [
      completedItem({ createdAt: today.toISOString() }),
      completedItem({ createdAt: yesterday.toISOString() }),
      completedItem({ createdAt: twoDaysAgo.toISOString() }),
    ];
    expect(computeStats(items).streak).toBe(3);
  });

  it("stops the streak at the first gap", () => {
    const fourDaysAgo = new Date(Date.now() - 4 * 86400000);
    const items = [
      completedItem({ createdAt: today.toISOString() }),
      completedItem({ createdAt: fourDaysAgo.toISOString() }),
    ];
    expect(computeStats(items).streak).toBe(1);
  });
});
