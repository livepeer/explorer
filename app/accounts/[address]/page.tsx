"use client";

import {
  Check,
  ChevronDown,
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

import { Avatar, CopyButton, useIdentity } from "@/components/identity";
import { Page } from "@/components/page";
import {
  PAGE_ACTIONS_SLOT,
  PAGE_INFO_SLOT,
  useSlot,
} from "@/components/page-header";
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
  const actionsSlot = useSlot(PAGE_ACTIONS_SLOT);
  if (!valid) notFound();

  const isConnected = address === walletAddress;
  const saved = inPortfolio(address);
  const isOrchestrator = orchestrators?.some((o) => o.id === address);

  const actions = (
    <>
      {isOrchestrator && (
        <Button size="sm" render={<Link href={`/orchestrators/${address}`} />}>
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
                  toast(`Removed ${label ?? name ?? shortAddress(address)}`, {
                    action: {
                      label: "Undo",
                      onClick: () => add(address, label),
                    },
                  });
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
    </>
  );
  // On desktop the app header already names the account (the breadcrumb),
  // so the page's own header is for phones. There, the name itself opens a
  // menu of what you can do with the address (Linear-style), and the page's
  // buttons join the header's right side; the page opens on the balance.
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
  // In the header: the profiles this address also has, and, until it's
  // saved, adding it to your portfolio (once saved, that's in the menu).
  const headerActions = (
    <>
      {isOrchestrator && (
        <Button size="sm" render={<Link href={`/orchestrators/${address}`} />}>
          <Server /> Orchestrator profile
        </Button>
      )}
      {gateway && (
        <Button size="sm" render={<Link href={`/gateways/${address}`} />}>
          <Waypoints /> Gateway profile
        </Button>
      )}
      {!isConnected && !saved && (
        <Button
          size="sm"
          variant="primary"
          onClick={() => add(address, name ?? undefined)}
        >
          <Plus /> Add to portfolio
        </Button>
      )}
    </>
  );

  return (
    <Page>
      {infoSlot && createPortal(nameMenu, infoSlot)}
      {actionsSlot && createPortal(headerActions, actionsSlot)}
      <RenameAddressDialog
        account={renaming ? accounts[0] : null}
        onOpenChange={(o) => !o && setRenaming(false)}
      />
      <PortfolioView
        accounts={accounts}
        canManage={inPortfolio}
        showScope={false}
        // Phones only (see above); on desktop the page opens on the balance,
        // level with the position rail.
        header={
          <header className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between lg:hidden">
            <div className="flex min-w-0 items-center gap-4">
              <Avatar address={address} src={avatar} size={52} />
              <div className="flex min-w-0 flex-col gap-1">
                <div className="text-ui-caption text-muted-foreground">
                  {/* Portfolio membership shows on the button beside it. */}
                  {isConnected ? "Connected wallet" : "Account"}
                </div>
                <div className="flex min-w-0 items-center gap-1.5">
                  <h1 className="truncate text-[24px] leading-8 font-semibold tracking-[-0.02em]">
                    {label ?? name ?? (
                      <span className="font-mono text-[20px] font-medium tracking-normal">
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
            <div className="flex flex-wrap gap-2">{actions} </div>
          </header>
        }
      />
    </Page>
  );
}
