"use client";

import { Plus, Wallet, X } from "lucide-react";
import { useState } from "react";
import { useAccount } from "wagmi";

import { Avatar, useIdentity } from "@/components/identity";
import { Button } from "@/components/ui/button";
import { Tooltip } from "@/components/ui/tooltip";
import { cn } from "@/lib/cn";
import { shortAddress } from "@/lib/format";
import { useConnectWallet } from "@/lib/hooks/connect";
import { type PortfolioAccount, useAddresses } from "@/lib/hooks/watchlist";

import { AddAddressDialog } from "./addresses";

function Chip({
  active,
  onClick,
  children,
  onRemove,
  removeLabel,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  onRemove?: () => void;
  removeLabel?: string;
}) {
  return (
    <span
      className={cn(
        "group inline-flex h-8 items-center rounded-full border text-ui-caption transition-colors",
        active
          ? "border-foreground/20 bg-active text-foreground"
          : "border-hairline text-muted-foreground hover:border-border hover:text-foreground"
      )}
    >
      <button
        type="button"
        aria-pressed={active}
        onClick={onClick}
        className={cn(
          "flex h-full cursor-pointer items-center gap-2 rounded-full pl-1.5 outline-none focus-visible:ring-1 focus-visible:ring-green-bright/40",
          onRemove ? "pr-1" : "pr-3"
        )}
      >
        {children}
      </button>
      {onRemove && (
        <Tooltip content={removeLabel ?? "Remove"}>
          <button
            type="button"
            aria-label={removeLabel ?? "Remove"}
            onClick={onRemove}
            className="mr-1 inline-flex size-6 cursor-pointer items-center justify-center rounded-full text-subtle-foreground opacity-60 transition hover:bg-hover hover:text-foreground group-hover:opacity-100"
          >
            <X className="size-3" />
          </button>
        </Tooltip>
      )}
    </span>
  );
}

function AccountChip({
  account,
  active,
  onSelect,
  onRemove,
}: {
  account: PortfolioAccount;
  active: boolean;
  onSelect: () => void;
  onRemove?: () => void;
}) {
  const { name, avatar } = useIdentity(account.address);
  return (
    <Chip
      active={active}
      onClick={onSelect}
      onRemove={onRemove}
      removeLabel="Remove from portfolio"
    >
      <Avatar address={account.address} src={avatar} size={20} />
      <span
        className={cn(!account.label && !name && "font-mono text-[11.5px]")}
      >
        {account.label ?? name ?? shortAddress(account.address)}
      </span>
      {account.connected && (
        <span
          aria-label="Connected"
          className="size-1.5 rounded-full bg-green-bright"
        />
      )}
    </Chip>
  );
}

/**
 * Header for the portfolio: what you're viewing (chosen in the sidebar
 * switcher) on the left, ways to add accounts on the right.
 */
export function ScopeBar({
  accounts,
  scope,
  onScope,
}: {
  accounts: PortfolioAccount[];
  scope: string;
  onScope: (s: string) => void;
}) {
  const { remove } = useAddresses();
  const { isConnected } = useAccount();
  const connectWallet = useConnectWallet();
  const [adding, setAdding] = useState(false);
  const selected = accounts.find((a) => a.address === scope);

  return (
    <div className="flex flex-wrap items-center justify-between gap-2">
      <div className="flex min-w-0 items-center gap-2">
        {selected ? (
          <>
            <AccountChip
              account={selected}
              active
              onSelect={() => {}}
              onRemove={
                // The connected address would be added straight back.
                selected.connected
                  ? undefined
                  : () => {
                      remove(selected.address);
                      onScope("all");
                    }
              }
            />
            {accounts.length > 1 && (
              <Button
                variant="ghost"
                size="sm"
                className="rounded-full"
                onClick={() => onScope("all")}
              >
                Show all wallets
              </Button>
            )}
          </>
        ) : (
          <span className="text-ui-body text-muted-foreground">
            {accounts.length > 1
              ? `All wallets · ${accounts.length}`
              : "1 wallet"}
          </span>
        )}
      </div>
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setAdding(true)}
          className="rounded-full"
        >
          <Plus /> Add address
        </Button>
        {!isConnected && (
          <Button
            variant="ghost"
            size="sm"
            onClick={connectWallet}
            className="rounded-full"
          >
            <Wallet /> Connect wallet
          </Button>
        )}
      </div>
      <AddAddressDialog
        open={adding}
        onOpenChange={setAdding}
        onAdded={(address) => onScope(address)}
      />
    </div>
  );
}
