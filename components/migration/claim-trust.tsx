"use client";

import { ArrowUpRight } from "lucide-react";

import { addressUrl, L2_MIGRATOR } from "@/lib/config";

const LIP_73 = "https://github.com/livepeer/LIPs/blob/master/LIPs/LIP-73.md";

const link = "inline-flex items-center gap-0.5 hover:text-foreground";

/**
 * Where the funds are, and the proposal that put them there, both checkable
 * outside the app: a returning delegator being asked to claim LPT has every
 * reason to want proof it's real.
 */
export function ClaimTrust({ className }: { className?: string }) {
  return (
    <span
      className={`flex flex-wrap items-center gap-x-3 gap-y-1 text-ui-caption text-muted-foreground ${
        className ?? ""
      }`}
    >
      <a
        href={addressUrl(L2_MIGRATOR)}
        target="_blank"
        rel="noreferrer"
        className={link}
      >
        View the migration contract on Arbiscan
        <ArrowUpRight className="size-3" />
      </a>
      <a href={LIP_73} target="_blank" rel="noreferrer" className={link}>
        Read the migration proposal (LIP-73)
        <ArrowUpRight className="size-3" />
      </a>
    </span>
  );
}
