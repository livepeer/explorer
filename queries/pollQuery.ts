import { gql } from "@apollo/client";

export const pollQuery = gql`
  query poll($id: ID!) {
    poll(id: $id) {
      id
      proposal
      endBlock
      quorum
      quota
      status
      isActive
      totalVoteStake
      totalNonVoteStake
      estimatedTimeRemaining
      endTime
      tally {
        yes
        no
      }
      votes {
        id
      }
    }
  }
`;
