import { VOTING_SUPPORT_MAP } from "@lib/api/types/votes";
import dayjs from "@lib/dayjs";
import {
  Badge,
  Box,
  Card,
  Flex,
  Heading,
  Link,
  Text,
} from "@livepeer/design-system";
import {
  ArrowTopRightIcon,
  CounterClockwiseClockIcon,
} from "@radix-ui/react-icons";
import { formatAddress, formatTransactionHash } from "@utils/web3";

import { PollVoteType } from ".";

interface MobileVoteViewProps {
  vote: PollVoteType;
  formatWeight: (stake: string) => string;
  onSelect: (voter: {
    address: string;
    voteStake: string;
    ensName?: string;
  }) => void;
}

/**
 * Renders a mobile-optimized vote card showing voter identity, support badge,
 * stake amount, transaction link, and timestamp with a history action button.
 */
export function MobileVoteView({
  vote,
  formatWeight,
  onSelect,
}: MobileVoteViewProps) {
  const support = VOTING_SUPPORT_MAP[vote.choiceID];
  const voterId = vote.ensName ? vote.ensName : formatAddress(vote.voter);

  return (
    <Card
      css={{
        padding: "$4",
        marginBottom: "$3",
        position: "relative",
        zIndex: 2,
        backgroundColor: "$panel",
        border: "1px solid $neutral5",
        "&:focus-within": {
          borderColor: "$neutral6",
        },
      }}
    >
      <Flex css={{ flexDirection: "column", gap: "$3" }}>
        {/* Hero: Vote badge */}
        <Badge
          size="2"
          css={{
            backgroundColor: support.style.backgroundColor,
            color: support.style.color,
            fontWeight: support.style.fontWeight,
            border: "none",
            display: "inline-flex",
            alignItems: "center",
            gap: "$1",
            alignSelf: "flex-start",
          }}
        >
          <Box as={support.icon} css={{ width: 14, height: 14 }} />
          {support.text}
        </Badge>

        {/* Voter name + History */}
        <Flex css={{ justifyContent: "space-between", alignItems: "center" }}>
          <Heading as="h4" css={{ fontSize: "$2" }}>
            <Link
              href={`https://explorer.livepeer.org/accounts/${vote.voter}/delegating`}
              target="_blank"
              rel="noopener noreferrer"
              css={{
                color: "$hiContrast",
                textDecoration: "none",
                display: "inline-block",
                padding: "2px 8px",
                margin: "-2px -8px",
                borderRadius: "6px",
                cursor: "pointer",
                "&:focus-visible": {
                  outline: "2px solid $primary11",
                  outlineOffset: "2px",
                },
              }}
            >
              {voterId}
            </Link>
          </Heading>
          <Box
            as="button"
            aria-label={`See ${vote.ensName || vote.voter}'s voting history`}
            css={{
              display: "flex",
              alignItems: "center",
              gap: "$1",
              color: "$neutral10",
              cursor: "pointer",
              border: "none",
              backgroundColor: "transparent",
              padding: "$2",
              minHeight: "44px",
              borderRadius: "$1",
              transition: "all 0.2s",
              "&:hover": {
                color: "$primary11",
                backgroundColor: "$neutral3",
              },
              "&:focus-visible": {
                outline: "2px solid $primary11",
                outlineOffset: "2px",
                color: "$primary11",
              },
            }}
            onClick={() =>
              onSelect({
                address: vote.voter,
                voteStake: vote.voteStake,
                ensName: vote.ensName,
              })
            }
          >
            <Text size="1" css={{ fontWeight: 600, color: "inherit" }}>
              History
            </Text>
            <Box
              as={CounterClockwiseClockIcon}
              css={{ width: 14, height: 14 }}
            />
          </Box>
        </Flex>

        <Text size="1" css={{ color: "$neutral11" }}>
          {formatWeight(vote.voteStake)}
        </Text>

        {/* Footer: Transaction + Timestamp */}
        <Flex css={{ alignItems: "center", gap: "$2" }}>
          {vote.transactionHash ? (
            <Link
              href={`https://arbiscan.io/tx/${vote.transactionHash}#eventlog`}
              target="_blank"
              rel="noopener noreferrer"
              css={{
                display: "inline-flex",
                textDecoration: "none !important",
                "&:hover > *": {
                  border: "1.5px solid $grass7 !important",
                  backgroundColor: "$grass3 !important",
                  color: "$grass11 !important",
                },
                "&:focus-visible > *": {
                  outline: "2px solid $primary11",
                  outlineOffset: "2px",
                },
              }}
            >
              <Badge
                css={{
                  cursor: "pointer",
                  backgroundColor: "$neutral3",
                  color: "$neutral11",
                  border: "1px solid $neutral4",
                  transition:
                    "background-color 0.2s ease, color 0.2s ease, border-color 0.2s ease",
                }}
                size="1"
              >
                {formatTransactionHash(vote.transactionHash)}
                <Box
                  css={{
                    marginLeft: "$1",
                    width: 14,
                    height: 14,
                  }}
                  as={ArrowTopRightIcon}
                />
              </Badge>
            </Link>
          ) : (
            <Text css={{ color: "$neutral9" }} size="1">
              N/A
            </Text>
          )}
          {vote.timestamp && (
            <>
              <Text size="1" css={{ color: "$neutral9" }}>
                ·
              </Text>
              <Text size="1" css={{ color: "$neutral11" }}>
                {dayjs.unix(vote.timestamp).format("MMM D, h:mm a")}
              </Text>
            </>
          )}
        </Flex>
      </Flex>
    </Card>
  );
}
