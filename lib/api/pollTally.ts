import { l2PublicClient } from "@lib/chains";
import { Address, formatEther, getAbiItem, getAddress } from "viem";

import { bondingManager } from "./abis/main/BondingManager";
import { poll as pollAbi } from "./abis/main/Poll";
import { roundsManager } from "./abis/main/RoundsManager";
import { getBondingManagerAddress, getRoundsManagerAddress } from "./contracts";
import { PollTally, PollTallyVote } from "./types/get-poll-tally";

/**
 * TEMPORARY stopgap: compute a poll's stake-weighted tally from chain state so
 * results stay visible while the subgraph is behind on indexing.
 *
 * This mirrors the subgraph's tally rules (see livepeer/subgraph
 * `src/mappings/poll.ts`):
 *  - a vote's weight is the voter's stake at the current round,
 *  - a registered transcoder votes with its *total* stake (own + delegated),
 *  - a delegator that votes itself is subtracted from its delegate's weight
 *    (`nonVoteStake`), so stake is never counted twice,
 *  - only `Yes` (0) and `No` (1) choices count, and the latest vote per address
 *    wins.
 *
 * CAVEAT: this reads stake as it is *now*, not as it was at the poll's end
 * block. While a poll is open that matches what the subgraph reports. Once it
 * closes the real result freezes and this one keeps moving as stake is bonded,
 * unbonded, or earns rewards — enough to flip the derived passed/rejected
 * status. That is left unhandled on purpose: the poll is expected to still be
 * open for the few days this stopgap exists, and pinning the reads to the end
 * block needs `NodeInterface.l2BlockRangeForL1` to map it onto L2, which reverts
 * intermittently for the same input (the RPC's own flakiness, also the likely
 * cause of the `getL2BlockRangeForL1` TODO in ./polls.ts). Pinning through it
 * traded a small drift for an intermittent hard failure. If voting closes while
 * the subgraph is still behind, treat these numbers as indicative and confirm
 * the outcome from the vote events at the end block.
 *
 * Remove together with the manual poll list once indexing recovers.
 */

const VOTE_EVENT = getAbiItem({ abi: pollAbi, name: "Vote" });

/** Choice IDs the contract accepts; anything else is ignored by the tally. */
const CHOICES: Record<string, PollTallyVote["choice"]> = { 0: "Yes", 1: "No" };

/** Infura caps `eth_getLogs` at 10k blocks on Arbitrum; stay under it. */
const MAX_LOG_RANGE = 9_000n;

/** Blocks re-scanned on every poll, so a reorg near the tip can't drop a vote. */
const REORG_BUFFER = 200n;

/** How many range chunks are in flight at once during a cold scan. */
const CHUNK_CONCURRENCY = 10;

type Choice = PollTallyVote["choice"];

const decode = (logs: Awaited<ReturnType<typeof getRangeLogs>>) =>
  logs.flatMap((log) => {
    const choice = CHOICES[String(log.args.choiceID)];
    return choice && log.args.voter
      ? [{ voter: getAddress(log.args.voter), choice }]
      : [];
  });

const getRangeLogs = (address: Address, fromBlock: bigint, toBlock: bigint) =>
  l2PublicClient.getLogs({ address, event: VOTE_EVENT, fromBlock, toBlock });

/**
 * Read `Vote` logs across a block span. Tries the span in one request — cheap on
 * providers that allow it — and falls back to fixed-size chunks for the ones
 * that cap the range (Infura), a few at a time so we don't burst the rate limit.
 */
const getVoteLogs = async (
  address: Address,
  fromBlock: bigint,
  toBlock: bigint
): Promise<{ voter: Address; choice: Choice }[]> => {
  if (fromBlock > toBlock) return [];

  try {
    return decode(await getRangeLogs(address, fromBlock, toBlock));
  } catch (err) {
    if (toBlock - fromBlock < MAX_LOG_RANGE) throw err;

    const ranges: [bigint, bigint][] = [];
    for (let start = fromBlock; start <= toBlock; start += MAX_LOG_RANGE) {
      const end = start + MAX_LOG_RANGE - 1n;
      ranges.push([start, end > toBlock ? toBlock : end]);
    }

    const votes: { voter: Address; choice: Choice }[] = [];
    for (let i = 0; i < ranges.length; i += CHUNK_CONCURRENCY) {
      const batch = await Promise.all(
        ranges
          .slice(i, i + CHUNK_CONCURRENCY)
          .map(([start, end]) => getRangeLogs(address, start, end))
      );
      for (const logs of batch) votes.push(...decode(logs));
    }

    return votes;
  }
};

/**
 * Votes seen so far per poll, so only blocks appended since the last call are
 * scanned. A poll's history is ~830k blocks and grows by ~345k a day, which is
 * ~90 chunked requests to walk — worth paying once per process, not per request.
 */
const scanned = new Map<
  Address,
  { toBlock: bigint; choices: Map<Address, Choice> }
>();

/** Latest vote per address, matching the subgraph's overwrite on re-vote. */
const getChoiceByVoter = async (
  address: Address,
  startBlock: bigint,
  latestBlock: bigint
) => {
  const previous = scanned.get(address);
  const choices = previous?.choices ?? new Map<Address, Choice>();
  const fromBlock = previous
    ? previous.toBlock > REORG_BUFFER
      ? previous.toBlock - REORG_BUFFER
      : startBlock
    : startBlock;

  // Re-scanning the buffer is idempotent: replaying a vote sets the same choice.
  for (const { voter, choice } of await getVoteLogs(
    address,
    fromBlock,
    latestBlock
  )) {
    choices.set(voter, choice);
  }

  scanned.set(address, { toBlock: latestBlock, choices });

  return choices;
};

export const getPollTally = async (
  pollAddress: Address,
  startBlock: number
): Promise<PollTally> => {
  const [bondingManagerAddress, roundsManagerAddress, latestBlock] =
    await Promise.all([
      getBondingManagerAddress(),
      getRoundsManagerAddress(),
      l2PublicClient.getBlockNumber(),
    ]);

  const [currentRound, totalBonded, choiceByVoter] = await Promise.all([
    l2PublicClient.readContract({
      address: roundsManagerAddress,
      abi: roundsManager,
      functionName: "currentRound",
    }),
    l2PublicClient.readContract({
      address: bondingManagerAddress,
      abi: bondingManager,
      functionName: "getTotalBonded",
    }),
    getChoiceByVoter(pollAddress, BigInt(startBlock), latestBlock),
  ]);

  const voters = [...choiceByVoter.keys()];

  // `l2PublicClient` aggregates concurrent reads into multicall3 batches, so
  // these are a handful of requests no matter how many addresses voted.
  const read = { address: bondingManagerAddress, abi: bondingManager } as const;

  const [delegators, registrations, transcoderStakes, pendingStakes] =
    await Promise.all([
      Promise.all(
        voters.map((voter) =>
          l2PublicClient.readContract({
            ...read,
            functionName: "getDelegator",
            args: [voter],
          })
        )
      ),
      Promise.all(
        voters.map((voter) =>
          l2PublicClient.readContract({
            ...read,
            functionName: "isRegisteredTranscoder",
            args: [voter],
          })
        )
      ),
      Promise.all(
        voters.map((voter) =>
          l2PublicClient.readContract({
            ...read,
            functionName: "transcoderTotalStake",
            args: [voter],
          })
        )
      ),
      Promise.all(
        voters.map((voter) =>
          l2PublicClient.readContract({
            ...read,
            functionName: "pendingStake",
            args: [voter, currentRound],
          })
        )
      ),
    ]);

  // Delegators that voted themselves are subtracted from their delegate's
  // weight, whether or not the delegate ended up voting.
  const nonVoteStake = new Map<Address, bigint>();
  const tallied = voters.map((voter, index) => {
    const registeredTranscoder = registrations[index];
    const delegate = getAddress(delegators[index][2]);
    const isSelfDelegated = delegate === voter;
    const voteStake = isSelfDelegated
      ? transcoderStakes[index]
      : pendingStakes[index];

    if (!isSelfDelegated) {
      nonVoteStake.set(
        delegate,
        (nonVoteStake.get(delegate) ?? 0n) + voteStake
      );
    }

    return {
      voter,
      choice: choiceByVoter.get(voter) as Choice,
      registeredTranscoder,
      voteStake,
    };
  });

  let yes = 0n;
  let no = 0n;

  const votes = tallied.map(
    ({ voter, choice, registeredTranscoder, voteStake }) => {
      // Only a *registered* transcoder's weight is reduced by its delegators'
      // own votes — an unregistered delegate votes with its personal stake only.
      const excluded = registeredTranscoder
        ? nonVoteStake.get(voter) ?? 0n
        : 0n;
      const weight = voteStake - excluded;

      if (choice === "Yes") yes += weight;
      else no += weight;

      return {
        voter: voter.toLowerCase(),
        choice,
        voteStake: formatEther(voteStake),
        nonVoteStake: formatEther(excluded),
        registeredTranscoder,
      };
    }
  );

  return {
    poll: pollAddress.toLowerCase(),
    tally: { yes: formatEther(yes), no: formatEther(no) },
    totalStake: formatEther(totalBonded),
    votes,
    updatedAt: Math.floor(Date.now() / 1000),
  };
};
