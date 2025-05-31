import { gql } from "@apollo/client";

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