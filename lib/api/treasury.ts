import { AVERAGE_L1_BLOCK_TIME } from "@lib/chains";
import {
  getApollo,
  PollsQueryResult,
  ProtocolByBlockDocument,
  ProtocolByBlockQuery,
  ProtocolByBlockQueryVariables,
  ProtocolQuery,
} from "apollo";
import dayjs from "dayjs";
import fm from "front-matter";
import { catIpfsJson, IpfsPoll } from "utils/ipfs";
import { Proposal, ProposalState } from "./types/get-treasury-proposal";
import { CurrentRoundInfo } from "./types/get-current-round";

export type ProposalTextAttributes = {
  title: string;
  lip: string;
  created: string;
  text: string;
};

export type ProposalVoteCounts = {
  estimatedEndTime: number;

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

const zeroIfNaN = (value: number) => (isNaN(value) ? 0 : value);

export const getProposalTextAttributes = (proposal: Proposal): ProposalTextAttributes => {
  const transformedProposal = fm<ProposalTextAttributes>(proposal.description ?? "");

  const attributes = {
    title: transformedProposal.attributes.title,
    lip: transformedProposal.attributes.lip,
    created: transformedProposal.attributes.created,
    text: transformedProposal.body,
  };

  if (!attributes.title || !attributes.text) {
    // strip the first line of the title as if it were a markdown title
    const titleAndBody = proposal.description?.split("\n", 2);

    attributes.title = titleAndBody[0].replace(/^#+\s*/, "");
    attributes.text = titleAndBody.length === 1 ? attributes.title : titleAndBody[1].replace(/^\s+/, "");
  }

  return attributes;
};

export const getProposalVoteCounts = (
  proposal: Proposal,
  state: ProposalState,
  currentRound: CurrentRoundInfo,
  protocol: ProtocolQuery["protocol"]
): ProposalVoteCounts => {
  const totalVoteSupply = +(state.totalVoteSupply ?? 0) / 1e18;

  const againstVotes = +(state.votes.against || 0) / 1e18;
  const forVotes = +(state.votes.for || 0) / 1e18;
  const abstainVotes = +(state.votes.abstain || 0) / 1e18;
  const totalVotes = againstVotes + forVotes + abstainVotes;
  const quotaTotalVotes = againstVotes + forVotes;

  const estimatedEndTime = getEstimatedEndTimeByRound(+(proposal.voteEnd ?? 0) + 1, currentRound, protocol);

  const missingVotes = totalVoteSupply - totalVotes;

  return {
    ...proposal,
    ...state,
    estimatedEndTime,

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
  };
};

const getEstimatedEndTimeByRound = (
  requestedRound: number,
  currentRound: CurrentRoundInfo,
  protocol: ProtocolQuery["protocol"]
) => {
  const roundLength = +(protocol?.roundLength ?? 1);
  const requestedStartBlock = currentRound.startBlock + (requestedRound - currentRound.id) * roundLength;
  // we don't need to make requests to the etherscan, since we can rely on consistent L1 block times
  return dayjs()
    .add((requestedStartBlock - currentRound.currentL1Block) * AVERAGE_L1_BLOCK_TIME, "s")
    .unix();
};
