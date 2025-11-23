import {
  getProposalExtended,
  ParsedProposal,
  ProposalExtended,
} from "@lib/api/treasury";
import { CurrentRoundInfo } from "@lib/api/types/get-current-round";
import {
  Badge,
  Box,
  Card,
  Flex,
  Heading,
  Link as A,
} from "@livepeer/design-system";
import { ProtocolQuery } from "apollo";
import { sentenceCase } from "change-case";
import { useTreasuryProposalState } from "hooks";
import Link from "next/link";
import { useMemo } from "react";

export const BadgeVariantByState = {
  Pending: "lime",
  Active: "blue",
  Canceled: "gray",
  Defeated: "red",
  Succeeded: "green",
  Queued: "yellow",
  Expired: "orange",
  Executed: "green",
} as const;

type Props = {
  key: string;
  proposal: ParsedProposal;
  currentRound: CurrentRoundInfo;
  protocol: ProtocolQuery["protocol"];
};

const TreasuryProposalRow = ({
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
    <A
      as={Link}
      {...props}
      href={`/treasury/${proposal.id}`}
      passHref
      // disable clicking if there's no state (i.e. details page would just hang)
      {...(!state ? { onClick: (e) => e.preventDefault() } : {})}
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
          padding: "$4",
          marginBottom: "$3",
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
                  {proposal.votes.voteEndTime.format("MMM D, YYYY")}
                </Box>
              ) : (
                <Box>
                  Voting will end on ~
                  {proposal.votes.voteEndTime.format("MMM D, YYYY")}
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
  );
};

export default TreasuryProposalRow;
