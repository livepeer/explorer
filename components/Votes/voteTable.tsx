"use client";

import React, { useState, useEffect } from "react";
import { ApolloClient, InMemoryCache } from "@apollo/client";
import ArbitrumIcon from "../../public/img/logos/arbitrum.png";
import Spinner from "@components/Spinner";
import Image from "next/image";
import {
  Box,
  Card,
  Flex,
  Heading,
  Link,
  Text,
} from "@livepeer/design-system";
import VoterPopover from "./voterPopover";

import {
  CONTRACT_ADDRESS,
  VOTECAST_TOPIC0,
  provider,
  contractInterface,
} from "./contracts";
import { ENS_QUERY } from "./queries";
import { formatAddress } from "./formatAddress";

const createEnsApolloClient = () =>
  new ApolloClient({
    uri: process.env.NEXT_PUBLIC_ENS_API_URI,
    cache: new InMemoryCache(),
  });

interface Vote {
  transactionHash?: string;
  weight: string;
  voter: string;
  choiceID: string;
  proposalId: string;
  reason: string;
  ensName?: string;
}

interface VoteTableProps {
  proposalId: string;
  proposalTitle: string;
  ensCache?: any;
  votes: { voter: string; weight: string; choiceID: string }[];
  formatStake?: (stake: number) => string;
}


const getSupportStyles = (choiceID: string) => {
  switch (choiceID) {
    case "1":
      return { color: "$green9", fontWeight: 600 };
    case "0":
      return { color: "$red9", fontWeight: 600 };
    default:
      return { color: "$yellow9", fontWeight: 600 };
  }
};

const fetchVotesFromInfura = async (proposalId: string): Promise<Vote[]> => {
  const ensClient = createEnsApolloClient();
  try {
    const logs = await provider.getLogs({
      address: CONTRACT_ADDRESS,
      fromBlock: "earliest",
      toBlock: "latest",
      topics: [VOTECAST_TOPIC0],
    });

    const decodedVotes = logs
      .map((log) => {
        const decoded = contractInterface.parseLog(log);
        return {
          transactionHash: log.transactionHash,
          voter: decoded?.args.voter.toLowerCase() || "",
          choiceID: decoded?.args.support.toString() || "",
          proposalId: decoded?.args.proposalId.toString() || "",
          weight: decoded?.args.weight.toString() || "0",
          reason: decoded?.args.reason || "No reason provided",
        };
      })
      .filter((vote) => vote.proposalId === proposalId);

    const uniqueVoters = Array.from(new Set(decodedVotes.map((v) => v.voter)));
    const localEnsCache: { [address: string]: string } = {};

    await Promise.all(
      uniqueVoters.map(async (address) => {
        try {
          const { data } = await ensClient.query({
            query: ENS_QUERY,
            variables: { address },
          });
          if (data?.domains?.length > 0) {
            localEnsCache[address] = data.domains[0].name;
          }
        } catch (e) {
          console.warn(`Failed to fetch ENS for ${address}`, e);
        }
      })
    );

    return decodedVotes.map((vote) => ({
      ...vote,
      ensName: localEnsCache[vote.voter] || formatAddress(vote.voter),
    }));
  } catch (error) {
    console.error("Error fetching logs from Infura:", error);
    return [];
  }
};

const VoteTable: React.FC<VoteTableProps> = ({
  proposalId,
  proposalTitle,
  formatStake = (stake: number) =>
    new Intl.NumberFormat("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(stake / 1e18),
}) => {
  const [votes, setVotes] = useState<Vote[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVoter, setSelectedVoter] = useState<string | null>(null);

  useEffect(() => {
    if (!proposalId) return;
    const loadVotes = async () => {
      setLoading(true);
      const fetchedVotes = await fetchVotesFromInfura(proposalId);
      const sorted = fetchedVotes.sort(
        (a, b) => parseFloat(b.weight) - parseFloat(a.weight)
      );
      setVotes(sorted);
      setLoading(false);
    };
    loadVotes();
  }, [proposalId]);

  const totalWeight = votes.reduce(
    (sum, vote) => sum + parseFloat(vote.weight),
    0
  );

  const calculateVotePercentage = (weight: string) => {
    return totalWeight > 0
      ? ((parseFloat(weight) / totalWeight) * 100).toFixed(2)
      : "0";
  };

  if (loading) {
    return (
      <Flex
        css={{
          justifyContent: "center",
          alignItems: "center",
          height: "150px",
        }}
      >
          <Spinner />
      </Flex>
    );
  }

  if (votes.length === 0) {
    return (
      <Text
        css={{
          textAlign: "center",
          color: "$neutral11",
          marginTop: "$4",
        }}
      >
        No votes found for this proposal.
      </Text>
    );
  }

  const yesCount = votes.filter((v) => v.choiceID === "1").length;
  const noCount = votes.filter((v) => v.choiceID === "0").length;
  const abstainCount = votes.filter((v) => v.choiceID === "2").length;

  // Desktop Layout (Table-based)
const renderDesktopTable = () => (
  <Box
    css={{
      display: "none",
      "@bp2": { display: "block" },
      overflowX: "auto",
    }}
  >
    <Flex
      css={{
        justifyContent: "center",
        marginBottom: "$4",
        fontWeight: 700,
        fontSize: "$3",
        color: "$white",
      }}
    >
      <Text css={{ marginRight: "$1", color: "$green9" }}>Yes ({yesCount})</Text>
      <Text>|</Text>
      <Text css={{ marginLeft: "$1", marginRight: "$1", color: "$red9" }}>No ({noCount})</Text>
      <Text>|</Text>
      <Text css={{ marginLeft: "$1", color: "$yellow9" }}>
        Abstain ({abstainCount})
      </Text>
    </Flex>
    <Box
      as="table"
      css={{
        width: "100%",
        borderCollapse: "collapse",
      }}
    >
      <Box as="thead">
        <Box
          as="tr"
          css={{
            backgroundColor: "$neutral4",
          }}
        >
          {[
            { label: "Voter", width: "auto" },
            { label: "Support", width: "auto" },
            { label: "Weight", width: "30%" },
            { label: "Reason", width: "10%" },
            { label: "Vote Txn", width: "auto" },
          ].map((header) => (
            <Box
              as="th"
              key={header.label}
              css={{
                textAlign: "center",
                textTransform: "uppercase",
                fontSize: "$1",
                color: "$neutral11",
                borderBottom: "1px solid $neutral5",
                width: header.width,
              }}
            >
              {header.label}
            </Box>
          ))}
        </Box>
      </Box>
      <Box as="tbody">
  {votes.map((vote, index) => {
    const supportText =
      vote.choiceID === "1"
        ? "Yes"
        : vote.choiceID === "2"
        ? "Abstain"
        : "No";
    return (
      <Box
      as="tr"
      key={index}
      css={{
        backgroundColor: "$neutral3",
        cursor: "pointer",
        position: "relative",
        zIndex: 2,
        "&:hover": { backgroundColor: "$neutral4" },
        "& > td": { padding: "$2" },
      }}
      onClickCapture={(e) => {
        const target = e.target as HTMLElement;
        if (target.closest("a")) return;
        
        e.stopPropagation();
        setSelectedVoter(vote.voter);
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
            {formatAddress(vote.ensName ?? "") || formatAddress(vote.voter)}
          </Link>
        </Box>
        <Box
          as="td"
          css={{
            textAlign: "center",
            ...getSupportStyles(vote.choiceID),
            borderBottom: "1px solid $neutral5",
          }}
        >
          {supportText}
        </Box>
        <Box
          as="td"
          css={{
            textAlign: "center",
            color: "$white",
            borderBottom: "1px solid $neutral5",
            width: "15%", 
          }}
        >
          {new Intl.NumberFormat("en-US", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          }).format(parseFloat(vote.weight) / 1e18)}{" "}
          LPT ({calculateVotePercentage(vote.weight)}%)
        </Box>
        <Box
          as="td"
          css={{
            textAlign: "center",
            color: "$neutral9",
            borderBottom: "1px solid $neutral5",
            width: "35%", 
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
      onClickCapture={(e) => {
        e.stopPropagation(); 
      }}
      css={{
        display: "inline-block",
        transition: "transform 0.2s ease",
        zIndex: 9999,
        position: "relative",
        "&:hover": {
          transform: "scale(1.3)",
          zIndex: 9999,
        },
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
  })}
</Box>
</Box>
    </Box>
  );


  // Mobile Layout (Card-based for better UI/UX)
  const renderMobileCards = () => (
    <Box
      css={{
        display: "block",
        "@bp2": { display: "none" },
      }}
    >
      <Flex
        css={{
          justifyContent: "center",
      
          fontWeight: 700,
          fontSize: "$3",
          color: "$white",
          marginTop: "$2",
          marginBottom: "$2",
        }}
      >
        <Text css={{ marginRight: "$1", color: "$green9" }}>Yes ({yesCount})</Text>
      <Text>|</Text>
      <Text css={{ marginLeft: "$1", marginRight: "$1", color: "$red9" }}>No ({noCount})</Text>
      <Text>|</Text>
      <Text css={{ marginLeft: "$1", color: "$yellow9" }}>
        Abstain ({abstainCount})
      </Text>
      </Flex>
      {votes.map((vote, index) => {
  const supportText =
    vote.choiceID === "1"
      ? "Yes"
      : vote.choiceID === "2"
      ? "Abstain"
      : "No";
  return (
    <Card
  key={index}
  css={{
    padding: "$4",
    marginBottom: "$3",
    cursor: "pointer",
    position: "relative",
    zIndex: 2,
    backgroundColor: "$neutral3",
    "&:hover": { backgroundColor: "$neutral4" },
  }}
  onClickCapture={(e) => {
    const target = e.target as HTMLElement;
    if (target.closest("a")) return;
    
    e.stopPropagation();
    setSelectedVoter(vote.voter);
  }}
>
      <Heading as="h4" css={{ fontSize: "$3", mb: "$2", color: "$green11" }}>
      {formatAddress(vote.ensName ?? "") || formatAddress(vote.voter)}
      </Heading>
      <Text css={{ display: "flex", alignItems: "center", marginBottom: "$1" }}>
  <Text as="span" css={{ fontWeight: 600, marginRight: "$2" }}>
    Support:
  </Text>
  <Text as="span" css={getSupportStyles(vote.choiceID)}>
    {supportText}
  </Text>
</Text>

      <Text css={{ marginBottom: "$1", color: "$white" }}>
        <Text as="span" css={{ fontWeight: 600 }}>
          Weight:
        </Text>{" "}
          {new Intl.NumberFormat("en-US", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          }).format(parseFloat(vote.weight) / 1e18)}{" "}
          LPT ({calculateVotePercentage(vote.weight)}%)
      </Text>
      <Text css={{ marginBottom: "$1", color: "$neutral9" }}>
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
            css={{ color: "$blue9", textDecoration: "underline" }}
            onClick={(e) => e.stopPropagation()}
           >
          <Image src={ArbitrumIcon} alt="Arbitrum Icon" width={24} height={24} />
          </Link>
        ) : (
          <Text css={{ color: "$neutral9" }}>N/A</Text>
        )}
      </Box>
    </Card>
  );
})}

    </Box>
  );

  return (
    <>
      {renderDesktopTable()}
      {renderMobileCards()}
      {selectedVoter && (
        <VoterPopover
          voter={selectedVoter}
          proposalId={proposalId}
          onClose={() => setSelectedVoter(null)}
        />
      )}
    </>
  );
};

export default VoteTable;
