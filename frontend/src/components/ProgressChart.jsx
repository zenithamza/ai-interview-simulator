import { useMemo, useState } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Dot,
} from "recharts";

function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const point = payload[0].payload;
  return (
    <div className="rounded-lg border border-border-subtle bg-surface-raised px-4 py-3 shadow-lg">
      <div className="font-display text-base text-text-primary">{point.role}</div>
      <div className="mt-0.5 font-mono text-[11px] uppercase tracking-widest text-text-muted">
        {point.difficulty} · {point.dateLabel}
      </div>
      <div className="mt-2 font-mono text-lg text-accent">{point.score}/10</div>
    </div>
  );
}

function ActiveDot(props) {
  const { cx, cy } = props;
  return <Dot cx={cx} cy={cy} r={5} fill="#0e1013" stroke="#4fd1c5" strokeWidth={2} />;
}

export default function ProgressChart({ items }) {
  const roles = useMemo(() => {
    const set = new Set(
      items.filter((i) => i.status === "completed" && !i.practiceMode).map((i) => i.role)
    );
    return ["All roles", ...Array.from(set)];
  }, [items]);

  const [roleFilter, setRoleFilter] = useState("All roles");

  const data = useMemo(() => {
    return items
      .filter(
        (i) =>
          i.status === "completed" &&
          !i.practiceMode &&
          typeof i.report?.overallScore === "number" &&
          (roleFilter === "All roles" || i.role === roleFilter)
      )
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
      .map((i, idx) => ({
        session: idx + 1,
        score: i.report.overallScore,
        role: i.role,
        difficulty: i.difficulty,
        dateLabel: new Date(i.createdAt).toLocaleDateString(undefined, {
          month: "short",
          day: "numeric",
        }),
      }));
  }, [items, roleFilter]);

  const average =
    data.length > 0 ? (data.reduce((sum, d) => sum + d.score, 0) / data.length).toFixed(1) : null;

  const trend =
    data.length >= 2 ? data[data.length - 1].score - data[0].score : null;

  if (roles.length <= 1) return null; // no completed sessions yet

  return (
    <section className="mb-14">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="mb-1 font-mono text-xs uppercase tracking-widest text-text-muted">
            Progress over time
          </h2>
          <p className="text-sm text-text-muted">
            {data.length} completed session{data.length === 1 ? "" : "s"}
            {average !== null && (
              <>
                {" "}
                · avg <span className="text-accent">{average}/10</span>
              </>
            )}
            {trend !== null && (
              <>
                {" "}
                ·{" "}
                <span className={trend >= 0 ? "text-accent" : "text-accent-warm"}>
                  {trend >= 0 ? "+" : ""}
                  {trend.toFixed(1)} since first session
                </span>
              </>
            )}
          </p>
        </div>

        {roles.length > 2 && (
          <div className="flex flex-wrap gap-2">
            {roles.map((r) => (
              <button
                key={r}
                onClick={() => setRoleFilter(r)}
                className={`rounded-full border px-3.5 py-1.5 font-mono text-xs transition-colors ${
                  roleFilter === r
                    ? "border-accent bg-accent-soft text-accent"
                    : "border-border-subtle text-text-muted hover:border-text-muted"
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-border-subtle bg-surface p-5">
        {data.length === 1 ? (
          <p className="py-10 text-center text-sm text-text-muted">
            Complete one more session to start seeing a trend.
          </p>
        ) : (
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={data} margin={{ top: 10, right: 16, bottom: 0, left: -16 }}>
              <CartesianGrid stroke="#2a2f38" strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="session"
                tickFormatter={(v) => `#${v}`}
                stroke="#9095a0"
                tick={{ fontFamily: "JetBrains Mono", fontSize: 11, fill: "#9095a0" }}
                axisLine={{ stroke: "#2a2f38" }}
                tickLine={false}
              />
              <YAxis
                domain={[0, 10]}
                ticks={[0, 2, 4, 6, 8, 10]}
                stroke="#9095a0"
                tick={{ fontFamily: "JetBrains Mono", fontSize: 11, fill: "#9095a0" }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ stroke: "#2a2f38" }} />
              <Line
                type="monotone"
                dataKey="score"
                stroke="#4fd1c5"
                strokeWidth={2.5}
                dot={<ActiveDot />}
                activeDot={{ r: 6, fill: "#4fd1c5", stroke: "#0e1013", strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </section>
  );
}
