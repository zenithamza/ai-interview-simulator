import { useEffect, useRef, useState } from "react";

const SUGGESTED_SECONDS = 120;

// Counts up (not down) so it never forces a submission — real interviews
// don't cut you off, but seeing time pass builds useful pressure.
export default function Timer({ running, resetKey }) {
  const [seconds, setSeconds] = useState(0);
  const intervalRef = useRef(null);

  useEffect(() => {
    setSeconds(0);
  }, [resetKey]);

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => setSeconds((s) => s + 1), 1000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [running]);

  const mins = String(Math.floor(seconds / 60)).padStart(2, "0");
  const secs = String(seconds % 60).padStart(2, "0");
  const isOverSuggested = seconds > SUGGESTED_SECONDS;

  return (
    <div className="flex items-center gap-2 font-mono text-xs">
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          running ? (isOverSuggested ? "bg-accent-warm" : "bg-accent") : "bg-text-muted"
        }`}
      />
      <span className={isOverSuggested ? "text-accent-warm" : "text-text-muted"}>
        {mins}:{secs}
        {isOverSuggested && running && <span className="ml-1.5">— past the 2 min guideline</span>}
      </span>
    </div>
  );
}
