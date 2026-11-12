"use client";

import { useConnectModal } from "@rainbow-me/rainbowkit";
import { useEffect, useState } from "react";
import { useAccount, useDisconnect } from "wagmi";

/**
 * Connect a wallet, replacing the one connected now: RainbowKit only
 * offers its connect screen once disconnected.
 */
export function useConnectWallet() {
  const { isConnected } = useAccount();
  const { disconnectAsync } = useDisconnect();
  const { openConnectModal } = useConnectModal();
  const [pending, setPending] = useState(false);
  useEffect(() => {
    if (pending && !isConnected && openConnectModal) {
      setPending(false);
      openConnectModal();
    }
  }, [pending, isConnected, openConnectModal]);
  return () => {
    if (!isConnected) openConnectModal?.();
    else {
      setPending(true);
      disconnectAsync().catch(() => setPending(false));
    }
  };
}
