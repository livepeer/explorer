"use client";

import { useCallback, useState } from "react";

import { Dialog, DialogContent } from "@/components/ui/dialog";
import type { BridgeWithdrawal } from "@/lib/bridge/types";

import { BridgeFlow } from "./bridge-dialog";
import { ClaimFlow } from "./claim-dialog";
import { BridgeContext, type Direction } from "./context";

type BridgeAction =
  | { kind: "claim"; withdrawal: BridgeWithdrawal }
  | { kind: "bridge"; wallet: string; direction?: Direction };

/** Hosts the bridge and claim dialogs, so any part of the app can open them. */
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
  const bridge = useCallback((wallet: string, direction?: Direction) => {
    setAction({ kind: "bridge", wallet: wallet.toLowerCase(), direction });
    setOpen(true);
  }, []);
  return (
    <BridgeContext.Provider value={{ claim, bridge }}>
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
