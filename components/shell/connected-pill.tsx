"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";
import {
  AlertTriangle,
  ChevronDown,
  Copy,
  LogOut,
  RefreshCw,
  UserRound,
  Wallet,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useBalance, useDisconnect, useReadContract } from "wagmi";

import { Avatar, useIdentity } from "@/components/identity";
import {
  Menu,
  MenuContent,
  MenuItem,
  MenuSeparator,
  MenuTrigger,
  Skeleton,
} from "@/components/ui/misc";
import { livepeerToken } from "@/lib/abis/LivepeerToken";
import { cn } from "@/lib/cn";
import { L2_CHAIN } from "@/lib/config";
import { formatToken, fromWei, shortAddress } from "@/lib/format";
import { useConnectWallet } from "@/lib/hooks/connect";
import { useAddresses } from "@/lib/hooks/watchlist";
import { useProtocolContract } from "@/lib/staking/contracts";

/**
 * A ghost button, like "New poll": same height, radius and type as the
 * header's buttons, with no outline, so the avatar carries it.
 */
const PILL =
  "inline-flex h-8 cursor-pointer items-center gap-2 rounded-sm pr-2.5 pl-1.5 text-sm font-medium transition-colors outline-none hover:bg-hover focus-visible:ring-1 focus-visible:ring-green-bright/40 aria-expanded:bg-hover";

/** Under this, ETH on Arbitrum may not cover a transaction's gas. */
const LOW_GAS_ETH = 0.0002;

/**
 * What the wallet holds, wherever you are in the app: LPT to delegate, and
 * ETH on Arbitrum for gas, which nothing works without.
 */
function WalletBalances({ address }: { address: string }) {
  const token = useProtocolContract("LivepeerToken");
  const addr = address as `0x${string}`;
  const { data: lptWei } = useReadContract({
    address: token,
    abi: livepeerToken,
    functionName: "balanceOf",
    args: [addr],
    chainId: L2_CHAIN.id,
    query: { enabled: Boolean(token), staleTime: 60_000 },
  });
  const { data: eth } = useBalance({
    address: addr,
    chainId: L2_CHAIN.id,
    query: { staleTime: 60_000 },
  });
  const lpt = lptWei != null ? fromWei(lptWei as bigint) : null;
  const ethAmount = eth ? fromWei(eth.value) : null;
  const lowGas = ethAmount != null && ethAmount < LOW_GAS_ETH;
  // One figure per token, the network under it.
  const figure = (
    unit: string,
    value: number | null,
    note: React.ReactNode,
    warn = false
  ) => (
    <div className="flex min-w-0 flex-col gap-0.5">
      {value == null ? (
        <Skeleton className="my-0.5 h-5 w-20" />
      ) : (
        <span
          className={cn(
            "truncate text-[18px] leading-6 font-medium tracking-[-0.01em] tabular-nums",
            warn && "text-warm"
          )}
          title={warn ? "Low: may not cover gas on Arbitrum" : undefined}
        >
          {formatToken(value)}{" "}
          <span className="text-ui-caption font-normal text-muted-foreground">
            {unit}
          </span>
        </span>
      )}
      <span className="text-ui-caption text-subtle-foreground">{note}</span>
    </div>
  );
  return (
    // The menu items' inset (px-2.5), so figures and icons share an edge.
    <div className="grid grid-cols-2 gap-3 px-2.5 pt-1 pb-2">
      {figure("LPT", lpt, "On Arbitrum")}
      {figure("ETH", ethAmount, "For gas", lowGas)}
    </div>
  );
}

/** The wallet at the top of its menu: who, and its address. */
function Identity({
  address,
  name,
  avatar,
  onCopy,
}: {
  address: string;
  name: string | null | undefined;
  avatar: string | null;
  onCopy: () => void;
}) {
  return (
    <div className="flex items-center gap-2.5 px-2.5 pt-2 pb-2">
      {/* Sized to the lines beside it: two with a name, one without. */}
      <Avatar address={address} src={avatar} size={name ? 32 : 28} />
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Without a name, the address once, not twice. */}
        {name && (
          <span className="truncate text-ui-body font-medium text-foreground">
            {name}
          </span>
        )}
        <span
          className={cn(
            "font-mono",
            // Without a name, the address is its name: named size.
            name
              ? "text-[12px] text-subtle-foreground"
              : "text-[13px] font-medium text-foreground"
          )}
        >
          {shortAddress(address)}
        </span>
      </div>
      <button
        type="button"
        onClick={onCopy}
        aria-label="Copy address"
        title="Copy address"
        // Pulled out by its padding: the icon ends where the items' text does.
        className="-mr-[7px] flex size-7 shrink-0 cursor-pointer items-center justify-center rounded-md text-subtle-foreground outline-none transition-colors hover:bg-hover hover:text-foreground focus-visible:ring-1 focus-visible:ring-green-bright/40"
      >
        <Copy className="size-3.5" />
      </button>
    </div>
  );
}

function Connected({
  address,
  onSwitch,
}: {
  address: string;
  onSwitch: () => void;
}) {
  const router = useRouter();
  const { disconnect } = useDisconnect();
  const { name, avatar } = useIdentity(address);
  const { list } = useAddresses();
  const label = list.find((w) => w.address === address.toLowerCase())?.label;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(address);
      toast.success("Address copied");
    } catch {
      // clipboard blocked
    }
  };

  return (
    <Menu>
      <MenuTrigger
        render={<button type="button" className={PILL} />}
        aria-label={`Connected as ${label ?? name ?? address}`}
      >
        <span className="relative inline-flex">
          <Avatar address={address} src={avatar} size={20} />
          <span
            aria-hidden="true"
            className="absolute -right-0.5 -bottom-0.5 size-2 rounded-full border-[1.5px] border-background bg-green-fill"
          />
        </span>
        <span className="max-w-[10rem] truncate text-foreground">
          {label ?? name ?? (
            <span className="font-mono text-[12px]">
              {shortAddress(address)}
            </span>
          )}
        </span>
        <ChevronDown className="size-3 text-subtle-foreground" />
      </MenuTrigger>
      <MenuContent align="end" className="w-72">
        {/* The wallet itself; what to do with it, under a divider. */}
        <Identity
          address={address}
          name={label ?? name}
          avatar={avatar}
          onCopy={copy}
        />
        <WalletBalances address={address} />
        <MenuSeparator />
        <MenuItem onClick={() => router.push(`/accounts/${address}`)}>
          <UserRound /> View account
        </MenuItem>
        <MenuSeparator />
        <MenuItem onClick={onSwitch}>
          <RefreshCw /> Switch wallet
        </MenuItem>
        <MenuItem onClick={() => disconnect()}>
          <LogOut /> Disconnect
        </MenuItem>
      </MenuContent>
    </Menu>
  );
}

/**
 * The wallet you'd sign with, top right on desktop, apart from the sidebar's
 * switcher, which picks what the portfolio shows. With nothing connected,
 * it offers to connect, so the header is never one-sided.
 */
export function ConnectedPill() {
  // Switching disconnects first, then opens the connect screen. Held here,
  // not in Connected: disconnecting unmounts Connected, which would drop
  // the second step and leave you simply disconnected.
  const switchWallet = useConnectWallet();
  return (
    <ConnectButton.Custom>
      {({ account, chain, openChainModal, openConnectModal, mounted }) => {
        if (!mounted) return <div className="h-8" aria-hidden="true" />;
        if (!account) {
          return (
            <button
              type="button"
              onClick={openConnectModal}
              className={`${PILL} pl-2.5 text-foreground`}
            >
              <Wallet className="size-3.5 text-subtle-foreground" /> Connect
              wallet
            </button>
          );
        }
        if (chain?.unsupported) {
          return (
            <button
              type="button"
              onClick={openChainModal}
              className={`${PILL} pl-2.5 text-warm`}
            >
              <AlertTriangle className="size-3.5" /> Switch to Arbitrum
            </button>
          );
        }
        return <Connected address={account.address} onSwitch={switchWallet} />;
      }}
    </ConnectButton.Custom>
  );
}
