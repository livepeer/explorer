"use client";

import { ExternalLink, History, Loader2 } from "lucide-react";

import { Avatar, Identity, useIdentity } from "@/components/identity";
import { Card } from "@/components/page";
import { useStaking } from "@/components/staking/staking";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { formatETH, formatLPT, fromWei, shortAddress } from "@/lib/format";
import { type MigrationClaim, useMigrationClaim } from "@/lib/migration/claim";
import {
  type L1Leftovers,
  type MigrationKind,
  retryableUrl,
} from "@/lib/migration/l1";

import { ClaimTrust } from "./claim-trust";
import {
  useL1Leftovers,
  useMigrate,
  useSentMigration,
  useSentMigrations,
} from "./migrate";

/*
 * Everything an address has left from before Livepeer moved to Arbitrum:
 * delegated stake to claim (already held on Arbitrum), and anything to
 * migrate (still on Ethereum). One list of items, shown two ways: full
 * rows where it's the page's subject (a wallet with nothing
 * on Arbitrum yet), compact lines where it sits above a portfolio.
 */

/**
 * Where the funds are now: still on Ethereum (migrated with a transaction
 * there), or already held on Arbitrum by the migration contract (claimed).
 */
type Held = "ethereum" | "arbitrum";

type WaitingItem = {
  key: string;
  title: string;
  held: Held;
  amount: string;
  /** How it arrives, for full rows; the dialogs say it otherwise. */
  lands: React.ReactNode;
  action: React.ReactNode;
};

/** The items for one address: its claim first, then what's to migrate. */
function useWaitingItems(
  account: string,
  leftovers: L1Leftovers | undefined,
  claim: MigrationClaim | null | undefined
): WaitingItem[] {
  const { open } = useStaking();
  const lockDelegate = useIdentity(leftovers?.locks?.delegate ?? null);
  const poolDelegate = useIdentity(claim?.poolDelegate ?? null);
  const items: WaitingItem[] = [];

  if (claim?.status === "claimable" && (claim.stake > 0 || claim.fees > 0)) {
    // What a pooled claim has earned since the snapshot, so a bigger
    // number than they remember isn't a surprise.
    const grown =
      claim.pool && claim.stake - claim.snapshotStake >= 0.01
        ? ` It was ${formatLPT(
            claim.snapshotStake
          )} in 2022 and has grown from rewards since.`
        : "";
    const fees =
      claim.fees >= 0.001 ? ` Plus ${formatETH(claim.fees)} in fees.` : "";
    items.push({
      key: "claim",
      title: "Delegated stake",
      held: "arbitrum",
      amount: claim.stake > 0 ? formatLPT(claim.stake) : formatETH(claim.fees),
      lands: (
        <span className="flex flex-col gap-2">
          <span>
            {claim.poolDelegate
              ? `Claimed into this wallet, still delegated to ${
                  poolDelegate.name ?? shortAddress(claim.poolDelegate)
                }.`
              : "Claimed into this wallet, delegated to an orchestrator you choose."}
            {grown}
            {fees}
          </span>
          {/* Proof it's real, one click away: a returning delegator being
              asked to claim LPT has every reason to want it. */}
          <ClaimTrust />
        </span>
      ),
      action: (
        <Button
          size="sm"
          variant="primary"
          className="min-w-24"
          onClick={() => open({ kind: "claimMigrated", account })}
        >
          Claim
        </Button>
      ),
    });
  }
  if (leftovers?.locks) {
    items.push({
      key: "locks",
      title: "Undelegated stake",
      held: "ethereum",
      amount: formatLPT(fromWei(leftovers.locks.total)),
      lands: `Arrives delegated to ${
        lockDelegate.name ?? shortAddress(leftovers.locks.delegate)
      }, ready to unstake or move.`,
      action: <MigrateAction account={account} kind="locks" />,
    });
  }
  if (leftovers?.orchestrator) {
    items.push({
      key: "orchestrator",
      title: "Orchestrator stake",
      held: "ethereum",
      amount: formatLPT(fromWei(leftovers.orchestrator.own)),
      lands: "Arrives staked to this orchestrator, with its fees.",
      action: <MigrateAction account={account} kind="orchestrator" />,
    });
  }
  if (leftovers?.sender) {
    items.push({
      key: "sender",
      title: "Broadcaster funds",
      held: "ethereum",
      amount: formatETH(
        fromWei(leftovers.sender.deposit + leftovers.sender.reserve)
      ),
      lands: "Arrives as the same deposit and reserve.",
      action: <MigrateAction account={account} kind="sender" />,
    });
  }
  return items;
}

/** Migrate, or "on its way" once sent from this browser. */
function MigrateAction({
  account,
  kind,
}: {
  account: string;
  kind: MigrationKind;
}) {
  const { open } = useMigrate();
  const sent = useSentMigration(account, kind);
  if (sent) {
    return (
      <a
        href={retryableUrl(sent.l1Tx)}
        target="_blank"
        rel="noreferrer"
        className="inline-flex items-center gap-1.5 text-ui-caption text-muted-foreground hover:text-foreground"
      >
        <Loader2 className="size-3 animate-spin" /> On its way
        <ExternalLink className="size-3" />
      </a>
    );
  }
  return (
    <Button
      size="sm"
      variant="primary"
      className="min-w-24"
      onClick={() => open({ account, kind })}
    >
      Migrate
    </Button>
  );
}

/** Where the funds are, next to what they are. */
function HeldTag({ held }: { held: Held }) {
  return (
    <span
      className={cn(
        "shrink-0 rounded-full px-1.5 py-px text-[11px] leading-4",
        held === "arbitrum"
          ? "bg-green-subtle text-green-bright"
          : "bg-hover text-muted-foreground"
      )}
    >
      {held === "arbitrum" ? "Held on Arbitrum" : "On Ethereum"}
    </span>
  );
}

/**
 * A full row, for where this is the page's subject: the amount large, how
 * it arrives, and the button.
 */
function ItemRow({
  title,
  held,
  amount,
  lands,
  action,
}: Omit<WaitingItem, "key">) {
  const i = amount.lastIndexOf(" ");
  // "12,676 LPT": the number leads, the unit steps back.
  const [value, unit] =
    i > 0 ? [amount.slice(0, i), amount.slice(i + 1)] : [amount, ""];
  return (
    <li className="flex flex-wrap items-center gap-x-6 gap-y-4 px-6 py-5">
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="flex items-center gap-2 text-ui-caption text-muted-foreground">
          {title}
          <HeldTag held={held} />
        </span>
        <span className="flex items-baseline gap-1.5">
          <span className="text-[28px] leading-none font-light tracking-[-0.02em] tabular-nums">
            {value}
          </span>
          <span className="text-[15px] font-light text-muted-foreground">
            {unit}
          </span>
        </span>
        <span className="mt-1 text-ui-caption text-pretty text-muted-foreground">
          {lands}
        </span>
      </div>
      <div className="shrink-0">{action}</div>
    </li>
  );
}

/**
 * A compact line, for above a portfolio: what it is and where, whose (with
 * several wallets), how much, and the button. The dialogs explain the rest.
 */
function CompactRow({
  item: { title, held, amount, action },
  account,
}: {
  item: WaitingItem;
  /** The wallet, when the card covers several. */
  account: string | null;
}) {
  return (
    // Phones: the amount sits under the label, so the button keeps its line.
    <li className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 px-5 py-3.5 sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:px-6">
      <div className="flex min-w-0 flex-col gap-1">
        <span className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-ui-body">
          {title}
          <HeldTag held={held} />
        </span>
        <span className="text-[15px] tabular-nums sm:hidden">{amount}</span>
        {account && <WalletName address={account} />}
      </div>
      <span className="hidden text-right text-[15px] tabular-nums sm:block">
        {amount}
      </span>
      <div className="flex justify-end">{action}</div>
    </li>
  );
}

function WalletName({ address }: { address: string }) {
  const { name, avatar } = useIdentity(address);
  return (
    <span className="flex min-w-0 items-center gap-1.5 text-ui-caption text-muted-foreground">
      <Avatar address={address} src={avatar} size={14} />
      <span className="truncate">{name ?? shortAddress(address)}</span>
    </span>
  );
}

/** One wallet's items, in the card's style. Nothing waiting, nothing. */
function AccountSection({
  account,
  several,
  compact,
}: {
  account: string;
  several: boolean;
  compact: boolean;
}) {
  const sent = useSentMigrations(account);
  // Sent from here: check until Arbitrum has it.
  const { data: leftovers } = useL1Leftovers(account, {
    poll: sent.length > 0,
  });
  const { data: claim } = useMigrationClaim(account);
  const items = useWaitingItems(account, leftovers, claim);
  if (!items.length) return null;
  if (compact) {
    return (
      <>
        {items.map((item) => (
          <CompactRow
            key={`${account}-${item.key}`}
            item={item}
            account={several ? account : null}
          />
        ))}
      </>
    );
  }
  return (
    <li>
      {several && (
        <div className="-mb-1 px-6 pt-5">
          <Identity address={account} size={20} />
        </div>
      )}
      <ul className="divide-y divide-(--hairline)">
        {items.map(({ key, ...item }) => (
          <ItemRow key={key} {...item} />
        ))}
      </ul>
    </li>
  );
}

/**
 * On account pages and the portfolio: everything the shown wallets have
 * left from before the move to Arbitrum, in one card that hides itself
 * when there's nothing. Compact above a portfolio; full when it's the
 * page's headline (a wallet with nothing on Arbitrum yet).
 */
export function FromEthereumCard({
  accounts,
  headline = false,
  className,
}: {
  accounts: string[];
  /** It's the page's main content: full rows, not compact lines. */
  headline?: boolean;
  className?: string;
}) {
  const several = accounts.length > 1;
  return (
    // Hidden until a wallet has a row: each section decides for itself.
    <Card className={cn("mb-5 overflow-hidden not-has-[li]:hidden", className)}>
      <div
        className={cn(
          "flex items-start gap-3 border-b border-hairline px-5 sm:px-6",
          headline ? "py-4" : "py-3.5"
        )}
      >
        <History className="mt-0.5 size-4 shrink-0 text-green-bright" />
        <div className="flex min-w-0 flex-col gap-0.5">
          {/* Many who see this left in 2022 and missed the move: say what
              happened and what to do, in plain words. The rows' tags and
              buttons say which item needs which. */}
          <span className="text-ui-body font-medium">
            Finish moving to Arbitrum
          </span>
          <span className="text-ui-caption text-pretty text-muted-foreground">
            Livepeer moved from Ethereum to Arbitrum in 2022. These haven&apos;t
            come over yet. Claim or migrate each one to use it.
          </span>
        </div>
      </div>
      <ul className="divide-y divide-(--hairline)">
        {accounts.map((a) => (
          <AccountSection
            key={a}
            account={a.toLowerCase()}
            several={several}
            compact={!headline}
          />
        ))}
      </ul>
    </Card>
  );
}
