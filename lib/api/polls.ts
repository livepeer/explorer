import { AVERAGE_L1_BLOCK_TIME, CHAIN_INFO, l2Provider } from "@lib/chains";
import dayjs from "@lib/dayjs";
import {
  getApollo,
  PollsQueryResult,
  ProtocolByBlockDocument,
  ProtocolByBlockQuery,
  ProtocolByBlockQueryVariables,
} from "apollo";
import { ethers } from "ethers";
import fm from "front-matter";
import { catIpfsJson, IpfsPoll } from "utils/ipfs";
import { Address } from "viem";

import { nodeInterface } from "./abis/bridge/NodeInterface";

export type Fm = {
  title: string;
  lip: string;
  commitHash: string;
  created: string;
  text: string;
};

export type PollExtended = NonNullable<
  PollsQueryResult["data"]
>["polls"][number] & {
  id: Address;
  attributes?: Fm | null;
  estimatedEndTime: number;
  status: "active" | "passed" | "rejected" | "quorum-not-met";

  percent: {
    yes: number;
    no: number;

    voters: number;
    nonVoters: number;
  };

  stake: {
    yes: number;
    no: number;

    voters: number;
    nonVoters: number;
  };
};

export const parsePollIpfs = (ipfsObject?: IpfsPoll | null): Fm | null => {
  if (!ipfsObject?.text || !ipfsObject?.gitCommitHash) return null;

  const transformedProposal = fm<Fm>(ipfsObject.text);

  return {
    title: String(transformedProposal.attributes.title),
    lip: String(transformedProposal.attributes.lip),
    commitHash: String(ipfsObject.gitCommitHash),
    created: String(transformedProposal.attributes.created),
    text: String(transformedProposal.body),
  };
};

export const getPollExtended = async (
  poll:
    | NonNullable<PollsQueryResult["data"]>["polls"][number]
    | null
    | undefined,
  l1BlockNumber: number
): Promise<PollExtended> => {
  const ipfsObject = await catIpfsJson<IpfsPoll>(poll?.proposal);

  let attributes = parsePollIpfs(ipfsObject);

  if (attributes) {
    const commitOrBranch = attributes.commitHash ?? "master";
    const lipNum = attributes.lip ?? "1";
    const baseUrl = `https://github.com/livepeer/LIPs/blob/${commitOrBranch}/LIPs/LIP-${lipNum}.md`;
    attributes = {
      ...attributes,
      text: absolutizeLinks(attributes.text, baseUrl),
    };
  }

  const isActive = l1BlockNumber <= parseInt(poll?.endBlock ?? "0");

  // Get L2 block number corresponding to end of poll
  // Create NodeInterface to get L2 block number corresponding to end of poll
  const totalStakeString = await getTotalStake(
    Number(
      isActive
        ? undefined
        : (
            await getL2BlockRangeForL1(Number(poll?.endBlock ?? "0"))
          ).lastBlock
    )
  );

  const totalStake = +(totalStakeString ?? 0);
  const noVoteStake = +(poll?.tally?.no || 0);
  const yesVoteStake = +(poll?.tally?.yes || 0);
  const totalVoteStake = noVoteStake + yesVoteStake;
  const totalYesVotePercent = isNaN(yesVoteStake / totalVoteStake)
    ? 0
    : yesVoteStake / totalVoteStake;
  const totalNoVotePercent = isNaN(noVoteStake / totalVoteStake)
    ? 0
    : noVoteStake / totalVoteStake;
  const totalParticipationPercent = totalVoteStake / totalStake;

  const status = isActive
    ? "active"
    : totalParticipationPercent > +(poll?.quorum ?? 0) / 1000000
    ? totalYesVotePercent > +(poll?.quota ?? 0) / 1000000
      ? "passed"
      : "rejected"
    : "quorum-not-met";

  const estimatedEndTime = await getEstimatedEndTimeByBlockNumber(
    +(poll?.endBlock ?? 0),
    l1BlockNumber
  );

  const totalNonVoteStake = totalStake - totalVoteStake;
  const nonVotersPercent = totalNonVoteStake / totalStake;

  return {
    ...poll,
    attributes,
    status,
    estimatedEndTime,

    percent: {
      yes: totalYesVotePercent,
      no: totalNoVotePercent,

      voters: totalVoteStake / totalStake,
      nonVoters: nonVotersPercent,
    },
    stake: {
      yes: yesVoteStake,
      no: noVoteStake,

      voters: totalVoteStake,
      nonVoters: totalNonVoteStake,
    },
  } as PollExtended;
};

const absolutizeLinks = (markdown: string, baseUrl: string) => {
  const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;

  return markdown.replace(linkRegex, (match, linkText, url) => {
    // If it's already an absolute link, return match as is
    if (url.startsWith("http://") || url.startsWith("https://")) {
      return match;
    }

    const absoluteUrl = new URL(url, baseUrl).toString();
    return `[${linkText}](${absoluteUrl})`;
  });
};

const getEstimatedEndTimeByBlockNumber = async (
  requestedBlock: number,
  currentBlock: number
) => {
  // we don't need to make requests to the etherscan, since we can rely on consistent L1 block times
  return dayjs()
    .add((requestedBlock - currentBlock) * AVERAGE_L1_BLOCK_TIME, "s")
    .unix();
};

const getTotalStake = async (l2BlockNumber?: number | undefined) => {
  const client = getApollo();

  const protocolResponse = await client.query<
    ProtocolByBlockQuery,
    ProtocolByBlockQueryVariables
  >({
    query: ProtocolByBlockDocument,
    variables: l2BlockNumber
      ? {
          block: {
            number: l2BlockNumber,
          },
        }
      : undefined,
    fetchPolicy: "network-only",
  });

  return protocolResponse?.data?.protocol?.totalActiveStake;
};

const getL2BlockRangeForL1 = async (l1BlockNumber: number) => {
  try {
    const contract = new ethers.Contract(
      CHAIN_INFO[l2Provider.network.chainId].contracts.nodeInterface,
      nodeInterface,
      l2Provider
    );
    // TODO: Block number 18328665 throws an error, so we add 1 to the block number
    // TODO: Monitor if this is invalid data or if it shows up again
    const l2BlockRangeForL1 = await contract.l2BlockRangeForL1(
      l1BlockNumber === 18328665
        ? BigInt(l1BlockNumber + 1)
        : BigInt(l1BlockNumber)
    );
    return {
      lastBlock: l2BlockRangeForL1.lastBlock.toNumber(),
      firstBlock: l2BlockRangeForL1.firstBlock.toNumber(),
    };
  } catch (error) {
    console.error(
      "Error getting L2 block range for L1 " + l1BlockNumber,
      error
    );
    return {
      lastBlock: 0,
      firstBlock: 0,
    };
  }
};
