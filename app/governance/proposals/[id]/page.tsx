"use client";

import { FileText } from "lucide-react";
import { useParams } from "next/navigation";

import {
  BackLink,
  DetailHeader,
  DetailItem,
  DetailLayout,
  DetailList,
  DetailSkeleton,
  DetailTabs,
  RailSection,
  useDetailTab,
} from "@/components/governance/detail";
import { PlainMarkdown } from "@/components/governance/markdown";
import {
  formatDateTime,
  GOVERNOR_STATES,
  type Outcome,
  proposalDocument,
  proposalMajority,
  proposalPhase,
  proposalWindow,
  roundStartsAt,
  timeCopy,
} from "@/components/governance/model";
import {
  ProposalVoteForm,
  useProposalState,
  useProposalThresholds,
} from "@/components/governance/proposal-vote";
import {
  proposalSeries,
  TallyBar,
  TallyLegend,
} from "@/components/governance/tally";
import { useVoteElectorate, VotesPanel } from "@/components/governance/votes";
import { CopyButton, Identity } from "@/components/identity";
import { Card, EmptyState, ErrorNotice, Page } from "@/components/page";
import { useNow } from "@/components/shell/round-clock";
import { Badge } from "@/components/ui/badge";
import { StatusDot } from "@/components/ui/misc";
import { formatLPT, formatPercent, shortAddress } from "@/lib/format";
import {
  useGovernance,
  useProposalVotes,
  useProtocol,
} from "@/lib/hooks/queries";

const TABS = ["description", "votes"] as const;
import type { Protocol } from "@/lib/subgraph/network";

/** Exact start time for recent rounds, otherwise an estimate from round length. */
function roundTime(protocol: Protocol, round: number) {
  const known = protocol.recentRounds.find((r) => r.round === round);
  return known
    ? { ts: known.ts, exact: true }
    : { ts: roundStartsAt(protocol, round), exact: false };
}

export default function ProposalPage() {
  const params = useParams<{ id: string }>();
  const id = decodeURIComponent(params.id ?? "");
  const governance = useGovernance();
  const protocol = useProtocol();
  const nowMs = useNow(30_000);
  const proposal = governance.data?.proposals.find((p) => p.id === id);
  const chainState = useProposalState(proposal);
  const thresholds = useProposalThresholds(
    proposal,
    protocol.data?.currentRound
  );
  const [tab, setTab] = useDetailTab(TABS, "description");
  const votes = useProposalVotes(proposal ? proposal.id : undefined);
  // Voting power is fixed at the proposal's start round.
  const electorate = useVoteElectorate(
    proposal &&
      protocol.data &&
      proposal.voteStart <= protocol.data.currentRound
      ? { round: proposal.voteStart }
      : null
  );

  if (governance.error || protocol.error) {
    return (
      <Page>
        <BackLink />
        <ErrorNotice
          error={governance.error ?? protocol.error}
          onRetry={() => {
            if (governance.error) governance.refetch();
            if (protocol.error) protocol.refetch();
          }}
        />
      </Page>
    );
  }
  if (!governance.data || !protocol.data) return <DetailSkeleton />;

  if (!proposal) {
    return (
      <Page>
        <BackLink />
        <Card>
          <EmptyState
            icon={<FileText />}
            title="Proposal not found"
            description="There's no treasury proposal with this ID in the subgraph. It may not be indexed yet."
          />
        </Card>
      </Page>
    );
  }

  const p = protocol.data;
  const { title, body } = proposalDocument(proposal.description);
  const onChain = chainState != null ? GOVERNOR_STATES[chainState] : undefined;
  const phase = onChain?.phase ?? proposalPhase(proposal, p.currentRound);
  const { opensAt, closesAt } = proposalWindow(proposal, p);
  const series = proposalSeries(proposal);
  const total = series.reduce((s, x) => s + x.value, 0);

  const outcome: Outcome =
    onChain ??
    (phase === "active"
      ? { label: "Active", tone: "positive" }
      : phase === "pending"
      ? { label: "Pending", tone: "neutral" }
      : proposalMajority(proposal));

  const snapshot = roundTime(p, proposal.voteStart + 1);
  const end = roundTime(p, proposal.voteEnd + 1);

  return (
    <Page>
      <BackLink />
      <DetailHeader
        eyebrow="Treasury proposal"
        status={
          <Badge tone={outcome.tone}>
            {phase === "active" && <StatusDot pulse className="mr-0.5" />}
            {outcome.label}
          </Badge>
        }
        title={title}
      />

      <DetailLayout
        rail={
          <>
            <RailSection title="Votes">
              <Card className="flex flex-col gap-4 p-4">
                <div className="flex items-baseline justify-between gap-3">
                  <span className="text-ui-caption text-muted-foreground">
                    {timeCopy(
                      phase,
                      phase === "pending" ? opensAt : closesAt,
                      nowMs
                    )}
                  </span>
                  <span className="font-mono text-ui-caption text-muted-foreground tabular-nums">
                    {formatLPT(total)}
                  </span>
                </div>
                <TallyBar series={series} className="h-2.5" />
                <TallyLegend series={series} />
                {phase === "active" && (
                  <div className="-mx-4 border-t border-hairline px-4 pt-4">
                    <ProposalVoteForm proposal={proposal} />
                  </div>
                )}
                {phase === "pending" && (
                  <p className="-mx-4 border-t border-hairline px-4 pt-4 text-ui-caption text-muted-foreground">
                    Voting opens when round{" "}
                    {(proposal.voteStart + 1).toLocaleString()} starts. Voting
                    power is your stake at round{" "}
                    {proposal.voteStart.toLocaleString()}.
                  </p>
                )}
              </Card>
            </RailSection>

            <RailSection title="Details">
              <Card>
                <DetailList>
                  <DetailItem label="Proposer" mono={false}>
                    <Identity address={proposal.proposer} size={18} />
                  </DetailItem>
                  <DetailItem label="On-chain state" mono={false}>
                    {onChain?.label ?? "—"}
                  </DetailItem>
                  <DetailItem
                    label="Voting starts"
                    sub={`${snapshot.exact ? "" : "~"}${formatDateTime(
                      snapshot.ts
                    )}`}
                  >
                    Round {(proposal.voteStart + 1).toLocaleString()}
                  </DetailItem>
                  <DetailItem
                    label="Voting ends"
                    sub={`${end.exact ? "" : "~"}${formatDateTime(end.ts)}`}
                  >
                    Round {proposal.voteEnd.toLocaleString()}
                  </DetailItem>
                  <DetailItem label="Quorum" sub="of voting power must vote">
                    {thresholds
                      ? formatPercent(thresholds.quorum, { decimals: 2 })
                      : "—"}
                  </DetailItem>
                  {thresholds && phase !== "pending" && (
                    <DetailItem
                      label="Participation"
                      sub={
                        <span
                          className={
                            thresholds.quorumReached
                              ? "text-green-bright"
                              : undefined
                          }
                        >
                          {thresholds.quorumReached
                            ? "Quorum reached"
                            : phase === "active"
                            ? "Below quorum so far"
                            : "Quorum not reached"}
                        </span>
                      }
                    >
                      {formatPercent(thresholds.participation, {
                        decimals: 2,
                      })}
                    </DetailItem>
                  )}
                  <DetailItem
                    label="Quota"
                    sub="of For and Against votes must be For"
                  >
                    {thresholds
                      ? formatPercent(thresholds.quota, { decimals: 2 })
                      : "—"}
                  </DetailItem>
                  {phase !== "pending" && (
                    <DetailItem
                      label="For share"
                      sub="Abstain votes don't count"
                    >
                      {thresholds?.forShare != null
                        ? formatPercent(thresholds.forShare)
                        : "—"}
                    </DetailItem>
                  )}
                  <DetailItem label="Total votes">
                    {formatLPT(proposal.totalVotes)}
                  </DetailItem>
                  <DetailItem label="Proposal ID">
                    <span className="inline-flex items-center gap-1">
                      <span title={proposal.id}>
                        {shortAddress(proposal.id, 6, 6)}
                      </span>
                      <CopyButton
                        value={proposal.id}
                        label="Copy proposal ID"
                      />
                    </span>
                  </DetailItem>
                </DetailList>
              </Card>
            </RailSection>
          </>
        }
        main={
          <>
            <DetailTabs
              value={tab}
              onChange={setTab}
              options={[
                { value: "description", label: "Description" },
                {
                  value: "votes",
                  label: votes.data
                    ? `Votes · ${votes.data.length.toLocaleString()}`
                    : "Votes",
                },
              ]}
            />
            {tab === "votes" ? (
              <VotesPanel
                votes={votes.data}
                isLoading={votes.isLoading}
                error={votes.error}
                onRetry={() => votes.refetch()}
                series={series}
                electorate={electorate}
              />
            ) : (
              <Card className="p-5 sm:p-6">
                {body ? (
                  <PlainMarkdown source={body} />
                ) : (
                  <p className="text-ui-body text-muted-foreground">
                    This proposal has no description beyond its title.
                  </p>
                )}
              </Card>
            )}
          </>
        }
      />
    </Page>
  );
}
