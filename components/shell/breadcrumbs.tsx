"use client";

import { ChevronRight, type LucideIcon, UserRound } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Fragment, useEffect, useState } from "react";

import { Avatar, useIdentity } from "@/components/identity";
import { cn } from "@/lib/cn";
import { useAddresses } from "@/lib/hooks/watchlist";
import { routeParam } from "@/lib/params";

import { NAV } from "./nav";

type Crumb = {
  label: React.ReactNode;
  href?: string;
  icon?: LucideIcon;
  /** An address the crumb names, shown with its avatar. */
  address?: string;
};

/** Sections by their path segment, with the sidebar's label and icon. */
const SECTIONS = Object.fromEntries(
  NAV.map((n) => [n.href.slice(1), { label: n.label, icon: n.icon }])
) as Record<string, { label: string; icon: LucideIcon }>;

const SUFFIX = " · Livepeer Explorer";

/**
 * The page's own title, from <title>, which detail pages set from their data
 * (a proposal's name, a poll's LIP). Watched, since it can land after the
 * route changes.
 */
function useDocumentTitle(fallback: string) {
  const pathname = usePathname();
  const [title, setTitle] = useState<string | null>(null);
  useEffect(() => {
    const read = () =>
      setTitle(
        document.title.endsWith(SUFFIX)
          ? document.title.slice(0, -SUFFIX.length)
          : null
      );
    read();
    const head = document.querySelector("head");
    if (!head) return;
    const observer = new MutationObserver(read);
    observer.observe(head, {
      subtree: true,
      childList: true,
      characterData: true,
    });
    return () => observer.disconnect();
  }, [pathname]);
  return title ?? fallback;
}

function CrumbAvatar({ address }: { address: string }) {
  const { avatar } = useIdentity(address);
  return <Avatar address={address} src={avatar} size={18} />;
}

/** Your own label for a saved wallet, else its ENS name or short address. */
function AddressName({ address }: { address: string }) {
  const { display } = useIdentity(address);
  const { list } = useAddresses();
  const label = list.find((w) => w.address === address.toLowerCase())?.label;
  return <>{label ?? display}</>;
}

function DocumentTitle({ fallback }: { fallback: string }) {
  return <>{useDocumentTitle(fallback)}</>;
}

function crumbsFor(pathname: string): Crumb[] {
  const [section, a, b] = pathname.split("/").filter(Boolean);
  if (!section) return [SECTIONS[""]];
  if (section === "accounts" && a) {
    return [
      { label: "Accounts", icon: UserRound },
      {
        label: <AddressName address={routeParam(a)} />,
        address: routeParam(a),
      },
    ];
  }
  const s = SECTIONS[section];
  if (!s) return [];
  const { label: name, icon } = s;
  if (section === "governance" && a && b) {
    const polls = a === "polls";
    const parent = {
      label: name,
      icon,
      href: polls ? "/governance?tab=polls" : "/governance",
    };
    if (b === "new") {
      return [parent, { label: polls ? "New poll" : "New proposal" }];
    }
    return [
      parent,
      { label: <DocumentTitle fallback={polls ? "Poll" : "Proposal"} /> },
    ];
  }
  if (a && (section === "orchestrators" || section === "gateways")) {
    return [
      { label: name, icon, href: `/${section}` },
      {
        label: <AddressName address={routeParam(a)} />,
        address: routeParam(a),
      },
    ];
  }
  return [{ label: name, icon }];
}

/** Where you are, Linear-style: the section, then the page within it. */
export function Breadcrumbs() {
  const pathname = usePathname();
  const crumbs = crumbsFor(pathname);
  if (!crumbs.length) return null;
  return (
    <nav aria-label="Breadcrumb" className="min-w-0">
      <ol className="flex min-w-0 items-center gap-1.5 text-ui-body">
        {crumbs.map((c, i) => {
          const last = i === crumbs.length - 1;
          return (
            <Fragment key={i}>
              {i > 0 && (
                <ChevronRight
                  aria-hidden="true"
                  className="size-3.5 shrink-0 text-subtle-foreground"
                />
              )}
              <li
                className={cn(
                  "flex items-center gap-2",
                  last ? "min-w-0" : "shrink-0"
                )}
                aria-current={last ? "page" : undefined}
              >
                {c.icon && (
                  <c.icon
                    aria-hidden="true"
                    strokeWidth={1.75}
                    className="size-4 shrink-0 text-subtle-foreground"
                  />
                )}
                {c.address && <CrumbAvatar address={c.address} />}
                {c.href && !last ? (
                  <Link
                    href={c.href}
                    className="text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {c.label}
                  </Link>
                ) : (
                  <span
                    className={cn(
                      "truncate",
                      last ? "text-foreground" : "text-muted-foreground"
                    )}
                  >
                    {c.label}
                  </span>
                )}
              </li>
            </Fragment>
          );
        })}
      </ol>
    </nav>
  );
}
