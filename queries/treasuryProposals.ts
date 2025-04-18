import { gql } from "@apollo/client";

export const GET_PROPOSALS_VOTES = gql`
  query GetProposalsVotes {
    treasuryProposals(orderBy: voteStart, orderDirection: desc) {
      id
      description
      targets
      values
      voteStart
      voteEnd
      calldatas
      proposer {
        id
      }
    }
    votes(first: 1000, orderBy: voter, orderDirection: desc) {
      choiceID
      id
      voteStake
      voter
      poll {
        id
        proposal
      }
    }
  }
`;

export const GET_BLOCK_TIMESTAMPS = gql`
  query GetBlockTimestamps {
    rounds(first: 1000, orderBy: startTimestamp, orderDirection: desc) {
      startTimestamp
      id
    }
  }
`;

export const GET_PROTOCOL_STATS = gql`
  query GetProtocolStats {
    protocols {
      totalActiveStake
    }
  }
`;

export const ENS_QUERY = gql`
  query getENS($address: String!) {
  domains(where: { resolvedAddress: $address }
    orderBy: registration__registrationDate
    orderDirection: desc
  ) {
    name
    resolvedAddress {
      id
    }
    createdAt
  }
}
`;

export const GET_PROPOSALS_BY_IDS = gql`
  query getProposalsByIds($ids: [String!]!) {
  treasuryProposals(where: { id_in: $ids }) {
    id
    description
    voteStart
    voteEnd
  }
}
`;