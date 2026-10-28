"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { useAccount, useAccountEffect } from "wagmi";

import { useStaking } from "@/components/staking/staking";
import { usePortfolioAccounts } from "@/lib/hooks/watchlist";

/**
 * Shows the wallet you just connected, like watching an address does, but
 * only on the portfolio pages: elsewhere you connected to do something
 * there (delegate, vote), so the page stays. Not on a reconnect at page
 * load, and not while a staking dialog is open or waiting to resume.
 *
 * Switching accounts in the wallet while on the old account's page moves to
 * the new one, so the page matches the account that can sign.
 */
export function FollowWallet() {
  const router = useRouter();
  const pathname = usePathname();
  const { address, isConnected } = useAccount();
  const { accounts } = usePortfolioAccounts();
  const { busy } = useStaking();

  // Set by a connect you made just now, not by a reconnect.
  const fresh = useRef(false);
  useAccountEffect({
    onConnect: ({ isReconnected }) => {
      if (!isReconnected) fresh.current = true;
    },
  });

  const prev = useRef<string | null>(null);
  useEffect(() => {
    const now = isConnected && address ? address.toLowerCase() : null;
    const before = prev.current;
    prev.current = now;
    const justConnected = fresh.current;
    fresh.current = false;
    if (!now || busy) return;

    const [, section, here] = pathname.split("/");
    const viewing = section === "accounts" ? here?.toLowerCase() : undefined;
    if (viewing === now) return;

    if (justConnected) {
      const onPortfolio = pathname === "/" || section === "accounts";
      // With one wallet, the portfolio already is its page.
      const alreadyShown = pathname === "/" && accounts.length <= 1;
      if (onPortfolio && !alreadyShown) router.push(`/accounts/${now}`);
    } else if (before && before !== now && viewing === before) {
      router.push(`/accounts/${now}`);
    }
    // Only a change of account should move the page.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [address, isConnected]);

  return null;
}
