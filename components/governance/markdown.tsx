import { Fragment } from "react";

import { cn } from "@/lib/cn";

/**
 * A deliberately small markdown reader: headings, lists (task lists too),
 * quotes, fenced code, tables, rules and paragraphs, plus inline links
 * (reference-style too), bold, italic, code, escapes, entities and `<br>`
 * line breaks. Images become links rather than loading from whatever host a
 * proposal names. Everything renders as React text nodes — no HTML is ever
 * injected.
 */

type Block =
  | { kind: "heading"; level: number; text: string }
  | { kind: "list"; ordered: boolean; items: string[] }
  | { kind: "quote"; lines: string[] }
  | { kind: "code"; text: string }
  | { kind: "table"; head: string[] | null; rows: string[][] }
  | { kind: "rule" }
  | { kind: "paragraph"; lines: string[] };

/** A `<br>` tag, which markdown written elsewhere uses for line breaks. */
const BR = /<br\s*\/?>/gi;

/** A table row: starts with `|` and has another. The closing `|` is optional. */
const ROW = /^\|.*\|/;

const cells = (row: string) =>
  row
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((c) => c.trim());

/** Reference-style link targets, e.g. `[1]: https://…`, by lowercased id. */
type Refs = Map<string, string>;

const REF_DEF = /^\[([^\]^]+)\]:\s*<?(\S+?)>?(?:\s+["'(].*)?$/;

function parseBlocks(source: string): { blocks: Block[]; refs: Refs } {
  const lines = source.replace(/\r\n/g, "\n").split("\n");
  const blocks: Block[] = [];
  const refs: Refs = new Map();
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
    // A line holding only `<br>` is spacing between sections: treat it as
    // a blank line rather than showing the tag.
    // So is `****` alone, an empty bold pair left by exported docs.
    if (
      !line ||
      line === "****" ||
      line
        .replace(BR, "")
        .replace(/&nbsp;/g, "")
        .trim() === ""
    ) {
      flush();
      continue;
    }
    const ref = REF_DEF.exec(line);
    if (ref) {
      flush();
      refs.set(ref[1].toLowerCase(), ref[2]);
      continue;
    }
    if (/^([-*_])(\s*\1){2,}$/.test(line)) {
      flush();
      blocks.push({ kind: "rule" });
      continue;
    }
    if (ROW.test(line)) {
      flush();
      const rows: string[] = [];
      while (i < lines.length && ROW.test(lines[i].trim())) {
        let row = lines[i++].trim();
        // A cell broken across lines: rejoin it, but only when a line within
        // the next few closes the row, so text after a table isn't swept in.
        if (!row.endsWith("|")) {
          const more: string[] = [];
          for (let j = i; j < Math.min(i + 3, lines.length); j++) {
            const next = lines[j].trim();
            if (!next || next.startsWith("|")) break;
            more.push(next);
            if (next.endsWith("|")) {
              row = [row, ...more].join(" ");
              i = j + 1;
              break;
            }
          }
        }
        rows.push(row);
      }
      i--;
      // The first row is a header when a separator row (|---|) follows it.
      const separated = rows.length > 1 && /^\|[\s:|-]+\|?$/.test(rows[1]);
      blocks.push({
        kind: "table",
        head: separated ? cells(rows[0]) : null,
        rows: rows.slice(separated ? 2 : 0).map(cells),
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
  return { blocks, refs };
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

const ENTITIES: Record<string, string> = {
  nbsp: "\u00a0",
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
};

/** Plain text with HTML entities (`&nbsp;`, `&amp;`, `&#39;`) decoded. */
function decode(text: string) {
  return text.replace(/&(#\d+|#x[\da-f]+|[a-z]+);/gi, (m, e: string) => {
    if (e[0] !== "#") return ENTITIES[e.toLowerCase()] ?? m;
    const code =
      e[1] === "x" || e[1] === "X"
        ? parseInt(e.slice(2), 16)
        : parseInt(e.slice(1), 10);
    return Number.isFinite(code) && code > 0 ? String.fromCodePoint(code) : m;
  });
}

/**
 * Text between the matches below. Bold pairs are matched there, so a `**`
 * left here has no partner, a slip like `[name](url)**` in a table cell:
 * drop it rather than show the asterisks.
 */
const plain = (text: string) => decode(text.replace(/\*{2,}/g, ""));

const INLINE = new RegExp(
  [
    // `code`, first so nothing inside it is formatted.
    /`(?<code>[^`]+)`/,
    // \* and friends: the character itself.
    /\\(?<escaped>[\\`*_{}[\]()#+\-.!>|~])/,
    // [![thumbnail](image)](url), e.g. a video's preview: a link to the url.
    /\[!\[[^\]]*\]\([^)\s]+\)\]\((?<linkedImg>[^)\s]+)\)/,
    // ![alt](url) and <img alt src>: a link, never a fetched image.
    /!\[(?<imgAlt>[^\]]*)\]\((?<imgSrc>[^)\s]+)(?:\s+"[^"]*")?\)/,
    /<img\b(?<imgTag>[^>]*)>/,
    // [text](url), and [text][ref] or ![alt][ref] from a definition below.
    /\[(?<text>[^\]]+)\]\((?<href>[^)\s]+)(?:\s+"[^"]*")?\)/,
    /(?<refImg>!)?\[(?<refText>[^\]]+)\]\[(?<ref>[^\]]*)\]/,
    /(?<url>https?:\/\/[^\s)<>]+[^\s)<>.,;:!?'"])/,
    /\*\*\*(?<strongEm>[^*]+)\*\*\*/,
    /\*\*(?<strong>[^*]+)\*\*|__(?<strong2>[^_]+)__/,
    // *em* and _em_, but not a lone * or snake_case.
    /(?<![\w*])\*(?=\S)(?<em>[^*\n]*?\S)\*(?![\w*])/,
    /(?<!\w)_(?=\S)(?<em2>[^_\n]*?\S)_(?!\w)/,
    /(?<br><br\s*\/?>)/,
  ]
    .map((r) => r.source)
    .join("|"),
  "gi"
);

const attr = (tag: string, name: string) =>
  new RegExp(`\\b${name}\\s*=\\s*["']([^"']*)["']`, "i").exec(tag)?.[1];

type Ctx = { base?: string; refs: Refs };

function Inline({ text, ctx }: { text: string; ctx: Ctx }) {
  const out: React.ReactNode[] = [];
  let last = 0;
  let key = 0;
  const link = (href: string | null, label: React.ReactNode, wrap = false) =>
    href ? (
      <a
        key={key++}
        href={href}
        target="_blank"
        rel="noreferrer noopener"
        className={cn(LINK, wrap && "break-all")}
      >
        {label}
      </a>
    ) : (
      <Fragment key={key++}>{label}</Fragment>
    );
  // The forum appends a size to image names ("Roadmap|690x486"): drop it.
  const image = (alt: string | undefined, src: string | undefined) =>
    link(
      src ? safeHref(src, ctx.base) : null,
      `[${alt?.replace(/\|\d+x\d+.*$/, "").trim() || "Image"}]`
    );

  for (const m of text.matchAll(INLINE)) {
    const g = m.groups!;
    const idx = m.index ?? 0;
    if (idx > last) out.push(plain(text.slice(last, idx)));
    if (g.code != null) {
      out.push(
        <code
          key={key++}
          className="rounded-[3px] bg-hover px-1 py-px font-mono text-[0.9em]"
        >
          {g.code}
        </code>
      );
    } else if (g.escaped != null) {
      out.push(g.escaped);
    } else if (g.linkedImg != null) {
      const href = safeHref(g.linkedImg, ctx.base);
      out.push(link(href, href ?? g.linkedImg, true));
    } else if (g.imgSrc != null) {
      out.push(image(g.imgAlt, g.imgSrc));
    } else if (g.imgTag != null) {
      out.push(image(attr(g.imgTag, "alt"), attr(g.imgTag, "src")));
    } else if (g.href != null) {
      out.push(
        link(safeHref(g.href, ctx.base), <Inline text={g.text} ctx={ctx} />)
      );
    } else if (g.refText != null) {
      const target = ctx.refs.get((g.ref || g.refText).toLowerCase());
      if (!target) out.push(decode(m[0]));
      else if (g.refImg) out.push(image(g.refText, target));
      else
        out.push(
          link(
            safeHref(target, ctx.base),
            <Inline text={g.refText} ctx={ctx} />
          )
        );
    } else if (g.url != null) {
      out.push(link(g.url, g.url, true));
    } else if (g.strongEm != null) {
      out.push(
        <strong key={key++} className="font-medium text-foreground">
          <em>
            <Inline text={g.strongEm} ctx={ctx} />
          </em>
        </strong>
      );
    } else if (g.strong != null || g.strong2 != null) {
      out.push(
        <strong key={key++} className="font-medium text-foreground">
          <Inline text={(g.strong ?? g.strong2)!} ctx={ctx} />
        </strong>
      );
    } else if (g.em != null || g.em2 != null) {
      out.push(
        <em key={key++}>
          <Inline text={(g.em ?? g.em2)!} ctx={ctx} />
        </em>
      );
    } else if (g.br != null) {
      out.push(<br key={key++} />);
    }
    last = idx + m[0].length;
  }
  if (last < text.length) out.push(plain(text.slice(last)));
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
  const { blocks, refs } = parseBlocks(source);
  const ctx: Ctx = { base, refs };
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
                <Inline text={b.text} ctx={ctx} />
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
                {b.items.map((item, j) => {
                  // - [x] done / - [ ] to do
                  const task = /^\[([ xX])\]\s+/.exec(item);
                  return (
                    <li
                      key={j}
                      className={cn(
                        "pl-1 marker:text-subtle-foreground",
                        task && "-ml-5 list-none"
                      )}
                    >
                      {task && (
                        <input
                          type="checkbox"
                          checked={task[1] !== " "}
                          readOnly
                          disabled
                          aria-label={task[1] !== " " ? "Done" : "Not done"}
                          className="mr-2 align-[-2px]"
                        />
                      )}
                      <Inline
                        text={task ? item.slice(task[0].length) : item}
                        ctx={ctx}
                      />
                    </li>
                  );
                })}
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
                    <Inline text={l} ctx={ctx} />
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
          case "rule":
            return <hr key={i} className="border-hairline" />;
          case "table":
            return (
              <div key={i} className="surface overflow-x-auto">
                <table className="w-full text-left text-ui-caption leading-5">
                  {b.head && (
                    <thead>
                      <tr className="border-b border-hairline">
                        {b.head.map((c, j) => (
                          <th
                            key={j}
                            className="px-3 py-2 align-bottom font-medium text-foreground"
                          >
                            <Inline text={c} ctx={ctx} />
                          </th>
                        ))}
                      </tr>
                    </thead>
                  )}
                  <tbody>
                    {b.rows.map((r, j) => (
                      <tr
                        key={j}
                        className="border-b border-hairline last:border-0"
                      >
                        {r.map((c, k) => (
                          <td key={k} className="px-3 py-2 align-top">
                            <Inline text={c} ctx={ctx} />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          case "paragraph":
            return (
              <p key={i} className="break-words">
                {b.lines.map((l, j) => (
                  <Fragment key={j}>
                    {j > 0 && <br />}
                    <Inline text={l} ctx={ctx} />
                  </Fragment>
                ))}
              </p>
            );
        }
      })}
    </div>
  );
}
