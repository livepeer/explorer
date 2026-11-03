"use client";

import { Analytics as VercelAnalytics } from "@vercel/analytics/next";
import { usePathname } from "next/navigation";
import { useAccountEffect } from "wagmi";

import { redactUrl, trackWalletConnected } from "@/lib/analytics";

/** Web Analytics, plus wallet connects for the delegation funnel. */
export function Analytics() {
  const pathname = usePathname();
  useAccountEffect({
    onConnect: ({ isReconnected }) => {
      // Reconnects restore a previous session, so they don't count.
      if (!isReconnected) trackWalletConnected(pathname);
    },
  });
  return <VercelAnalytics beforeSend={redactUrl} />;
}
