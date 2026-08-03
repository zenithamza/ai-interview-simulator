import { useMemo } from "react";
import { computeStats } from "../lib/stats.js";

export default function StatsRow({ items }) {
  const stats = useMemo(() => computeStats(items), [items]);

  if (!stats) return null;

  const cards = [
    { label: "Total sessions", value: stats.total },
    { label: "Average score", value: `${stats.avg}/10` },
    { label: "Strongest role", value: stats.bestRole, small: true },
    { label: "Day streak", value: stats.streak },
  ];

  return (
    <div className="mb-12 grid grid-cols-2 gap-4 sm:grid-cols-4">
      {cards.map((c) => (
        <div key={c.label} className="rounded-2xl border border-border-subtle bg-surface p-5">
          <div
            className={`font-mono text-accent ${c.small ? "text-base leading-tight" : "text-3xl"}`}
          >
            {c.value}
          </div>
          <div className="mt-1.5 font-mono text-[11px] uppercase tracking-widest text-text-muted">
            {c.label}
          </div>
        </div>
      ))}
    </div>
  );
}
