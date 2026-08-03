import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ROLES, DIFFICULTIES, PERSONAS, MODES } from "../lib/roles.js";
import { api } from "../lib/api.js";

export default function Home() {
  const [selectedRole, setSelectedRole] = useState(ROLES[0].id);
  const [difficulty, setDifficulty] = useState("Intermediate");
  const [persona, setPersona] = useState("Friendly");
  const [mode, setMode] = useState("standard");
  const [practiceMode, setPracticeMode] = useState(false);
  const [resumeFile, setResumeFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  const roleObj = ROLES.find((r) => r.id === selectedRole);

  function handleFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== "application/pdf") {
      setError("Resume must be a PDF");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("Resume must be under 5MB");
      return;
    }
    setError(null);
    setResumeFile(file);
  }

  async function handleStart() {
    setLoading(true);
    setError(null);
    try {
      const interview = await api.startInterview({
        role: roleObj.name,
        difficulty,
        persona,
        mode,
        practiceMode,
        resumeFile,
      });
      navigate(`/interview/${interview._id}`);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto max-w-6xl px-6 pb-32 pt-16">
      {/* Hero */}
      <section className="mb-16 max-w-2xl">
        <p className="mb-4 font-mono text-xs uppercase tracking-[0.2em] text-accent">
          Mock interview, on demand
        </p>
        <h1 className="font-display text-5xl leading-[1.05] tracking-tight text-text-primary sm:text-6xl">
          Walk in ready.
          <br />
          Not <span className="italic text-text-muted">hopeful.</span>
        </h1>
        <p className="mt-6 text-lg leading-relaxed text-text-muted">
          Pick a role, answer out loud, and get an interviewer's honest read on
          your performance — question by question, then as a full report.
        </p>
      </section>

      {/* Call sheet */}
      <section className="mb-12">
        <h2 className="mb-4 font-mono text-xs uppercase tracking-widest text-text-muted">
          01 — Choose a room
        </h2>

        <div className="divide-y divide-border-subtle border-y border-border-subtle">
          {ROLES.map((role, i) => {
            const active = role.id === selectedRole;
            return (
              <button
                key={role.id}
                onClick={() => setSelectedRole(role.id)}
                className={`group flex w-full items-center gap-6 px-4 py-5 text-left transition-colors sm:px-6 ${
                  active ? "bg-surface" : "hover:bg-surface/60"
                }`}
              >
                <span className={`font-mono text-sm ${active ? "text-accent" : "text-text-muted"}`}>
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="flex-1">
                  <span className="block font-display text-xl text-text-primary">{role.name}</span>
                  <span className="mt-1 block text-sm text-text-muted">{role.blurb}</span>
                </span>
                <span className="hidden font-mono text-xs text-text-muted sm:block">{role.tag}</span>
                <span
                  className={`h-2.5 w-2.5 shrink-0 rounded-full border transition-colors ${
                    active ? "border-accent bg-accent" : "border-border-subtle bg-transparent"
                  }`}
                />
              </button>
            );
          })}
        </div>
      </section>

      {/* Difficulty */}
      <section className="mb-10">
        <h2 className="mb-4 font-mono text-xs uppercase tracking-widest text-text-muted">
          02 — Starting difficulty
        </h2>
        <div className="flex flex-wrap gap-3">
          {DIFFICULTIES.map((d) => (
            <button
              key={d}
              onClick={() => setDifficulty(d)}
              className={`rounded-full border px-5 py-2 font-mono text-sm transition-colors ${
                difficulty === d
                  ? "border-accent bg-accent-soft text-accent"
                  : "border-border-subtle text-text-muted hover:border-text-muted"
              }`}
            >
              {d}
            </button>
          ))}
        </div>
        <p className="mt-2 text-xs text-text-muted">
          Adapts automatically as you go — score well and questions get harder.
        </p>
      </section>

      {/* Persona */}
      <section className="mb-10">
        <h2 className="mb-4 font-mono text-xs uppercase tracking-widest text-text-muted">
          03 — Interviewer style
        </h2>
        <div className="grid gap-3 sm:grid-cols-3">
          {PERSONAS.map((p) => (
            <button
              key={p.id}
              onClick={() => setPersona(p.id)}
              className={`rounded-xl border p-4 text-left transition-colors ${
                persona === p.id
                  ? "border-accent bg-accent-soft"
                  : "border-border-subtle hover:border-text-muted"
              }`}
            >
              <div className={`font-mono text-sm ${persona === p.id ? "text-accent" : "text-text-primary"}`}>
                {p.label}
              </div>
              <div className="mt-1 text-xs text-text-muted">{p.blurb}</div>
            </button>
          ))}
        </div>
      </section>

      {/* Mode */}
      <section className="mb-10">
        <h2 className="mb-4 font-mono text-xs uppercase tracking-widest text-text-muted">
          04 — Format
        </h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {MODES.map((m) => (
            <button
              key={m.id}
              onClick={() => setMode(m.id)}
              className={`rounded-xl border p-4 text-left transition-colors ${
                mode === m.id
                  ? "border-accent bg-accent-soft"
                  : "border-border-subtle hover:border-text-muted"
              }`}
            >
              <div className={`font-mono text-sm ${mode === m.id ? "text-accent" : "text-text-primary"}`}>
                {m.label}
              </div>
              <div className="mt-1 text-xs text-text-muted">{m.blurb}</div>
            </button>
          ))}
        </div>
      </section>

      {/* Resume + practice mode */}
      <section className="mb-14">
        <h2 className="mb-4 font-mono text-xs uppercase tracking-widest text-text-muted">
          05 — Optional
        </h2>
        <div className="flex flex-wrap items-center gap-3">
          <input
            ref={fileInputRef}
            type="file"
            accept="application/pdf"
            onChange={handleFileChange}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="rounded-full border border-border-subtle px-5 py-2 font-mono text-xs text-text-primary transition-colors hover:border-accent hover:text-accent"
          >
            {resumeFile ? `📄 ${resumeFile.name}` : "Upload resume (PDF) — tailors questions"}
          </button>
          {resumeFile && (
            <button
              onClick={() => setResumeFile(null)}
              className="font-mono text-xs text-text-muted hover:text-danger"
            >
              Remove
            </button>
          )}

          <label className="ml-2 flex cursor-pointer items-center gap-2 font-mono text-xs text-text-muted">
            <input
              type="checkbox"
              checked={practiceMode}
              onChange={(e) => setPracticeMode(e.target.checked)}
              className="h-3.5 w-3.5 accent-accent"
            />
            Practice mode — not saved to stats, no report email
          </label>
        </div>
      </section>

      {error && (
        <p className="mb-6 rounded-lg border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-danger">
          {error}
        </p>
      )}

      <button
        onClick={handleStart}
        disabled={loading}
        className="group inline-flex items-center gap-3 rounded-full bg-accent px-7 py-3.5 font-mono text-sm font-medium text-accent-contrast transition-transform hover:scale-[1.02] disabled:opacity-60 disabled:hover:scale-100"
      >
        {loading ? "Setting up the room…" : `Start ${roleObj.name} interview`}
        {!loading && (
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="transition-transform group-hover:translate-x-0.5">
            <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </button>
    </main>
  );
}
