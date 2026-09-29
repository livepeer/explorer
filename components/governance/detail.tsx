"use client";

import { ArrowLeft } from "lucide-react";
import { motion } from "motion/react";
import Link from "next/link";
import { useCallback, useSyncExternalStore } from "react";

import { Card, Page, SectionHeader } from "@/components/page";
import { Skeleton } from "@/components/ui/misc";
import { cn } from "@/lib/cn";

export function BackLink({ href = "/governance" }: { href?: string }) {
  return (
    <Link
      href={href}
      className="-ml-1.5 mb-6 inline-flex h-7 items-center gap-1.5 rounded-sm px-1.5 text-ui-caption text-muted-foreground transition-colors outline-none hover:bg-hover hover:text-foreground focus-visible:ring-1 focus-visible:ring-green-bright/40"
    >
      <ArrowLeft className="size-3.5" /> Governance
    </Link>
  );
}

export function DetailHeader({
  eyebrow,
  status,
  title,
  loading = false,
}: {
  eyebrow: React.ReactNode;
  status: React.ReactNode;
  title: React.ReactNode;
  loading?: boolean;
}) {
  return (
    <header className="mb-8 flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2 text-ui-caption text-muted-foreground">
        {status}
        <span>{eyebrow}</span>
      </div>
      {loading ? (
        <Skeleton className="h-8 w-full max-w-[520px] sm:h-9" />
      ) : (
        <h1 className="max-w-[40ch] text-[26px] leading-8 font-light tracking-[-0.01em] text-balance break-words sm:text-[28px] sm:leading-9">
          {title}
        </h1>
      )}
    </header>
  );
}

/** Description left, a 320px rail right on xl. The rail leads on small screens. */
export function DetailLayout({
  main,
  rail,
}: {
  main: React.ReactNode;
  rail: React.ReactNode;
}) {
  return (
    <div className="grid grid-cols-1 gap-10 xl:grid-cols-[minmax(0,1fr)_320px] xl:gap-12">
      <div className="min-w-0 xl:order-2">{rail}</div>
      <div className="min-w-0 xl:order-1">{main}</div>
    </div>
  );
}

export function RailSection({
  title,
  children,
  className,
}: {
  title: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("mt-8 first:mt-0", className)}>
      <SectionHeader title={title} />
      {children}
    </section>
  );
}

export function DetailList({ children }: { children: React.ReactNode }) {
  return (
    <dl className="flex flex-col divide-y divide-(--hairline)">{children}</dl>
  );
}

export function DetailItem({
  label,
  children,
  sub,
  mono = true,
}: {
  label: React.ReactNode;
  children: React.ReactNode;
  sub?: React.ReactNode;
  mono?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-4 px-4 py-3 first:pt-4 last:pb-4">
      <dt className="shrink-0 text-ui-body text-muted-foreground">{label}</dt>
      <dd className="flex min-w-0 flex-col items-end gap-0.5 text-right">
        <span
          className={cn(
            "min-w-0 text-ui-body",
            mono && "font-mono text-[13px] tabular-nums"
          )}
        >
          {children}
        </span>
        {sub && (
          <span className="text-ui-caption text-muted-foreground">{sub}</span>
        )}
      </dd>
    </div>
  );
}

export function DetailSkeleton() {
  return (
    <Page>
      <Skeleton className="mb-6 h-7 w-28" />
      <div className="mb-8 flex flex-col gap-3">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-8 w-full max-w-[560px]" />
      </div>
      <DetailLayout
        rail={
          <>
            <Skeleton className="mb-3 h-5 w-16" />
            <Card className="flex flex-col gap-4 p-4">
              <Skeleton className="h-2 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
            </Card>
            <Skeleton className="mt-8 mb-3 h-5 w-16" />
            <Card className="h-[220px]" />
          </>
        }
        main={
          <>
            <Skeleton className="mb-3 h-5 w-24" />
            <Card className="flex flex-col gap-3 p-5 sm:p-6">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-11/12" />
              <Skeleton className="h-4 w-4/5" />
              <Skeleton className="mt-4 h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </Card>
          </>
        }
      />
    </Page>
  );
}

/* ── URL state (?tab=votes&list=not-voted&vote=no) ────────────────────── */

const URL_EVENT = "detail-url:changed";

function subscribeUrl(onChange: () => void) {
  window.addEventListener("popstate", onChange);
  window.addEventListener(URL_EVENT, onChange);
  return () => {
    window.removeEventListener("popstate", onChange);
    window.removeEventListener(URL_EVENT, onChange);
  };
}

/**
 * One query parameter as state, so a view can be linked. The fallback value
 * is left out of the URL; `clears` names parameters that only make sense
 * alongside this one and are dropped when it returns to its fallback.
 * Updates replace the history entry, and it reads the URL directly so the
 * page doesn't need a Suspense boundary.
 */
export function useUrlParam<T extends string>(
  key: string,
  values: readonly T[],
  fallback: T,
  clears: readonly string[] = []
) {
  const value = useSyncExternalStore(
    subscribeUrl,
    () => {
      const v = new URLSearchParams(window.location.search).get(key);
      return values.includes(v as T) ? (v as T) : fallback;
    },
    () => fallback
  );
  const clearKeys = clears.join(",");
  const set = useCallback(
    (next: T) => {
      const url = new URL(window.location.href);
      if (next === fallback) {
        url.searchParams.delete(key);
        for (const k of clearKeys.split(",")) if (k) url.searchParams.delete(k);
      } else url.searchParams.set(key, next);
      window.history.replaceState(window.history.state, "", url);
      window.dispatchEvent(new Event(URL_EVENT));
    },
    [key, fallback, clearKeys]
  );
  return [value, set] as const;
}

/** The detail page's tab (`?tab=`); leaving the votes tab drops its state. */
export function useDetailTab<T extends string>(
  values: readonly T[],
  fallback: T
) {
  return useUrlParam("tab", values, fallback, VOTES_PARAMS);
}

const VOTES_PARAMS = ["list", "vote"] as const;

export function DetailTabs<T extends string>({
  value,
  onChange,
  options,
  action,
}: {
  value: T;
  onChange: (v: T) => void;
  options: readonly { value: T; label: React.ReactNode }[];
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-5 flex items-end justify-between gap-3 border-b border-hairline">
      <div role="tablist" aria-label="Section" className="flex gap-5">
        {options.map((o) => {
          const active = o.value === value;
          return (
            <button
              key={o.value}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => onChange(o.value)}
              className={cn(
                "relative -mb-px cursor-pointer pb-2.5 text-[15px] font-medium transition-colors outline-none focus-visible:text-foreground",
                active
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {o.label}
              {active && (
                <motion.span
                  layoutId="detail-tab"
                  className="absolute inset-x-0 bottom-0 h-0.5 rounded-full bg-foreground"
                  transition={{ type: "spring", bounce: 0.15, duration: 0.35 }}
                />
              )}
            </button>
          );
        })}
      </div>
      {action && <div className="pb-2.5">{action}</div>}
    </div>
  );
}
