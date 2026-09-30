"use client";

import { Check, Plus, Server, Waypoints } from "lucide-react";
import Link from "next/link";
import { notFound, useParams } from "next/navigation";
import { useMemo } from "react";
import { isAddress } from "viem";

import { Avatar, CopyButton, useIdentity } from "@/components/identity";
import { Page } from "@/components/page";
import { PortfolioView } from "@/components/portfolio/portfolio-view";
import { Button } from "@/components/ui/button";
import { addressUrl } from "@/lib/config";
import { shortAddress } from "@/lib/format";
import { useGateway, useOrchestrators } from "@/lib/hooks/queries";
import { useAddresses, usePortfolioAccounts } from "@/lib/hooks/watchlist";

export default function AccountPage() {
  const params = useParams<{ address: string }>();
  const raw = decodeURIComponent(params.address ?? "");
  const address = raw.toLowerCase();
  const valid = isAddress(address);
  const { name, avatar } = useIdentity(valid ? address : null);
  const { walletAddress, inPortfolio } = usePortfolioAccounts();
  const { list, add, remove } = useAddresses();
  const { data: orchestrators } = useOrchestrators();
  const { data: gateway } = useGateway(valid ? address : null);

  const accounts = useMemo(
    () => [
      {
        address,
        label: list.find((w) => w.address === address)?.label,
        connected: address === walletAddress,
      },
    ],
    [address, walletAddress, list]
  );

  if (!valid) notFound();

  const isConnected = address === walletAddress;
  const saved = inPortfolio(address);
  const isOrchestrator = orchestrators?.some((o) => o.id === address);

  return (
    <Page>
      <header className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-4">
          <Avatar address={address} src={avatar} size={52} />
          <div className="flex min-w-0 flex-col gap-1">
            <div className="text-ui-caption text-muted-foreground">
              {isConnected
                ? "Connected wallet"
                : saved
                ? "In your portfolio"
                : "Account"}
            </div>
            <h1 className="truncate text-[26px] leading-8 font-light tracking-[-0.01em]">
              {name ?? (
                <span className="font-mono text-[22px]">
                  {shortAddress(address, 8, 6)}
                </span>
              )}
            </h1>
            <div className="flex items-center gap-1 text-ui-caption text-muted-foreground">
              <a
                href={addressUrl(address)}
                target="_blank"
                rel="noreferrer"
                className="font-mono hover:text-foreground"
              >
                {shortAddress(address, 10, 8)}
              </a>
              <CopyButton value={address} />
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {isOrchestrator && (
            <Button
              size="sm"
              render={<Link href={`/orchestrators/${address}`} />}
            >
              <Server /> Orchestrator profile
            </Button>
          )}
          {gateway && (
            <Button size="sm" render={<Link href={`/gateways/${address}`} />}>
              <Waypoints /> Gateway profile
            </Button>
          )}
          {!isConnected &&
            (saved ? (
              <Button size="sm" variant="ghost" onClick={() => remove(address)}>
                <Check /> In your portfolio
              </Button>
            ) : (
              <Button
                size="sm"
                variant="primary"
                onClick={() => add(address, name ?? undefined)}
              >
                <Plus /> Add to portfolio
              </Button>
            ))}
        </div>
      </header>
      <PortfolioView
        accounts={accounts}
        canManage={inPortfolio}
        showScope={false}
      />
    </Page>
  );
}
