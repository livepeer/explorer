import TransactionBadge from "@components/TransactionBadge";
import { parseProposalText } from "@lib/api/treasury";
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
import { ChevronDownIcon, ChevronUpIcon } from "@radix-ui/react-icons";
import { TreasuryVoteEvent, TreasuryVoteSupport } from "apollo";
import React, { useState } from "react";

interface VoteDetailItemProps {
  vote: TreasuryVoteEvent;
  formatWeight: (weight: string) => string;
}

const Index: React.FC<VoteDetailItemProps> = ({ vote, formatWeight }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const support =
    VOTING_SUPPORT_MAP[vote.support] ||
    VOTING_SUPPORT_MAP[TreasuryVoteSupport.Abstain];
  const hasReason =
    vote.reason && vote.reason.toLowerCase() !== "no reason provided";

  const title = parseProposalText(vote.proposal).attributes.title;
  const reasonId = `reason-${vote.transaction.id}`;

  return (
    <Box
      css={{
        position: "relative",
      }}
    >
      {/* Mobile Card Layout */}
      <Card
        css={{
          display: "block",
          "@bp2": { display: "none" },
          padding: "$4",
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

          {/* Title link */}
          <Heading as="h4" css={{ fontSize: "$2" }}>
            <Link
              href={`/treasury/${vote.proposal.id}`}
              target="_blank"
              css={{
                color: "$hiContrast",
                textDecoration: "none",
                display: "inline-block",
                padding: "2px 8px",
                margin: "-2px -8px",
                borderRadius: "6px",
                transition: "all 0.2s ease",
                "&:hover": {
                  backgroundColor: "$neutral4",
                  textDecoration: "underline",
                  textUnderlineOffset: "4px",
                },
                "&:focus-visible": {
                  outline: "2px solid $primary11",
                  outlineOffset: "2px",
                },
              }}
            >
              {title}
            </Link>
          </Heading>

          {/* Weight */}
          <Text size="1" css={{ color: "$neutral11" }}>
            {formatWeight(vote.weight)}
          </Text>

          {/* Collapsible Reason */}
          {hasReason && (
            <Box>
              <Box
                as="button"
                onClick={() => setIsExpanded(!isExpanded)}
                aria-expanded={isExpanded}
                aria-controls={reasonId}
                css={{
                  display: "flex",
                  alignItems: "center",
                  gap: "$1",
                  color: "$primary11",
                  cursor: "pointer",
                  border: "none",
                  backgroundColor: "transparent",
                  padding: "$2",
                  margin: "-$2",
                  borderRadius: "$1",
                  minHeight: "44px",
                  fontSize: "$1",
                  fontWeight: 600,
                  transition: "background-color 0.2s ease",
                  "&:hover": {
                    backgroundColor: "$neutral3",
                  },
                  "&:focus-visible": {
                    outline: "2px solid $primary11",
                    outlineOffset: "2px",
                  },
                }}
              >
                <Box
                  as={isExpanded ? ChevronUpIcon : ChevronDownIcon}
                  css={{ width: 16, height: 16 }}
                />
                {isExpanded ? "Hide reason" : "Show reason"}
              </Box>
              {isExpanded && (
                <Box
                  id={reasonId}
                  css={{
                    marginTop: "$3",
                    padding: "$2",
                    backgroundColor: "$neutral3",
                    borderRadius: "$1",
                    fontSize: "$1",
                  }}
                >
                  <Text
                    css={{
                      color: "$neutral12",
                      fontStyle: "italic",
                    }}
                  >
                    &ldquo;{vote.reason}&rdquo;
                  </Text>
                </Box>
              )}
            </Box>
          )}

          {/* Footer: Transaction + Timestamp */}
          <Flex css={{ alignItems: "center", gap: "$2" }}>
            {vote.transaction.id ? (
              <TransactionBadge id={vote.transaction.id} />
            ) : (
              <Text css={{ color: "$neutral9" }} size="1">
                N/A
              </Text>
            )}
            <Text size="1" css={{ color: "$neutral9" }}>
              ·
            </Text>
            <Text size="1" css={{ color: "$neutral11" }}>
              {dayjs.unix(vote.transaction.timestamp).format("MMM D, h:mm a")}
            </Text>
          </Flex>
        </Flex>
      </Card>

      {/* Desktop Timeline Layout */}
      <Flex
        css={{
          display: "none",
          "@bp2": { display: "flex" },
          position: "relative",
          paddingLeft: "$6",
          alignItems: "center",
        }}
      >
        {/* Timeline Dot */}
        <Box
          css={{
            position: "absolute",
            left: 0,
            top: "50%",
            transform: "translateY(-50%)",
            width: 16,
            height: 16,
            borderRadius: "50%",
            backgroundColor: "$neutral3",
            border: `3px solid ${support.style.color}`,
            zIndex: 1,
          }}
        />

        <Box
          css={{
            backgroundColor: "$panel",
            padding: "$4",
            borderRadius: "$2",
            border: "1px solid $neutral5",
            width: "100%",
            transition: "border-color 0.2s ease",
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

            {/* Title link */}
            <Heading as="h2" css={{ fontSize: "$2", color: "$white" }}>
              <Link
                href={`/treasury/${vote.proposal.id}`}
                target="_blank"
                css={{
                  color: "$green11",
                  textDecoration: "none",
                  "&:hover": { textDecoration: "underline" },
                  "&:focus-visible": {
                    outline: "2px solid $green11",
                    outlineOffset: "2px",
                    borderRadius: "2px",
                  },
                }}
              >
                {title}
              </Link>
            </Heading>

            {/* Weight */}
            <Text size="1" css={{ color: "$neutral11" }}>
              {formatWeight(vote.weight)}
            </Text>

            {/* Collapsible Reason */}
            {hasReason && (
              <Box>
                <Box
                  as="button"
                  onClick={() => setIsExpanded(!isExpanded)}
                  aria-expanded={isExpanded}
                  aria-controls={reasonId}
                  css={{
                    display: "flex",
                    alignItems: "center",
                    gap: "$1",
                    color: "$primary11",
                    cursor: "pointer",
                    border: "none",
                    backgroundColor: "transparent",
                    padding: "$2",
                    margin: "-$2",
                    borderRadius: "$1",
                    minHeight: "44px",
                    fontSize: "$1",
                    fontWeight: 600,
                    transition: "background-color 0.2s ease",
                    "&:hover": {
                      backgroundColor: "$neutral3",
                    },
                    "&:focus-visible": {
                      outline: "2px solid $primary11",
                      outlineOffset: "2px",
                    },
                  }}
                >
                  <Box
                    as={isExpanded ? ChevronUpIcon : ChevronDownIcon}
                    css={{ width: 16, height: 16 }}
                  />
                  {isExpanded ? "Hide reason" : "Show reason"}
                </Box>
                {isExpanded && (
                  <Box
                    id={reasonId}
                    css={{
                      marginTop: "$3",
                      padding: "$2",
                      backgroundColor: "$neutral3",
                      borderRadius: "$1",
                      fontSize: "$1",
                    }}
                  >
                    <Text
                      css={{
                        color: "$neutral12",
                        fontStyle: "italic",
                      }}
                    >
                      &ldquo;{vote.reason}&rdquo;
                    </Text>
                  </Box>
                )}
              </Box>
            )}

            {/* Footer: Transaction + Timestamp */}
            <Flex css={{ alignItems: "center", gap: "$2" }}>
              {vote.transaction.id ? (
                <TransactionBadge id={vote.transaction.id} />
              ) : (
                <Text css={{ color: "$neutral9" }} size="1">
                  N/A
                </Text>
              )}
              <Text size="1" css={{ color: "$neutral9" }}>
                ·
              </Text>
              <Text size="1" css={{ color: "$neutral11" }}>
                {dayjs.unix(vote.transaction.timestamp).format("MMM D, h:mm a")}
              </Text>
            </Flex>
          </Flex>
        </Box>
      </Flex>
    </Box>
  );
};

export default Index;
