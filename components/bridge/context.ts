"use client";

import { createContext, useContext } from "react";

import type { BridgeWithdrawal } from "@/lib/bridge/types";

export type Direction = "toArbitrum" | "toEthereum";

export const BridgeContext = createContext<{
  /** Claim a withdrawal that's through Arbitrum's withdrawal period. */
  claim: (w: BridgeWithdrawal) => void;
  /**
   * Open the bridge for a wallet. Without a direction it starts where the
   * wallet's LPT is: Ethereum → Arbitrum if it holds any on Ethereum.
   */
  bridge: (wallet: string, direction?: Direction) => void;
}>({ claim: () => {}, bridge: () => {} });

export const useBridge = () => useContext(BridgeContext);
