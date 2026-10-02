"use client";

import { ExternalLink, Vote } from "lucide-react";
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
  type Outcome,
  pollEndsAt,
  pollMajority,
  pollPhase,
  pollTitle,
  timeCopy,
  useL1Block,
  usePollDocument,
} from "@/components/governance/model";
import {
  pollSeries,
  TallyBar,
  TallyLegend,
} from "@/components/governance/tally";
import { PollVoteForm } from "@/components/governance/vote-form";
import { useVoteElectorate, VotesPanel } from "@/components/governance/votes";
import { CopyButton } from "@/components/identity";
import { Card, EmptyState, ErrorNotice, Page } from "@/components/page";
import { useNow } from "@/components/shell/round-clock";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton, StatusDot } from "@/components/ui/misc";
import { addressUrl } from "@/lib/config";
import { formatLPT, formatPercent, shortAddress } from "@/lib/format";
import { useGovernance, usePollVotes, useProtocol } from "@/lib/hooks/queries";

const TABS = ["proposal", "votes"] as const;

const LINK =
  "inline-flex items-center gap-1 hover:text-foreground hover:underline underline-offset-4";

export default function PollPage() {
  const params = useParams<{ id: string }>();
  const id = decodeURIComponent(params.id ?? "").toLowerCase();
  const governance = useGovernance();
  const protocol = useProtocol();
  const { block: l1Block, isLoading: blockLoading } = useL1Block();
  const nowMs = useNow(30_000);
  const poll = governance.data?.polls.find((p) => p.id.toLowerCase() === id);
  const doc = usePollDocument(poll?.proposal);
  const [tab, setTab] = useDetailTab(TABS, "proposal");
  const votes = usePollVotes(poll ? poll.id : undefined);
  // Ended polls are measured against the active set when they closed.
  const electorate = useVoteElectorate(
    poll && pollPhase(poll, l1Block) === "ended"
      ? { block: poll.endBlock }
      : null
  );

  if (governance.error) {
    return (
      <Page>
        <BackLink href="/governance?tab=polls" />
        <ErrorNotice
          error={governance.error}
          onRetry={() => governance.refetch()}
        />
      </Page>
    );
  }
  if (!governance.data || blockLoading) return <DetailSkeleton />;

  if (!poll) {
    return (
      <Page>
        <BackLink href="/governance?tab=polls" />
        <Card>
          <EmptyState
            icon={<Vote />}
            title="Poll not found"
            description="There's no LIP poll at this address in the subgraph. It may not be indexed yet."
          />
        </Card>
      </Page>
    );
  }

  const phase = pollPhase(poll, l1Block);
  const endsAt = pollEndsAt(poll, l1Block, nowMs);
  const series = pollSeries(poll);
  const voted = poll.yes + poll.no;
  const yesShare = voted > 0 ? (poll.yes / voted) * 100 : null;
  // Participation against the active stake the poll is measured against:
  // today's while open, the closing round's once ended.
  const electorateStake = electorate?.fallback
    ? null
    : electorate?.orchestrators.reduce((s, o) => s + o.totalStake, 0) ?? null;
  const activeStake =
    phase === "active"
      ? protocol.data?.totalActiveStake ?? electorateStake
      : electorateStake;
  const participation =
    activeStake && activeStake > 0 ? (voted / activeStake) * 100 : null;

  const outcome: Outcome =
    phase === "active"
      ? { label: "Active", tone: "positive" }
      : phase === "ended"
      ? pollMajority(poll)
      : { label: "Status unknown", tone: "neutral" };

  const lipUrl =
    doc.data?.lip != null
      ? `https://github.com/livepeer/LIPs/blob/${
          doc.data.commitHash ?? "master"
        }/LIPs/LIP-${doc.data.lip}.md`
      : null;

  const timing =
    endsAt != null && phase !== "unknown"
      ? timeCopy(phase, endsAt, nowMs)
      : `Ends at block ${poll.endBlock.toLocaleString()}`;

  return (
    <Page>
      <BackLink href="/governance?tab=polls" />
      <DetailHeader
        eyebrow={doc.data?.lip ? `LIP-${doc.data.lip} poll` : "LIP poll"}
        status={
          <Badge tone={outcome.tone}>
            {phase === "active" && <StatusDot pulse className="mr-0.5" />}
            {outcome.label}
          </Badge>
        }
        loading={doc.isLoading}
        title={doc.data?.title ?? pollTitle(poll, undefined)}
      />

      <DetailLayout
        rail={
          <>
            <RailSection title="Votes">
              <Card className="flex flex-col gap-4 p-4">
                <div className="flex items-baseline justify-between gap-3">
                  <span className="text-ui-caption text-muted-foreground">
                    {timing}
                  </span>
                  <span className="font-mono text-ui-caption text-muted-foreground tabular-nums">
                    {formatLPT(voted)}
                  </span>
                </div>
                <TallyBar series={series} className="h-2.5" />
                <TallyLegend series={series} />
                {phase === "active" && (
                  <div className="-mx-4 border-t border-hairline px-4 pt-4">
                    <PollVoteForm pollAddress={poll.id} />
                  </div>
                )}
              </Card>
            </RailSection>

            <RailSection title="Details">
              <Card>
                <DetailList>
                  <DetailItem
                    label={phase === "ended" ? "Ended" : "Ends"}
                    sub={
                      endsAt != null ? `~${formatDateTime(endsAt)}` : undefined
                    }
                  >
                    Block {poll.endBlock.toLocaleString()}
                  </DetailItem>
                  <DetailItem label="Quorum" sub="of active stake must vote">
                    {formatPercent(poll.quorum, { decimals: 2 })}
                  </DetailItem>
                  {participation != null && (
                    <DetailItem
                      label="Participation"
                      sub={
                        <span
                          className={
                            participation >= poll.quorum
                              ? "text-green-bright"
                              : undefined
                          }
                        >
                          {participation >= poll.quorum
                            ? "Quorum reached"
                            : phase === "active"
                            ? "Below quorum so far"
                            : "Quorum not reached"}
                        </span>
                      }
                    >
                      {formatPercent(participation, { decimals: 2 })}
                    </DetailItem>
                  )}
                  <DetailItem label="Quota" sub="of votes must be yes">
                    {formatPercent(poll.quota, { decimals: 2 })}
                  </DetailItem>
                  <DetailItem label="Yes share">
                    {yesShare != null ? formatPercent(yesShare) : "—"}
                  </DetailItem>
                  <DetailItem label="Voters">
                    {poll.voteCount.toLocaleString()}
                  </DetailItem>
                  <DetailItem label="Poll contract">
                    <span className="inline-flex items-center gap-1">
                      <a
                        href={addressUrl(poll.id)}
                        target="_blank"
                        rel="noreferrer"
                        className={LINK}
                      >
                        {shortAddress(poll.id)}
                      </a>
                      <CopyButton value={poll.id} />
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
                { value: "proposal", label: "Proposal" },
                {
                  value: "votes",
                  label: `Votes · ${poll.voteCount.toLocaleString()}`,
                },
              ]}
              action={
                tab === "proposal" && lipUrl ? (
                  <a
                    href={lipUrl}
                    target="_blank"
                    rel="noreferrer"
                    className={`${LINK} text-ui-caption text-muted-foreground`}
                  >
                    View on GitHub <ExternalLink className="size-3" />
                  </a>
                ) : undefined
              }
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
                {doc.isLoading ? (
                  <div className="flex flex-col gap-3">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-11/12" />
                    <Skeleton className="h-4 w-4/5" />
                    <Skeleton className="mt-4 h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                  </div>
                ) : doc.data ? (
                  <PlainMarkdown
                    source={doc.data.body}
                    base={lipUrl ?? undefined}
                  />
                ) : (
                  <div className="flex flex-col items-start gap-3">
                    <p className="text-ui-body font-medium">
                      Couldn&apos;t load the proposal text from IPFS
                    </p>
                    <p className="font-mono text-ui-caption break-all text-muted-foreground">
                      {poll.proposal}
                    </p>
                    <Button size="sm" onClick={() => doc.refetch()}>
                      Retry
                    </Button>
                  </div>
                )}
              </Card>
            )}
          </>
        }
      />
    </Page>
  );
}
