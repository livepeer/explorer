import { AVERAGE_L1_BLOCK_TIME } from "@lib/chains";
import dayjs from "@lib/dayjs";
import {
  getApollo,
  PollsQueryResult,
  ProtocolByBlockDocument,
  ProtocolByBlockQuery,
  ProtocolByBlockQueryVariables,
} from "apollo";
import fm from "front-matter";
import { catIpfsJson, IpfsPoll } from "utils/ipfs";
import { Address } from "viem";

export type Fm = {
  title: string;
  lip: string;
  commitHash: string;
  created: string;
  text: string;
};

export type PollExtended = NonNullable<PollsQueryResult["data"]>["polls"][number] & {
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

export const getPollExtended = async (
  poll: NonNullable<PollsQueryResult["data"]>["polls"][number] | null | undefined,
  l1BlockNumber: number
): Promise<PollExtended> => {
  const ipfsObject = await catIpfsJson<IpfsPoll>(poll?.proposal);

  let attributes: Fm | null = null;

  // only include proposals with valid format
  if (ipfsObject?.text && ipfsObject?.gitCommitHash) {
    const transformedProposal = fm<Fm>(ipfsObject.text);

    attributes = {
      title: String(transformedProposal.attributes.title),
      lip: String(transformedProposal.attributes.lip),
      commitHash: String(ipfsObject.gitCommitHash),
      created: String(transformedProposal.attributes.created),
      text: String(transformedProposal.body),
    };

    const commitOrBranch = attributes.commitHash ?? "master";
    const lipNum = attributes.lip ?? "1";
    const baseUrl = `https://github.com/livepeer/LIPs/blob/${commitOrBranch}/LIPs/LIP-${lipNum}.md`;
    attributes = {
      ...attributes,
      text: absolutizeLinks(attributes.text, baseUrl),
    };
  }

  const isActive = l1BlockNumber <= parseInt(poll?.endBlock ?? "0");
  const totalStakeString = await getTotalStake(
    // TODO fix endblock to query for l2 block corresponding to end of poll
    isActive ? undefined : +(poll?.endBlock ?? 0)
  );

  const totalStake = +(totalStakeString ?? 0);
  const noVoteStake = +(poll?.tally?.no || 0);
  const yesVoteStake = +(poll?.tally?.yes || 0);
  const totalVoteStake = noVoteStake + yesVoteStake;
  const totalYesVotePercent = isNaN(yesVoteStake / totalVoteStake) ? 0 : yesVoteStake / totalVoteStake;
  const totalNoVotePercent = isNaN(noVoteStake / totalVoteStake) ? 0 : noVoteStake / totalVoteStake;
  const totalParticipationPercent = totalVoteStake / totalStake;

  const status = isActive
    ? "active"
    : totalParticipationPercent > +(poll?.quorum ?? 0) / 1000000
    ? totalYesVotePercent > +(poll?.quota ?? 0) / 1000000
      ? "passed"
      : "rejected"
    : "quorum-not-met";

  const estimatedEndTime = await getEstimatedEndTimeByBlockNumber(+(poll?.endBlock ?? 0), l1BlockNumber);

  const totalNonVoteStake = totalStake - totalVoteStake;
  const nonVotersPercent = totalNonVoteStake / totalStake;

  return {
    ...(poll as any),
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
  };
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

const getEstimatedEndTimeByBlockNumber = async (requestedBlock: number, currentBlock: number) => {
  // we don't need to make requests to the etherscan, since we can rely on consistent L1 block times
  return dayjs()
    .add((requestedBlock - currentBlock) * AVERAGE_L1_BLOCK_TIME, "s")
    .unix();
};

const getTotalStake = async (l2BlockNumber?: number | undefined) => {
  const client = getApollo();

  const protocolResponse = await client.query<ProtocolByBlockQuery, ProtocolByBlockQueryVariables>({
    query: ProtocolByBlockDocument,
    variables: l2BlockNumber
      ? {
          block: {
            number: l2BlockNumber,
          },
        }
      : undefined,
  });

  return protocolResponse?.data?.protocol?.totalActiveStake;
};
