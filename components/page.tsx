import { cn } from "@/lib/cn";

/**
 * Page scaffolding. One max-width for every data page so headers, sections
 * and tables line up; section titles sit *above* their card, never inside it.
 */

export function Page({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "mx-auto w-full max-w-[1200px] px-4 pt-6 pb-16 sm:px-6 lg:px-10 lg:pt-10",
        className
      )}
      {...props}
    />
  );
}

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  className,
}: {
  eyebrow?: React.ReactNode;
  title: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <header
      className={cn(
        "mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between",
        className
      )}
    >
      <div className="flex min-w-0 flex-col gap-2">
        {eyebrow && (
          <div className="text-ui-caption text-muted-foreground">{eyebrow}</div>
        )}
        <h1 className="text-page-title font-light tracking-[-0.01em] text-balance">
          {title}
        </h1>
        {description && (
          <p className="max-w-[62ch] text-ui-body text-muted-foreground text-pretty">
            {description}
          </p>
        )}
      </div>
      {actions && (
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {actions}
        </div>
      )}
    </header>
  );
}

export function SectionHeader({
  title,
  description,
  action,
  className,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "mb-3 flex flex-wrap items-end justify-between gap-x-4 gap-y-2",
        className
      )}
    >
      <div className="flex min-w-0 flex-col gap-0.5">
        <h2 className="text-[15px] font-medium text-foreground">{title}</h2>
        {description && (
          <p className="text-ui-caption text-muted-foreground">{description}</p>
        )}
      </div>
      {action && <div className="flex items-center gap-2">{action}</div>}
    </div>
  );
}

export function Section({
  className,
  ...props
}: React.ComponentProps<"section">) {
  return <section className={cn("mt-10 first:mt-0", className)} {...props} />;
}

export function Card({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("surface", className)} {...props} />;
}

/** A row of KPI tiles divided by hairlines (a 1px gap over the edge colour). */
export function KpiStrip({
  className,
  cols = 4,
  ...props
}: React.ComponentProps<"div"> & { cols?: 2 | 3 | 4 }) {
  return (
    <div
      className={cn(
        "grid grid-cols-2 gap-px overflow-hidden rounded-md border border-hairline bg-hairline shadow-(--surface-highlight) [&>*]:bg-surface",
        cols === 4 && "lg:grid-cols-4",
        cols === 3 && "sm:grid-cols-3",
        className
      )}
      {...props}
    />
  );
}

export function Kpi({
  label,
  value,
  sub,
  trend,
  className,
}: {
  label: React.ReactNode;
  value: React.ReactNode;
  sub?: React.ReactNode;
  /** A small chart pinned to the bottom of the tile. */
  trend?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex min-w-0 flex-col gap-1.5 px-4 py-4 sm:px-5",
        className
      )}
    >
      <div className="flex items-center gap-1.5 text-ui-caption text-muted-foreground">
        {label}
      </div>
      <div className="truncate text-[22px] leading-7 font-medium tracking-[-0.01em] text-foreground">
        {value}
      </div>
      {sub && (
        <div className="text-ui-caption text-muted-foreground">{sub}</div>
      )}
      {trend && <div className="mt-auto pt-3">{trend}</div>}
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon?: React.ReactNode;
  title: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center gap-3 px-6 py-12 text-center",
        className
      )}
    >
      {icon && (
        <div className="text-subtle-foreground [&_svg]:size-8">{icon}</div>
      )}
      <div className="flex flex-col gap-1">
        <p className="text-ui-body font-medium text-foreground">{title}</p>
        {description && (
          <p className="max-w-[62ch] text-ui-caption text-balance text-muted-foreground">
            {description}
          </p>
        )}
      </div>
      {action}
    </div>
  );
}

export function ErrorNotice({
  error,
  onRetry,
}: {
  error: unknown;
  onRetry?: () => void;
}) {
  const message =
    error instanceof Error ? error.message : "Something went wrong";
  return (
    <div className="surface flex flex-col items-start gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-col gap-0.5">
        <p className="text-ui-body font-medium">
          Couldn&apos;t load data from the subgraph
        </p>
        <p className="font-mono text-ui-caption break-all text-muted-foreground">
          {message}
        </p>
      </div>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="btn-outline inline-flex h-8 shrink-0 cursor-pointer items-center rounded-sm px-3 text-sm font-medium"
        >
          Retry
        </button>
      )}
    </div>
  );
}
