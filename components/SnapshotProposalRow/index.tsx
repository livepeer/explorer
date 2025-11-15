import { Badge, Box, Card, Flex, Heading, Link as A } from "@livepeer/design-system";
import Link from "next/link";
import { SnapshotProposal } from "@lib/api/snapshot";
import { sentenceCase } from "change-case";
import dayjs from "@lib/dayjs";

export const BadgeVariantByState = {
  active: "blue",
  pending: "lime",
  closed: "gray",
} as const;

type Props = {
  key: string;
  proposal: SnapshotProposal;
};

const SnapshotProposalRow = ({ key, proposal, ...props }: Props) => {
  const startDate = dayjs.unix(proposal.start);
  const endDate = dayjs.unix(proposal.end);
  const now = dayjs();

  const isActive = now.isAfter(startDate) && now.isBefore(endDate);
  const isPending = now.isBefore(startDate);

  return (
    <A
      as={Link}
      {...props}
      href={`/snapshots/${proposal.id}`}
      passHref
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
              {proposal.title}
            </Heading>
            <Box css={{ fontSize: "$1", color: "$neutral10" }}>
              {proposal.state === "closed" ? (
                <Box>Voting ended on {endDate.format("MMM D, YYYY")}</Box>
              ) : isActive ? (
                <Box>Voting will end on ~{endDate.format("MMM D, YYYY")}</Box>
              ) : isPending ? (
                <Box>Voting starts on {startDate.format("MMM D, YYYY")}</Box>
              ) : (
                <Box>Voting ended on {endDate.format("MMM D, YYYY")}</Box>
              )}
            </Box>
          </Box>
          <Badge
            size="2"
            variant={BadgeVariantByState[proposal.state] || "neutral"}
            css={{
              textTransform: "capitalize",
              fontWeight: 700,
            }}
          >
            {sentenceCase(proposal.state)}
          </Badge>
        </Flex>
      </Card>
    </A>
  );
};

export default SnapshotProposalRow;
