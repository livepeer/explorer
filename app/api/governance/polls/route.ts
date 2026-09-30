import { getPollableLips } from "@/lib/governance/lips";

/**
 * Pins a LIP to IPFS for a new poll and returns the hash to pass to
 * PollCreator.createPoll. The request only names the LIP: the text pinned
 * is the LIP as published in the LIPs repository, so this can't be used to
 * pin arbitrary content with the explorer's Pinata key.
 */
export async function POST(request: Request) {
  const jwt = process.env.PINATA_JWT;
  if (!jwt)
    return Response.json(
      {
        error:
          "Poll creation isn't configured on this deployment (PINATA_JWT).",
      },
      { status: 503 }
    );

  let lip: unknown;
  try {
    ({ lip } = await request.json());
  } catch {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }
  if (typeof lip !== "string" || !/^\d{1,4}$/.test(lip))
    return Response.json({ error: "Invalid LIP number" }, { status: 400 });

  let pollable;
  try {
    pollable = await getPollableLips();
  } catch {
    return Response.json({ error: "Couldn't load LIPs" }, { status: 502 });
  }
  const found = pollable.lips.find((l) => l.lip === lip);
  if (!found)
    return Response.json(
      { error: `LIP-${lip} isn't open for a poll` },
      { status: 404 }
    );

  const pinned = await fetch("https://api.pinata.cloud/pinning/pinJSONToIPFS", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${jwt}`,
    },
    body: JSON.stringify({
      pinataContent: { gitCommitHash: pollable.commit, text: found.text },
      pinataMetadata: { name: `LIP-${lip} poll` },
    }),
  });
  if (!pinned.ok)
    return Response.json({ error: "IPFS pinning failed" }, { status: 502 });
  const { IpfsHash } = (await pinned.json()) as { IpfsHash: string };
  return Response.json({ hash: IpfsHash });
}
