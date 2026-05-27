import TransactionBadge from "@components/TransactionBadge";
import { parsePollText } from "@lib/api/polls";
import { POLL_VOTES } from "@lib/api/types/votes";
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
import { VoteEvent } from "apollo";
import React, { useEffect, useState } from "react";

interface PollVoteDetailProps {
  vote: VoteEvent;
}

const Index: React.FC<PollVoteDetailProps> = ({ vote }) => {
  const [title, setTitle] = useState<string>("");
  const support = POLL_VOTES[vote.choiceID];

  useEffect(() => {
    async function getTitle() {
      const pollText = await parsePollText(vote.poll.proposal);

      if (pollText?.title) {
        setTitle(pollText.title);
      }
    }

    getTitle();
  }, [vote.poll.proposal]);

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
              href={`/voting/${vote.poll.id}`}
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
                href={`/voting/${vote.poll.id}`}
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
