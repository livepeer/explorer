"use client";

import { Identity } from "@/components/identity";
import { Card } from "@/components/page";
import { formatETH, formatLPT, shortAddress } from "@/lib/format";
import type { ProposalAction } from "@/lib/governance/actions";

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
            <>
              <span className="text-ui-body">
                Call{" "}
                <span className="font-mono text-[13px]">
                  {shortAddress(a.target)}
                </span>
              </span>
              <span className="text-ui-caption text-muted-foreground">
                {a.selector ? (
                  <>
                    Function <span className="font-mono">{a.selector}</span>
                  </>
                ) : (
                  "No calldata"
                )}
                {a.value > 0 && ` · sends ${formatETH(a.value)}`}
              </span>
            </>
          )}
        </div>
      ))}
    </Card>
  );
}
