import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api.js";
import ProgressChart from "../components/ProgressChart.jsx";
import StatsRow from "../components/StatsRow.jsx";

export default function History() {
  const [items, setItems] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.getHistory().then(setItems).catch((err) => setError(err.message));
  }, []);

  return (
    <main className="mx-auto max-w-4xl px-6 pb-32 pt-12">
      <p className="mb-2 font-mono text-xs uppercase tracking-widest text-text-muted">Archive</p>
      <h1 className="mb-10 font-display text-4xl text-text-primary">Your sessions</h1>

      {error && <p className="text-danger">{error}</p>}

      {!items && !error && <p className="text-text-muted">Loading history…</p>}

      {items && items.length > 0 && <StatsRow items={items} />}
      {items && items.length > 0 && <ProgressChart items={items} />}

      {items && items.length === 0 && (
        <div className="rounded-2xl border border-dashed border-border-subtle p-10 text-center">
          <p className="mb-4 text-text-muted">No sessions yet. Your first one is one click away.</p>
          <Link
            to="/"
            className="inline-block rounded-full bg-accent px-6 py-3 font-mono text-sm text-accent-contrast"
          >
            Start an interview
          </Link>
        </div>
      )}

      {items && items.length > 0 && (
        <div className="divide-y divide-border-subtle border-y border-border-subtle">
          {items.map((item) => (
            <Link
              key={item._id}
              to={item.status === "completed" ? `/report/${item._id}` : `/interview/${item._id}`}
              className="flex items-center justify-between gap-6 px-2 py-5 transition-colors hover:bg-surface/60"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-display text-xl text-text-primary">{item.role}</span>
                  {item.practiceMode && (
                    <span className="rounded-full bg-accent-warm/15 px-2 py-0.5 font-mono text-[10px] text-accent-warm">
                      Practice
                    </span>
                  )}
                </div>
                <div className="mt-1 font-mono text-xs uppercase tracking-widest text-text-muted">
                  {item.difficulty} · {new Date(item.createdAt).toLocaleDateString()} ·{" "}
                  {item.status === "completed" ? "Completed" : "In progress"}
                </div>
              </div>
              {item.status === "completed" ? (
                <div className="font-mono text-2xl text-accent">
                  {item.report?.overallScore ?? "—"}
                  <span className="text-sm text-text-muted">/10</span>
                </div>
              ) : (
                <span className="font-mono text-xs text-accent-warm">Resume →</span>
              )}
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
