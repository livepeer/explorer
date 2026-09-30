"use client";

import { Page, PageHeader } from "@/components/page";
import { Onboarding } from "@/components/portfolio/onboarding";
import { PortfolioView } from "@/components/portfolio/portfolio-view";
import { Skeleton } from "@/components/ui/misc";
import { usePortfolioAccounts } from "@/lib/hooks/watchlist";

export default function PortfolioPage() {
  const { accounts, inPortfolio, isReconnecting } = usePortfolioAccounts();

  if (isReconnecting && accounts.length === 0) {
    return (
      <Page>
        <Skeleton className="mb-8 h-9 w-48" />
        <Skeleton className="h-[420px] w-full rounded-md" />
      </Page>
    );
  }

  if (accounts.length === 0) {
    return (
      <Page>
        <Onboarding />
      </Page>
    );
  }

  return (
    <Page>
      <PageHeader title="Portfolio" className="mb-5" />
      <PortfolioView accounts={accounts} canManage={inPortfolio} />
    </Page>
  );
}
