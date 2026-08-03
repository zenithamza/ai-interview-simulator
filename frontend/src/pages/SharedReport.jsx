import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { publicApi } from "../lib/api.js";

export default function SharedReport() {
  const { shareId } = useParams();
  const [interview, setInterview] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    publicApi.getSharedReport(shareId).then(setInterview).catch((err) => setError(err.message));
  }, [shareId]);

  if (error) {
    return (
      <main className="mx-auto max-w-2xl px-6 py-24 text-center">
        <p className="mb-4 text-danger">{error}</p>
        <Link to="/" className="font-mono text-sm text-accent hover:underline">
          Go to Mockroom →
        </Link>
      </main>
    );
  }

  if (!interview) {
    return (
      <main className="mx-auto max-w-2xl px-6 py-24 text-center text-text-muted">Loading report…</main>
    );
  }

  const { report } = interview;

  return (
    <main className="mx-auto max-w-3xl px-6 pb-32 pt-12">
      <p className="mb-2 font-mono text-xs uppercase tracking-widest text-text-muted">
        Shared report · {interview.role} · {interview.difficulty}
      </p>

      <div className="mb-12 flex items-end justify-between border-b border-border-subtle pb-8">
        <h1 className="font-display text-4xl text-text-primary">Interview report</h1>
        <div className="text-right">
          <div className="font-mono text-5xl text-accent">{report.overallScore}</div>
          <div className="font-mono text-xs uppercase tracking-widest text-text-muted">out of 10</div>
        </div>
      </div>

      <section className="mb-10">
        <h2 className="mb-3 font-mono text-xs uppercase tracking-widest text-text-muted">Summary</h2>
        <p className="text-lg leading-relaxed text-text-primary/90">{report.summary}</p>
      </section>

      <div className="mb-10 grid gap-8 sm:grid-cols-2">
        <section>
          <h2 className="mb-3 font-mono text-xs uppercase tracking-widest text-accent">Strengths</h2>
          <ul className="space-y-2">
            {report.strengths?.map((s, i) => (
              <li key={i} className="flex gap-2 text-sm text-text-primary/90">
                <span className="text-accent">＋</span>
                {s}
              </li>
            ))}
          </ul>
        </section>
        <section>
          <h2 className="mb-3 font-mono text-xs uppercase tracking-widest text-accent-warm">Focus areas</h2>
          <ul className="space-y-2">
            {report.weaknesses?.map((w, i) => (
              <li key={i} className="flex gap-2 text-sm text-text-primary/90">
                <span className="text-accent-warm">−</span>
                {w}
              </li>
            ))}
          </ul>
        </section>
      </div>

      {report.topicBreakdown?.length > 0 && (
        <section className="mb-12">
          <h2 className="mb-4 font-mono text-xs uppercase tracking-widest text-text-muted">
            Score by topic
          </h2>
          <div className="space-y-3">
            {report.topicBreakdown.map((t) => (
              <div key={t.topic} className="flex items-center gap-4">
                <span className="w-40 shrink-0 truncate text-sm text-text-primary/90">{t.topic}</span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-surface">
                  <div
                    className={`h-full rounded-full ${t.averageScore >= 7 ? "bg-accent" : t.averageScore >= 4 ? "bg-accent-warm" : "bg-danger"}`}
                    style={{ width: `${(t.averageScore / 10) * 100}%` }}
                  />
                </div>
                <span className="w-10 shrink-0 text-right font-mono text-xs text-text-muted">
                  {t.averageScore}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="mb-12">
        <h2 className="mb-4 font-mono text-xs uppercase tracking-widest text-text-muted">
          Question-by-question
        </h2>
        <div className="divide-y divide-border-subtle border-y border-border-subtle">
          {interview.answers.map((a, i) => (
            <div key={i} className="px-1 py-5">
              <div className="mb-1 flex items-center justify-between gap-4">
                <span className="font-display text-lg text-text-primary">{a.question}</span>
                <span className="shrink-0 font-mono text-sm text-accent">{a.score}/10</span>
              </div>
              <p className="mb-2 font-mono text-[11px] uppercase tracking-widest text-text-muted/70">
                {a.topic}
              </p>
              <p className="text-sm text-text-muted">{a.feedback}</p>
            </div>
          ))}
        </div>
      </section>

      <Link
        to="/"
        className="inline-block rounded-full bg-accent px-7 py-3.5 font-mono text-sm font-medium text-accent-contrast transition-transform hover:scale-[1.02]"
      >
        Try Mockroom yourself →
      </Link>
    </main>
  );
}
