import { parseProposalText } from "@lib/api/treasury";
import { VOTING_SUPPORT_MAP } from "@lib/api/types/votes";
import { formatAddress, formatTransactionHash } from "@lib/utils";
import { Badge, Box, Flex, Heading, Link, Text } from "@livepeer/design-system";
import { ArrowTopRightIcon } from "@modulz/radix-icons";
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
        paddingBottom: "$6",
        "&:last-child": { paddingBottom: 0 },
      }}
    >
      <Flex
        css={{
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
            width: "100%",
            transition: "all 0.2s ease",
            "&:hover, &:focus-within": {
              backgroundColor: "$neutral5",
              transform: "translateX(4px)",
            },
          }}
        >
          <Flex
            css={{
              justifyContent: "space-between",
              alignItems: "flex-start",
              gap: "$4",
              flexDirection: "column",
              "@bp2": { flexDirection: "row" },
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
                alignItems: "flex-start",
                "@bp2": { alignItems: "flex-end" },
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
                <Link
                  href={`https://arbiscan.io/tx/${vote.transaction.id}#eventlog`}
                  target="_blank"
                  css={{
                    display: "inline-flex",
                    alignItems: "center",
                    textDecoration: "none !important",
                    "&:hover > *": {
                      border: "1.5px solid $grass7 !important",
                      backgroundColor: "$grass3 !important",
                      color: "$grass11 !important",
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
                    {formatTransactionHash(vote.transaction.id)}
                    <Box
                      as={ArrowTopRightIcon}
                      css={{ marginLeft: "$1", width: 12, height: 12 }}
                    />
                  </Badge>
                </Link>
              )}
            </Flex>
          </Flex>
        </Box>
      </Flex>
    </Box>
  );
};

export default Index;
