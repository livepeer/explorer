"use client";

import { Vote, VOTING_SUPPORT } from "@lib/api/types/votes";
import { formatAddress, formatLpt, formatTransactionHash } from "@lib/utils";
import { Badge, Box, Flex, Heading, Link, Text } from "@livepeer/design-system";
import { ArrowTopRightIcon } from "@modulz/radix-icons";
import React from "react";

interface VoteDetailItemProps {
  vote: Vote;
}

const Index: React.FC<VoteDetailItemProps> = ({ vote }) => {
  const support = VOTING_SUPPORT[vote.choiceID] || VOTING_SUPPORT["2"];
  const hasReason =
    vote.reason && vote.reason.toLowerCase() !== "no reason provided";

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
                  href={`https://explorer.livepeer.org/treasury/${vote.proposalId}`}
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
                  {vote.proposalTitle}
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
                ID: {formatAddress(vote.proposalId)}
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
                  color: support.style.color,
                  fontWeight: support.style.fontWeight,
                }}
              >
                {support.text.toUpperCase()}
              </Badge>

              <Text size="1" css={{ fontWeight: 600, color: "$white" }}>
                {formatLpt(vote.weight)}
              </Text>

              {vote.transactionHash && (
                <Link
                  href={`https://arbiscan.io/tx/${vote.transactionHash}#eventlog`}
                  target="_blank"
                  css={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "$1",
                    fontSize: "$1",
                    color: "$neutral11",
                    textDecoration: "none",
                    "&:hover": { color: "$primary11" },
                    "&:focus-visible": {
                      outline: "2px solid $primary11",
                      outlineOffset: "2px",
                      borderRadius: "2px",
                    },
                  }}
                >
                  {formatTransactionHash(vote.transactionHash)}
                  <Box as={ArrowTopRightIcon} css={{ width: 12, height: 12 }} />
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
