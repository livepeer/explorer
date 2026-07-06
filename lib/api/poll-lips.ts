import fm from "front-matter";
import { CHAIN_INFO, DEFAULT_CHAIN_ID } from "lib/chains";
import { fetchWithRetry } from "lib/fetchWithRetry";
import { IpfsPoll } from "utils/ipfs";

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
          text?: string;
        };
      }[];
    };
  };
};

const getLipNamespace = () =>
  process.env.NEXT_PUBLIC_GITHUB_LIP_NAMESPACE || "livepeer";

const UPSTREAM_TIMEOUT_MS = 8_000;
const IPFS_CONCURRENCY = 5;

type GraphQLResponse<T> = {
  data?: T;
  errors?: unknown[];
};

/** Posts a GraphQL query with the shared upstream timeout. */
async function fetchGraphQL<T>(
  uri: string,
  query: string,
  headers?: HeadersInit
): Promise<GraphQLResponse<T>> {
  const response = await fetchWithRetry(
    uri,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...headers,
      },
      body: JSON.stringify({ query }),
    },
    { timeoutMs: UPSTREAM_TIMEOUT_MS }
  );

  return response.json() as Promise<GraphQLResponse<T>>;
}

/** Runs async work over a list while capping concurrent upstream requests. */
async function mapWithConcurrency<T, R>(
  items: T[],
  concurrency: number,
  mapper: (item: T) => Promise<R>
): Promise<R[]> {
  const results: R[] = [];
  let nextIndex = 0;

  async function worker() {
    while (nextIndex < items.length) {
      const index = nextIndex;
      nextIndex += 1;
      results[index] = await mapper(items[index]);
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(concurrency, items.length) }, worker)
  );

  return results;
}

/** Reads a poll proposal JSON object from Livepeer's IPFS gateway. */
async function fetchIpfsPoll(ipfsHash: string | undefined | null) {
  if (!ipfsHash) return null;

  const response = await fetchWithRetry(
    `https://ipfs.livepeer.com/ipfs/${ipfsHash}`,
    { method: "GET" },
    { timeoutMs: UPSTREAM_TIMEOUT_MS }
  );

  return response.json() as Promise<IpfsPoll>;
}

/** Fetches proposed LIPs and excludes any that already have an on-chain poll. */
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

  const result = await fetchGraphQL<GitHubLipResponse>(
    "https://api.github.com/graphql",
    lipsQuery,
    {
      authorization: `Bearer ${process.env.GITHUB_ACCESS_TOKEN}`,
    }
  );
  if (result.errors?.length) {
    throw new Error(
      `GitHub GraphQL returned errors: ${JSON.stringify(result.errors)}`
    );
  }

  const githubData = result.data;
  if (!githubData?.repository?.content?.entries) {
    throw new Error(`No LIP data returned for ${getLipNamespace()}/LIPS`);
  }

  const { data: pollsData, errors: pollsErrors } = await fetchGraphQL<{
    polls: { proposal?: string | null }[];
  }>(CHAIN_INFO[DEFAULT_CHAIN_ID].subgraph, `{ polls { proposal } }`);
  if (pollsErrors?.length) {
    throw new Error(
      `Polls subgraph returned errors: ${JSON.stringify(pollsErrors)}`
    );
  }

  const createdPolls: string[] = [];
  if (pollsData) {
    await mapWithConcurrency(
      pollsData.polls,
      IPFS_CONCURRENCY,
      async (poll) => {
        const obj = await fetchIpfsPoll(poll?.proposal).catch((err) => {
          console.warn(
            `[poll-lips] Failed to read poll IPFS object ${poll?.proposal}`,
            err
          );
          return null;
        });

        if (obj?.text && obj?.gitCommitHash) {
          try {
            const transformedProposal = fm(obj.text) as TransformedProposal;
            createdPolls.push(String(transformedProposal.attributes.lip));
          } catch (err) {
            console.warn(
              `[poll-lips] Failed to parse poll IPFS object ${poll?.proposal}`,
              err
            );
          }
        }
      }
    );
  }

  const lips: PollLip[] = [];
  for (const lip of githubData.repository.content.entries) {
    if (typeof lip.content.text !== "string") continue;

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
    lips: lips.sort((a, b) => {
      const aLip = Number(a?.attributes?.lip ?? 0);
      const bLip = Number(b?.attributes?.lip ?? 0);
      return bLip - aLip;
    }),
  };
}
