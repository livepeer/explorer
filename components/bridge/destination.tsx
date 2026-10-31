"use client";

import { ShieldCheck } from "lucide-react";
import { useRef, useState } from "react";
import { getAddress } from "viem";
import { useBytecode, useReadContracts, useStorageAt } from "wagmi";

import { Avatar, useIdentity } from "@/components/identity";
import {
  type Recipient,
  RecipientPicker,
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
import { cn } from "@/lib/cn";
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
  /** The address chosen so far, confirmed or not, for the To card. */
  chosen: string | null;
  /** The Safe has to choose where its LPT goes. */
  choosing: boolean;
  /** Brings the choice into view and, with nothing chosen, focuses it. */
  focus: () => void;
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
  // After Change, the field comes back focused, ready for another address.
  const [changed, setChanged] = useState(false);
  const pickedKind = useAccountKind(picked?.address ?? null, destChain);
  const { name: pickedName } = useIdentity(picked?.address ?? null);
  const { accounts } = usePortfolioAccounts();
  const panel = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const focus = () => {
    panel.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
    input.current?.focus({ preventScroll: true });
  };

  const settled = {
    isSafe: false,
    unsupported: false,
    loading: false,
    chosen: null,
    choosing: false,
    focus,
  };
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
        <span className="-mt-1 flex items-center gap-1.5 text-ui-caption text-subtle-foreground">
          <ShieldCheck className="size-3.5 shrink-0 text-green-bright" />
          The same Safe on {destNetwork}: same owners, same threshold.
        </span>
      ),
    };
  }

  // A Safe without a twin on the other side: choose where the LPT goes.
  const toName =
    picked?.label ?? pickedName ?? (picked ? shortAddress(picked.address) : "");
  // Another contract there can't be shown to be yours.
  const pickedBlocked = pickedKind?.kind === "contract";
  const kindLabel =
    pickedKind?.kind === "safe"
      ? "Safe"
      : pickedKind?.kind === "wallet"
      ? "Wallet"
      : null;
  const why =
    mirror.kind === "wallet"
      ? `This Safe doesn't exist on ${destNetwork}.`
      : mirror.kind === "safe" && sameSigners(source.signers, mirror.signers)
      ? `The Safe at this address on ${destNetwork} has modules or non-standard code, so its owners may not be the only ones in control.`
      : `This address on ${destNetwork} isn't this Safe with the same owners.`;
  const clear = () => {
    setPicked(null);
    setVouched(false);
    setChanged(true);
  };
  const confirmed = Boolean(picked && vouched && !pickedBlocked);

  // One panel for the whole choice: why it's needed, the address, and the
  // confirmation, right under the To card it fills in.
  const ui = (
    <div
      ref={panel}
      className={cn(
        "flex scroll-mt-4 flex-col gap-3 rounded-lg border p-3.5 transition-colors",
        confirmed ? "border-hairline" : "border-foreground/25"
      )}
    >
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-ui-body font-medium">
          Where it lands on {destNetwork}
        </span>
        {picked && !locked && (
          <button
            type="button"
            onClick={clear}
            className="shrink-0 cursor-pointer text-ui-caption text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
          >
            Change
          </button>
        )}
      </div>
      {picked ? (
        <PickedAddress
          address={picked.address}
          title={picked.label ?? pickedName ?? undefined}
          kind={kindLabel}
        />
      ) : (
        <>
          <p className="-mt-2 text-ui-caption text-muted-foreground">
            {why} Choose an address you control there.
          </p>
          <RecipientPicker
            inputRef={input}
            autoFocus={changed}
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
        </>
      )}
      {pickedBlocked && (
        <Notice tone="warning">
          {toName} is a contract on {destNetwork} that isn&apos;t a Safe, so
          there&apos;s no telling who controls it. Choose another address.
        </Notice>
      )}
      {picked && !pickedBlocked && (
        <label className="flex cursor-pointer items-start gap-2.5 border-t border-hairline pt-3 text-ui-caption text-muted-foreground">
          <input
            type="checkbox"
            checked={vouched}
            disabled={locked}
            onChange={(e) => setVouched(e.target.checked)}
            className="mt-0.5 size-4 shrink-0 cursor-pointer accent-(--primary)"
          />
          <span>
            I control this address on {destNetwork}. LPT bridged there can only
            be moved from it, and this can&apos;t be undone.
          </span>
        </label>
      )}
    </div>
  );
  return {
    ...settled,
    isSafe: true,
    choosing: true,
    chosen: picked?.address ?? null,
    to:
      picked && vouched && pickedKind !== undefined && !pickedBlocked
        ? picked.address
        : null,
    ui,
  };
}

/**
 * The chosen address, written out in full and checksummed: a shortened one
 * is easy to imitate, and this is where the LPT lands for good.
 */
function PickedAddress({
  address,
  title,
  kind,
}: {
  address: string;
  title?: string;
  kind: string | null;
}) {
  const { avatar } = useIdentity(address);
  return (
    <div className="flex items-start gap-3">
      <Avatar address={address} src={avatar} size={28} className="shrink-0" />
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="flex min-w-0 items-center gap-2 text-ui-body">
          <span className="truncate">{title ?? shortAddress(address)}</span>
          {kind && (
            <span className="shrink-0 rounded-full bg-hover px-1.5 py-px text-[11px] text-muted-foreground">
              {kind}
            </span>
          )}
        </span>
        <span className="font-mono text-ui-caption break-all text-muted-foreground">
          {getAddress(address)}
        </span>
      </div>
    </div>
  );
}
