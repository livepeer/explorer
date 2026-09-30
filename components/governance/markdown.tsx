import { Fragment } from "react";

import { cn } from "@/lib/cn";

/**
 * A deliberately small markdown reader: headings, lists, quotes, fenced code,
 * tables (kept monospace) and paragraphs, plus inline links, bold and code.
 * Everything renders as React text nodes — no HTML is ever injected.
 */

type Block =
  | { kind: "heading"; level: number; text: string }
  | { kind: "list"; ordered: boolean; items: string[] }
  | { kind: "quote"; lines: string[] }
  | { kind: "code"; text: string }
  | { kind: "paragraph"; lines: string[] };

function parseBlocks(source: string): Block[] {
  const lines = source.replace(/\r\n/g, "\n").split("\n");
  const blocks: Block[] = [];
  let para: string[] = [];
  const flush = () => {
    if (para.length) blocks.push({ kind: "paragraph", lines: para });
    para = [];
  };

  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i];
    const line = raw.trim();

    if (line.startsWith("```") || line.startsWith("~~~")) {
      flush();
      const fence = line.slice(0, 3);
      const code: string[] = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith(fence))
        code.push(lines[i++]);
      blocks.push({ kind: "code", text: code.join("\n") });
      continue;
    }
    if (!line) {
      flush();
      continue;
    }
    if (/^\|.*\|$/.test(line)) {
      flush();
      const rows: string[] = [];
      while (i < lines.length && /^\|.*\|$/.test(lines[i].trim()))
        rows.push(lines[i++].trim());
      i--;
      blocks.push({
        kind: "code",
        text: rows.filter((r) => !/^\|[\s:|-]+\|$/.test(r)).join("\n"),
      });
      continue;
    }
    const heading = /^(#{1,6})\s+(.*?)\s*#*$/.exec(line);
    if (heading) {
      flush();
      blocks.push({
        kind: "heading",
        level: heading[1].length,
        text: heading[2],
      });
      continue;
    }
    const bullet = /^[-*+]\s+(.*)$/.exec(line);
    const numbered = /^\d+[.)]\s+(.*)$/.exec(line);
    if (bullet || numbered) {
      flush();
      const ordered = Boolean(numbered);
      const text = (bullet ?? numbered)![1];
      const last = blocks[blocks.length - 1];
      if (last?.kind === "list" && last.ordered === ordered)
        last.items.push(text);
      else blocks.push({ kind: "list", ordered, items: [text] });
      continue;
    }
    if (line.startsWith(">")) {
      flush();
      const text = line.replace(/^>\s?/, "");
      const last = blocks[blocks.length - 1];
      if (last?.kind === "quote") last.lines.push(text);
      else blocks.push({ kind: "quote", lines: [text] });
      continue;
    }
    // A continuation line under a list item joins that item.
    const last = blocks[blocks.length - 1];
    if (!para.length && last?.kind === "list" && /^\s{2,}/.test(raw)) {
      last.items[last.items.length - 1] += " " + line;
      continue;
    }
    para.push(line);
  }
  flush();
  return blocks;
}

const SAFE_URL = /^(https?:|mailto:)/i;

function safeHref(url: string, base?: string) {
  if (SAFE_URL.test(url)) return url;
  if (base && !/^[a-z][a-z0-9+.-]*:/i.test(url)) {
    try {
      return new URL(url, base).toString();
    } catch {
      return null;
    }
  }
  return null;
}

const INLINE =
  /\[([^\]]+)\]\(([^)\s]+)(?:\s+"[^"]*")?\)|(https?:\/\/[^\s)<>]+[^\s)<>.,;:!?'"])|\*\*([^*]+)\*\*|__([^_]+)__|`([^`]+)`/g;

function Inline({ text, base }: { text: string; base?: string }) {
  const out: React.ReactNode[] = [];
  let last = 0;
  let key = 0;
  for (const m of text.matchAll(INLINE)) {
    const idx = m.index ?? 0;
    if (idx > last) out.push(text.slice(last, idx));
    if (m[1] != null) {
      const href = safeHref(m[2], base);
      out.push(
        href ? (
          <a
            key={key++}
            href={href}
            target="_blank"
            rel="noreferrer noopener"
            className={LINK}
          >
            {m[1]}
          </a>
        ) : (
          m[1]
        )
      );
    } else if (m[3] != null) {
      out.push(
        <a
          key={key++}
          href={m[3]}
          target="_blank"
          rel="noreferrer noopener"
          className={cn(LINK, "break-all")}
        >
          {m[3]}
        </a>
      );
    } else if (m[4] != null || m[5] != null) {
      out.push(
        <strong key={key++} className="font-medium text-foreground">
          {m[4] ?? m[5]}
        </strong>
      );
    } else if (m[6] != null) {
      out.push(
        <code
          key={key++}
          className="rounded-[3px] bg-hover px-1 py-px font-mono text-[0.9em]"
        >
          {m[6]}
        </code>
      );
    }
    last = idx + m[0].length;
  }
  if (last < text.length) out.push(text.slice(last));
  return <>{out}</>;
}

const LINK =
  "text-foreground underline decoration-foreground/30 underline-offset-4 hover:decoration-foreground";

const HEADING: Record<number, string> = {
  1: "mt-8 text-[20px] leading-7 font-medium first:mt-0",
  2: "mt-8 text-[17px] leading-6 font-medium first:mt-0",
  3: "mt-6 text-[15px] leading-6 font-medium first:mt-0",
};

export function PlainMarkdown({
  source,
  base,
  className,
}: {
  source: string;
  base?: string;
  className?: string;
}) {
  const blocks = parseBlocks(source);
  return (
    <div
      className={cn(
        "flex min-w-0 flex-col gap-4 text-[15px] leading-7 text-foreground/85 text-pretty",
        className
      )}
    >
      {blocks.map((b, i) => {
        switch (b.kind) {
          case "heading": {
            const Tag = `h${Math.min(6, b.level + 1)}` as "h2";
            return (
              <Tag
                key={i}
                className={cn(
                  "text-foreground",
                  HEADING[b.level] ?? "mt-5 text-[15px] font-medium first:mt-0"
                )}
              >
                <Inline text={b.text} base={base} />
              </Tag>
            );
          }
          case "list": {
            const Tag = b.ordered ? "ol" : "ul";
            return (
              <Tag
                key={i}
                className={cn(
                  "flex flex-col gap-1.5 pl-5",
                  b.ordered ? "list-decimal" : "list-disc"
                )}
              >
                {b.items.map((item, j) => (
                  <li key={j} className="pl-1 marker:text-subtle-foreground">
                    <Inline text={item} base={base} />
                  </li>
                ))}
              </Tag>
            );
          }
          case "quote":
            return (
              <blockquote
                key={i}
                className="border-l-2 border-border pl-4 text-muted-foreground"
              >
                {b.lines.map((l, j) => (
                  <Fragment key={j}>
                    {j > 0 && <br />}
                    <Inline text={l} base={base} />
                  </Fragment>
                ))}
              </blockquote>
            );
          case "code":
            return (
              <pre
                key={i}
                className="overflow-x-auto rounded-sm bg-hover px-3 py-2.5 font-mono text-[12.5px] leading-5 text-foreground"
              >
                {b.text}
              </pre>
            );
          case "paragraph":
            return (
              <p key={i} className="break-words">
                {b.lines.map((l, j) => (
                  <Fragment key={j}>
                    {j > 0 && <br />}
                    <Inline text={l} base={base} />
                  </Fragment>
                ))}
              </p>
            );
        }
      })}
    </div>
  );
}
