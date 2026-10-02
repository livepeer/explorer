"use client";

import { useQueries } from "@tanstack/react-query";
import { Check, Copy } from "lucide-react";
import Link from "next/link";
import { useCallback, useState } from "react";
import { normalize } from "viem/ens";
import { useConfig, useEnsAvatar, useEnsName } from "wagmi";
import { getEnsNameQueryOptions } from "wagmi/query";

import { Tooltip } from "@/components/ui/tooltip";
import { cn } from "@/lib/cn";
import { L1_CHAIN } from "@/lib/config";
import { shortAddress } from "@/lib/format";

export function useIdentity(address?: string | null) {
  const { data: ensName } = useEnsName({
    address: address as `0x${string}` | undefined,
    chainId: L1_CHAIN.id,
    query: { enabled: Boolean(address), staleTime: 60 * 60_000, retry: false },
  });
  let normalized: string | undefined;
  try {
    normalized = ensName ? normalize(ensName) : undefined;
  } catch {
    normalized = undefined;
  }
  const { data: avatar } = useEnsAvatar({
    name: normalized,
    chainId: L1_CHAIN.id,
    query: {
      enabled: Boolean(normalized),
      staleTime: 60 * 60_000,
      retry: false,
    },
  });
  return {
    name: ensName ?? null,
    avatar: avatar ?? null,
    display: ensName ?? shortAddress(address ?? ""),
  };
}

/** Stable two-stop gradient derived from the address bytes. */
function gradientFor(address: string) {
  const hex = address.toLowerCase().replace(/^0x/, "").padEnd(12, "0");
  const h1 = parseInt(hex.slice(0, 4), 16) % 360;
  const h2 = (h1 + 40 + (parseInt(hex.slice(4, 6), 16) % 120)) % 360;
  const angle = parseInt(hex.slice(6, 8), 16) % 360;
  return `linear-gradient(${angle}deg, oklch(0.72 0.13 ${h1}), oklch(0.5 0.14 ${h2}))`;
}

export function Avatar({
  address,
  size = 28,
  className,
  src,
}: {
  address: string;
  size?: number;
  className?: string;
  src?: string | null;
}) {
  const [failed, setFailed] = useState(false);
  return (
    <span
      aria-hidden="true"
      className={cn(
        "relative inline-block shrink-0 overflow-hidden rounded-full",
        className
      )}
      style={{ width: size, height: size, background: gradientFor(address) }}
    >
      {src && !failed && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt=""
          className="absolute inset-0 size-full object-cover"
          onError={() => setFailed(true)}
        />
      )}
      <span className="absolute inset-0 rounded-full ring-1 ring-inset ring-foreground/10" />
    </span>
  );
}

export function CopyButton({
  value,
  label = "Copy address",
}: {
  value: string;
  label?: string;
}) {
  const [copied, setCopied] = useState(false);
  return (
    <Tooltip content={copied ? "Copied" : label}>
      <button
        type="button"
        aria-label={label}
        onClick={async (e) => {
          e.preventDefault();
          e.stopPropagation();
          try {
            await navigator.clipboard.writeText(value);
            setCopied(true);
            setTimeout(() => setCopied(false), 1400);
          } catch {
            // clipboard blocked; nothing sensible to fall back to
          }
        }}
        className="inline-flex size-6 cursor-pointer items-center justify-center rounded-sm text-muted-foreground transition-colors hover:bg-hover hover:text-foreground"
      >
        {copied ? (
          <Check className="size-3.5 text-green-bright" />
        ) : (
          <Copy className="size-3.5" />
        )}
      </button>
    </Tooltip>
  );
}

/**
 * Avatar + ENS name (or short address). Links to the account or orchestrator
 * page. The raw address is always one hover away.
 */
export function Identity({
  address,
  href,
  size = 24,
  label,
  secondary,
  className,
}: {
  address: string;
  href?: string | null;
  size?: number;
  label?: string;
  secondary?: React.ReactNode;
  className?: string;
}) {
  const { name, avatar } = useIdentity(address);
  const primary = label ?? name ?? shortAddress(address);
  const showMono = !label && !name;
  const body = (
    <span className={cn("flex min-w-0 items-center gap-2.5", className)}>
      <Avatar address={address} size={size} src={avatar} />
      <span className="flex min-w-0 flex-col">
        <span
          className={cn(
            "truncate text-ui-body text-foreground",
            showMono && "font-mono text-[13px] tracking-tight"
          )}
          title={address}
        >
          {primary}
        </span>
        {secondary && (
          <span className="truncate text-ui-caption text-muted-foreground">
            {secondary}
          </span>
        )}
      </span>
    </span>
  );
  if (href === null) return body;
  return (
    <Link
      href={href ?? `/accounts/${address}`}
      className="-m-1 inline-flex max-w-full min-w-0 rounded-sm p-1 transition-colors outline-none hover:bg-hover focus-visible:ring-1 focus-visible:ring-green-bright/40"
    >
      {body}
    </Link>
  );
}

/* ── Search by address or ENS name ───────────────────────────────────────── */

/**
 * ENS names for every address, fetched only while searching. Shares the
 * cache with the per-row `useEnsName` lookups, so rows already on screen
 * cost nothing extra.
 */
export function useEnsNames(addresses: string[], enabled: boolean) {
  const config = useConfig();
  // One Map per change in the resolved names, not per render, so callers
  // can depend on it in memos.
  const combine = useCallback(
    (results: { data?: string | null }[]) => {
      const map = new Map<string, string>();
      results.forEach((r, i) => {
        if (r.data) map.set(addresses[i], r.data.toLowerCase());
      });
      return map;
    },
    [addresses]
  );
  return useQueries({
    queries: addresses.map((address) => ({
      ...getEnsNameQueryOptions(config, {
        address: address as `0x${string}`,
        chainId: L1_CHAIN.id,
      }),
      enabled,
      staleTime: 60 * 60_000,
      retry: false,
    })),
    combine,
  });
}
