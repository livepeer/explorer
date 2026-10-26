"use client";

import {
  ArrowDownToLine,
  CircleDollarSign,
  History,
  Server,
} from "lucide-react";

import { useIdentity } from "@/components/identity";
import { ClaimTrust } from "@/components/migration/claim-trust";
import { Card } from "@/components/page";
import { useStaking } from "@/components/staking/staking";
import { Button } from "@/components/ui/button";
import { formatETH, formatLPT, formatUSD, shortAddress } from "@/lib/format";
import { useOrchestrators, usePrices } from "@/lib/hooks/queries";
import { type MigrationClaim, useMigrationClaim } from "@/lib/migration/claim";

/**
 * Stake and fees a wallet still has waiting from before Livepeer moved to
 * Arbitrum (LIP-73). The people who see this delegated years ago and are
 * coming back to an app they don't know, often to a lot of LPT, so the
 * amount leads, where it's held is one click from proof, and claiming is
 * one button (the dialog handles where the stake goes).
 */

/** "24,491 LPT and 0.27 ETH", whichever parts there are. */
function amounts(c: MigrationClaim) {
  return [
    c.stake > 0 && formatLPT(c.stake),
    c.fees > 0 && formatETH(c.fees),
  ].filter(Boolean) as string[];
}

const claimable = (c: MigrationClaim | null | undefined): c is MigrationClaim =>
  Boolean(c && c.status === "claimable" && (c.stake > 0 || c.fees > 0));

/**
 * The notice, for a wallet that has a position on Arbitrum too, or among
 * several wallets. A wallet whose claim is its only position gets the claim
 * as its headline instead (ClaimHero), so this stays out of the way there.
 */
export function MigrationClaimNotice({
  account,
  canManage,
  label,
  headlined = false,
}: {
  account: string;
  canManage: boolean;
  /** The wallet's name, when the page shows several. */
  label?: boolean;
  /** The page shows this claim as its headline: don't repeat it. */
  headlined?: boolean;
}) {
  const { data: claim } = useMigrationClaim(account);
  const { open } = useStaking();
  const { name } = useIdentity(label ? account : null);
  if (!claimable(claim) || (headlined && claim.stake > 0)) return null;
  const parts = amounts(claim);

  return (
    <div className="mb-5 flex flex-col gap-3 rounded-md border border-green-bright/25 bg-green-subtle px-4 py-3 sm:flex-row sm:items-center">
      <History className="hidden size-4 shrink-0 text-green-bright sm:block" />
      <div className="flex flex-1 flex-col gap-1">
        <p className="text-ui-body text-muted-foreground">
          <span className="text-foreground tabular-nums">
            {parts.join(" and ")}
          </span>{" "}
          {label && (
            <>
              for{" "}
              <span className="text-foreground">
                {name ?? shortAddress(account)}
              </span>{" "}
            </>
          )}
          {parts.length > 1 ? "are" : "is"} waiting from before Livepeer moved
          to Arbitrum.
          {claim.pool &&
            claim.stake > claim.snapshotStake &&
            " It's kept earning since."}
        </p>
        <ClaimTrust />
      </div>
      {canManage && (
        <Button
          size="sm"
          variant="primary"
          className="shrink-0"
          onClick={() => open({ kind: "claimMigrated", account })}
        >
          Claim
        </Button>
      )}
    </div>
  );
}

/**
 * A wallet whose only position is stake waiting from Ethereum: the claim is
 * the headline, not "0 LPT, not delegated", which would contradict it,
 * with a plain explanation of what it is and why it needs claiming. Falls
 * back to the page's usual headline otherwise.
 */
export function ClaimHero({
  account,
  canManage,
  fallback,
}: {
  account: string;
  canManage: boolean;
  fallback: React.ReactNode;
}) {
  const { data: claim } = useMigrationClaim(account);
  const { data: prices } = usePrices();
  const { data: orchestrators } = useOrchestrators();
  const orchIdentity = useIdentity(claim?.poolDelegate ?? null);
  const { open } = useStaking();
  if (!claimable(claim) || claim.stake <= 0) return <>{fallback}</>;

  const earned = claim.stake - claim.snapshotStake;
  const orch = claim.poolDelegate
    ? orchestrators?.find((o) => o.id === claim.poolDelegate)
    : undefined;
  const { name: orchName } = orchIdentity;
  const orchLabel = claim.poolDelegate
    ? orchName ?? shortAddress(claim.poolDelegate)
    : null;

  // What happens on claiming, step by step, so nothing about it is a guess.
  const steps = [
    {
      icon: ArrowDownToLine,
      title: "Moves to this wallet on Arbitrum",
      text: `${formatLPT(claim.stake)}, delegated and earning from then on.`,
    },
    claim.pool
      ? {
          icon: Server,
          title: `Stays with your delegate, ${orchLabel}`,
          text: orch
            ? `${
                orch.realizedApr?.toFixed(1) ?? "—"
              }% APR · ${orch.rewardCut.toFixed(
                0
              )}% cut. You can switch any time.`
            : "It isn't active now, so switch after claiming to keep earning.",
        }
      : {
          icon: Server,
          title: "Choose a new delegate",
          text: "Your old delegate never moved to Arbitrum, so you'll pick a new one. The best reliable ones are listed first.",
        },
    claim.fees > 0 && {
      icon: CircleDollarSign,
      title: "Fees go to your wallet",
      text: `${formatETH(claim.fees)}, in the same transaction.`,
    },
  ].filter(Boolean) as {
    icon: typeof Server;
    title: string;
    text: string;
  }[];

  return (
    <Card className="relative overflow-hidden">
      <div
        className="pointer-events-none absolute inset-0"
        aria-hidden="true"
        style={{
          background:
            "radial-gradient(80% 120% at 100% 0%, color-mix(in srgb, var(--green-bright) 10%, transparent), transparent 60%)",
        }}
      />
      <div className="relative grid gap-10 p-6 sm:p-10 lg:grid-cols-[1.2fr_1fr] lg:items-center">
        <div className="flex min-w-0 flex-col gap-5">
          <div className="flex flex-col gap-2">
            <span className="flex items-center gap-1.5 text-ui-caption text-green-bright">
              <History className="size-3.5" /> Waiting from Ethereum
            </span>
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <span className="text-display-md font-light tracking-[-0.02em] tabular-nums">
                {formatLPT(claim.stake).replace(" LPT", "")}
              </span>
              <span className="text-[20px] font-light text-muted-foreground">
                LPT
              </span>
            </div>
            {prices?.lpt != null && (
              <span className="text-ui-body text-muted-foreground tabular-nums">
                {formatUSD(claim.stake * prices.lpt)}
              </span>
            )}
          </div>
          {/* What this is and why it needs a claim, in plain words. */}
          <p className="max-w-[48ch] text-[15px] leading-6 text-pretty text-muted-foreground">
            When Livepeer moved from Ethereum to Arbitrum in 2022, delegated
            stake had to be claimed on Arbitrum to carry over. Yours hasn&apos;t
            been claimed yet.
            {claim.pool &&
              earned > 0 &&
              ` It was ${formatLPT(
                claim.snapshotStake
              )} then and has grown to ${formatLPT(
                claim.stake
              )} from rewards since.`}
          </p>
          {canManage && (
            <Button
              variant="primary"
              size="lg"
              className="self-start"
              onClick={() => open({ kind: "claimMigrated", account })}
            >
              Claim {formatLPT(claim.stake)}
            </Button>
          )}
        </div>

        <div className="flex flex-col gap-4">
          <span className="text-ui-caption text-muted-foreground">
            When you claim
          </span>
          <ul className="flex flex-col gap-4">
            {steps.map(({ icon: Icon, title, text }) => (
              <li key={title} className="flex gap-3">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-md border border-hairline bg-background/50 text-muted-foreground light:bg-card">
                  <Icon className="size-4" />
                </span>
                <span className="flex min-w-0 flex-col gap-0.5">
                  <span className="truncate text-ui-body font-medium">
                    {title}
                  </span>
                  <span className="text-ui-caption text-muted-foreground">
                    {text}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
      {/* Sources, out of the way of the button: where the funds are, and
          the proposal that put them there. */}
      <div className="relative border-t border-hairline px-6 py-3.5 sm:px-10">
        <ClaimTrust />
      </div>
    </Card>
  );
}
