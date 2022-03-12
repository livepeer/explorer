const Query = `
type Account {
  id: ID!
  tokenBalance: String
  ethBalance: String
  allowance: String
  pollCreatorAllowance: String
}

type TransactionStatus {
  status: String
}

type Identity {
  id: ID!
  did: String
  name: String
  website: String
  twitter: String
  description: String
  image: String
}

type Query {
  account(id: ID!): Account
  getTxReceiptStatus(txHash: String): TransactionStatus
  txPrediction(gasPrice: String!): JSON
  transaction(txHash: String): JSON
  identity(id: ID!): Identity
  block: JSON
  l1Block: JSON
  chartData: JSON
  currentRoundInfo: JSON
}
`;

export default Query;
