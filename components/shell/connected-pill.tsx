"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";
import {
  AlertTriangle,
  ArrowLeftRight,
  ChevronDown,
  Copy,
  LogOut,
  UserRound,
  Wallet,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useDisconnect } from "wagmi";

import { Avatar, useIdentity } from "@/components/identity";
import {
  Menu,
  MenuContent,
  MenuItem,
  MenuSeparator,
  MenuTrigger,
} from "@/components/ui/misc";
import { shortAddress } from "@/lib/format";
import { useConnectWallet } from "@/lib/hooks/connect";
import { useAddresses } from "@/lib/hooks/watchlist";

/**
 * A ghost button, like "New poll": same height, radius and type as the
 * header's buttons, with no outline, so the avatar carries it.
 */
const PILL =
  "inline-flex h-8 cursor-pointer items-center gap-2 rounded-sm pr-2.5 pl-1.5 text-sm font-medium transition-colors outline-none hover:bg-hover focus-visible:ring-1 focus-visible:ring-green-bright/40 aria-expanded:bg-hover";

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
      <MenuContent align="end" className="w-56">
        <div className="px-2 pt-1.5 pb-1 text-[11px] text-subtle-foreground">
          Connected · {shortAddress(address)}
        </div>
        <MenuItem onClick={() => router.push(`/accounts/${address}`)}>
          <UserRound /> View account
        </MenuItem>
        <MenuItem onClick={copy}>
          <Copy /> Copy address
        </MenuItem>
        <MenuSeparator />
        <MenuItem onClick={onSwitch}>
          <ArrowLeftRight /> Switch wallet
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
