import { readFile } from "node:fs/promises";
import { join } from "node:path";

import { ImageResponse } from "next/og";

import { LivepeerLockup } from "@/components/brand/logo";

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

export const OG_COLORS = { green: GREEN, red: RED, muted: SUBTLE };
