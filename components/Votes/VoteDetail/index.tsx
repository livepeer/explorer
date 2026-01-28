import TransactionBadge from "@components/TransactionBadge";
import { parseProposalText } from "@lib/api/treasury";
import { VOTING_SUPPORT_MAP } from "@lib/api/types/votes";
import { formatAddress } from "@lib/utils";
import {
  Badge,
  Box,
  Card,
  Flex,
  Heading,
  Link,
  Text,
} from "@livepeer/design-system";
import { TreasuryVoteEvent, TreasuryVoteSupport } from "apollo";
import React from "react";

interface VoteDetailItemProps {
  vote: TreasuryVoteEvent;
  formatWeight: (weight: string) => string;
}

const Index: React.FC<VoteDetailItemProps> = ({ vote, formatWeight }) => {
  const support =
    VOTING_SUPPORT_MAP[vote.support] ||
    VOTING_SUPPORT_MAP[TreasuryVoteSupport.Abstain];
  const hasReason =
    vote.reason && vote.reason.toLowerCase() !== "no reason provided";

  const title = parseProposalText(vote.proposal).attributes.title;

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
          backgroundColor: "$neutral3",
          borderLeft: `4px solid ${support.style.color}`,
          transition: "all 0.2s ease",
          "&:hover, &:focus-within": {
            backgroundColor: "$neutral4",
          },
        }}
      >
        <Flex
          css={{ justifyContent: "space-between", alignItems: "flex-start" }}
        >
          <Box>
            <Heading as="h4" css={{ fontSize: "$2", marginBottom: "$1" }}>
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
            <Text
              size="1"
              css={{
                color: "$neutral11",
                marginBottom: "$2",
                display: "block",
              }}
            >
              ID: {formatAddress(vote.proposal.id)}
            </Text>
            <Text
              size="1"
              css={{
                color: "$neutral11",
                marginBottom: "$3",
                display: "block",
              }}
            >
              {formatWeight(vote.weight)}
            </Text>
          </Box>
          <Badge
            size="1"
            css={{
              backgroundColor: support.style.backgroundColor,
              color: support.style.color,
              fontWeight: support.style.fontWeight,
              border: "none",
            }}
          >
            {support.text}
          </Badge>
        </Flex>

        {hasReason && (
          <Box
            css={{
              marginBottom: "$3",
              padding: "$2",
              backgroundColor: "$neutral2",
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

        <Flex css={{ justifyContent: "space-between", alignItems: "center" }}>
          <Box>
            {vote.transaction.id ? (
              <TransactionBadge id={vote.transaction.id} />
            ) : (
              <Text css={{ color: "$neutral9" }} size="1">
                N/A
              </Text>
            )}
          </Box>
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
            backgroundColor: "$neutral4",
            padding: "$4",
            borderRadius: "$2",
            border: "1px solid $neutral5",
            width: "100%",
            transition: "background-color 0.2s ease",
            "&:hover, &:focus-within": {
              backgroundColor: "$neutral5",
            },
          }}
        >
          <Flex
            css={{
              justifyContent: "space-between",
              alignItems: "flex-start",
              gap: "$4",
              flexDirection: "row",
            }}
          >
            <Box css={{ flex: 1 }}>
              <Heading
                as="h2"
                css={{ fontSize: "$2", marginBottom: "$1", color: "$white" }}
              >
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
              <Text
                size="1"
                css={{
                  color: "$neutral11",
                  display: "block",
                  marginBottom: "$2",
                }}
              >
                ID: {formatAddress(vote.proposal.id)}
              </Text>

              {hasReason && (
                <Box
                  css={{
                    marginTop: "$2",
                    padding: "$2 $3",
                    backgroundColor: "$neutral3",
                    borderRadius: "$1",
                    borderLeft: `2px solid ${support.style.color}`,
                  }}
                >
                  <Text
                    size="1"
                    css={{ color: "$neutral12", fontStyle: "italic" }}
                  >
                    &ldquo;{vote.reason}&rdquo;
                  </Text>
                </Box>
              )}
            </Box>

            <Flex
              css={{
                flexDirection: "column",
                gap: "$2",
                minWidth: "140px",
                alignItems: "flex-end",
              }}
            >
              <Badge
                size="1"
                css={{
                  backgroundColor: support.style.backgroundColor,
                  color: support.style.color,
                  fontWeight: support.style.fontWeight,
                  border: "none",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "$1",
                }}
              >
                <Box as={support.icon} css={{ width: 12, height: 12 }} />
                {support.text}
              </Badge>

              <Text size="1" css={{ fontWeight: 600, color: "$white" }}>
                {formatWeight(vote.weight)}
              </Text>

              {vote.transaction.id && (
                <TransactionBadge id={vote.transaction.id} />
              )}
            </Flex>
          </Flex>
        </Box>
      </Flex>
    </Box>
  );
};

export default Index;
