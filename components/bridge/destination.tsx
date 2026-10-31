"use client";

import { ShieldCheck } from "lucide-react";
import { useState } from "react";
import { getAddress } from "viem";
import { useBytecode, useReadContracts, useStorageAt } from "wagmi";

import { useIdentity } from "@/components/identity";
import {
  type Recipient,
  RecipientPicker,
  RecipientRow,
} from "@/components/staking/recipient";
import { Notice } from "@/components/staking/staking";
import {
  isDelegatedWallet,
  isOfficialSafe,
  ownersOnly,
  SAFE_SENTINEL,
  safeModulesAbi,
  type SafeSigners,
  safeSignersAbi,
  sameSigners,
} from "@/lib/bridge/safe";
import { shortAddress } from "@/lib/format";
import { usePortfolioAccounts } from "@/lib/hooks/watchlist";

type Kind =
  | { kind: "wallet" }
  | {
      kind: "safe";
      signers: SafeSigners;
      /**
       * Runs official Safe code with no modules beyond Safe's own
       * owner-signed 4337 module, so its owners alone
       * control it. A lookalike at the same address could report the same
       * owners while something else holds the keys.
       */
      genuine: boolean;
    }
  | { kind: "contract" };

/**
 * What's at an address on a network: a regular wallet (no code), a Safe
 * (with its signers), or some other contract. Undefined while reading.
 */
function useAccountKind(address: string | null, chainId: number) {
  const a = (address ?? undefined) as `0x${string}` | undefined;
  const { data: code, isLoading: loadingCode } = useBytecode({
    address: a,
    chainId,
    query: { enabled: Boolean(a), staleTime: 5 * 60_000 },
  });
  // A 7702-delegated wallet has code, but its key still controls it.
  const isContract = Boolean(code && code !== "0x" && !isDelegatedWallet(code));
  const { data, isLoading } = useReadContracts({
    allowFailure: true,
    contracts: [
      { address: a, abi: safeSignersAbi, functionName: "getOwners", chainId },
      {
        address: a,
        abi: safeSignersAbi,
        functionName: "getThreshold",
        chainId,
      },
      {
        address: a,
        abi: safeModulesAbi,
        functionName: "getModulesPaginated",
        args: [SAFE_SENTINEL, 10n],
        chainId,
      },
    ],
    query: { enabled: Boolean(a) && isContract, staleTime: 5 * 60_000 },
  });
  const { data: slot0, isLoading: loadingSlot } = useStorageAt({
    address: a,
    slot: "0x0",
    chainId,
    query: { enabled: Boolean(a) && isContract, staleTime: 5 * 60_000 },
  });
  if (!a || loadingCode) return undefined;
  if (!isContract) return { kind: "wallet" } as Kind;
  if (isLoading || loadingSlot || !data) return undefined;
  const [owners, threshold, modules] = data;
  if (owners.status !== "success" || threshold.status !== "success") {
    return { kind: "contract" } as Kind;
  }
  // Known gap: a Safe's setup can write storage directly, so a lookalike
  // could plant a module the module list doesn't show. That takes an older
  // Safe whose address doesn't depend on its setup (CREATE), and someone
  // taking that address on the other network first. Ruling it out needs
  // the setup used at creation, which isn't on-chain in readable form and
  // which Safe's indexer often lacks (4337-created Safes show "0x"), so
  // it's left open as a targeted, unlikely attack.
  const genuine =
    isOfficialSafe(slot0) &&
    modules.status === "success" &&
    // A full page could hide more; only a short, complete list is judged.
    modules.result[0].length < 10 &&
    ownersOnly(modules.result[0]);
  return {
    kind: "safe",
    signers: { owners: owners.result, threshold: threshold.result },
    genuine,
  } as Kind;
}

export type Destination = {
  /** Where the LPT lands, once settled (null until chosen and confirmed). */
  to: string | null;
  /** The source wallet is a Safe: it signs by proposal. */
  isSafe: boolean;
  /** A contract that isn't a Safe: not bridged from here. */
  unsupported: boolean;
  /** Still reading what the wallets are. */
  loading: boolean;
  /** What to show about the destination, and any choice it needs. */
  ui: React.ReactNode;
};

/**
 * Where bridged LPT lands. A regular wallet bridges to its own address on
 * the other network: its key controls both. A Safe can too, but only when
 * the same address on the other network is a Safe with the same owners and
 * threshold, so the same people control it. Otherwise the Safe chooses a
 * destination (one of the portfolio's wallets, or an address typed in) and
 * confirms it controls it there, since a wrong address can't be undone.
 * Other contracts aren't bridged from here: there's no telling who controls
 * them on the other network.
 */
export function useDestination({
  wallet,
  sourceChain,
  destChain,
  destNetwork,
  locked,
}: {
  wallet: string;
  sourceChain: number;
  destChain: number;
  destNetwork: string;
  /** While a transaction is in flight, the choice can't change. */
  locked: boolean;
}): Destination {
  const source = useAccountKind(wallet, sourceChain);
  const mirror = useAccountKind(
    source?.kind === "safe" ? wallet : null,
    destChain
  );
  const [picked, setPicked] = useState<Recipient | null>(null);
  const [vouched, setVouched] = useState(false);
  const pickedKind = useAccountKind(picked?.address ?? null, destChain);
  const { name: pickedName } = useIdentity(picked?.address ?? null);
  const { accounts } = usePortfolioAccounts();

  const settled = { isSafe: false, unsupported: false, loading: false };
  if (source === undefined) {
    return { ...settled, to: null, loading: true, ui: null };
  }
  if (source.kind === "wallet") {
    return {
      ...settled,
      to: wallet,
      // The To card shows the address; nothing more to say.
      ui: null,
    };
  }
  if (source.kind === "contract") {
    return { ...settled, to: null, unsupported: true, ui: null };
  }
  if (mirror === undefined) {
    return { ...settled, isSafe: true, to: null, loading: true, ui: null };
  }

  // The same Safe on both networks: bridge to itself.
  if (
    mirror.kind === "safe" &&
    mirror.genuine &&
    sameSigners(source.signers, mirror.signers)
  ) {
    return {
      ...settled,
      isSafe: true,
      to: wallet,
      ui: (
        <span className="flex items-center gap-1.5 text-ui-caption text-subtle-foreground">
          <ShieldCheck className="size-3.5 shrink-0 text-green-bright" />
          To the same Safe on {destNetwork}: same owners, same threshold.
        </span>
      ),
    };
  }

  // A Safe without a twin on the other side: choose where the LPT goes.
  const toName =
    picked?.label ?? pickedName ?? (picked ? shortAddress(picked.address) : "");
  // Another contract there can't be shown to be yours.
  const pickedBlocked = pickedKind?.kind === "contract";
  const status = (r: Recipient) =>
    r.address === picked?.address
      ? pickedKind?.kind === "safe"
        ? `Safe on ${destNetwork}`
        : pickedKind?.kind === "wallet"
        ? "Wallet"
        : ""
      : "";
  const ui = (
    <div className="flex flex-col gap-2">
      <Notice>
        {mirror.kind === "wallet"
          ? `This Safe doesn't exist on ${destNetwork}, so choose where the LPT goes there.`
          : mirror.kind === "safe" &&
            sameSigners(source.signers, mirror.signers)
          ? `The Safe at this address on ${destNetwork} has modules or non-standard code, so its owners may not be the only ones in control. Choose where the LPT goes.`
          : `The address on ${destNetwork} isn't this Safe with the same owners, so choose where the LPT goes.`}
      </Notice>
      <div className="text-ui-caption text-muted-foreground">
        To, on {destNetwork}
      </div>
      {picked ? (
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2.5 rounded-lg border border-hairline px-3 py-2.5">
            <RecipientRow
              recipient={picked}
              status={status(picked)}
              onClear={
                locked
                  ? undefined
                  : () => {
                      setPicked(null);
                      setVouched(false);
                    }
              }
            />
          </div>
          {/* The whole address, checksummed: a shortened one is easy to
              imitate, and this is where the LPT lands for good. */}
          <div className="font-mono text-ui-caption break-all text-muted-foreground">
            {getAddress(picked.address)}
          </div>
        </div>
      ) : (
        <RecipientPicker
          wallets={accounts
            .filter((a) => a.address !== wallet)
            .map((a) => ({ address: a.address, label: a.label }))}
          exclude={wallet}
          status={() => ""}
          onSelect={(r) => {
            setPicked(r);
            setVouched(false);
          }}
        />
      )}
      {pickedBlocked && (
        <Notice tone="warning">
          {toName} is a contract on {destNetwork} that isn&apos;t a Safe, so
          there&apos;s no telling who controls it. Choose another address.
        </Notice>
      )}
      {picked && !pickedBlocked && (
        <label className="flex cursor-pointer items-start gap-2.5 text-ui-caption text-muted-foreground">
          <input
            type="checkbox"
            checked={vouched}
            disabled={locked}
            onChange={(e) => setVouched(e.target.checked)}
            className="mt-0.5 size-4 shrink-0 cursor-pointer accent-(--primary)"
          />
          <span>
            I control {toName} on {destNetwork}. LPT bridged there can only be
            moved from it, and this can&apos;t be undone.
          </span>
        </label>
      )}
    </div>
  );
  return {
    ...settled,
    isSafe: true,
    to:
      picked && vouched && pickedKind !== undefined && !pickedBlocked
        ? picked.address
        : null,
    ui,
  };
}
