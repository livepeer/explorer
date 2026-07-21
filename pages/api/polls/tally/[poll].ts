/**
 * TEMPORARY stopgap: serve a poll's stake-weighted tally computed from chain
 * state, for polls the subgraph has not indexed yet. Restricted to the manually
 * listed polls so it can't be used to scan arbitrary contracts — remove along
 * with `constants/manualPolls` once indexing recovers.
 */

import { getCacheControlHeader } from "@lib/api";
import {
  badRequest,
  internalError,
  methodNotAllowed,
  notFound,
} from "@lib/api/errors";
import { getPollTally } from "@lib/api/pollTally";
import { PollTally } from "@lib/api/types/get-poll-tally";
import { getManualPoll } from "constants/manualPolls";
import { NextApiRequest, NextApiResponse } from "next";
import { Address, getAddress, isAddress } from "viem";

/** Recompute at most once a minute per poll, CDN in front of us or not. */
const MEMO_TTL_MS = 60_000;

const memo = new Map<
  Address,
  { expiresAt: number; tally: Promise<PollTally> }
>();

const getCachedPollTally = (pollAddress: Address, startBlock: number) => {
  const cached = memo.get(pollAddress);

  if (cached && cached.expiresAt > Date.now()) {
    return cached.tally;
  }

  const tally = getPollTally(pollAddress, startBlock).catch((err) => {
    // Don't cache failures — the next request should retry.
    memo.delete(pollAddress);
    throw err;
  });

  memo.set(pollAddress, { expiresAt: Date.now() + MEMO_TTL_MS, tally });

  return tally;
};
const handler = async (
  req: NextApiRequest,
  res: NextApiResponse<PollTally | unknown>
) => {
  try {
    const method = req.method;

    if (method !== "GET") {
      methodNotAllowed(res, method ?? "unknown", ["GET"]);
      return;
    }

    const { poll } = req.query;

    if (!poll || Array.isArray(poll) || !isAddress(poll)) {
      badRequest(res, "Invalid poll address format");
      return;
    }

    const manualPoll = getManualPoll(poll);

    if (!manualPoll) {
      notFound(
        res,
        "No manually listed poll for this address",
        "Tallies are only computed on-chain for polls missing from the subgraph"
      );
      return;
    }

    res.setHeader("Cache-Control", getCacheControlHeader("minute"));

    const tally = await getCachedPollTally(
      getAddress(poll),
      manualPoll.startBlockL2
    );

    res.status(200).json(tally);
  } catch (err) {
    internalError(res, err);
  }
};

export default handler;
