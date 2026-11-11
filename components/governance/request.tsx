"use client";

import { ExternalLink } from "lucide-react";

import { CopyButton, Identity } from "@/components/identity";
import { Card } from "@/components/page";
import { addressUrl } from "@/lib/config";
import { formatETH, formatLPT } from "@/lib/format";
import type { ProposalAction } from "@/lib/governance/actions";

type Call = Extract<ProposalAction, { kind: "call" }>;

/**
 * A call that isn't a plain LPT transfer, shown in full so a voter can
 * check exactly what it would do: the whole target address (with a link to
 * it), the function and its arguments when it's a protocol contract we can
 * read, and otherwise the raw calldata to copy and verify.
 */
function CallDetails({ call: c }: { call: Call }) {
  return (
    <>
      <span className="text-ui-body">
        Call {c.contract ?? "a contract"}
        {c.value > 0 && (
          <span className="text-muted-foreground">
            {" "}
            · sends {formatETH(c.value)}
          </span>
        )}
      </span>
      <a
        href={addressUrl(c.target)}
        target="_blank"
        rel="noreferrer"
        className="inline-flex items-center gap-1 font-mono text-ui-caption break-all text-muted-foreground hover:text-foreground"
      >
        {c.target}
        <ExternalLink className="size-3 shrink-0" />
      </a>
      {c.decoded ? (
        <div className="mt-1 rounded-md bg-hover px-2.5 py-2 font-mono text-ui-caption break-all">
          {c.decoded.functionName}(
          {c.decoded.args.map((arg, i) => (
            <div key={i} className="pl-3">
              {arg}
              {i < c.decoded!.args.length - 1 && ","}
            </div>
          ))}
          )
        </div>
      ) : c.selector ? (
        <div className="mt-1 flex flex-col gap-1">
          <span className="flex items-center gap-1 text-ui-caption text-muted-foreground">
            Calldata, not decoded
            <CopyButton value={c.data} label="Copy calldata" />
          </span>
          <code className="max-h-32 overflow-auto rounded-md bg-hover px-2.5 py-2 font-mono text-ui-caption break-all">
            {c.data}
          </code>
        </div>
      ) : (
        <span className="text-ui-caption text-muted-foreground">
          No calldata
        </span>
      )}
    </>
  );
}

/**
 * Every call a treasury proposal makes if it passes, for one that does more
 * than transfer LPT (a plain funding request shows as Requested and
 * Recipient in its details instead), so nothing it would do is hidden.
 */
export function ProposalActions({
  actions,
}: {
  actions: readonly ProposalAction[];
}) {
  return (
    <Card className="divide-y divide-(--hairline)">
      {actions.map((a, i) => (
        <div key={i} className="flex flex-col gap-1 px-4 py-3">
          {a.kind === "lptTransfer" ? (
            <>
              <span className="text-ui-body tabular-nums">
                Send {formatLPT(a.amount)}
              </span>
              <span className="flex items-center gap-1.5 text-ui-caption text-muted-foreground">
                to <Identity address={a.to} size={16} />
              </span>
            </>
          ) : (
            <CallDetails call={a} />
          )}
        </div>
      ))}
    </Card>
  );
}
