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
  /**
   * A bridge or claim dialog is open: switching accounts then is to sign
   * in it, so the page shouldn't follow the wallet elsewhere.
   */
  open: boolean;
}>({ claim: () => {}, bridge: () => {}, open: false });

export const useBridge = () => useContext(BridgeContext);
