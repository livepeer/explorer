import {
  CheckCircledIcon,
  CrossCircledIcon,
  MinusCircledIcon,
} from "@radix-ui/react-icons";
import { TreasuryVoteSupport } from "apollo";

// Standardized Poll Votes ("0" is yes/for)
export const POLL_VOTES = {
  "0": {
    text: "For",
    icon: CheckCircledIcon,
    style: { color: "$grass11", backgroundColor: "$grass3", fontWeight: 600 },
  },
  "1": {
    text: "Against",
    icon: CrossCircledIcon,
    style: { color: "$tomato11", backgroundColor: "$tomato3", fontWeight: 600 },
  },
  Yes: {
    text: "For",
    icon: CheckCircledIcon,
    style: { color: "$grass11", backgroundColor: "$grass3", fontWeight: 600 },
  },
  No: {
    text: "Against",
    icon: CrossCircledIcon,
    style: { color: "$tomato11", backgroundColor: "$tomato3", fontWeight: 600 },
  },
} as const;

// Standardized Treasury Votes ("for" | "against" | "abstain")
export const TREASURY_VOTES = {
  for: {
    text: "For",
    icon: CheckCircledIcon,
    style: { color: "$grass11", backgroundColor: "$grass3", fontWeight: 600 },
  },
  against: {
    text: "Against",
    icon: CrossCircledIcon,
    style: { color: "$tomato11", backgroundColor: "$tomato3", fontWeight: 600 },
  },
  abstain: {
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
  [TreasuryVoteSupport.Against]: TREASURY_VOTES.against,
  [TreasuryVoteSupport.For]: TREASURY_VOTES.for,
  [TreasuryVoteSupport.Abstain]: TREASURY_VOTES.abstain,
} as const;

// Legacy support (to be replaced by POLL_VOTES or TREASURY_VOTES)
export const VOTING_SUPPORT = {
  ...POLL_VOTES,
  "2": TREASURY_VOTES.abstain,
} as const;

export type SupportKey = keyof typeof VOTING_SUPPORT;
export type PollVoteKey = keyof typeof POLL_VOTES;
export type TreasuryVoteKey = keyof typeof TREASURY_VOTES;
