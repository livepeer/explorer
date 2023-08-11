import { Badge, Box, Card, Flex, Heading, Link as A } from "@livepeer/design-system";
import dayjs from "dayjs";
import Link from "next/link";
import { useMemo } from "react";
import { ProtocolQuery } from "apollo";
import { useTreasuryProposalState } from "hooks";
import { sentenceCase } from "change-case";
import { CurrentRoundInfo } from "@lib/api/types/get-current-round";
import {
  ParsedProposal,
  ProposalExtended,
  getProposalExtended,
} from "@lib/api/treasury";

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
  proposal: ParsedProposal;
  currentRound: CurrentRoundInfo;
  protocol: ProtocolQuery["protocol"];
};

const TreasuryProposalRow = ({
  key,
  proposal: parsedProposal,
  currentRound,
  protocol,
  ...props
}: Props) => {
  const { data: state, error: stateFetchErr } = useTreasuryProposalState(
    parsedProposal.id
  );
  const isLoadingState = !state && !stateFetchErr;

  const proposal = useMemo<ParsedProposal | ProposalExtended>(() => {
    return !state
      ? parsedProposal
      : getProposalExtended(parsedProposal, state, currentRound, protocol);
  }, [currentRound, protocol, parsedProposal, state]);

  return (
    <Link
      {...props}
      href="/treasury/[proposal]"
      as={`/treasury/${proposal.id}`}
      passHref
      // disable clicking if there's no state (i.e. details page would just hang)
      {...(!state ? { onClick: (e) => e.preventDefault() } : {})}
    >
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
                {proposal.attributes.title}
                {!proposal.attributes.lip
                  ? ""
                  : ` (LIP ${proposal.attributes.lip})`}
              </Heading>
              <Box css={{ fontSize: "$1", color: "$neutral10" }}>
                {!state || !("votes" in proposal) ? (
                  <Box>Loading...</Box>
                ) : !["Pending", "Active"].includes(state?.state) ? (
                  <Box>
                    Voting ended on{" "}
                    {dayjs
                      .unix(proposal.votes.estimatedEndTime)
                      .format("MMM D, YYYY")}
                  </Box>
                ) : (
                  <Box>
                    Voting ongoing until ~
                    {dayjs
                      .unix(proposal.votes.estimatedEndTime)
                      .format("MMM D, YYYY")}
                  </Box>
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
              {sentenceCase(
                isLoadingState ? "Loading" : state?.state ?? "Unknown"
              )}
            </Badge>
          </Flex>
        </Card>
      </A>
    </Link>
  );
};

export default TreasuryProposalRow;
