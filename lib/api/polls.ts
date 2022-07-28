import { CHAIN_INFO, DEFAULT_CHAIN_ID } from "@lib/chains";
import {
  getApollo,
  PollsQueryResult,
  ProtocolByBlockDocument,
  ProtocolByBlockQuery,
  ProtocolByBlockQueryVariables,
} from "apollo";
import fm from "front-matter";
import { catIpfsJson, IpfsPoll } from "utils/ipfs";

export type Fm = {
  title: string;
  lip: string;
  commitHash: string;
  created: string;
  text: string;
};

export type PollExtended = PollsQueryResult["data"]["polls"][number] & {
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
  poll: PollsQueryResult["data"]["polls"][number] | null | undefined,
  l2BlockNumber: number
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
  }

  const isActive = l2BlockNumber <= parseInt(poll.endBlock);
  const totalStakeString = await getTotalStake(
    isActive ? l2BlockNumber : +poll.endBlock
  );

  const totalStake = +totalStakeString;
  const noVoteStake = +poll?.tally?.no || 0;
  const yesVoteStake = +poll?.tally?.yes || 0;
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
    : totalParticipationPercent > +poll.quorum / 10000
    ? totalYesVotePercent > +poll.quota / 10000
      ? "passed"
      : "rejected"
    : "quorum-not-met";

  const estimatedEndTime = await getEndTimeByBlockNumber(+poll.endBlock);

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
  };
};

const getEndTimeByBlockNumber = async (number: number) => {
  const blockDataResponse = await fetch(
    `${CHAIN_INFO[DEFAULT_CHAIN_ID].explorerAPI}?module=block&action=getblockreward&blockno=${number}&apikey=${process.env.NEXT_PUBLIC_ETHERSCAN_API_KEY}`
  );
  const { result } = await blockDataResponse.json();
  return Number(result?.timeStamp) ?? 0;
};

const getTotalStake = async (l2BlockNumber: number) => {
  const client = getApollo();

  const protocolResponse = await client.query<
    ProtocolByBlockQuery,
    ProtocolByBlockQueryVariables
  >({
    query: ProtocolByBlockDocument,
    variables: {
      block: {
        number: l2BlockNumber,
      },
    },
  });

  return protocolResponse?.data?.protocol?.totalActiveStake;
};
