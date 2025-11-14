import snapshot from "@snapshot-labs/snapshot.js";

// Livepeer Snapshot space ID - this should be configured via env variable
const SNAPSHOT_SPACE = process.env.NEXT_PUBLIC_SNAPSHOT_SPACE || "livepeer.eth";
const SNAPSHOT_HUB = "https://hub.snapshot.org";

export type SnapshotProposal = {
  id: string;
  title: string;
  body: string;
  choices: string[];
  start: number;
  end: number;
  snapshot: string;
  state: string;
  author: string;
  space: {
    id: string;
    name: string;
  };
  type: string;
  strategies: any[];
  scores: number[];
  scores_total: number;
  votes: number;
};

export type SnapshotVote = {
  id: string;
  voter: string;
  created: number;
  choice: number | number[];
  vp: number;
  proposal: {
    id: string;
  };
};

const client = new snapshot.Client712(SNAPSHOT_HUB);

/**
 * Fetch all proposals from the Livepeer Snapshot space
 */
export async function getSnapshotProposals(
  state: "all" | "active" | "pending" | "closed" = "all"
): Promise<SnapshotProposal[]> {
  try {
    const response = await fetch(SNAPSHOT_HUB + "/graphql", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query: `
          query Proposals($space: String!, $state: String!) {
            proposals(
              first: 20,
              skip: 0,
              where: {
                space_in: [$space],
                state: $state
              },
              orderBy: "created",
              orderDirection: desc
            ) {
              id
              title
              body
              choices
              start
              end
              snapshot
              state
              author
              space {
                id
                name
              }
              type
              strategies {
                name
                params
              }
              scores
              scores_total
              votes
            }
          }
        `,
        variables: {
          space: SNAPSHOT_SPACE,
          state: state,
        },
      }),
    });

    const data = await response.json();
    return data?.data?.proposals || [];
  } catch (error) {
    console.error("Error fetching snapshot proposals:", error);
    return [];
  }
}

/**
 * Fetch a single proposal by ID
 */
export async function getSnapshotProposal(
  proposalId: string
): Promise<SnapshotProposal | null> {
  try {
    const response = await fetch(SNAPSHOT_HUB + "/graphql", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query: `
          query Proposal($id: String!) {
            proposal(id: $id) {
              id
              title
              body
              choices
              start
              end
              snapshot
              state
              author
              space {
                id
                name
              }
              type
              strategies {
                name
                params
              }
              scores
              scores_total
              votes
            }
          }
        `,
        variables: {
          id: proposalId,
        },
      }),
    });

    const data = await response.json();
    return data?.data?.proposal || null;
  } catch (error) {
    console.error("Error fetching snapshot proposal:", error);
    return null;
  }
}

/**
 * Fetch votes for a specific proposal
 */
export async function getSnapshotProposalVotes(
  proposalId: string
): Promise<SnapshotVote[]> {
  try {
    const response = await fetch(SNAPSHOT_HUB + "/graphql", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query: `
          query Votes($proposalId: String!) {
            votes(
              first: 1000,
              where: {
                proposal: $proposalId
              }
            ) {
              id
              voter
              created
              choice
              vp
              proposal {
                id
              }
            }
          }
        `,
        variables: {
          proposalId: proposalId,
        },
      }),
    });

    const data = await response.json();
    return data?.data?.votes || [];
  } catch (error) {
    console.error("Error fetching snapshot votes:", error);
    return [];
  }
}

/**
 * Get voting power for a specific address at a specific snapshot
 */
export async function getVotingPower(
  address: string,
  proposalId: string,
  snapshot: string,
  strategies: any[]
): Promise<number> {
  try {
    const response = await fetch(SNAPSHOT_HUB + "/api/scores", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        params: {
          space: SNAPSHOT_SPACE,
          network: "1", // Mainnet
          snapshot: snapshot,
          strategies: strategies,
          addresses: [address],
        },
      }),
    });

    const data = await response.json();
    const scores = data?.result?.scores || [];
    
    // Sum up voting power from all strategies
    let totalVp = 0;
    scores.forEach((strategyScores: any) => {
      totalVp += strategyScores[address] || 0;
    });
    
    return totalVp;
  } catch (error) {
    console.error("Error fetching voting power:", error);
    return 0;
  }
}

/**
 * Cast a vote on a proposal
 */
export async function castSnapshotVote(
  web3Provider: any,
  address: string,
  proposalId: string,
  choice: number,
  reason?: string
): Promise<any> {
  try {
    const receipt = await client.vote(web3Provider, address, {
      space: SNAPSHOT_SPACE,
      proposal: proposalId,
      type: "single-choice",
      choice: choice,
      reason: reason || "",
      app: "livepeer-explorer",
    });

    return receipt;
  } catch (error) {
    console.error("Error casting snapshot vote:", error);
    throw error;
  }
}

/**
 * Check if an address has voted on a proposal
 */
export async function hasVoted(
  address: string,
  proposalId: string
): Promise<boolean> {
  try {
    const response = await fetch(SNAPSHOT_HUB + "/graphql", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query: `
          query Vote($proposalId: String!, $voter: String!) {
            votes(
              where: {
                proposal: $proposalId,
                voter: $voter
              }
            ) {
              id
            }
          }
        `,
        variables: {
          proposalId: proposalId,
          voter: address.toLowerCase(),
        },
      }),
    });

    const data = await response.json();
    return (data?.data?.votes || []).length > 0;
  } catch (error) {
    console.error("Error checking if voted:", error);
    return false;
  }
}
