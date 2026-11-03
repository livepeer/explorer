"use client";

import {
  ChevronDown,
  ChevronRight,
  Copy,
  ExternalLink,
  Pencil,
  Plus,
  Server,
  Trash2,
  Waypoints,
} from "lucide-react";
import Link from "next/link";
import { notFound, useParams } from "next/navigation";
import { useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { toast } from "sonner";
import { isAddress } from "viem";

import { Avatar, useIdentity } from "@/components/identity";
import { Page } from "@/components/page";
import { PAGE_INFO_SLOT, useSlot } from "@/components/page-header";
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
import { routeParam } from "@/lib/params";

export default function AccountPage() {
  const params = useParams<{ address: string }>();
  const raw = routeParam(params.address);
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

  const infoSlot = useSlot(PAGE_INFO_SLOT);
  if (!valid) notFound();

  const isConnected = address === walletAddress;
  const saved = inPortfolio(address);
  const isOrchestrator = orchestrators?.some((o) => o.id === address);

  // The account's name opens a menu of what you can do with the address
  // (Linear-style). On desktop it's the breadcrumb's last step; on phones,
  // which have no header breadcrumb, the page draws the same one.
  const removeFromPortfolio = () => {
    remove(address);
    toast(`Removed ${label ?? name ?? shortAddress(address)}`, {
      action: { label: "Undo", onClick: () => add(address, label) },
    });
  };
  const nameMenu = (
    <Menu>
      {/* The breadcrumb's last step: the account's name, which opens what
          you can do with the address. */}
      <MenuTrigger
        aria-label={`${
          label ?? name ?? shortAddress(address)
        }: account options`}
        className="-ml-1 flex min-w-0 cursor-pointer items-center gap-2 rounded-sm px-1 py-0.5 text-ui-body text-foreground outline-none transition-colors hover:bg-hover focus-visible:ring-1 focus-visible:ring-green-bright/40 data-popup-open:bg-hover"
      >
        <Avatar address={address} src={avatar} size={18} />
        <span className="truncate">
          {label ?? name ?? shortAddress(address)}
        </span>
        <ChevronDown className="size-3.5 shrink-0 text-subtle-foreground" />
      </MenuTrigger>
      <MenuContent align="start">
        {/* Saving it to your portfolio leads, while it isn't saved. */}
        {!isConnected && !saved && (
          <>
            <MenuItem
              onClick={() => {
                add(address, name ?? undefined);
                toast(
                  `Added ${name ?? shortAddress(address)} to your portfolio`
                );
              }}
            >
              <Plus /> Add to portfolio
            </MenuItem>
            <MenuSeparator />
          </>
        )}
        <MenuItem
          onClick={() => {
            navigator.clipboard?.writeText(address);
            toast("Address copied");
          }}
        >
          <Copy /> Copy address
        </MenuItem>
        <MenuItem
          render={
            <a href={addressUrl(address)} target="_blank" rel="noreferrer" />
          }
        >
          <ExternalLink /> View on Arbiscan
        </MenuItem>
        {/* The address's other roles in the network. */}
        {isOrchestrator && (
          <MenuItem render={<Link href={`/orchestrators/${address}`} />}>
            <Server /> Orchestrator profile
          </MenuItem>
        )}
        {gateway && (
          <MenuItem render={<Link href={`/gateways/${address}`} />}>
            <Waypoints /> Gateway profile
          </MenuItem>
        )}
        {list.some((w) => w.address === address) && (
          <MenuItem onClick={() => setRenaming(true)}>
            <Pencil /> {label ? "Rename…" : "Name this wallet…"}
          </MenuItem>
        )}
        {!isConnected && saved && (
          <>
            <MenuSeparator />
            <MenuItem onClick={removeFromPortfolio}>
              <Trash2 /> Remove from portfolio
            </MenuItem>
          </>
        )}
      </MenuContent>
    </Menu>
  );

  return (
    <Page>
      {infoSlot && createPortal(nameMenu, infoSlot)}
      <RenameAddressDialog
        account={renaming ? accounts[0] : null}
        onOpenChange={(o) => !o && setRenaming(false)}
      />
      <PortfolioView
        accounts={accounts}
        canManage={inPortfolio}
        showScope={false}
        // Phones only: desktop names the account in its breadcrumb.
        header={
          <header className="-mx-4 -mt-6 mb-6 flex h-11 min-w-0 items-center justify-between gap-3 border-b border-hairline px-4 sm:-mx-6 sm:px-6 lg:hidden">
            {/* The breadcrumb desktop shows in its header, as a strip under
                the top bar: part of the frame, not the content. */}
            <nav
              aria-label="Breadcrumb"
              className="flex min-w-0 items-center gap-1.5 text-ui-body text-muted-foreground"
            >
              <span className="shrink-0">Accounts</span>
              <ChevronRight className="size-3.5 shrink-0 text-subtle-foreground" />
              {nameMenu}
            </nav>
            {!isConnected && !saved && (
              <Button
                size="xs"
                onClick={() => {
                  add(address, name ?? undefined);
                  toast(
                    `Added ${name ?? shortAddress(address)} to your portfolio`
                  );
                }}
              >
                <Plus /> Add to portfolio
              </Button>
            )}
          </header>
        }
      />
    </Page>
  );
}
