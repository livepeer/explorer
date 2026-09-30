"use client";

import {
  Check,
  ChevronDown,
  Pencil,
  Plus,
  Server,
  Trash2,
  Waypoints,
} from "lucide-react";
import Link from "next/link";
import { notFound, useParams } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { isAddress } from "viem";

import { Avatar, CopyButton, useIdentity } from "@/components/identity";
import { Page } from "@/components/page";
import { RenameAddressDialog } from "@/components/portfolio/addresses";
import { PortfolioView } from "@/components/portfolio/portfolio-view";
import { Button } from "@/components/ui/button";
import {
  Menu,
  MenuContent,
  MenuItem,
  MenuSeparator,
  MenuTrigger,
} from "@/components/ui/misc";
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
  const [renaming, setRenaming] = useState(false);
  const label = list.find((w) => w.address === address)?.label;

  const accounts = useMemo(
    () => [
      {
        address,
        label,
        connected: address === walletAddress,
      },
    ],
    [address, walletAddress, label]
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
              {/* Portfolio membership shows on the button beside it. */}
              {isConnected ? "Connected wallet" : "Account"}
            </div>
            <div className="flex min-w-0 items-center gap-1.5">
              <h1 className="truncate text-[26px] leading-8 font-light tracking-[-0.01em]">
                {label ?? name ?? (
                  <span className="font-mono text-[22px]">
                    {shortAddress(address, 8, 6)}
                  </span>
                )}
              </h1>
              {/* Only saved wallets carry a label to edit. */}
              {list.some((w) => w.address === address) && (
                <Button
                  size="icon-xs"
                  variant="ghost"
                  aria-label={label ? "Rename" : "Name this wallet"}
                  onClick={() => setRenaming(true)}
                  className="shrink-0 text-subtle-foreground"
                >
                  <Pencil />
                </Button>
              )}
            </div>
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
              <Menu>
                <MenuTrigger
                  render={<Button size="sm" variant="ghost" />}
                  aria-label="In your portfolio: rename or remove"
                >
                  <Check /> In your portfolio
                  <ChevronDown className="size-3.5 opacity-60" />
                </MenuTrigger>
                <MenuContent>
                  <MenuItem onClick={() => setRenaming(true)}>
                    <Pencil /> Rename…
                  </MenuItem>
                  <MenuSeparator />
                  <MenuItem
                    onClick={() => {
                      remove(address);
                      toast(
                        `Removed ${label ?? name ?? shortAddress(address)}`,
                        {
                          action: {
                            label: "Undo",
                            onClick: () => add(address, label),
                          },
                        }
                      );
                    }}
                  >
                    <Trash2 /> Remove from portfolio
                  </MenuItem>
                </MenuContent>
              </Menu>
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
      <RenameAddressDialog
        account={renaming ? accounts[0] : null}
        onOpenChange={(o) => !o && setRenaming(false)}
      />
      <PortfolioView
        accounts={accounts}
        canManage={inPortfolio}
        showScope={false}
      />
    </Page>
  );
}
