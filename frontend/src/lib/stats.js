// Pure function so it can be unit tested without rendering React —
// mirrors the same pattern used on the backend (utils/topicBreakdown.js).
export function computeStats(items) {
  const completed = items.filter(
    (i) => i.status === "completed" && !i.practiceMode && typeof i.report?.overallScore === "number"
  );

  if (completed.length === 0) return null;

  const avg = completed.reduce((sum, i) => sum + i.report.overallScore, 0) / completed.length;

  const byRole = {};
  completed.forEach((i) => {
    byRole[i.role] = byRole[i.role] || [];
    byRole[i.role].push(i.report.overallScore);
  });
  const bestRole = Object.entries(byRole).sort(
    (a, b) =>
      b[1].reduce((s, v) => s + v, 0) / b[1].length - a[1].reduce((s, v) => s + v, 0) / a[1].length
  )[0];

  const dayStrings = [...new Set(completed.map((i) => new Date(i.createdAt).toDateString()))]
    .map((d) => new Date(d))
    .sort((a, b) => b - a);

  let streak = 0;
  let cursor = new Date();
  cursor.setHours(0, 0, 0, 0);
  for (const day of dayStrings) {
    const diffDays = Math.round((cursor - day) / 86400000);
    if (diffDays === streak) {
      streak += 1;
    } else {
      break;
    }
  }

  return {
    total: items.length,
    completedCount: completed.length,
    avg: avg.toFixed(1),
    bestRole: bestRole ? bestRole[0] : "—",
    streak,
  };
}
