import { readFile } from "node:fs/promises";
import { join } from "node:path";

import { ImageResponse } from "next/og";

import { LivepeerLockup, LivepeerWordmark } from "@/components/brand/logo";
import { memoize } from "@/lib/server/memo";

/**
 * The share card every page's image is drawn from: black, white type, the
 * explorer's green for the numbers that matter. 1200×630, the size Open
 * Graph and X's large card both use.
 */

export const OG_SIZE = { width: 1200, height: 630 };

const GREEN = "#40bf86";
const RED = "#e5484d";
const MUTED = "#a1a1a1";
const SUBTLE = "#6f6f6f";
const HAIRLINE = "#262626";

const font = (file: string) => readFile(join(process.cwd(), "assets/og", file));

const fonts = Promise.all([
  font("inter-latin-300-normal.woff"),
  font("inter-latin-400-normal.woff"),
  font("inter-latin-500-normal.woff"),
  font("GeistMono-Regular.ttf"),
]);

export type CardStat = {
  label: string;
  value: string;
  tone?: "positive" | "negative";
};

export type Card = {
  /** Small line above the title: what kind of page this is. */
  eyebrow: string;
  title: string;
  /** Under the title, e.g. an address or a status. */
  subtitle?: string;
  stats: CardStat[];
  /** A thin bar under the stats, e.g. a vote split. */
  bar?: { value: number; color: string }[];
};

export async function shareCard(card: Card) {
  const [light, regular, medium, mono] = await fonts;
  const long = card.title.length > 42;
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#000",
          color: "#fafafa",
          padding: "64px 72px",
          fontFamily: "Inter",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <LivepeerLockup
            style={{ width: 216, height: 27, color: "#fafafa" }}
          />
          <div
            style={{
              display: "flex",
              border: `1.5px solid ${GREEN}`,
              color: GREEN,
              borderRadius: 999,
              padding: "3px 12px",
              fontSize: 15,
              letterSpacing: 2.5,
              fontWeight: 500,
            }}
          >
            EXPLORER
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ display: "flex", fontSize: 26, color: MUTED }}>
            {card.eyebrow}
          </div>
          <div
            style={{
              display: "block",
              fontSize: long ? 58 : 76,
              fontWeight: 300,
              lineHeight: 1.08,
              letterSpacing: -2,
              lineClamp: 2,
            }}
          >
            {card.title}
          </div>
          {card.subtitle && (
            <div
              style={{
                display: "flex",
                fontSize: 24,
                color: SUBTLE,
                fontFamily: "Geist Mono",
              }}
            >
              {card.subtitle}
            </div>
          )}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
          {card.bar && (
            <div
              style={{
                display: "flex",
                height: 8,
                borderRadius: 4,
                overflow: "hidden",
                background: HAIRLINE,
                gap: 3,
              }}
            >
              {card.bar
                .filter((b) => b.value > 0)
                .map((b, i) => (
                  <div
                    key={i}
                    style={{
                      display: "flex",
                      flexGrow: b.value,
                      background: b.color,
                    }}
                  />
                ))}
            </div>
          )}
          <div
            style={{
              display: "flex",
              borderTop: `1px solid ${HAIRLINE}`,
              paddingTop: 26,
            }}
          >
            {card.stats.map((s, i) => (
              <div
                key={s.label}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  flex: 1,
                  gap: 8,
                  paddingLeft: i === 0 ? 0 : 28,
                  borderLeft: i === 0 ? "none" : `1px solid ${HAIRLINE}`,
                }}
              >
                <div style={{ display: "flex", fontSize: 20, color: MUTED }}>
                  {s.label}
                </div>
                <div
                  style={{
                    display: "flex",
                    fontSize: 36,
                    fontFamily: "Geist Mono",
                    letterSpacing: -1,
                    color:
                      s.tone === "positive"
                        ? GREEN
                        : s.tone === "negative"
                        ? RED
                        : "#fafafa",
                  }}
                >
                  {s.value}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    ),
    {
      ...OG_SIZE,
      fonts: [
        { name: "Inter", data: light, weight: 300, style: "normal" },
        { name: "Inter", data: regular, weight: 400, style: "normal" },
        { name: "Inter", data: medium, weight: 500, style: "normal" },
        { name: "Geist Mono", data: mono, weight: 400, style: "normal" },
      ],
    }
  );
}

/**
 * The site's own share card, for pages without one of their own: just the
 * wordmark and its EXPLORER tag over Livepeer stock art (from the brand's
 * marketing library, recoloured to the explorer's green). The link
 * preview's title and description do the explaining.
 */
export async function siteCard() {
  const [, , medium] = await fonts;
  const art = await readFile(join(process.cwd(), "assets/og/home-bg.jpg"));
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          position: "relative",
          background: "#000",
          fontFamily: "Inter",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`data:image/jpeg;base64,${art.toString("base64")}`}
          width={OG_SIZE.width}
          height={OG_SIZE.height}
          alt=""
          style={{ position: "absolute", inset: 0 }}
        />
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 30,
            padding: "0 88px",
          }}
        >
          <LivepeerWordmark
            style={{ width: 400, height: 60, color: "#fafafa" }}
          />
          <div
            style={{
              display: "flex",
              // A dark fill so it reads against the green art, and a
              // brighter green than the site's for the same reason.
              border: "3px solid #5ee3a5",
              background: "rgba(0, 0, 0, 0.55)",
              color: "#7ff0bb",
              borderRadius: 999,
              padding: "8px 28px",
              fontSize: 30,
              letterSpacing: 5,
              fontWeight: 500,
              boxShadow: "0 0 36px rgba(94, 227, 165, 0.55)",
            }}
          >
            EXPLORER
          </div>
        </div>
      </div>
    ),
    {
      ...OG_SIZE,
      fonts: [{ name: "Inter", data: medium, weight: 500, style: "normal" }],
    }
  );
}

export const OG_COLORS = { green: GREEN, red: RED, muted: SUBTLE };

/**
 * The generic card for an identifier with nothing to show (unknown,
 * malformed, or a failed lookup), rendered once per kind and reused, so
 * cycling through made-up identifiers costs no rendering.
 */
const fallbackPng = memoize(
  async (eyebrow: string) =>
    new Uint8Array(
      await (
        await shareCard({ eyebrow, title: "Livepeer Explorer", stats: [] })
      ).arrayBuffer()
    ),
  { ttlMs: Number.POSITIVE_INFINITY, max: 10 }
);

/** A share image: the card if there is one, else the kind's cached fallback. */
export async function shareImage(
  card: Card | undefined,
  eyebrow: string
): Promise<Response> {
  if (card) return shareCard(card);
  return new Response(await fallbackPng(eyebrow), {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
