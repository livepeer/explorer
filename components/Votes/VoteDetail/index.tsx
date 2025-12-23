"use client";

import { Vote, VOTING_SUPPORT } from "@lib/api/types/votes";
import { formatAddress, formatLpt, formatTransactionHash } from "@lib/utils";
import { Badge, Box, Heading, Link, Text } from "@livepeer/design-system";
import { ArrowTopRightIcon } from "@modulz/radix-icons";
import React from "react";

interface VoteDetailItemProps {
  vote: Vote;
}

const Index: React.FC<VoteDetailItemProps> = ({ vote }) => {
  const support = VOTING_SUPPORT[vote.choiceID] || VOTING_SUPPORT["2"];
  return (
    <Box
      css={{
        backgroundColor: "$neutral4",
        padding: "$4",
        borderRadius: "$2",
        marginTop: "$2",
      }}
    >
      <Heading as="h2" css={{ fontSize: "$3", mb: "$2", color: "$white" }}>
        <Link
          href={`https://explorer.livepeer.org/treasury/${vote.proposalId}`}
          target="_blank"
          css={{
            color: "$green11",
            textDecoration: "none",
            "&:hover": { textDecoration: "underline" },
          }}
        >
          {vote.proposalTitle}
        </Link>
      </Heading>

      <Text css={{ marginBottom: "$1" }}>
        <Text as="span" css={{ color: "$white", fontWeight: 600 }}>
          Proposal ID:
        </Text>{" "}
        <Text as="span" css={{ color: "$neutral11" }}>
          {formatAddress(vote.proposalId)}
        </Text>
      </Text>

      <Text
        css={{
          marginBottom: "$1",
          display: "inline-flex",
          alignItems: "center",
        }}
      >
        <Text
          as="span"
          css={{ color: "$white", fontWeight: 600, marginRight: "$1" }}
        >
          Support:
        </Text>
        <Text as="span" css={{ color: "$neutral11", ...support.style }}>
          {support.text}
        </Text>
      </Text>

      <Text css={{ marginBottom: "$1" }}>
        <Text as="span" css={{ color: "$white", fontWeight: 600 }}>
          Weight:
        </Text>{" "}
        <Text as="span" css={{ color: "$neutral11" }}>
          {formatLpt(vote.weight)}
        </Text>
      </Text>

      <Text css={{ marginBottom: "$1" }}>
        <Text as="span" css={{ color: "$white", fontWeight: 600 }}>
          Reason:
        </Text>{" "}
        <Text as="span" css={{ color: "$neutral11" }}>
          {vote.reason || "No reason provided"}
        </Text>
      </Text>

      <Box css={{ textAlign: "start", marginTop: "$2" }}>
        {vote.transactionHash ? (
          <Link
            href={`https://arbiscan.io/tx/${vote.transactionHash}#eventlog`}
            target="_blank"
            onClickCapture={(e) => e.stopPropagation()}
            css={{
              display: "inline-block",
              transition: "transform 0.2s ease",
              "&:hover": { transform: "scale(1.1)" },
            }}
          >
            <Badge css={{ cursor: "pointer" }} variant="primary" size="1">
              {formatTransactionHash(vote.transactionHash)}
              <Box
                css={{ marginLeft: "$1", width: 15, height: 15 }}
                as={ArrowTopRightIcon}
              />
            </Badge>
          </Link>
        ) : (
          <Text css={{ color: "$neutral9" }}>N/A</Text>
        )}
      </Box>
    </Box>
  );
};

export default Index;
