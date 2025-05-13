import ArbitrumIcon from "../../public/img/logos/arbitrum.png";
import { Vote, SUPPORT } from "../../../../lib/api/types/votes";
import { Card, Heading, Link, Text, Box } from "@livepeer/design-system";
import Image from "next/image";


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
    const support = SUPPORT[vote.choiceID] || SUPPORT["2"];
    return (
      <Card
        css={{
          p: "$4"
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
              css={{
                display: "inline-block",
                transition: "transform 0.2s ease",
                zIndex: 9999,
                position: "relative",
                "&:hover": { transform: "scale(1.3)", zIndex: 9999 },
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <Image
                src={ArbitrumIcon}
                alt="Arbitrum Icon"
                width={24}
                height={24}
              />
            </Link>
          ) : (
            <Text css={{ color: "$neutral9" }}>N/A</Text>
          )}
        </Box>
      </Card>
    );
  }
  
  function DesktopVoteView({ vote, onSelect, formatWeight }: VoteViewProps) {
    const support = SUPPORT[vote.choiceID] || SUPPORT["2"];
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
            {vote.ensName}
          </Link>
        </Box>
        <Box
          as="td"
          css={{
            textAlign: "center",
            ...support.style,
            borderBottom: "1px solid $neutral5",
          }}
        >
          {support.text}
        </Box>
        <Box
          as="td"
          css={{
            textAlign: "center",
            color: "$white",
            borderBottom: "1px solid $neutral5",
          }}
        >
          {formatWeight(vote.weight)}
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
                zIndex: 9999,
                position: "relative",
                "&:hover": { transform: "scale(1.3)", zIndex: 9999 },
              }}
            >
              <Image
                src={ArbitrumIcon}
                alt="Arbitrum Icon"
                width={32}
                height={32}
              />
            </Link>
          ) : (
            <Text css={{ color: "$neutral9" }}>N/A</Text>
          )}
        </Box>
      </Box>
    );
  }
  