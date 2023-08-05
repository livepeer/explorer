import { Badge, Box, Card, Flex, Heading, Link as A } from "@livepeer/design-system";
import dayjs from "dayjs";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ProtocolQuery } from "apollo";
import { useTreasuryProposalStateData } from "hooks";
import { sentenceCase } from "change-case";
import { Proposal } from "@lib/api/types/get-treasury-proposal";
import { CurrentRoundInfo } from "@lib/api/types/get-current-round";
import { ProposalVoteCounts, getProposalTextAttributes, getProposalVoteCounts } from "@lib/api/treasury";

export const BadgeVariantByState = {
  Pending: "blue",
  Active: "blue",
  Canceled: "red",
  Defeated: "red",
  Succeeded: "primary",
  Queued: "neutral",
  Expired: "red",
  Executed: "primary",
} as const;

type Props = {
  key: string;
  proposal: Proposal;
  currentRound: CurrentRoundInfo;
  protocol: ProtocolQuery["protocol"];
};

const TreasuryProposalRow = ({ key, proposal, currentRound, protocol, ...props }: Props) => {
  const state = useTreasuryProposalStateData(proposal.id);

  const attributes = useMemo(() => getProposalTextAttributes(proposal), [proposal]);

  const voteCounts = useMemo(() => {
    if (!state) return null;
    return getProposalVoteCounts(proposal, state, currentRound, protocol);
  }, [currentRound, protocol, proposal, state]);

  return (
    <Link {...props} href="/treasury/[proposal]" as={`/treasury/${proposal.id}`} passHref>
      <A
        css={{
          cursor: "pointer",
          display: "block",
          textDecoration: "none",
          "&:hover": { textDecoration: "none" },
        }}
      >
        <Card
          variant="interactive"
          css={{
            p: "$4",
            mb: "$3",
            border: "1px solid $neutral4",
          }}
        >
          <Flex
            css={{
              flexDirection: "column-reverse",
              justifyContent: "space-between",
              alignItems: "flex-start",
              "@bp2": {
                flexDirection: "row",
                alignItems: "center",
              },
            }}
          >
            <Box>
              <Heading size="1" css={{ mb: "$1" }}>
                {attributes.title}
                {!attributes.lip ? "" : ` (LIP ${attributes.lip})`}
              </Heading>
              <Box css={{ fontSize: "$1", color: "$neutral10" }}>
                {!state || !voteCounts ? (
                  <Box>Loading...</Box>
                ) : !["Pending", "Active"].includes(state?.state) ? (
                  <Box>Voting ended on {dayjs.unix(voteCounts.estimatedEndTime).format("MMM D, YYYY")}</Box>
                ) : (
                  <Box>Voting ongoing until ~${dayjs.unix(voteCounts.estimatedEndTime).format("MMM D, YYYY")}</Box>
                )}
              </Box>
            </Box>
            <Badge
              size="2"
              variant={BadgeVariantByState[state?.state ?? ""] || "neutral"}
              css={{
                textTransform: "capitalize",
                fontWeight: 700,
              }}
            >
              {sentenceCase(state?.state ?? "Unknown")}
            </Badge>
          </Flex>
        </Card>
      </A>
    </Link>
  );
};

export default TreasuryProposalRow;
