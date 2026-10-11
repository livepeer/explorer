import { SUBGRAPH_URL } from "@/lib/config";

import { parseDocument } from "./document";

/**
 * LIPs that can be put to a poll: status "Proposed", not part of another
 * LIP, and without a poll already. Read from the LIPs repository on GitHub
 * at its latest commit, the same rules the previous explorer used.
 */

const OWNER = process.env.GITHUB_LIP_NAMESPACE || "livepeer";
const REPO = "LIPS";
const BRANCH = "master";
const REVALIDATE = 600;

export type Lip = {
  lip: string;
  title: string;
  created: string | null;
  text: string;
  url: string;
};

export type PollableLips = { commit: string; lips: Lip[] };

const github = (path: string) =>
  fetch(`https://api.github.com/repos/${OWNER}/${REPO}${path}`, {
    headers: {
      Accept: "application/vnd.github+json",
      ...(process.env.GITHUB_ACCESS_TOKEN
        ? { Authorization: `Bearer ${process.env.GITHUB_ACCESS_TOKEN}` }
        : {}),
    },
    next: { revalidate: REVALIDATE },
    signal: AbortSignal.timeout(10_000),
  });

/** Run `fn` over `items`, at most `n` at a time. */
async function mapLimit<T, R>(items: T[], n: number, fn: (t: T) => Promise<R>) {
  const out: R[] = [];
  let next = 0;
  await Promise.all(
    Array.from({ length: Math.min(n, items.length) }, async () => {
      while (next < items.length) {
        const i = next++;
        out[i] = await fn(items[i]);
      }
    })
  );
  return out;
}

/**
 * LIP numbers that already have a poll, from each poll's IPFS document.
 * Fails rather than guess: an unreadable poll list or document would make an
 * already-polled LIP look pollable, inviting a duplicate poll, so any fetch
 * or parse failure throws and poll creation stops until it reads cleanly.
 */
async function polledLips(): Promise<Set<string>> {
  const res = await fetch(SUBGRAPH_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query: "{ polls(first: 1000) { proposal } }" }),
    next: { revalidate: REVALIDATE },
  });
  if (!res.ok) throw new Error(`Subgraph returned ${res.status}`);
  const json = (await res.json()) as {
    data?: { polls: { proposal: string | null }[] };
    errors?: { message: string }[];
  };
  // GraphQL reports failures in an `errors` array, often with a 200.
  if (json.errors?.length) throw new Error(json.errors[0].message);
  if (!json.data) throw new Error("Subgraph returned no polls");

  const hashes = json.data.polls
    .map((p) => p.proposal)
    .filter((h): h is string => Boolean(h));
  const lips = await mapLimit(hashes, 6, async (hash) => {
    const doc = await fetch(`https://ipfs.livepeer.com/ipfs/${hash}`, {
      next: { revalidate: 86_400 },
      signal: AbortSignal.timeout(8_000),
    });
    if (!doc.ok) throw new Error(`IPFS returned ${doc.status} for ${hash}`);
    const { text } = (await doc.json()) as { text?: string };
    // Read cleanly but not a LIP document: genuinely no LIP number.
    return typeof text === "string"
      ? parseDocument(text).attributes.lip ?? null
      : null;
  });
  return new Set(lips.filter((l): l is string => Boolean(l)));
}

export async function getPollableLips(): Promise<PollableLips> {
  const head = await github(`/commits/${BRANCH}`);
  if (!head.ok) throw new Error(`GitHub returned ${head.status}`);
  const commit = ((await head.json()) as { sha: string }).sha;

  const treeRes = await github(`/git/trees/${commit}?recursive=1`);
  if (!treeRes.ok) throw new Error(`GitHub returned ${treeRes.status}`);
  const paths = ((await treeRes.json()) as { tree: { path: string }[] }).tree
    .map((t) => t.path)
    .filter((p) => /^LIPs\/LIP-\d+\.md$/.test(p));

  const [texts, polled] = await Promise.all([
    mapLimit(paths, 8, async (path) => {
      const raw = await fetch(
        `https://raw.githubusercontent.com/${OWNER}/${REPO}/${commit}/${path}`,
        {
          next: { revalidate: REVALIDATE },
          signal: AbortSignal.timeout(10_000),
        }
      );
      return raw.ok ? { path, text: await raw.text() } : null;
    }),
    polledLips(),
  ]);

  const lips: Lip[] = [];
  for (const file of texts) {
    if (!file) continue;
    const { attributes } = parseDocument(file.text);
    const lip = attributes.lip;
    if (
      !lip ||
      attributes.status !== "Proposed" ||
      attributes["part-of"] ||
      polled.has(lip)
    )
      continue;
    lips.push({
      lip,
      title: attributes.title ?? `LIP-${lip}`,
      created: attributes.created ?? null,
      text: file.text,
      url: `https://github.com/${OWNER}/${REPO}/blob/${commit}/${file.path}`,
    });
  }
  lips.sort((a, b) => Number(b.lip) - Number(a.lip));
  return { commit, lips };
}
