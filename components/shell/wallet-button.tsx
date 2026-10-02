"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";
import {
  AlertTriangle,
  ArrowLeftRight,
  Check,
  ChevronsUpDown,
  Copy,
  Layers,
  LogOut,
  MoreHorizontal,
  Pencil,
  Plus,
  Trash2,
  UserRound,
  Wallet,
} from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { useDisconnect } from "wagmi";

import { Avatar, useIdentity } from "@/components/identity";
import {
  AddAddressDialog,
  RenameAddressDialog,
} from "@/components/portfolio/addresses";
import { Button } from "@/components/ui/button";
import {
  Menu,
  MenuContent,
  MenuItem,
  MenuSeparator,
  MenuSub,
  MenuSubContent,
  MenuSubTrigger,
  MenuTrigger,
} from "@/components/ui/misc";
import { cn } from "@/lib/cn";
import { formatLPT, fromWei, shortAddress } from "@/lib/format";
import { useConnectWallet } from "@/lib/hooks/connect";
import { usePortfolio } from "@/lib/hooks/queries";
import { useViewScope } from "@/lib/hooks/view-scope";
import {
  type PortfolioAccount,
  useAddresses,
  usePortfolioAccounts,
} from "@/lib/hooks/watchlist";

function AccountAvatar({
  address,
  connected,
  size,
}: {
  address: string;
  connected?: boolean;
  size: number;
}) {
  const { avatar } = useIdentity(address);
  return (
    <span className="relative inline-flex shrink-0">
      <Avatar address={address} src={avatar} size={size} />
      {connected && (
        <span
          aria-label="Connected"
          className="absolute -right-0.5 -bottom-0.5 size-2.5 rounded-full border-2 border-popover bg-green-bright"
        />
      )}
    </span>
  );
}

function AccountName({ account }: { account: PortfolioAccount }) {
  const { display } = useIdentity(account.address);
  return <>{account.label ?? display}</>;
}

function AllWalletsIcon({ size }: { size: number }) {
  return (
    <span
      className="inline-flex shrink-0 items-center justify-center rounded-full bg-hover"
      style={{ width: size, height: size }}
    >
      <Layers className="size-3.5! text-foreground!" />
    </span>
  );
}

const lpt = (v: number | null) =>
  v == null ? "…" : formatLPT(v, { compact: true });

/**
 * The portfolio switcher: picks what the portfolio shows, every address or
 * one, like a wallet app's account picker. It doesn't change the connected
 * account; acting for another address asks you to connect it.
 */
function PortfolioSwitcher({
  accounts,
  compact,
  connected,
}: {
  accounts: PortfolioAccount[];
  compact?: boolean;
  connected: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { disconnect } = useDisconnect();
  const connectWallet = useConnectWallet();
  const addresses = useMemo(() => accounts.map((a) => a.address), [accounts]);
  const [scope, setScope] = useViewScope(addresses);
  const { data } = usePortfolio(addresses);
  const [adding, setAdding] = useState(false);
  const [renaming, setRenaming] = useState<PortfolioAccount | null>(null);
  const { add, remove } = useAddresses();

  const copy = async (address: string) => {
    try {
      await navigator.clipboard.writeText(address);
      toast.success("Address copied");
    } catch {
      // clipboard blocked
    }
  };

  // Removing only makes the explorer forget the address, so offer an undo
  // rather than asking first.
  const removeAccount = (a: PortfolioAccount) => {
    // Still connected, it would be added straight back.
    if (a.connected) disconnect();
    remove(a.address);
    if (scope === a.address) setScope("all");
    toast(`Removed ${a.label ?? shortAddress(a.address)}`, {
      action: { label: "Undo", onClick: () => add(a.address, a.label) },
    });
  };

  const stakeOf = (address: string) => {
    if (!data) return null;
    const a = data.accounts.find((x) => x.id === address);
    return a ? fromWei(a.pendingStake) : 0;
  };
  const total = data ? fromWei(data.pendingStake) : null;
  const multi = accounts.length > 1;
  // One account is its own "all".
  const viewing = multi
    ? accounts.find((a) => a.address === scope)
    : accounts[0];

  const view = (next: string) => {
    setScope(next);
    if (pathname !== "/") router.push("/");
  };

  return (
    <>
      <Menu>
        <MenuTrigger
          render={
            <button
              type="button"
              aria-label="Switch portfolio"
              className={cn(
                "flex min-w-0 cursor-pointer items-center gap-2.5 rounded-sm text-left transition-colors outline-none hover:bg-hover focus-visible:ring-1 focus-visible:ring-green-bright/40 aria-expanded:bg-hover",
                compact ? "p-1" : "w-full px-2 py-2"
              )}
            />
          }
        >
          {viewing ? (
            <AccountAvatar
              address={viewing.address}
              connected={viewing.connected}
              size={compact ? 26 : 28}
            />
          ) : (
            <AllWalletsIcon size={compact ? 26 : 28} />
          )}
          {!compact && (
            <>
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="truncate text-ui-caption text-foreground">
                  {viewing ? <AccountName account={viewing} /> : "All wallets"}
                </span>
                <span className="truncate font-mono text-[11px] text-muted-foreground tabular-nums">
                  {lpt(viewing ? stakeOf(viewing.address) : total)}
                </span>
              </span>
              <ChevronsUpDown className="size-3.5 shrink-0 text-subtle-foreground" />
            </>
          )}
        </MenuTrigger>
        <MenuContent align={compact ? "end" : "start"} className="w-72">
          {multi && (
            <MenuItem className="h-auto py-2" onClick={() => view("all")}>
              <AllWalletsIcon size={28} />
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="truncate">All wallets</span>
                <span className="truncate font-mono text-[11px] text-muted-foreground tabular-nums">
                  {lpt(total)}
                </span>
              </span>
              {!viewing && <Check className="text-green-bright!" />}
            </MenuItem>
          )}
          {accounts.map((a) => (
            <div key={a.address} className="flex items-center gap-0.5">
              <MenuItem
                className="h-auto min-w-0 flex-1 py-2"
                onClick={() => view(a.address)}
              >
                <AccountAvatar
                  address={a.address}
                  connected={a.connected}
                  size={28}
                />
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate">
                    <AccountName account={a} />
                  </span>
                  <span className="truncate text-[11px] text-muted-foreground">
                    <span className="font-mono tabular-nums">
                      {lpt(stakeOf(a.address))}
                    </span>
                    {a.connected && " · Connected"}
                  </span>
                </span>
                {viewing?.address === a.address && (
                  <Check className="text-green-bright!" />
                )}
              </MenuItem>
              <MenuSub>
                <MenuSubTrigger
                  aria-label={`Actions for ${a.label ?? a.address}`}
                  className="flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-md text-muted-foreground outline-none hover:text-foreground data-highlighted:bg-hover data-popup-open:bg-hover data-popup-open:text-foreground"
                >
                  <MoreHorizontal className="size-4" />
                </MenuSubTrigger>
                <MenuSubContent>
                  <MenuItem
                    onClick={() => router.push(`/accounts/${a.address}`)}
                  >
                    <UserRound /> View account
                  </MenuItem>
                  <MenuItem onClick={() => copy(a.address)}>
                    <Copy /> Copy address
                  </MenuItem>
                  <MenuItem onClick={() => setRenaming(a)}>
                    <Pencil /> Rename…
                  </MenuItem>
                  <MenuSeparator />
                  <MenuItem
                    className="text-destructive [&_svg]:text-destructive"
                    onClick={() => removeAccount(a)}
                  >
                    <Trash2 />
                    {a.connected ? "Disconnect and remove" : "Remove"}
                  </MenuItem>
                </MenuSubContent>
              </MenuSub>
            </div>
          ))}
          <MenuSeparator />
          <MenuItem onClick={() => setAdding(true)}>
            <Plus /> Add address
          </MenuItem>
          <MenuSeparator />
          <MenuItem onClick={connectWallet}>
            {connected ? (
              <>
                <ArrowLeftRight /> Connect a different wallet
              </>
            ) : (
              <>
                <Wallet /> Connect wallet
              </>
            )}
          </MenuItem>
          {connected && (
            <MenuItem onClick={() => disconnect()}>
              <LogOut /> Disconnect
            </MenuItem>
          )}
        </MenuContent>
      </Menu>
      <AddAddressDialog
        open={adding}
        onOpenChange={setAdding}
        onAdded={(address) => view(address)}
      />
      <RenameAddressDialog
        account={renaming}
        onOpenChange={(o) => !o && setRenaming(null)}
      />
    </>
  );
}

export function WalletButton({ compact = false }: { compact?: boolean }) {
  const { accounts } = usePortfolioAccounts();
  return (
    <ConnectButton.Custom>
      {({ account, chain, openChainModal, openConnectModal, mounted }) => {
        if (!mounted) {
          return (
            <div className={compact ? "size-8" : "h-11"} aria-hidden="true" />
          );
        }
        if (account && chain?.unsupported) {
          return (
            <Button
              variant="outline"
              size={compact ? "sm" : "default"}
              onClick={openChainModal}
              className={cn("text-warm", !compact && "w-full")}
            >
              <AlertTriangle />
              Switch to Arbitrum
            </Button>
          );
        }
        if (accounts.length === 0) {
          return (
            <Button
              variant="primary"
              size={compact ? "sm" : "default"}
              onClick={openConnectModal}
              className={compact ? "" : "w-full"}
            >
              <Wallet />
              {compact ? "Connect" : "Connect wallet"}
            </Button>
          );
        }
        return (
          <PortfolioSwitcher
            accounts={accounts}
            compact={compact}
            connected={Boolean(account)}
          />
        );
      }}
    </ConnectButton.Custom>
  );
}
