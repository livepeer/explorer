import { createApolloFetch } from "apollo-fetch";
import fm from "front-matter";
import { CHAIN_INFO, DEFAULT_CHAIN_ID } from "lib/chains";
import { catIpfsJson, IpfsPoll } from "utils/ipfs";

import { PollLip, PollLips } from "./types/get-poll-lips";

type TransformedProposal = {
  attributes: {
    lip: string;
  };
};

type GitHubLipResponse = {
  repository?: {
    owner: {
      login: string;
    };
    name: string;
    defaultBranchRef: {
      target: {
        oid: string;
      };
    };
    content: {
      entries: {
        content: {
          text: string;
        };
      }[];
    };
  };
};

const getLipNamespace = () =>
  process.env.NEXT_PUBLIC_GITHUB_LIP_NAMESPACE || "livepeer";

export async function getPollLips(): Promise<PollLips> {
  const lipsQuery = `
    {
      repository(owner: "${getLipNamespace()}", name: "LIPS") {
        owner {
          login
        }
        name
        defaultBranchRef {
          target {
            oid
          }
        }
        content: object(expression: "master:LIPs/") {
          ... on Tree {
            entries {
              content: object {
                commitResourcePath
                ... on Blob {
                  text
                }
              }
            }
          }
        }
      }
    }
    `;

  const githubFetch = createApolloFetch({
    uri: "https://api.github.com/graphql",
  });

  githubFetch.use(({ options }, next) => {
    if (!options.headers) {
      options.headers = {};
    }
    options.headers[
      "authorization"
    ] = `Bearer ${process.env.GITHUB_ACCESS_TOKEN}`;

    next();
  });

  const result = await githubFetch({ query: lipsQuery });
  if (result.errors?.length) {
    throw new Error(
      `GitHub GraphQL returned errors: ${JSON.stringify(result.errors)}`
    );
  }

  const githubData = result.data as GitHubLipResponse | undefined;
  if (!githubData?.repository?.content?.entries) {
    throw new Error(`No LIP data returned for ${getLipNamespace()}/LIPS`);
  }

  const subgraphFetch = createApolloFetch({
    uri: CHAIN_INFO[DEFAULT_CHAIN_ID].subgraph,
  });
  const { data: pollsData, errors: pollsErrors } = await subgraphFetch({
    query: `{ polls { proposal } }`,
  });
  if (pollsErrors?.length) {
    throw new Error(
      `Polls subgraph returned errors: ${JSON.stringify(pollsErrors)}`
    );
  }

  const createdPolls: string[] = [];
  if (pollsData) {
    await Promise.all(
      pollsData.polls.map(async (poll) => {
        const obj = await catIpfsJson<IpfsPoll>(poll?.proposal);

        if (obj?.text && obj?.gitCommitHash) {
          const transformedProposal = fm(obj.text) as TransformedProposal;
          createdPolls.push(String(transformedProposal.attributes.lip));
        }
      })
    );
  }

  const lips: PollLip[] = [];
  for (const lip of githubData.repository.content.entries) {
    const transformedLip = fm(lip.content.text) as unknown as PollLip;
    transformedLip.attributes.created = String(
      transformedLip.attributes.created
    );

    if (
      transformedLip.attributes.status === "Proposed" &&
      !transformedLip.attributes["part-of"] &&
      !createdPolls.includes(String(transformedLip.attributes.lip))
    ) {
      lips.push({ ...transformedLip, text: lip.content.text });
    }
  }

  return {
    projectOwner: githubData.repository.owner.login,
    projectName: githubData.repository.name,
    gitCommitHash: githubData.repository.defaultBranchRef.target.oid,
    lips: lips.sort((a, b) =>
      a?.attributes?.lip < b?.attributes?.lip ? 1 : -1
    ),
  };
}
