"use client";

import { useCallback, useState } from "react";

import { Dialog, DialogContent } from "@/components/ui/dialog";
import type { BridgeWithdrawal, TrackedDeposit } from "@/lib/bridge/types";

import { BridgeFlow } from "./bridge-dialog";
import { ClaimFlow } from "./claim-dialog";
import { BridgeContext, type Direction } from "./context";
import { RetryFlow } from "./retry-dialog";

type BridgeAction =
  | { kind: "claim"; withdrawal: BridgeWithdrawal }
  | { kind: "retry"; deposit: TrackedDeposit }
  | { kind: "bridge"; wallet: string; direction?: Direction };

/**
 * Hosts the bridge, claim and retry dialogs, so any part of the app can
 * open them.
 */
export function BridgeProvider({ children }: { children: React.ReactNode }) {
  const [action, setAction] = useState<BridgeAction | null>(null);
  const [open, setOpen] = useState(false);
  // A claim opened from the bridge dialog returns to it afterwards.
  const [returnTo, setReturnTo] = useState<BridgeAction | null>(null);
  const claim = useCallback(
    (withdrawal: BridgeWithdrawal) => {
      setReturnTo(open && action?.kind === "bridge" ? action : null);
      setAction({ kind: "claim", withdrawal });
      setOpen(true);
    },
    [open, action]
  );
  const back = () => {
    setAction(returnTo);
    setReturnTo(null);
  };
  const retry = useCallback((deposit: TrackedDeposit) => {
    setReturnTo(null);
    setAction({ kind: "retry", deposit });
    setOpen(true);
  }, []);
  const bridge = useCallback((wallet: string, direction?: Direction) => {
    setAction({ kind: "bridge", wallet: wallet.toLowerCase(), direction });
    setOpen(true);
  }, []);
  return (
    <BridgeContext.Provider value={{ claim, retry, bridge }}>
      {children}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          {action?.kind === "claim" && (
            <ClaimFlow
              key={action.withdrawal.id}
              withdrawal={action.withdrawal}
              onDone={returnTo ? back : () => setOpen(false)}
              onBack={returnTo ? back : undefined}
            />
          )}
          {action?.kind === "retry" && (
            <RetryFlow
              key={`${action.deposit.l1Tx}-${action.deposit.seq ?? ""}`}
              deposit={action.deposit}
              onDone={() => setOpen(false)}
            />
          )}
          {action?.kind === "bridge" && (
            <BridgeFlow
              key={`${action.wallet}-${action.direction ?? "auto"}`}
              wallet={action.wallet}
              initialDirection={action.direction}
            />
          )}
        </DialogContent>
      </Dialog>
    </BridgeContext.Provider>
  );
}
