"use client";

import React, { useState, useEffect } from "react";
// import Image from "next/image";
import { ethers } from "ethers";
import { ApolloClient, InMemoryCache } from "@apollo/client";
import ArbitrumIcon from "../../public/img/logos/arbitrum.svg";
import VoterPopover from "./voterPopover";

import {
  CONTRACT_ADDRESS,
  VOTECAST_TOPIC0,
  provider,
  contractInterface,
} from "./contracts";

import { ENS_QUERY } from "./queries"; 

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

const formatAddress = (addr: string): string => {
  if (!addr) return "";
  // If it ends with .xyz, always shorten if longer than 21 chars
  if (addr.endsWith(".xyz")) {
    return addr.length > 21 ? `${addr.slice(0, 6)}...${addr.slice(-6)}` : addr;
  }
  // If ends with .eth, return as is
  if (addr.endsWith(".eth")) {
    return addr;
  }
  // Otherwise, shorten if longer than 21 chars
  return addr.length > 21 ? `${addr.slice(0, 6)}...${addr.slice(-6)}` : addr;
};

const getSupportClasses = (choiceID: string) => {
  switch (choiceID) {
    case "1":
      return "text-green-500 font-semibold";
    case "0":
      return "text-red-500 font-semibold";
    default:
      return "text-yellow-500 font-semibold";
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

    // Fetch ENS names for unique voters
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

    // Replace voter address with ENS name if found
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
      <div className="flex justify-center items-center">
        <div className="w-6 h-6 border-2 border-green-400 border-dashed rounded-full animate-spin"></div>
      </div>
    );
  }

  if (votes.length === 0) {
    return (
      <div className="text-center text-gray-300 mt-4">
        No votes found for this proposal.
      </div>
    );
  }

  // Count votes by support
  const yesCount = votes.filter((v) => v.choiceID === "1").length;
  const noCount = votes.filter((v) => v.choiceID === "0").length;
  const abstainCount = votes.filter((v) => v.choiceID === "2").length;

  const totalVotes = yesCount + noCount + abstainCount;

  return (
    <>
      {/* Desktop Table */}
      <div className="hidden md:block overflow-x-auto">
      <div className="text-center text-white font-bold text-md mb-4 text-xl">
        <p>Total: {totalVotes}</p>
        <span className="text-green-400">Yes ({yesCount})</span> |{" "}
        <span className="text-red-400">No ({noCount})</span> |{" "}
        <span className="text-yellow-400">Abstain ({abstainCount})</span>
        </div>
        <table className="min-w-full divide-y divide-gray-700">
          <thead className="bg-gray-700">
            <tr>
              <th className="px-4 py-2 text-center text-gray-300 uppercase tracking-wider">
                Voter
              </th>
              <th className="px-4 py-2 text-center text-gray-300 uppercase tracking-wider">
                Support
              </th>
              <th className="px-4 py-2 text-center text-gray-300 uppercase tracking-wider">
                Weight
              </th>
              <th className="px-4 py-2 text-center text-gray-300 uppercase tracking-wider">
                Reason
              </th>
              <th className="px-4 py-2 text-center text-gray-300 uppercase tracking-wider">
                Vote Txn
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {votes.map((vote, index) => {
              const supportText =
                vote.choiceID === "1"
                  ? "Yes"
                  : vote.choiceID === "2"
                  ? "Abstain"
                  : "No";
              return (
                <tr
                  key={index}
                  className="bg-gray-800 hover:bg-gray-700 cursor-pointer"
                  onClick={() => setSelectedVoter(vote.voter)}
                >
                  <td className="px-4 py-2 text-white text-center">
                    <a
                      href={`https://explorer.livepeer.org/accounts/${vote.voter}/delegating`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 underline"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {vote.ensName || formatAddress(vote.voter)}
                    </a>
                  </td>
                  <td
                    className={`px-4 py-2 text-center ${getSupportClasses(
                      vote.choiceID
                    )}`}
                  >
                    {supportText}
                  </td>
                  <td className="px-4 py-2 text-white text-center">
                    {new Intl.NumberFormat("en-US", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    }).format(parseFloat(vote.weight) / 1e18)}{" "}
                    LPT ({calculateVotePercentage(vote.weight)}%)
                  </td>
                  <td className="px-4 py-2 text-gray-300 text-center">
                    {vote.reason}
                  </td>
                  <td className="px-4 py-2 text-center">
                    {vote.transactionHash ? (
                      <a
                        href={`https://arbiscan.io/tx/${vote.transactionHash}#eventlog`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center text-blue-400 underline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {/* Uncomment and use Image if needed
                        <Image
                          src={ArbitrumIcon}
                          alt="Tx"
                          width={20}
                          height={20}
                        /> */}
                      </a>
                    ) : (
                      <span className="text-gray-500">N/A</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile Version */}
      <div className="block md:hidden">
        
        <div className="text-center text-white font-bold text-md mb-4 text-lg">
        <p>Total: {totalVotes}</p>
        <br />
        <span className="text-green-400">Yes ({yesCount})</span> |{" "}
        <span className="text-red-400">No ({noCount})</span> |{" "}
        <span className="text-yellow-400">Abstain ({abstainCount})</span>
        </div>
        {votes.map((vote, index) => {
          const supportText =
            vote.choiceID === "1"
              ? "Yes"
              : vote.choiceID === "2"
              ? "Abstain"
              : "No";
          return (
            <div
              key={index}
              className="bg-gray-700 p-4 rounded-lg mt-2 cursor-pointer"
              onClick={() => setSelectedVoter(vote.voter)}
            >
              <div className="break-all inline-block w-full overflow-x-auto">
                <p className="text-gray-300 flex flex-wrap items-center gap-2 mb-2">
                  <strong>Voter:</strong>
                  <a
                    href={`https://explorer.livepeer.org/accounts/${vote.voter}/delegating`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 underline break-all whitespace-normal"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {vote.ensName || formatAddress(vote.voter)}
                  </a>
                </p>
              </div>
              <p className="text-gray-300">
                <strong>Support: </strong>
                <span className={getSupportClasses(vote.choiceID)}>
                  {supportText}
                </span>
              </p>
              <p className="text-gray-300">
                <strong>Weight:</strong> {formatStake(parseFloat(vote.weight))} (
                {calculateVotePercentage(vote.weight)}%)
              </p>
              <p className="text-gray-300">
                <strong>Reason:</strong> {vote.reason}
              </p>
              <p className="mt-2">
                {vote.transactionHash ? (
                  <a
                    href={`https://arbiscan.io/tx/${vote.transactionHash}#eventlog`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {/* Uncomment and use Image if needed
                    <Image
                      src={ArbitrumIcon}
                      alt="Txn"
                      width={20}
                      height={20}
                      className="inline-block"
                    /> */}
                  </a>
                ) : (
                  <span>N/A</span>
                )}
              </p>
            </div>
          );
        })}
      </div>

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
