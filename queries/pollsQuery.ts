import { gql } from "@apollo/client";

export const pollsQuery = gql`
  {
    polls {
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
