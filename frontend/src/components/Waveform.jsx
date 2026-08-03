const BAR_COUNT = 28;

// Deterministic per-bar weighting so the waveform has organic variance
// instead of every bar moving in lockstep with the raw mic level.
const WEIGHTS = Array.from({ length: BAR_COUNT }, (_, i) =>
  0.4 + 0.6 * Math.abs(Math.sin(i * 1.8))
);

export default function Waveform({ level = 0, active = false }) {
  return (
    <div className="flex h-16 items-end justify-center gap-[3px]">
      {WEIGHTS.map((w, i) => {
        const height = active ? Math.max(6, level * w * 64) : 4;
        return (
          <div
            key={i}
            className="w-[3px] rounded-full bg-accent transition-[height] duration-75 ease-out"
            style={{ height: `${height}px`, opacity: active ? 0.55 + w * 0.45 : 0.25 }}
          />
        );
      })}
    </div>
  );
}
