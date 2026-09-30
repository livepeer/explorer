"use client";

import { Combobox } from "@base-ui/react/combobox";
import { ChevronDown, X } from "lucide-react";
import { useEffect, useId, useMemo, useState } from "react";

import { Avatar, useIdentity } from "@/components/identity";
import { cn } from "@/lib/cn";
import { shortAddress } from "@/lib/format";
import { useAddressInput } from "@/lib/hooks/address-input";

/** A wallet stake can go to, with where its own stake is now. */
export type Recipient = {
  address: string;
  label?: string;
  /** Delegated LPT, once known. */
  stake?: number;
  /** Its orchestrator, or null with nothing delegated. */
  delegate?: string | null;
  /** Typed in rather than one of the portfolio's wallets. */
  external?: boolean;
};

/**
 * Pick where stake goes: one of the portfolio's wallets from the list, or
 * any address or ENS name pasted or typed into the same field, which is
 * chosen as soon as it resolves, the way a wallet's send screen works.
 */
export function RecipientPicker({
  wallets,
  exclude,
  onSelect,
  status,
}: {
  wallets: Recipient[];
  /** The sending wallet, which can't be picked. */
  exclude: string;
  onSelect: (r: Recipient) => void;
  status: (r: Recipient) => React.ReactNode;
}) {
  const id = useId();
  const [query, setQuery] = useState("");
  const typed = useAddressInput(query);
  const isSelf = typed.address === exclude;

  const items = useMemo(() => {
    const q = query.trim().toLowerCase();
    return wallets.filter(
      (w) =>
        !q ||
        w.address.includes(q) ||
        (w.label?.toLowerCase().includes(q) ?? false)
    );
  }, [wallets, query]);

  // A full address or resolved name is the choice; no need to pick it again.
  useEffect(() => {
    if (!typed.address || isSelf) return;
    const own = wallets.find((w) => w.address === typed.address);
    onSelect(
      own ?? { address: typed.address, label: typed.ens, external: true }
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [typed.address]);

  return (
    <Combobox.Root
      items={items}
      filter={null}
      inputValue={query}
      onInputValueChange={setQuery}
      value={null}
      onValueChange={(r: Recipient | null) => {
        if (r) onSelect(r);
      }}
      itemToStringLabel={(r: Recipient) => r.label ?? r.address}
      autoHighlight
    >
      <label htmlFor={id} className="sr-only">
        Receiving wallet or address
      </label>
      <Combobox.InputGroup className="relative flex h-10 items-center rounded-lg border border-hairline bg-background/40 transition-colors focus-within:border-ring light:bg-muted">
        <Combobox.Input
          id={id}
          placeholder="Choose a wallet, or paste an address or ENS name"
          aria-invalid={typed.invalid || isSelf}
          className="h-full w-full min-w-0 bg-transparent pr-9 pl-3 text-ui-body outline-none placeholder:text-muted-foreground"
        />
        <Combobox.Trigger
          aria-label="Show wallets"
          className="absolute right-1 flex size-8 cursor-pointer items-center justify-center rounded-md text-muted-foreground hover:text-foreground"
        >
          <ChevronDown className="size-4" />
        </Combobox.Trigger>
      </Combobox.InputGroup>
      {isSelf ? (
        <p className="mt-1.5 text-ui-caption text-destructive">
          That&apos;s the wallet the stake is in.
        </p>
      ) : typed.invalid ? (
        <p className="mt-1.5 text-ui-caption text-destructive">
          Not a valid address or ENS name
        </p>
      ) : null}
      <Combobox.Portal>
        <Combobox.Positioner sideOffset={6} className="z-[120]">
          <Combobox.Popup className="w-(--anchor-width) max-w-(--available-width) origin-(--transform-origin) rounded-xl border border-hairline bg-popover p-1 shadow-(--shadow-popover) outline-none transition-[opacity,scale] duration-150 ease-out data-ending-style:scale-95 data-ending-style:opacity-0 data-starting-style:scale-95 data-starting-style:opacity-0">
            <Combobox.Empty>
              <div className="px-3 py-2.5 text-ui-caption text-muted-foreground">
                {typed.resolving
                  ? "Looking up that name…"
                  : "No wallets match. Paste a full address or ENS name."}
              </div>
            </Combobox.Empty>
            <Combobox.List className="max-h-[min(18rem,var(--available-height))] overflow-y-auto outline-none">
              {(r: Recipient) => (
                <Combobox.Item
                  key={r.address}
                  value={r}
                  className="flex cursor-pointer items-center gap-2.5 rounded-md px-2.5 py-2 outline-none select-none data-highlighted:bg-hover"
                >
                  <RecipientRow recipient={r} status={status(r)} />
                </Combobox.Item>
              )}
            </Combobox.List>
          </Combobox.Popup>
        </Combobox.Positioner>
      </Combobox.Portal>
    </Combobox.Root>
  );
}

/** A wallet as a row: avatar, name with its short address, and a status. */
export function RecipientRow({
  recipient: r,
  status,
  onClear,
}: {
  recipient: Recipient;
  status: React.ReactNode;
  /** Shown as a clear button, for a chosen recipient. */
  onClear?: () => void;
}) {
  const { name, avatar } = useIdentity(r.address);
  const title = r.label ?? name;
  return (
    <>
      <Avatar address={r.address} src={avatar} size={26} />
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="flex min-w-0 items-baseline gap-2 text-ui-body">
          {title ? (
            <span className="truncate">{title}</span>
          ) : (
            <span className="truncate font-mono text-[13px]">
              {shortAddress(r.address)}
            </span>
          )}
          {title && (
            <span className="shrink-0 font-mono text-[11px] text-muted-foreground">
              {shortAddress(r.address)}
            </span>
          )}
        </span>
        <span className="truncate text-ui-caption text-muted-foreground">
          {status}
        </span>
      </span>
      {onClear && (
        <button
          type="button"
          onClick={onClear}
          aria-label="Choose a different wallet"
          className={cn(
            "flex size-7 shrink-0 cursor-pointer items-center justify-center rounded-md text-muted-foreground hover:bg-hover hover:text-foreground"
          )}
        >
          <X className="size-3.5" />
        </button>
      )}
    </>
  );
}
