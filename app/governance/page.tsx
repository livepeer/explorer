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
  pollEndsAt,
  pollPhase,
  proposalPhase,
  proposalWindow,
  useL1Block,
} from "@/components/governance/model";
import { TallyKey } from "@/components/governance/tally";
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
      <Segmented
        label="Governance type"
        value={tab}
        onChange={setTab}
        options={TABS}
        className="mb-8"
      />
      <div>{tab === "proposals" ? <Proposals /> : <Polls />}</div>
    </>
  );
}

function Proposals() {
  const governance = useGovernance();
  const protocol = useProtocol();
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

  const open = all
    .filter((x) => proposalPhase(x, p.currentRound) !== "ended")
    .sort(
      (a, b) => proposalWindow(a, p).closesAt - proposalWindow(b, p).closesAt
    );
  const past = all
    .filter((x) => proposalPhase(x, p.currentRound) === "ended")
    .sort((a, b) => b.voteEnd - a.voteEnd);

  return (
    <>
      {open.length > 0 && (
        <Section>
          <SectionHeader
            title="Open"
            description="Active and upcoming votes"
            action={<TallyKey series={PROPOSAL_KEY} />}
          />
          <Card className="divide-y divide-(--hairline) overflow-hidden">
            {open.map((x) => (
              <ProposalRow key={x.id} proposal={x} protocol={p} nowMs={nowMs} />
            ))}
          </Card>
        </Section>
      )}
      {past.length > 0 && (
        <Section>
          <SectionHeader
            title="Past"
            description="Outcome shown is the vote majority. Open a proposal for its quorum, quota and on-chain state."
            action={
              open.length === 0 ? <TallyKey series={PROPOSAL_KEY} /> : undefined
            }
          />
          <Card className="divide-y divide-(--hairline) overflow-hidden">
            {past.map((x) => (
              <ProposalRow key={x.id} proposal={x} protocol={p} nowMs={nowMs} />
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

  const open = all
    .filter((x) => pollPhase(x, l1Block) === "active")
    .sort(
      (a, b) =>
        (pollEndsAt(a, l1Block, nowMs) ?? 0) -
        (pollEndsAt(b, l1Block, nowMs) ?? 0)
    );
  const rest = all
    .filter((x) => pollPhase(x, l1Block) !== "active")
    .sort((a, b) => b.endBlock - a.endBlock);

  return (
    <>
      {open.length > 0 && (
        <Section>
          <SectionHeader
            title="Active"
            action={<TallyKey series={POLL_KEY} />}
          />
          <Card className="divide-y divide-(--hairline) overflow-hidden">
            {open.map((x) => (
              <PollRow key={x.id} poll={x} l1Block={l1Block} nowMs={nowMs} />
            ))}
          </Card>
        </Section>
      )}
      {rest.length > 0 && (
        <Section>
          <SectionHeader
            title={l1Block == null ? "All polls" : "Past"}
            description={
              l1Block == null
                ? "Couldn't read the current Ethereum block, so poll status is unknown."
                : "Outcome shown is the vote majority; quorum and quota are on each poll."
            }
            action={
              open.length === 0 ? <TallyKey series={POLL_KEY} /> : undefined
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
