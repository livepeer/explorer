"use client";

import { useState } from "react";

import { useIdentity } from "@/components/identity";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/misc";
import { shortAddress } from "@/lib/format";
import { useAddressInput } from "@/lib/hooks/address-input";
import { type PortfolioAccount, useAddresses } from "@/lib/hooks/watchlist";

/** Add any address or ENS name to the portfolio. */
export function AddAddressDialog({
  open,
  onOpenChange,
  onAdded,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onAdded?: (address: string) => void;
}) {
  const { add } = useAddresses();
  const [value, setValue] = useState("");
  const [label, setLabel] = useState("");
  const { address, ens, resolved, invalid } = useAddressInput(value);

  const submit = () => {
    if (!address) return;
    add(address, label || ens);
    onAdded?.(address);
    setValue("");
    setLabel("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
        >
          <DialogHeader>
            <DialogTitle>Add an address</DialogTitle>
            <DialogDescription>
              A cold wallet, a multisig, or any delegator. It stays in this
              browser; to act for it, you&apos;ll be asked to connect it.
            </DialogDescription>
          </DialogHeader>
          <DialogBody>
            <label className="flex flex-col gap-1.5">
              <span className="text-ui-caption text-muted-foreground">
                Address or ENS name
              </span>
              <Input
                autoFocus
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder="0x… or name.eth"
                aria-invalid={invalid}
                className="font-mono"
              />
              {ens && resolved && (
                <span className="font-mono text-[11px] text-muted-foreground">
                  {shortAddress(resolved, 10, 8)}
                </span>
              )}
              {invalid && (
                <span className="text-ui-caption text-destructive">
                  Not a valid address or name
                </span>
              )}
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-ui-caption text-muted-foreground">
                Label (optional)
              </span>
              <Input
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="Cold storage"
                maxLength={32}
              />
            </label>
          </DialogBody>
          <DialogFooter>
            <Button type="submit" variant="primary" disabled={!address}>
              Add address
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/** Name an address in the portfolio; empty clears it. */
export function RenameAddressDialog({
  account,
  onOpenChange,
}: {
  account: PortfolioAccount | null;
  onOpenChange: (open: boolean) => void;
}) {
  const { rename } = useAddresses();
  const { name } = useIdentity(account?.address);
  const [draft, setDraft] = useState("");
  const [shown, setShown] = useState<string | null>(null);
  // Start from the current label each time a different address opens.
  if (account && account.address !== shown) {
    setShown(account.address);
    setDraft(account.label ?? "");
  }

  return (
    <Dialog open={Boolean(account)} onOpenChange={onOpenChange}>
      <DialogContent>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (account) rename(account.address, draft);
            onOpenChange(false);
          }}
        >
          <DialogHeader>
            <DialogTitle>Rename</DialogTitle>
            <DialogDescription>
              {account ? shortAddress(account.address, 10, 8) : ""} · shown only
              in this browser.
            </DialogDescription>
          </DialogHeader>
          <DialogBody>
            <Input
              autoFocus
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder={name ?? "Cold storage"}
              maxLength={32}
              aria-label="Name"
            />
          </DialogBody>
          <DialogFooter>
            <Button type="submit" variant="primary">
              Save
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
