import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { jsPDF } from "jspdf";
import { api } from "../lib/api.js";

export default function Report() {
  const { id } = useParams();
  const [interview, setInterview] = useState(null);
  const [error, setError] = useState(null);
  const [shareState, setShareState] = useState({ loading: false, url: null, copied: false });

  useEffect(() => {
    api.getInterview(id).then(setInterview).catch((err) => setError(err.message));
  }, [id]);

  async function handleShare() {
    setShareState((s) => ({ ...s, loading: true }));
    try {
      const { shareId } = await api.shareInterview(id);
      const url = `${window.location.origin}/share/${shareId}`;
      setShareState({ loading: false, url, copied: false });
    } catch (err) {
      setError(err.message);
      setShareState((s) => ({ ...s, loading: false }));
    }
  }

  function copyShareUrl() {
    navigator.clipboard.writeText(shareState.url);
    setShareState((s) => ({ ...s, copied: true }));
    setTimeout(() => setShareState((s) => ({ ...s, copied: false })), 2000);
  }

  if (error) {
    return (
      <main className="mx-auto max-w-2xl px-6 py-24 text-center text-danger">{error}</main>
    );
  }

  if (!interview) {
    return (
      <main className="mx-auto max-w-2xl px-6 py-24 text-center text-text-muted">
        Compiling report…
      </main>
    );
  }

  const { report } = interview;

  function downloadPdf() {
    const doc = new jsPDF({ unit: "pt", format: "a4" });
    const margin = 48;
    const pageWidth = doc.internal.pageSize.getWidth();
    const maxWidth = pageWidth - margin * 2;
    let y = margin;

    function addWrapped(text, fontSize, lineHeight, color = "#171a1f") {
      doc.setFontSize(fontSize);
      doc.setTextColor(color);
      const lines = doc.splitTextToSize(text, maxWidth);
      lines.forEach((line) => {
        if (y > 780) {
          doc.addPage();
          y = margin;
        }
        doc.text(line, margin, y);
        y += lineHeight;
      });
    }

    doc.setFont("helvetica", "bold");
    addWrapped("Mockroom — Interview Report", 20, 26, "#0e9488");
    y += 4;
    doc.setFont("helvetica", "normal");
    addWrapped(`${interview.role} · ${interview.difficulty}`, 11, 16, "#6b7280");
    y += 10;

    doc.setFont("helvetica", "bold");
    addWrapped(`Overall score: ${report.overallScore}/10`, 16, 22);
    y += 6;

    doc.setFont("helvetica", "normal");
    addWrapped("Summary", 12, 16, "#0e9488");
    addWrapped(report.summary || "", 11, 15);
    y += 8;

    doc.setFont("helvetica", "normal");
    addWrapped("Strengths", 12, 16, "#0e9488");
    (report.strengths || []).forEach((s) => addWrapped(`• ${s}`, 11, 15));
    y += 8;

    addWrapped("Focus areas", 12, 16, "#b45309");
    (report.weaknesses || []).forEach((w) => addWrapped(`• ${w}`, 11, 15));
    y += 8;

    addWrapped("Recommended next step", 12, 16, "#0e9488");
    addWrapped(report.recommendation || "", 11, 15);
    y += 14;

    addWrapped("Question-by-question", 12, 16, "#0e9488");
    interview.answers.forEach((a, i) => {
      doc.setFont("helvetica", "bold");
      addWrapped(`${i + 1}. ${a.question}  (${a.score}/10)`, 11, 15);
      doc.setFont("helvetica", "normal");
      addWrapped(a.feedback || "", 10, 14, "#6b7280");
      y += 6;
    });

    doc.save(`mockroom-${interview.role.replace(/\s+/g, "-").toLowerCase()}-report.pdf`);
  }

  return (
    <main className="mx-auto max-w-3xl px-6 pb-32 pt-12">
      <p className="mb-2 font-mono text-xs uppercase tracking-widest text-text-muted">
        Final report · {interview.role} · {interview.difficulty}
      </p>

      <div className="mb-12 flex items-end justify-between border-b border-border-subtle pb-8">
        <div>
          <h1 className="font-display text-4xl text-text-primary">Session complete</h1>
          {!interview.practiceMode && (
            <p className="mt-2 font-mono text-xs text-text-muted">
              A copy of this report was emailed to you.
            </p>
          )}
        </div>
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

      <section className="mb-12 rounded-2xl border border-border-subtle bg-surface p-6">
        <h2 className="mb-2 font-mono text-xs uppercase tracking-widest text-text-muted">
          Recommended next step
        </h2>
        <p className="text-text-primary/90">{report.recommendation}</p>
      </section>

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

      <section className="mb-12 rounded-2xl border border-border-subtle bg-surface p-6">
        <h2 className="mb-2 font-mono text-xs uppercase tracking-widest text-text-muted">
          Share this report
        </h2>
        {!shareState.url ? (
          <>
            <p className="mb-4 text-sm text-text-muted">
              Generate a public, read-only link — no login required for whoever opens it.
            </p>
            <button
              onClick={handleShare}
              disabled={shareState.loading}
              className="rounded-full border border-border-subtle px-5 py-2 font-mono text-xs text-text-primary transition-colors hover:border-accent hover:text-accent disabled:opacity-60"
            >
              {shareState.loading ? "Generating link…" : "Create share link"}
            </button>
          </>
        ) : (
          <div className="flex flex-wrap items-center gap-3">
            <code className="flex-1 truncate rounded-lg bg-ink px-3 py-2 font-mono text-xs text-accent">
              {shareState.url}
            </code>
            <button
              onClick={copyShareUrl}
              className="rounded-full bg-accent px-4 py-2 font-mono text-xs font-medium text-accent-contrast transition-transform hover:scale-105"
            >
              {shareState.copied ? "Copied!" : "Copy"}
            </button>
          </div>
        )}
      </section>

      <div className="flex flex-wrap gap-4">
        <Link
          to="/"
          className="rounded-full bg-accent px-7 py-3.5 font-mono text-sm font-medium text-accent-contrast transition-transform hover:scale-[1.02]"
        >
          New interview
        </Link>
        <button
          onClick={downloadPdf}
          className="rounded-full border border-border-subtle px-7 py-3.5 font-mono text-sm text-text-primary transition-colors hover:border-accent hover:text-accent"
        >
          Download PDF
        </button>
        <Link
          to="/history"
          className="rounded-full border border-border-subtle px-7 py-3.5 font-mono text-sm text-text-primary transition-colors hover:border-accent hover:text-accent"
        >
          View history
        </Link>
      </div>
    </main>
  );
}
