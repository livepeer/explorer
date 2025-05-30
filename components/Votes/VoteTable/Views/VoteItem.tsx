import ArbitrumIcon from "../../../../public/img/logos/arbitrum.png";
import { Vote, VOTING_SUPPORT } from "../../../../lib/api/types/votes";
import { Card, Heading, Link, Text, Box, Badge } from "@livepeer/design-system";
import Image from "next/image";
import { ArrowTopRightIcon } from "@modulz/radix-icons";
import { formatAddress } from "utils/formatAddress";


interface VoteViewProps {
    vote: Vote;
    onSelect: (voter: string) => void;
    formatWeight: (weight: string) => string;
    isMobile?: boolean;
  }
  
  export function VoteView({ vote, onSelect, formatWeight, isMobile }: VoteViewProps) {
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
          p: "$4",
          mb: "$3",
          cursor: "pointer",
          position: "relative",
          zIndex: 2,
          bg: "$neutral3",
          "&:hover": { bg: "$neutral4" },
        }}
        onClickCapture={(e) => {
          if ((e.target as HTMLElement).closest("a")) return;
          e.stopPropagation();
          onSelect(vote.voter);
        }}
      >
        <Heading as="h4" css={{ fontSize: "$3", mb: "$2", color: "$green11" }}>
          <Link
            href={`https://explorer.livepeer.org/accounts/${vote.voter}/delegating`}
            target="_blank"
            css={{
              color: "$green11",
              textDecoration: "none",
              "&:hover": { textDecoration: "underline" },
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {vote.ensName}
          </Link>
        </Heading>
        <Text css={{ display: "flex", alignItems: "center", mb: "$1" }}>
          <Text as="span" css={{ fontWeight: 600, mr: "$2" }}>
            Support:
          </Text>
          <Text as="span" css={support.style}>
            {support.text}
          </Text>
        </Text>
        <Text css={{ mb: "$1", color: "$white" }}>
          <Text as="span" css={{ fontWeight: 600 }}>
            Weight:
          </Text>{" "}
          {formatWeight(vote.weight)}
        </Text>
        <Text css={{ mb: "$1", color: "$neutral11" }}>
          <Text as="span" css={{ fontWeight: 600 }}>
            Reason:
          </Text>{" "}
          {vote.reason}
        </Text>
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
                          {formatAddress(vote.transactionHash)}
                          <Box
                            css={{ ml: "$1", width: 15, height: 15 }}
                            as={ArrowTopRightIcon}
                          />
                        </Badge>
                      </Link>
          ) : (
            <Text css={{ color: "$neutral9" }}>N/A</Text>
          )}
        </Box>
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
          cursor: "pointer",
          position: "relative",
          zIndex: 2,
          "&:hover": { backgroundColor: "$neutral4" },
          "& > td": { padding: "$2" },
        }}
        onClickCapture={(e) => {
          if ((e.target as HTMLElement).closest("a")) return;
          e.stopPropagation();
          onSelect(vote.voter);
        }}
      >
        <Box
          as="td"
          css={{
            textAlign: "center",
            color: "$white",
            borderBottom: "1px solid $neutral5",
          }}
        >
          <Link
            href={`https://explorer.livepeer.org/accounts/${vote.voter}/delegating`}
            target="_blank"
            css={{
              color: "$green11",
              textDecoration: "none",
              "&:hover": { textDecoration: "underline" },
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <Text css={{
                fontWeight: 600,
                color: "$green11",
                whiteSpace: "nowrap",
              }}
              size="2">
                {vote.ensName}
              </Text>
          </Link>
        </Box>
        <Box
          as="td"
          css={{
            textAlign: "center",
            borderBottom: "1px solid $neutral5",
          }}
        >
          <Text css={{
                fontWeight: 600,
                whiteSpace: "nowrap",
                ...support.style,
              }}
              size="2">
                {support.text}
              </Text>
        </Box>
        <Box
          as="td"
          css={{
            textAlign: "center",
            color: "$white",
            borderBottom: "1px solid $neutral5",
          }}
        >
          <Text css={{
                fontWeight: 600,
                color: "$white",
                whiteSpace: "nowrap",
              }}
              size="2">
                {formatWeight(vote.weight)}
              </Text>
        </Box>
        <Box
          as="td"
          css={{
            textAlign: "center",
            color: "$neutral9",
            borderBottom: "1px solid $neutral5",
          }}
        >
          {vote.reason}
        </Box>
        <Box
          as="td"
          css={{
            textAlign: "center",
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
                          {formatAddress(vote.transactionHash)}
                          <Box
                            css={{ ml: "$1", width: 15, height: 15 }}
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
  }
  