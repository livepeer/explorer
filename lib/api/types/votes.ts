import { TreasuryVoteSupport } from "apollo";

export const VOTING_SUPPORT = {
  "0": { text: "Against", style: { color: "$tomato11", fontWeight: 600 } },
  "1": { text: "For", style: { color: "$sky11", fontWeight: 600 } },
  "2": { text: "Abstain", style: { color: "$neutral11", fontWeight: 600 } },
} as const;

export const VOTING_SUPPORT_MAP = {
  [TreasuryVoteSupport.Against]: VOTING_SUPPORT["0"],
  [TreasuryVoteSupport.For]: VOTING_SUPPORT["1"],
  [TreasuryVoteSupport.Abstain]: VOTING_SUPPORT["2"],
} as const;

export type SupportKey = keyof typeof VOTING_SUPPORT;
