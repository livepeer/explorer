import { ExplorerTooltip } from "@components/ExplorerTooltip";
import { VOTING_SUPPORT_MAP } from "@lib/api/types/votes";
import dayjs from "@lib/dayjs";
import { formatTransactionHash } from "@lib/utils";
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
  ChevronDownIcon,
  ChevronUpIcon,
  CounterClockwiseClockIcon,
} from "@radix-ui/react-icons";
import { TreasuryVoteSupport } from "apollo/subgraph";
import { useState } from "react";

import { Vote } from "./DesktopVoteTable";
import { VoteReasonPopover } from "./VoteReasonPopover";

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
  const [isExpanded, setIsExpanded] = useState(false);
  const support =
    VOTING_SUPPORT_MAP[vote.support] ||
    VOTING_SUPPORT_MAP[TreasuryVoteSupport.Abstain];
  const hasReason =
    vote.reason && vote.reason.toLowerCase() !== "no reason provided";
  const reasonId = `reason-${vote.transactionHash || vote.voter.id}`;

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
              href={`https://explorer.livepeer.org/accounts/${vote.voter.id}/delegating`}
              target="_blank"
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
              {vote.ensName}
            </Link>
          </Heading>
          <Box
            as="button"
            aria-label={`See ${vote.ensName || vote.voter.id}'s voting history`}
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
              onSelect({ address: vote.voter.id, ensName: vote.ensName })
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
                minHeight: "44px",
                fontSize: "$1",
                fontWeight: 600,
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
          {vote.transactionHash ? (
            <Link
              href={`https://arbiscan.io/tx/${vote.transactionHash}#eventlog`}
              target="_blank"
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
          borderBottom: "1px solid $neutral5",
        }}
      >
        <Link
          href={`https://explorer.livepeer.org/accounts/${vote.voter.id}/delegating`}
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
          onClick={(e) => e.stopPropagation()}
        >
          <Text
            css={{
              fontWeight: 600,
              color: "inherit",
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
        <Badge
          size="1"
          css={{
            backgroundColor: support.style.backgroundColor,
            color: support.style.color,
            fontWeight: support.style.fontWeight,
            border: "none",
            width: "86px",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "$1",
          }}
        >
          <Box as={support.icon} css={{ width: 12, height: 12 }} />
          {support.text}
        </Badge>
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
        <Box
          css={{
            minWidth: 200,
            maxWidth: 400,
            paddingRight: "$3",
            paddingLeft: "$2",
          }}
        >
          {!vote.reason ||
          vote.reason.toLowerCase() === "no reason provided" ? (
            <Text size="1" css={{ color: "$neutral9" }}>
              —
            </Text>
          ) : (vote.reason?.length ?? 0) > 50 ? (
            <VoteReasonPopover reason={vote.reason}>
              <Text
                size="1"
                css={{
                  color: "$hiContrast",
                  display: "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  cursor: "help",
                }}
              >
                {vote.reason}
              </Text>
            </VoteReasonPopover>
          ) : (
            <Text size="1" css={{ color: "$hiContrast", cursor: "default" }}>
              {vote.reason}
            </Text>
          )}
        </Box>
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
              display: "inline-flex",
              textDecoration: "none",
              transition: "transform 0.2s ease",
              "&:hover": {
                transform: "scale(1.02)",
                textDecoration: "none",
              },
              "&:hover > *": {
                borderColor: "$grass4 !important",
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
              {formatTransactionHash(vote.transactionHash)}
              <Box
                className="arrow-icon"
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
        <ExplorerTooltip content="See their voting history">
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
        </ExplorerTooltip>
      </Box>
    </Box>
  );
}
