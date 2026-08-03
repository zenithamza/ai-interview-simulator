import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../lib/api.js";
import { useSpeechRecorder } from "../lib/useSpeechRecorder.js";
import Waveform from "../components/Waveform.jsx";
import Timer from "../components/Timer.jsx";

export default function Interview() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [interview, setInterview] = useState(null);
  const [loadError, setLoadError] = useState(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [answerText, setAnswerText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [finishing, setFinishing] = useState(false);
  const [retrying, setRetrying] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  const recorder = useSpeechRecorder();

  useEffect(() => {
    api
      .getInterview(id)
      .then((data) => {
        setInterview(data);
        const firstUnanswered = data.answers.findIndex((a) => !a.feedback);
        setActiveIndex(firstUnanswered === -1 ? data.answers.length - 1 : firstUnanswered);
      })
      .catch((err) => setLoadError(err.message));
  }, [id]);

  useEffect(() => {
    setAnswerText(recorder.fullText);
  }, [recorder.fullText]);

  if (loadError) {
    return (
      <main className="mx-auto max-w-2xl px-6 py-24 text-center">
        <p className="text-danger">{loadError}</p>
      </main>
    );
  }

  if (!interview) {
    return (
      <main className="mx-auto max-w-2xl px-6 py-24 text-center text-text-muted">
        Loading the room…
      </main>
    );
  }

  const total = interview.totalQuestions;
  const current = interview.answers[activeIndex];
  const isAnswered = Boolean(current.feedback);
  const isLast = activeIndex === total - 1;

  async function handleSubmit() {
    if (!answerText.trim()) return;
    setSubmitting(true);
    setSubmitError(null);
    recorder.stop();
    try {
      const updated = await api.submitAnswer(interview._id, activeIndex, answerText.trim());
      setInterview(updated);
    } catch (err) {
      setSubmitError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleRetry() {
    setRetrying(true);
    setSubmitError(null);
    try {
      const updated = await api.retryQuestion(interview._id, activeIndex);
      setInterview(updated);
      setAnswerText("");
      recorder.setTranscript("");
    } catch (err) {
      setSubmitError(err.message);
    } finally {
      setRetrying(false);
    }
  }

  function goToNext() {
    setAnswerText("");
    recorder.setTranscript("");
    setActiveIndex((i) => Math.min(i + 1, total - 1));
  }

  async function handleFinish() {
    setFinishing(true);
    setSubmitError(null);
    try {
      await api.finishInterview(interview._id);
      navigate(`/report/${interview._id}`);
    } catch (err) {
      setSubmitError(err.message);
      setFinishing(false);
    }
  }

  return (
    <main className="mx-auto max-w-3xl px-6 pb-32 pt-12">
      {/* Progress */}
      <div className="mb-8 flex items-center gap-2">
        {Array.from({ length: total }).map((_, i) => {
          const answered = interview.answers[i]?.feedback;
          return (
            <div
              key={i}
              className={`h-1 flex-1 rounded-full transition-colors ${
                i === activeIndex ? "bg-accent" : answered ? "bg-accent/40" : "bg-border-subtle"
              }`}
            />
          );
        })}
      </div>

      <div className="mb-2 flex flex-wrap items-center gap-2 font-mono text-[11px] uppercase tracking-widest text-text-muted">
        <span>{interview.role}</span>
        <span>·</span>
        <span>{interview.persona}</span>
        <span>·</span>
        <span>{interview.mode === "system-design" ? "System design" : "Standard"}</span>
        {interview.practiceMode && (
          <span className="rounded-full bg-accent-warm/15 px-2 py-0.5 text-accent-warm">Practice</span>
        )}
      </div>

      <div className="mb-2 flex items-center justify-between">
        <p className="font-mono text-xs uppercase tracking-widest text-text-muted">
          Question {activeIndex + 1} of {total}
          <span className="ml-2 rounded-full bg-surface px-2 py-0.5 text-accent">{current.topic}</span>
          <span className="ml-2 text-text-muted/70">{current.difficulty}</span>
        </p>
        {!isAnswered && <Timer running={recorder.isRecording} resetKey={activeIndex} />}
      </div>

      <h1 className="mb-10 font-display text-3xl leading-snug text-text-primary sm:text-4xl">
        {current.question}
      </h1>

      {!isAnswered ? (
        <>
          {/* Recording console */}
          <div className="mb-6 rounded-2xl border border-border-subtle bg-surface p-6">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span
                  className={`h-2 w-2 rounded-full ${
                    recorder.isRecording ? "animate-pulse bg-danger" : "bg-text-muted"
                  }`}
                />
                <span className="font-mono text-xs uppercase tracking-widest text-text-muted">
                  {recorder.isRecording ? "Recording" : "Ready"}
                </span>
              </div>
              <button
                onClick={recorder.isRecording ? recorder.stop : recorder.start}
                className={`rounded-full px-5 py-2 font-mono text-xs transition-colors ${
                  recorder.isRecording
                    ? "bg-danger/15 text-danger hover:bg-danger/25"
                    : "bg-accent text-accent-contrast hover:bg-accent/90"
                }`}
              >
                {recorder.isRecording ? "Stop" : "Record answer"}
              </button>
            </div>

            <Waveform level={recorder.level} active={recorder.isRecording} />

            {recorder.error && <p className="mt-3 text-xs text-danger">{recorder.error}</p>}
          </div>

          {/* Editable transcript */}
          <textarea
            value={answerText}
            onChange={(e) => setAnswerText(e.target.value)}
            placeholder="Your transcribed answer appears here — or just type it directly."
            rows={5}
            className="mb-6 w-full resize-none rounded-2xl border border-border-subtle bg-surface p-5 text-text-primary placeholder:text-text-muted/60 focus:border-accent focus:outline-none"
          />

          {submitError && <p className="mb-4 text-sm text-danger">{submitError}</p>}

          <div className="flex flex-wrap gap-3">
            <button
              onClick={handleSubmit}
              disabled={submitting || !answerText.trim()}
              className="rounded-full bg-accent px-7 py-3.5 font-mono text-sm font-medium text-accent-contrast transition-transform hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100"
            >
              {submitting ? "Reviewing your answer…" : "Submit answer"}
            </button>
            <button
              onClick={handleRetry}
              disabled={retrying || submitting}
              className="rounded-full border border-border-subtle px-7 py-3.5 font-mono text-sm text-text-muted transition-colors hover:border-accent hover:text-accent disabled:opacity-50"
            >
              {retrying ? "Swapping question…" : "Try a different question"}
            </button>
          </div>
        </>
      ) : (
        <>
          {/* Feedback */}
          <div className="mb-8 rounded-2xl border border-border-subtle bg-surface p-6">
            <div className="mb-3 flex items-center justify-between">
              <span className="font-mono text-xs uppercase tracking-widest text-text-muted">
                Interviewer feedback
              </span>
              <span className="rounded-full bg-accent-soft px-3 py-1 font-mono text-sm text-accent">
                {current.score}/10
              </span>
            </div>
            <p className="leading-relaxed text-text-primary/90">{current.feedback}</p>

            <p className="mt-5 border-t border-border-subtle pt-4 text-sm text-text-muted">
              <span className="font-mono uppercase tracking-widest text-text-muted/70">Your answer — </span>
              {current.answerText}
            </p>
          </div>

          {submitError && <p className="mb-4 text-sm text-danger">{submitError}</p>}

          {isLast ? (
            <button
              onClick={handleFinish}
              disabled={finishing}
              className="rounded-full bg-accent px-7 py-3.5 font-mono text-sm font-medium text-accent-contrast transition-transform hover:scale-[1.02] disabled:opacity-60"
            >
              {finishing ? "Compiling your report…" : "Finish interview & see report"}
            </button>
          ) : (
            <button
              onClick={goToNext}
              className="rounded-full border border-border-subtle px-7 py-3.5 font-mono text-sm text-text-primary transition-colors hover:border-accent hover:text-accent"
            >
              Next question →
            </button>
          )}
        </>
      )}
    </main>
  );
}
