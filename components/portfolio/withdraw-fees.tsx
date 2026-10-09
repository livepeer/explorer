"use client";

import { ArrowDownToLine, ChevronDown } from "lucide-react";

import { Avatar, useIdentity } from "@/components/identity";
import { Button } from "@/components/ui/button";
import { Menu, MenuContent, MenuItem, MenuTrigger } from "@/components/ui/misc";
import { Tooltip } from "@/components/ui/tooltip";
import { formatETH, shortAddress } from "@/lib/format";

import type { Position } from "./positions";

function WalletName({ position }: { position: Position }) {
  const { name } = useIdentity(position.account.address);
  return (
    <>
      {position.account.label ?? name ?? shortAddress(position.account.address)}
    </>
  );
}

/**
 * Withdrawing fees is one transaction per wallet, signed by that wallet, so
 * the button says what it will actually withdraw: everything when all the
 * fees shown are in one connected wallet, that wallet's share when others
 * hold some too, and a choice when several connected wallets have fees.
 */
export function WithdrawFees({
  withdrawable,
  totalFees,
  onWithdraw,
}: {
  /** Connected wallets with fees, most first. */
  withdrawable: Position[];
  /** Fees across every wallet in view, ETH. */
  totalFees: number;
  onWithdraw: (p: Position) => void;
}) {
  if (!withdrawable.length) return null;

  const pill = "rounded-full";

  if (withdrawable.length > 1) {
    return (
      <Menu>
        <MenuTrigger
          render={<Button size="xs" variant="outline" className={pill} />}
        >
          <ArrowDownToLine /> Withdraw
          <ChevronDown className="size-3 opacity-60" />
        </MenuTrigger>
        <MenuContent align="start" className="w-64">
          {withdrawable.map((p) => (
            <MenuItem key={p.account.address} onClick={() => onWithdraw(p)}>
              <Avatar address={p.account.address} size={18} />
              <span className="min-w-0 flex-1 truncate">
                <WalletName position={p} />
              </span>
              <span className="font-mono text-[12px] text-muted-foreground tabular-nums">
                {formatETH(p.fees)}
              </span>
            </MenuItem>
          ))}
        </MenuContent>
      </Menu>
    );
  }

  const [only] = withdrawable;
  // All of it, allowing for rounding in the sum.
  const everything = only.fees >= totalFees * 0.999;
  const button = (
    <Button
      size="xs"
      variant="outline"
      className={pill}
      onClick={() => onWithdraw(only)}
    >
      <ArrowDownToLine />
      {everything ? "Withdraw" : `Withdraw ${formatETH(only.fees)}`}
    </Button>
  );
  if (everything) return button;
  return (
    <Tooltip
      content={
        <>
          From <WalletName position={only} />. The rest is in wallets you
          haven&apos;t connected; connect one to withdraw its fees.
        </>
      }
    >
      {button}
    </Tooltip>
  );
}
