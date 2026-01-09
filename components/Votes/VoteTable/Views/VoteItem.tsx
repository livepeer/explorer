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
import { TreasuryVoteSupport } from "apollo/subgraph";

import { VOTING_SUPPORT_MAP } from "../../../../lib/api/types/votes";
import { Vote } from "./DesktopVoteTable";

interface VoteViewProps {
  vote: Vote;
  onSelect: (voter: { address: string; ensName?: string }) => void;
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
  const support =
    VOTING_SUPPORT_MAP[vote.support] ||
    VOTING_SUPPORT_MAP[TreasuryVoteSupport.Abstain];
  const hasReason =
    vote.reason && vote.reason.toLowerCase() !== "no reason provided";

  return (
    <Card
      css={{
        padding: "$4",
        marginBottom: "$3",
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
      <Flex css={{ justifyContent: "space-between", alignItems: "flex-start" }}>
        <Box>
          <Heading
            as="h4"
            css={{ fontSize: "$2", marginBottom: "$1", color: "$primary11" }}
          >
            <Link
              href={`https://explorer.livepeer.org/accounts/${vote.voter}/delegating`}
              target="_blank"
              css={{
                color: "$primary11",
                textDecoration: "none",
                "&:hover": { textDecoration: "underline" },
                "&:focus-visible": {
                  outline: "2px solid $primary11",
                  outlineOffset: "2px",
                  borderRadius: "2px",
                },
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {vote.ensName}
            </Link>
          </Heading>
          <Text
            size="1"
            css={{ color: "$neutral11", marginBottom: "$3", display: "block" }}
          >
            {formatWeight(vote.weight)}
          </Text>
        </Box>
        <Badge
          size="1"
          css={{
            color: support.style.color,
            fontWeight: support.style.fontWeight,
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
          <Text css={{ color: "$neutral12", fontStyle: "italic" }}>
            &ldquo;{vote.reason}&rdquo;
          </Text>
        </Box>
      )}

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
                "&:focus-visible": {
                  outline: "2px solid $primary11",
                  outlineOffset: "2px",
                  borderRadius: "2px",
                },
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
            <Text css={{ color: "$neutral9" }} size="1">
              N/A
            </Text>
          )}
        </Box>
        <Box
          as="button"
          css={{
            display: "flex",
            alignItems: "center",
            gap: "$1",
            color: "$neutral10",
            cursor: "pointer",
            border: "none",
            backgroundColor: "transparent",
            "&:hover": { color: "$primary11" },
            "&:focus-visible": {
              outline: "2px solid $primary11",
              outlineOffset: "2px",
              borderRadius: "4px",
              color: "$primary11",
            },
            padding: "$1",
            transition: "all 0.2s",
          }}
          onClick={(e) => {
            e.stopPropagation();
            onSelect({ address: vote.voter.id, ensName: vote.ensName });
          }}
        >
          <Text size="1" css={{ fontWeight: 600, color: "inherit" }}>
            History
          </Text>
          <Box as={CounterClockwiseClockIcon} css={{ width: 14, height: 14 }} />
        </Box>
      </Flex>
    </Card>
  );
}

function DesktopVoteView({ vote, onSelect, formatWeight }: VoteViewProps) {
  const support =
    VOTING_SUPPORT_MAP[vote.support] ||
    VOTING_SUPPORT_MAP[TreasuryVoteSupport.Abstain];
  return (
    <Box
      key={vote.transactionHash || vote.voter.id}
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
            "&:focus-visible": {
              outline: "2px solid $primary11",
              outlineOffset: "2px",
              borderRadius: "2px",
            },
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
              "&:focus-visible": {
                outline: "2px solid $primary11",
                outlineOffset: "2px",
                borderRadius: "2px",
              },
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
              onSelect({ address: vote.voter.id, ensName: vote.ensName });
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
              "&:focus-visible": {
                outline: "2px solid $primary11",
                outlineOffset: "2px",
                color: "$primary11",
                backgroundColor: "$primary3",
              },
              transition: "all 0.2s",
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
