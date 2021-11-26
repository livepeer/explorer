import { gql } from "@apollo/client";

export const transactionsQuery = gql`
  {
    txs @client {
      __typename
      confirmed
      txHash
      from
      inputData
    }
  }
`;
