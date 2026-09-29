"use client";

import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import {
  ArrowUpRight,
  BookOpen,
  Menu as MenuIcon,
  Search,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { ExplorerBadge } from "@/components/brand/explorer-badge";
import { LivepeerWordmark } from "@/components/brand/logo";
import { THEME_OPTIONS, useTheme } from "@/components/theme";
import { Tooltip } from "@/components/ui/tooltip";
import { cn } from "@/lib/cn";

import { CommandSearch } from "./command-search";
import { NAV } from "./nav";
import { SidebarRoundClock } from "./round-clock";
import { WalletButton } from "./wallet-button";

function isActive(href: string, pathname: string) {
  if (href === "/") return pathname === "/" || pathname.startsWith("/accounts");
  return pathname.startsWith(href);
}

function NavList({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <nav aria-label="Primary">
      <ul className="flex flex-col gap-0.5">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = isActive(href, pathname);
          return (
            <li key={href}>
              <Link
                href={href}
                onClick={onNavigate}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "group flex h-8 items-center gap-2.5 rounded-sm px-2 text-ui-body transition-colors outline-none focus-visible:ring-1 focus-visible:ring-green-bright/40",
                  active
                    ? "bg-active text-foreground"
                    : "text-muted-foreground hover:bg-hover hover:text-foreground"
                )}
              >
                <Icon
                  className={cn(
                    "size-4 transition-colors",
                    active
                      ? "text-foreground"
                      : "text-subtle-foreground group-hover:text-foreground"
                  )}
                  strokeWidth={1.75}
                />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

function ThemeSwitch() {
  const { preference, setPreference } = useTheme();
  return (
    <div
      role="group"
      aria-label="Appearance"
      className="inline-flex rounded-full bg-hover p-0.5"
    >
      {THEME_OPTIONS.map(({ value, label, icon: Icon }) => (
        <Tooltip key={value} content={label}>
          <button
            type="button"
            aria-label={`${label} appearance`}
            aria-pressed={preference === value}
            onClick={() => setPreference(value)}
            className={cn(
              "inline-flex size-6 cursor-pointer items-center justify-center rounded-full transition-colors",
              preference === value
                ? "bg-secondary text-foreground light:bg-background light:shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Icon className="size-3.5" />
          </button>
        </Tooltip>
      ))}
    </div>
  );
}

function SearchTrigger({ onOpen }: { onOpen: () => void }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="flex h-8 w-full cursor-pointer items-center gap-2 rounded-sm border border-hairline bg-foreground/[0.03] px-2 text-ui-body text-muted-foreground transition-colors hover:border-foreground/25 hover:text-foreground light:bg-background"
    >
      <Search className="size-3.5" />
      <span className="flex-1 text-left">Search</span>
      <kbd className="rounded-[4px] border border-hairline px-1 font-sans text-[10px] leading-4 text-subtle-foreground">
        ⌘K
      </kbd>
    </button>
  );
}

function SidebarBody({
  onSearch,
  onNavigate,
}: {
  onSearch: () => void;
  onNavigate?: () => void;
}) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex h-14 shrink-0 items-center px-4">
        <Link
          href="/"
          onClick={onNavigate}
          aria-label="Livepeer Explorer home"
          className="flex items-center gap-2.5 rounded-sm outline-none"
        >
          <LivepeerWordmark className="h-[14px] w-auto text-foreground" />
          <ExplorerBadge />
        </Link>
      </div>

      <div className="flex flex-col gap-4 px-3 pt-1">
        <SearchTrigger onOpen={onSearch} />
        <NavList onNavigate={onNavigate} />
      </div>

      <div className="flex-1" />

      <div className="flex flex-col gap-1 px-3 pb-3">
        <a
          href="https://docs.livepeer.org/network/tutorials/delegate-your-first-lpt"
          target="_blank"
          rel="noreferrer"
          className="flex h-7 items-center gap-2.5 rounded-sm px-2 text-ui-caption text-muted-foreground transition-colors hover:bg-hover hover:text-foreground"
        >
          <BookOpen className="size-3.5" />
          Staking guide
          <ArrowUpRight className="ml-auto size-3 opacity-60" />
        </a>
        <SidebarRoundClock />
      </div>

      <div className="flex flex-col gap-3 border-t border-hairline p-3">
        <WalletButton />
        <div className="flex items-center justify-between px-1">
          <span className="text-[11px] text-subtle-foreground">Appearance</span>
          <ThemeSwitch />
        </div>
      </div>
    </div>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen((o) => !o);
      } else if (
        e.key === "/" &&
        !(e.target instanceof HTMLInputElement) &&
        !(e.target instanceof HTMLTextAreaElement)
      ) {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Close the mobile drawer on navigation.
  useEffect(() => setDrawerOpen(false), [pathname]);

  return (
    <div className="flex min-h-screen">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[200] focus:rounded-sm focus:bg-primary focus:px-3 focus:py-2 focus:text-primary-foreground"
      >
        Skip to content
      </a>

      {/*
        Fixed, not sticky: wallet modals lock scrolling with overflow:hidden
        on <body>, which makes body the sticky container and pins these to
        the top of the page instead of the screen.
      */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[244px] border-r border-hairline bg-background lg:block">
        <SidebarBody onSearch={() => setSearchOpen(true)} />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col pt-14 lg:pt-0 lg:pl-[244px]">
        {/* Mobile / tablet top bar */}
        <header className="fixed inset-x-0 top-0 z-40 flex h-14 items-center gap-2 border-b border-hairline bg-background/80 px-4 backdrop-blur-md lg:hidden">
          <button
            type="button"
            aria-label="Open navigation"
            onClick={() => setDrawerOpen(true)}
            className="-ml-2 inline-flex size-9 cursor-pointer items-center justify-center rounded-sm text-foreground hover:bg-hover"
          >
            <MenuIcon className="size-5" />
          </button>
          <Link
            href="/"
            aria-label="Livepeer Explorer home"
            className="flex items-center gap-2 outline-none"
          >
            <LivepeerWordmark className="h-[13px] w-auto text-foreground" />
            <ExplorerBadge />
          </Link>
          <div className="flex-1" />
          <button
            type="button"
            aria-label="Search"
            onClick={() => setSearchOpen(true)}
            className="inline-flex size-9 cursor-pointer items-center justify-center rounded-sm text-muted-foreground hover:bg-hover hover:text-foreground"
          >
            <Search className="size-[18px]" />
          </button>
          <WalletButton compact />
        </header>

        <main id="main" className="min-w-0 flex-1">
          {children}
        </main>
      </div>

      <DialogPrimitive.Root open={drawerOpen} onOpenChange={setDrawerOpen}>
        <DialogPrimitive.Portal>
          <DialogPrimitive.Backdrop className="fixed inset-0 z-50 bg-overlay transition-opacity duration-200 ease-out data-starting-style:opacity-0 data-ending-style:opacity-0 lg:hidden" />
          <DialogPrimitive.Popup className="fixed inset-y-0 left-0 z-50 w-[284px] max-w-[85vw] border-r border-hairline bg-background outline-none transition-transform duration-300 ease-(--ease-out) data-starting-style:-translate-x-full data-ending-style:-translate-x-full lg:hidden">
            <DialogPrimitive.Title className="sr-only">
              Navigation
            </DialogPrimitive.Title>
            <DialogPrimitive.Close
              aria-label="Close navigation"
              className="absolute top-3 right-3 z-10 inline-flex size-8 cursor-pointer items-center justify-center rounded-sm text-muted-foreground hover:bg-hover hover:text-foreground"
            >
              <X className="size-4" />
            </DialogPrimitive.Close>
            <SidebarBody
              onNavigate={() => setDrawerOpen(false)}
              onSearch={() => {
                setDrawerOpen(false);
                setSearchOpen(true);
              }}
            />
          </DialogPrimitive.Popup>
        </DialogPrimitive.Portal>
      </DialogPrimitive.Root>

      <CommandSearch open={searchOpen} onOpenChange={setSearchOpen} />
    </div>
  );
}
