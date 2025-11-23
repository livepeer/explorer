import { getCacheControlHeader } from "@lib/api";
import {
  getBondingVotesAddress,
  getContractAddress,
  getLivepeerGovernorAddress,
  getTreasuryAddress,
} from "@lib/api/contracts";
import { ContractInfo } from "@lib/api/types/get-contract-info";
import { CHAIN_INFO, DEFAULT_CHAIN_ID } from "@lib/chains";
import { NextApiRequest, NextApiResponse } from "next";

const handler = async (
  req: NextApiRequest,
  res: NextApiResponse<ContractInfo | null>
) => {
  try {
    const method = req.method;

    if (method === "GET") {
      res.setHeader("Cache-Control", getCacheControlHeader("day"));

      const contracts = {
        Controller: CHAIN_INFO[DEFAULT_CHAIN_ID].contracts.controller,

        // ArbRetryableTx: CHAIN_INFO[DEFAULT_CHAIN_ID].contracts.arbRetryableTx,
        // Inbox: CHAIN_INFO[DEFAULT_CHAIN_ID].contracts.inbox,
        L1Migrator: CHAIN_INFO[DEFAULT_CHAIN_ID].contracts.l1Migrator,
        L2Migrator: CHAIN_INFO[DEFAULT_CHAIN_ID].contracts.l2Migrator,
        // NodeInterface: CHAIN_INFO[DEFAULT_CHAIN_ID].contracts.nodeInterface,
        PollCreator: CHAIN_INFO[DEFAULT_CHAIN_ID].contracts.pollCreator,

        BondingManager: await getContractAddress("BondingManager"),
        LivepeerToken: await getContractAddress("LivepeerToken"),
        LivepeerTokenFaucet: await getContractAddress("LivepeerTokenFaucet"),
        MerkleSnapshot: await getContractAddress("MerkleSnapshot"),
        Minter: await getContractAddress("Minter"),
        RoundsManager: await getContractAddress("RoundsManager"),
        ServiceRegistry: await getContractAddress("ServiceRegistry"),
        TicketBroker: await getContractAddress("TicketBroker"),
        // TODO: Switch back to above pattern
        LivepeerGovernor: await getLivepeerGovernorAddress(),
        Treasury: await getTreasuryAddress(),
        BondingVotes: await getBondingVotesAddress(),
      };

      const contractsInfo: ContractInfo = {
        BondingManager: {
          name: "Bonding Manager (Proxy)",
          address: contracts.BondingManager,
          link: `${CHAIN_INFO[DEFAULT_CHAIN_ID].explorer}address/${contracts.BondingManager}`,
        },
        Controller: {
          name: "Controller",
          address: contracts.Controller,
          link: `${CHAIN_INFO[DEFAULT_CHAIN_ID].explorer}address/${contracts.Controller}`,
        },
        L1Migrator: {
          name: "L1 Migrator",
          address: contracts.L1Migrator,
          link: `${
            CHAIN_INFO[CHAIN_INFO[DEFAULT_CHAIN_ID].l1.id].explorer
          }address/${contracts.L1Migrator}`,
        },
        L2Migrator: {
          name: "L2 Migrator",
          address: contracts.L2Migrator,
          link: `${CHAIN_INFO[DEFAULT_CHAIN_ID].explorer}address/${contracts.L2Migrator}`,
        },
        LivepeerToken: {
          name: "Livepeer Token",
          address: contracts.LivepeerToken,
          link: `${CHAIN_INFO[DEFAULT_CHAIN_ID].explorer}address/${contracts.LivepeerToken}`,
        },
        LivepeerTokenFaucet: {
          name: "Livepeer Token Faucet",
          address: contracts.LivepeerTokenFaucet,
          link: `${CHAIN_INFO[DEFAULT_CHAIN_ID].explorer}address/${contracts.LivepeerTokenFaucet}`,
        },
        MerkleSnapshot: {
          name: "Merkle Snapshot",
          address: contracts.MerkleSnapshot,
          link: `${CHAIN_INFO[DEFAULT_CHAIN_ID].explorer}address/${contracts.MerkleSnapshot}`,
        },
        Minter: {
          name: "Minter",
          address: contracts.Minter,
          link: `${CHAIN_INFO[DEFAULT_CHAIN_ID].explorer}address/${contracts.Minter}`,
        },
        PollCreator: {
          name: "Poll Creator",
          address: contracts.PollCreator,
          link: `${CHAIN_INFO[DEFAULT_CHAIN_ID].explorer}address/${contracts.PollCreator}`,
        },
        RoundsManager: {
          name: "Rounds Manager (Proxy)",
          address: contracts.RoundsManager,
          link: `${CHAIN_INFO[DEFAULT_CHAIN_ID].explorer}address/${contracts.RoundsManager}`,
        },
        ServiceRegistry: {
          name: "Service Registry",
          address: contracts.ServiceRegistry,
          link: `${CHAIN_INFO[DEFAULT_CHAIN_ID].explorer}address/${contracts.ServiceRegistry}`,
        },
        TicketBroker: {
          name: "Ticket Broker (Proxy)",
          address: contracts.TicketBroker,
          link: `${CHAIN_INFO[DEFAULT_CHAIN_ID].explorer}address/${contracts.TicketBroker}`,
        },
        LivepeerGovernor: {
          name: "Livepeer Governor (Proxy)",
          address: contracts.LivepeerGovernor,
          link: `${CHAIN_INFO[DEFAULT_CHAIN_ID].explorer}address/${contracts.LivepeerGovernor}`,
        },
        Treasury: {
          name: "Treasury",
          address: contracts.Treasury,
          link: `${CHAIN_INFO[DEFAULT_CHAIN_ID].explorer}address/${contracts.Treasury}`,
        },
        BondingVotes: {
          name: "Bonding Votes (Proxy)",
          address: contracts.BondingVotes,
          link: `${CHAIN_INFO[DEFAULT_CHAIN_ID].explorer}address/${contracts.BondingVotes}`,
        },
      };

      return res.status(200).json(contractsInfo);
    }

    res.setHeader("Allow", ["GET"]);
    return res.status(405).end(`Method ${method} Not Allowed`);
  } catch (err) {
    console.error(err);
    return res.status(500).json(null);
  }
};

export default handler;
