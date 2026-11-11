"use client";

import { Page, PageHeader } from "@/components/page";
import { Onboarding } from "@/components/portfolio/onboarding";
import { PortfolioView } from "@/components/portfolio/portfolio-view";
import { usePortfolioAccounts } from "@/lib/hooks/watchlist";

export default function PortfolioPage() {
  const { accounts, inPortfolio, isReconnecting, loaded } =
    usePortfolioAccounts();

  // Saved wallets are read after hydration, and a wallet may still be
  // reconnecting: until then, the portfolio's own loading state (it has no
  // wallets to load yet), so the page loads once rather than twice.
  if ((!loaded || isReconnecting) && accounts.length === 0) {
    return (
      <Page>
        <PageHeader title="Portfolio" className="mb-5" />
        <PortfolioView accounts={[]} canManage={() => false} />
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
