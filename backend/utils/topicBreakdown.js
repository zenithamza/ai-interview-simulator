// Averages scores per topic across an interview's answers — used to build
// the report's topicBreakdown and, client-side, the topic weakness heatmap.
export function computeTopicBreakdown(answers) {
  const byTopic = {};
  answers.forEach((a) => {
    if (typeof a.score !== "number") return;
    const topic = a.topic || "General";
    byTopic[topic] = byTopic[topic] || [];
    byTopic[topic].push(a.score);
  });
  return Object.entries(byTopic).map(([topic, scores]) => ({
    topic,
    averageScore: Math.round((scores.reduce((s, v) => s + v, 0) / scores.length) * 10) / 10,
  }));
}
