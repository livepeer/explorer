"use client";

import { createContext, useContext } from "react";

import type { BridgeWithdrawal, TrackedDeposit } from "@/lib/bridge/types";

export type Direction = "toArbitrum" | "toEthereum";

export const BridgeContext = createContext<{
  /** Claim a withdrawal that's through Arbitrum's withdrawal period. */
  claim: (w: BridgeWithdrawal) => void;
  /** Retry a deposit whose automatic finish on Arbitrum failed. */
  retry: (d: TrackedDeposit) => void;
  /**
   * Open the bridge for a wallet. Without a direction it starts where the
   * wallet's LPT is: Ethereum → Arbitrum if it holds any on Ethereum.
   */
  bridge: (wallet: string, direction?: Direction) => void;
}>({ claim: () => {}, retry: () => {}, bridge: () => {} });

export const useBridge = () => useContext(BridgeContext);
