import { cn } from "@/lib/cn";

/*
 * Star field around the badge, as offsets from its centre (% of the badge
 * box). `dx`/`dy` is how far each star drifts while it twinkles, and `d`
 * staggers them so the field shimmers instead of blinking in unison.
 */
const STARS: {
  x: number;
  y: number;
  s: number;
  d: number;
  dx: number;
  dy: number;
  spark?: boolean;
}[] = [
  { x: -8, y: 12, s: 2, d: 0, dx: -4, dy: -2 },
  { x: 6, y: -38, s: 1.5, d: 0.35, dx: -2, dy: -4 },
  { x: 24, y: 118, s: 1.5, d: 0.9, dx: -1, dy: 4 },
  { x: 38, y: -30, s: 5, d: 0.15, dx: 0, dy: -3, spark: true },
  { x: 55, y: 132, s: 2, d: 0.6, dx: 1, dy: 4 },
  { x: 70, y: -44, s: 1.5, d: 1.1, dx: 2, dy: -3 },
  { x: 88, y: 120, s: 4, d: 0.45, dx: 2, dy: 3, spark: true },
  { x: 104, y: -14, s: 2, d: 0.8, dx: 4, dy: -2 },
  { x: 112, y: 70, s: 1.5, d: 0.25, dx: 5, dy: 1 },
  { x: -14, y: 84, s: 3.5, d: 1.25, dx: -4, dy: 2, spark: true },
  { x: 16, y: -18, s: 1, d: 0.55, dx: -1, dy: -3 },
  { x: 82, y: -26, s: 1, d: 1.4, dx: 1, dy: -3 },
];

function Sparkle({ size }: { size: number }) {
  return (
    <svg viewBox="0 0 10 10" width={size * 2} height={size * 2}>
      <path
        d="M5 0C5.4 3.2 6.8 4.6 10 5 6.8 5.4 5.4 6.8 5 10 4.6 6.8 3.2 5.4 0 5 3.2 4.6 4.6 3.2 5 0Z"
        fill="currentColor"
      />
    </svg>
  );
}

/**
 * The "EXPLORER" mark next to the Livepeer wordmark: a glowing pill that
 * comes alive (rotating border light, twinkling star field) when the logo
 * link is hovered or focused. Styles live in globals.css under `.xb`.
 */
export function ExplorerBadge({ className }: { className?: string }) {
  return (
    <span className={cn("xb", className)}>
      <span className="xb-stars" aria-hidden="true">
        {STARS.map((st, i) => (
          <span
            key={i}
            className={cn("xb-star", st.spark && "xb-spark")}
            style={
              {
                left: `${st.x}%`,
                top: `${st.y}%`,
                width: st.spark ? undefined : st.s,
                height: st.spark ? undefined : st.s,
                "--d": `${st.d}s`,
                "--dx": `${st.dx}px`,
                "--dy": `${st.dy}px`,
              } as React.CSSProperties
            }
          >
            {st.spark && <Sparkle size={st.s} />}
          </span>
        ))}
      </span>
      <span className="xb-text">Explorer</span>
    </span>
  );
}
