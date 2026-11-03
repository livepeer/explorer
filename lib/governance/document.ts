/* ── Documents: front matter + body ──────────────────────────────────────── */

/**
 * Split an optional YAML-ish front matter block (`---\nkey: value\n---`) off a
 * markdown document. Only flat `key: value` pairs are read; anything fancier
 * is ignored rather than guessed at.
 */
export function parseDocument(source: string) {
  const text = source.replace(/\r\n/g, "\n").trim();
  const attributes: Record<string, string> = {};
  let body = text;
  const match = /^---\n([\s\S]*?)\n---\n?/.exec(text);
  if (match) {
    for (const line of match[1].split("\n")) {
      const kv = /^([A-Za-z0-9_-]+)\s*:\s*(.*)$/.exec(line.trim());
      if (kv)
        attributes[kv[1].toLowerCase()] = kv[2]
          .replace(/^["']|["']$/g, "")
          .trim();
    }
    body = text.slice(match[0].length).trim();
  }
  return { attributes, body };
}

/**
 * Title + body of a treasury proposal description. The title is the front
 * matter `title` when present, else the first line (a markdown heading by
 * convention), which is then dropped from the body so it isn't shown twice.
 */
export function proposalDocument(description: string) {
  const { attributes, body } = parseDocument(description);
  if (attributes.title) return { title: attributes.title, body };
  const lines = body.split("\n");
  const first = lines.findIndex((l) => l.trim());
  if (first === -1) return { title: "Untitled proposal", body: "" };
  return {
    title: lines[first].trim().replace(/^#+\s*/, "") || "Untitled proposal",
    body: lines
      .slice(first + 1)
      .join("\n")
      .trim(),
  };
}
