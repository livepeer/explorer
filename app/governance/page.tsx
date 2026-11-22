"use client";

import { Landmark, Plus, Vote } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";

import {
  ListSkeleton,
  PollRow,
  ProposalRow,
} from "@/components/governance/list";
import {
  pollPhase,
  proposalPhaseOnChain,
  proposalWindow,
  useL1Block,
} from "@/components/governance/model";
import { OpenNow, useOpenVotes } from "@/components/governance/open-votes";
import { TallyKey } from "@/components/governance/tally";
import { TreasuryCard } from "@/components/governance/treasury";
import {
  Card,
  EmptyState,
  ErrorNotice,
  Page,
  PageHeader,
  Section,
  SectionHeader,
} from "@/components/page";
import { useNow } from "@/components/shell/round-clock";
import { Button } from "@/components/ui/button";
import { Segmented } from "@/components/ui/misc";
import { useGovernance, useProtocol } from "@/lib/hooks/queries";

type Tab = "proposals" | "polls";

const TABS = [
  { value: "proposals", label: "Treasury proposals" },
  { value: "polls", label: "LIP polls" },
] as const;

const PROPOSAL_KEY = [
  { key: "for", label: "For", color: "var(--series-3)" },
  { key: "against", label: "Against", color: "var(--series-2)" },
  { key: "abstain", label: "Abstain", color: "var(--series-other)" },
];

const POLL_KEY = [
  { key: "yes", label: "Yes", color: "var(--series-3)" },
  { key: "no", label: "No", color: "var(--series-2)" },
];

export default function GovernancePage() {
  return (
    <Page>
      <PageHeader
        title="Governance"
        description="Stakeholders steer the protocol: treasury proposals fund work from the on-chain treasury, and LIP polls signal support for protocol upgrades."
        actions={
          <>
            <Button
              size="sm"
              variant="ghost"
              render={<Link href="/governance/polls/new" />}
            >
              <Plus /> New poll
            </Button>
            <Button
              size="sm"
              render={<Link href="/governance/proposals/new" />}
            >
              <Plus /> New proposal
            </Button>
          </>
        }
      />
      {/* What's open to vote on leads, whichever kind it is. */}
      <OpenNow />
      {/* What treasury proposals spend from. */}
      <div className="mb-10">
        <TreasuryCard />
      </div>
      <Suspense fallback={<ListSkeleton />}>
        <GovernanceLists />
      </Suspense>
    </Page>
  );
}

function GovernanceLists() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const tab: Tab = params.get("tab") === "polls" ? "polls" : "proposals";

  const setTab = (t: Tab) => {
    router.replace(t === "polls" ? `${pathname}?tab=polls` : pathname, {
      scroll: false,
    });
  };

  return (
    <>
      {/* The switch on the left, and on the right the key to the vote bars
          in every list below it. Lists start a section's distance down. */}
      <div className="mb-10 flex flex-wrap items-center justify-between gap-3">
        <Segmented
          label="Governance type"
          value={tab}
          onChange={setTab}
          options={TABS}
        />
        <TallyKey series={tab === "polls" ? POLL_KEY : PROPOSAL_KEY} />
      </div>
      <div>{tab === "proposals" ? <Proposals /> : <Polls />}</div>
    </>
  );
}

/** Everything of this kind is open, so it's all in Open now above. */
function NothingElse() {
  return (
    <p className="text-ui-body text-muted-foreground">
      Nothing else here yet. Open votes are listed at the top of this page.
    </p>
  );
}

function Proposals() {
  const governance = useGovernance();
  const protocol = useProtocol();
  const { chainStates } = useOpenVotes();
  const nowMs = useNow(30_000);

  if (governance.error || protocol.error) {
    return (
      <ErrorNotice
        error={governance.error ?? protocol.error}
        onRetry={() => {
          if (governance.error) governance.refetch();
          if (protocol.error) protocol.refetch();
        }}
      />
    );
  }
  if (!governance.data || !protocol.data) return <ListSkeleton />;

  const p = protocol.data;
  const all = governance.data.proposals;
  if (!all.length) {
    return (
      <Card>
        <EmptyState
          icon={<Landmark />}
          title="No treasury proposals yet"
          description="Proposals to spend from the treasury will appear here once they're submitted on-chain."
        />
      </Card>
    );
  }

  // Active votes lead the page, in Open now.
  const phaseOf = (x: (typeof all)[number]) =>
    proposalPhaseOnChain(x, p.currentRound, chainStates.get(x.id));
  const upcoming = all
    .filter((x) => phaseOf(x) === "pending")
    .sort(
      (a, b) => proposalWindow(a, p).opensAt - proposalWindow(b, p).opensAt
    );
  const past = all
    .filter((x) => phaseOf(x) === "ended")
    .sort((a, b) => b.voteEnd - a.voteEnd);

  return (
    <>
      {upcoming.length === 0 && past.length === 0 && <NothingElse />}
      {upcoming.length > 0 && (
        <Section>
          <SectionHeader
            title="Upcoming"
            description="Voting hasn't started yet"
          />
          <Card className="divide-y divide-(--hairline) overflow-hidden">
            {upcoming.map((x) => (
              <ProposalRow
                key={x.id}
                proposal={x}
                protocol={p}
                nowMs={nowMs}
                chainState={chainStates.get(x.id)}
              />
            ))}
          </Card>
        </Section>
      )}
      {past.length > 0 && (
        <Section>
          <SectionHeader
            title="Past"
            description="Outcome shown is the vote majority. Open a proposal for its quorum, quota and on-chain state."
          />
          <Card className="divide-y divide-(--hairline) overflow-hidden">
            {past.map((x) => (
              <ProposalRow
                key={x.id}
                proposal={x}
                protocol={p}
                nowMs={nowMs}
                chainState={chainStates.get(x.id)}
              />
            ))}
          </Card>
        </Section>
      )}
    </>
  );
}

function Polls() {
  const governance = useGovernance();
  const { block: l1Block, isLoading: blockLoading } = useL1Block();
  const nowMs = useNow(30_000);

  if (governance.error)
    return (
      <ErrorNotice
        error={governance.error}
        onRetry={() => governance.refetch()}
      />
    );
  if (!governance.data || blockLoading) return <ListSkeleton />;

  const all = governance.data.polls;
  if (!all.length) {
    return (
      <Card>
        <EmptyState
          icon={<Vote />}
          title="No LIP polls yet"
          description="Polls on Livepeer Improvement Proposals will appear here once they're created on-chain."
        />
      </Card>
    );
  }

  // Active polls lead the page, in Open now.
  const rest = all
    .filter((x) => pollPhase(x, l1Block) !== "active")
    .sort((a, b) => b.endBlock - a.endBlock);

  return (
    <>
      {rest.length === 0 && <NothingElse />}
      {rest.length > 0 && (
        <Section>
          <SectionHeader
            title={l1Block == null ? "All polls" : "Past"}
            description={
              l1Block == null
                ? "Couldn't read the current Ethereum block, so poll status is unknown."
                : "Outcome shown is the vote majority; quorum and quota are on each poll."
            }
          />
          <Card className="divide-y divide-(--hairline) overflow-hidden">
            {rest.map((x) => (
              <PollRow key={x.id} poll={x} l1Block={l1Block} nowMs={nowMs} />
            ))}
          </Card>
        </Section>
      )}
    </>
  );
}
