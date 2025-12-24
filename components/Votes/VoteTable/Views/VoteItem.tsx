import { formatTransactionHash } from "@lib/utils";
import {
  Badge,
  Box,
  Card,
  Flex,
  Heading,
  Link,
  Text,
  Tooltip,
} from "@livepeer/design-system";
import {
  ArrowTopRightIcon,
  CounterClockwiseClockIcon,
} from "@radix-ui/react-icons";

import { Vote, VOTING_SUPPORT } from "../../../../lib/api/types/votes";

interface VoteViewProps {
  vote: Vote;
  onSelect: (voter: string) => void;
  formatWeight: (weight: string) => string;
  isMobile?: boolean;
}

export function VoteView({
  vote,
  onSelect,
  formatWeight,
  isMobile,
}: VoteViewProps) {
  return isMobile ? (
    <MobileVoteView
      vote={vote}
      onSelect={onSelect}
      formatWeight={formatWeight}
    />
  ) : (
    <DesktopVoteView
      vote={vote}
      onSelect={onSelect}
      formatWeight={formatWeight}
    />
  );
}

function MobileVoteView({ vote, onSelect, formatWeight }: VoteViewProps) {
  const support = VOTING_SUPPORT[vote.choiceID] || VOTING_SUPPORT["2"];
  return (
    <Card
      css={{
        padding: "$4",
        marginBottom: "$3",
        position: "relative",
        zIndex: 2,
        backgroundColor: "$neutral3",
      }}
    >
      <Heading
        as="h4"
        css={{ fontSize: "$2", marginBottom: "$2", color: "$primary11" }}
      >
        <Link
          href={`https://explorer.livepeer.org/accounts/${vote.voter}/delegating`}
          target="_blank"
          css={{
            color: "$primary11",
            textDecoration: "none",
            "&:hover": { textDecoration: "underline" },
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {vote.ensName}
        </Link>
      </Heading>
      <Text css={{ display: "flex", alignItems: "left", marginBottom: "$1" }}>
        <Text
          as="span"
          size="1"
          css={{ fontWeight: 600, marginRight: "$2", color: "$neutral11" }}
        >
          Support:
        </Text>
        <Text as="span" size="1" css={support.style}>
          {support.text}
        </Text>
      </Text>
      <Text css={{ marginBottom: "$1", color: "$hiContrast" }}>
        <Text as="span" size="1" css={{ fontWeight: 600, color: "$neutral11" }}>
          Weight:
        </Text>{" "}
        <Text as="span" size="1" css={{ color: "$hiContrast" }}>
          {formatWeight(vote.weight)}
        </Text>
      </Text>
      <Text css={{ marginBottom: "$3", color: "$neutral11" }}>
        <Text as="span" size="1" css={{ fontWeight: 600 }}>
          Reason:
        </Text>{" "}
        <Text as="span" size="1">
          {vote.reason}
        </Text>
      </Text>
      <Flex css={{ justifyContent: "space-between", alignItems: "center" }}>
        <Box>
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
        <Flex
          css={{
            alignItems: "center",
            gap: "$1",
            color: "$neutral8",
            cursor: "pointer",
            "&:hover": { color: "$primary12" },
          }}
          onClick={() => onSelect(vote.voter)}
        >
          <Text size="1" css={{ fontWeight: 600, color: "inherit" }}>
            History
          </Text>
          <Box as={CounterClockwiseClockIcon} css={{ width: 16, height: 16 }} />
        </Flex>
      </Flex>
    </Card>
  );
}

function DesktopVoteView({ vote, onSelect, formatWeight }: VoteViewProps) {
  const support = VOTING_SUPPORT[vote.choiceID] || VOTING_SUPPORT["2"];
  return (
    <Box
      key={vote.transactionHash || vote.voter}
      as="tr"
      css={{
        backgroundColor: "$neutral3",
        position: "relative",
        zIndex: 2,
        "& > td": { padding: "$2 $3" },
      }}
    >
      <Box
        as="td"
        css={{
          textAlign: "left",
          color: "$primary11",
          borderBottom: "1px solid $neutral5",
        }}
      >
        <Link
          href={`https://explorer.livepeer.org/accounts/${vote.voter}/delegating`}
          target="_blank"
          css={{
            color: "$primary11",
            textDecoration: "none",
            "&:hover": { textDecoration: "underline" },
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <Text
            css={{
              fontWeight: 600,
              color: "$primary11",
              whiteSpace: "nowrap",
            }}
            size="2"
          >
            {vote.ensName}
          </Text>
        </Link>
      </Box>
      <Box
        as="td"
        css={{
          textAlign: "left",
          borderBottom: "1px solid $neutral5",
        }}
      >
        <Text
          css={{
            fontWeight: 600,
            whiteSpace: "nowrap",
            ...support.style,
          }}
          size="2"
        >
          {support.text}
        </Text>
      </Box>
      <Box
        as="td"
        css={{
          textAlign: "left",
          color: "$hiContrast",
          borderBottom: "1px solid $neutral5",
        }}
      >
        <Text
          css={{
            fontWeight: 600,
            color: "$hiContrast",
            whiteSpace: "nowrap",
          }}
          size="2"
        >
          {formatWeight(vote.weight)}
        </Text>
      </Box>
      <Box
        as="td"
        css={{
          textAlign: "left",
          color: "$neutral11",
          borderBottom: "1px solid $neutral5",
        }}
      >
        <Text
          size="1"
          css={{
            color:
              vote.reason && vote.reason.toLowerCase() === "no reason provided"
                ? "$neutral9"
                : "$hiContrast",
          }}
        >
          {vote.reason}
        </Text>
      </Box>
      <Box
        as="td"
        css={{
          textAlign: "left",
          borderBottom: "1px solid $neutral5",
          position: "relative",
          zIndex: 5,
        }}
      >
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
                css={{ marginLeft: "$1", width: 14, height: 14 }}
                as={ArrowTopRightIcon}
              />
            </Badge>
          </Link>
        ) : (
          <Text css={{ color: "$neutral9" }}>N/A</Text>
        )}
      </Box>
      <Box
        as="td"
        css={{
          textAlign: "right",
          borderBottom: "1px solid $neutral5",
          color: "$primary11",
        }}
      >
        <Tooltip content="See their voting history">
          <Box
            as="button"
            onClick={(e) => {
              e.stopPropagation();
              onSelect(vote.voter);
            }}
            css={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: 32,
              height: 32,
              borderRadius: "50%",
              cursor: "pointer",
              border: "none",
              backgroundColor: "transparent",
              color: "$neutral10",
              "&:hover": {
                color: "$primary11",
                backgroundColor: "$primary3",
                transform: "rotate(-15deg)",
              },
              transition: "color .2s, background-color .2s, transform .2s",
            }}
          >
            <Box
              as={CounterClockwiseClockIcon}
              css={{ width: 16, height: 16 }}
            />
          </Box>
        </Tooltip>
      </Box>
    </Box>
  );
}
