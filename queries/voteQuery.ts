import { gql } from "@apollo/client";

export const voteQuery = gql`
  query vote($id: ID!) {
    vote(id: $id) {
      choiceID
      voteStake
      nonVoteStake
    }
  }
`;
