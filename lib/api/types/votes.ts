import {
  CheckCircledIcon,
  CrossCircledIcon,
  MinusCircledIcon,
} from "@radix-ui/react-icons";
import { TreasuryVoteSupport } from "apollo";

export interface Vote {
  transactionHash: string;
  voter: string;
  choiceID: string;
  proposalId: string;
  weight: string;
  reason?: string;
  ensName?: string;
  endVote?: number;
  description?: string;
  proposalTitle?: string;
}

export const VOTING_SUPPORT = {
  "0": {
    text: "Against",
    icon: CrossCircledIcon,
    style: { color: "$tomato11", backgroundColor: "$tomato3", fontWeight: 600 },
  },
  "1": {
    text: "For",
    icon: CheckCircledIcon,
    style: { color: "$grass11", backgroundColor: "$grass3", fontWeight: 600 },
  },
  "2": {
    text: "Abstain",
    icon: MinusCircledIcon,
    style: {
      color: "$neutral11",
      backgroundColor: "$neutral3",
      fontWeight: 600,
    },
  },
} as const;

export const VOTING_SUPPORT_MAP = {
  [TreasuryVoteSupport.Against]: VOTING_SUPPORT["0"],
  [TreasuryVoteSupport.For]: VOTING_SUPPORT["1"],
  [TreasuryVoteSupport.Abstain]: VOTING_SUPPORT["2"],
} as const;

export type SupportKey = keyof typeof VOTING_SUPPORT;
