import { AVERAGE_L1_BLOCK_TIME } from "@lib/chains";
import { ProtocolQuery, TreasuryProposalQuery } from "apollo";
import dayjs from "dayjs";
import fm from "front-matter";
import { ProposalState } from "./types/get-treasury-proposal";
import { CurrentRoundInfo } from "./types/get-current-round";
import { fromWei } from "@lib/utils";

export type Proposal = NonNullable<TreasuryProposalQuery["treasuryProposal"]>;

export type ProposalTextAttributes = {
  title: string;
  lip: string;
  created: string;
  text: string;
};

export type ProposalVotesExtended = ProposalState["votes"] & {
  voteStartTime: dayjs.Dayjs;
  voteEndTime: dayjs.Dayjs;

  percent: {
    against: number;
    for: number;
    abstain: number;

    voters: number;
    nonVoters: number;
  };

  total: {
    against: number;
    for: number;
    abstain: number;

    voters: number;
    quotaVoters: number;
    nonVoters: number;
  };
};

export type ParsedProposal = Proposal & {
  attributes: ProposalTextAttributes;
};

export type ProposalExtended = ParsedProposal &
  ProposalState & {
    votes: ProposalVotesExtended;
  };

const zeroIfNaN = (value: number) => (isNaN(value) ? 0 : value);

export const parseProposalText = (proposal: Proposal): ParsedProposal => {
  const transformedProposal = fm<ProposalTextAttributes>(
    proposal.description ?? ""
  );

  const attributes = {
    title: transformedProposal.attributes.title,
    lip: transformedProposal.attributes.lip,
    created: transformedProposal.attributes.created,
    text: transformedProposal.body,
  };

  if (!attributes.title || !attributes.text) {
    // strip the first line of the title as if it were a markdown title
    const titleAndBody = proposal.description?.split("\n");

    attributes.title = titleAndBody[0].replace(/^#+\s*/, "");
    attributes.text =
      titleAndBody.length === 1
        ? attributes.title
        : titleAndBody.slice(1).join("\n").replace(/^\s+/, "");
  }

  return { ...proposal, attributes };
};

export const getProposalExtended = (
  proposalArg: Proposal | ParsedProposal,
  state: ProposalState,
  currentRound: CurrentRoundInfo,
  protocol: ProtocolQuery["protocol"]
): ProposalExtended => {
  const proposal =
    "attributes" in proposalArg ? proposalArg : parseProposalText(proposalArg);

  const totalVoteSupply = +fromWei(state.totalVoteSupply ? state.totalVoteSupply : BigInt(0));

  const againstVotes = +fromWei(state.votes.against ? state.votes.against : BigInt(0));
  const forVotes = +fromWei(state.votes.for ? state.votes.for : BigInt(0));
  const abstainVotes = +fromWei(state.votes.abstain ? state.votes.abstain : BigInt(0));
  const totalVotes = againstVotes + forVotes + abstainVotes;
  const quotaTotalVotes = againstVotes + forVotes;

  const voteStartTime = estimateRoundStartTime(
    +proposal.voteStart + 1,
    currentRound,
    protocol
  );
  const voteEndTime = estimateRoundStartTime(
    +proposal.voteEnd + 1,
    currentRound,
    protocol
  );

  const missingVotes = totalVoteSupply - totalVotes;

  return {
    ...proposal,
    ...state,
    votes: {
      ...state.votes,

      voteStartTime,
      voteEndTime,

      percent: {
        against: zeroIfNaN(againstVotes / totalVotes),
        for: zeroIfNaN(forVotes / totalVotes),
        abstain: zeroIfNaN(abstainVotes / totalVotes),

        voters: zeroIfNaN(totalVotes / totalVoteSupply),
        nonVoters: zeroIfNaN(missingVotes / totalVoteSupply),
      },
      total: {
        against: againstVotes,
        for: forVotes,
        abstain: abstainVotes,

        voters: totalVotes,
        quotaVoters: quotaTotalVotes,
        nonVoters: missingVotes,
      },
    },
  };
};

const estimateRoundStartTime = (
  requestedRound: number,
  currentRound: CurrentRoundInfo,
  protocol: ProtocolQuery["protocol"]
) => {
  const roundLength = +(protocol?.roundLength ?? 1);
  const requestedStartBlock =
    currentRound.startBlock + (requestedRound - currentRound.id) * roundLength;

  // we don't need to make requests to the etherscan, since we can rely on consistent L1 block times
  const diffFromNow =
    (requestedStartBlock - currentRound.currentL1Block) * AVERAGE_L1_BLOCK_TIME;
  return dayjs().add(diffFromNow, "s");
};
