"use client";

import { useConnectModal } from "@rainbow-me/rainbowkit";
import { useQueryClient } from "@tanstack/react-query";
import {
  ArrowDown,
  Check,
  ExternalLink,
  Info,
  Loader2,
  Wallet,
} from "lucide-react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { toast } from "sonner";
import { encodeFunctionData, getAddress, type Hex, maxUint256 } from "viem";
import {
  useAccount,
  useConfig,
  useDisconnect,
  useReadContract,
  useReadContracts,
  useSendCalls,
  useSimulateContract,
  useSwitchChain,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";

import { Identity, useIdentity } from "@/components/identity";
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
import { Skeleton } from "@/components/ui/misc";
import { SafeProposed } from "@/components/wallet/safe-proposed";
import { bondingManager } from "@/lib/abis/BondingManager";
import { livepeerToken } from "@/lib/abis/LivepeerToken";
import {
  DELEGATION_EVENTS,
  REDELEGATION_EVENTS,
  trackEvent,
  trackTransaction,
  UNBONDING_EVENTS,
} from "@/lib/analytics";
import { cn } from "@/lib/cn";
import { L2_CHAIN, txUrl } from "@/lib/config";
import {
  formatDuration,
  formatETH,
  formatLPT,
  fromWei,
  shortAddress,
  toWei,
} from "@/lib/format";
import { useOrchestrators, useProtocol } from "@/lib/hooks/queries";
import { useIsSafe } from "@/lib/hooks/safe";
import { useAddresses, usePortfolioAccounts } from "@/lib/hooks/watchlist";
import { useProtocolContract } from "@/lib/staking/contracts";
import {
  bondHints,
  EMPTY_HINT,
  simulateHint,
  transferHints,
} from "@/lib/staking/hints";
import { refreshWhenIndexed } from "@/lib/subgraph/sync";

import { type Recipient, RecipientPicker, RecipientRow } from "./recipient";

/* ── Action model ────────────────────────────────────────────────────────── */

/*
 * Wording, used everywhere in the UI:
 * - Delegators "delegate" their stake. Actions are Delegate, Delegate more,
 *   Switch orchestrator, Undelegate, Redelegate (put undelegating LPT back)
 *   and Withdraw. Orchestrators "stake" (self-stake).
 * - "Stake" is the noun for the amount: your stake, total stake.
 * - Contract terms (bond, unbond, rebond, transcoder) stay out of the UI.
 */

export type StakingAction = (
  | {
      kind: "delegate";
      to: string;
      /** Pre-filled amount in LPT, e.g. a wallet's unstaked balance. */
      amount?: number;
    }
  | { kind: "undelegate"; delegate: string; staked: number }
  | { kind: "withdrawStake"; lockId: number; amount: number }
  | { kind: "rebond"; lockId: number; amount: number; delegate: string }
  | { kind: "withdrawFees"; amount: number }
  /** Move delegated stake to another portfolio wallet, without unbonding. */
  | { kind: "transfer"; delegate: string; staked: number }
) & {
  /**
   * The account this action is for. When it isn't the account active in
   * the wallet, the dialog asks you to switch before anything can be signed.
   * Omitted means "whichever account is active".
   */
  account?: string;
};

const StakingContext = createContext<{ open: (a: StakingAction) => void }>({
  open: () => {},
});

export const useStaking = () => useContext(StakingContext);

export function StakingProvider({ children }: { children: React.ReactNode }) {
  const [action, setAction] = useState<StakingAction | null>(null);
  const [open, setOpen] = useState(false);
  const { isConnected } = useAccount();
  const { openConnectModal, connectModalOpen } = useConnectModal();
  const { disconnectAsync } = useDisconnect();

  // Connecting the address an action is for: close, disconnect whatever is
  // connected, show the connect screen, and pick the action back up once a
  // wallet connects. The same for every wallet, so there's one way to do it.
  const [resume, setResume] = useState<StakingAction | null>(null);
  const shownConnect = useRef(false);
  const connect = useCallback(async () => {
    if (!action) return;
    shownConnect.current = false;
    setResume(action);
    setOpen(false);
    if (isConnected) await disconnectAsync().catch(() => {});
  }, [action, isConnected, disconnectAsync]);
  useEffect(() => {
    if (!resume) return;
    if (!isConnected && !shownConnect.current && openConnectModal) {
      shownConnect.current = true;
      openConnectModal();
    } else if (isConnected && shownConnect.current) {
      setAction(resume);
      setOpen(true);
      setResume(null);
    }
  }, [resume, isConnected, openConnectModal]);
  // Closed the connect screen without connecting: don't reopen later.
  const wasOpen = useRef(false);
  useEffect(() => {
    if (wasOpen.current && !connectModalOpen && !isConnected) setResume(null);
    wasOpen.current = connectModalOpen;
  }, [connectModalOpen, isConnected]);

  // The dialog opens either way; with nothing connected, its first step is
  // connecting.
  const start = useCallback((a: StakingAction) => {
    setAction(a);
    setOpen(true);
  }, []);

  return (
    <StakingContext.Provider value={{ open: start }}>
      {children}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          {action && (
            <AccountGate
              action={action}
              onDone={() => setOpen(false)}
              onConnect={connect}
            />
          )}
        </DialogContent>
      </Dialog>
    </StakingContext.Provider>
  );
}

/* ── Transaction plumbing ────────────────────────────────────────────────── */

type Step = { key: string; label: string };

function useTx(
  onConfirmed: () => void,
  signer: string | undefined,
  isSafe: boolean | undefined
) {
  const { address } = useAccount();
  const { writeContractAsync, isPending: writing, reset } = useWriteContract();
  const { sendCallsAsync, isPending: batching } = useSendCalls();
  const signing = writing || batching;
  const [hash, setHash] = useState<`0x${string}` | undefined>();
  // A Safe hands back a proposal's hash: there's no receipt to wait for.
  const [proposed, setProposed] = useState(false);
  const receipt = useWaitForTransactionReceipt({
    hash: isSafe ? undefined : hash,
    chainId: L2_CHAIN.id,
  });

  useEffect(() => {
    if (receipt.isSuccess) onConfirmed();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [receipt.isSuccess]);

  // Never sign from an account other than the one this action is for.
  const checkSigner = () => {
    if (!signer || address?.toLowerCase() !== signer.toLowerCase()) {
      throw new Error("Switch to the right account in your wallet first");
    }
  };

  return {
    /**
     * Several calls as one Safe proposal (EIP-5792), so the owners sign
     * once. Only offered inside Safe{Wallet}, whose provider supports it.
     */
    sendBatch: async (calls: { to: `0x${string}`; data: Hex }[]) => {
      checkSigner();
      const { id } = await sendCallsAsync({
        account: getAddress(signer!),
        chainId: L2_CHAIN.id,
        calls,
      });
      setHash(id as `0x${string}`);
      setProposed(true);
      return id;
    },
    send: async (args: Parameters<typeof writeContractAsync>[0]) => {
      reset();
      checkSigner();
      const h = await writeContractAsync({
        ...args,
        account: signer as `0x${string}`,
        chainId: L2_CHAIN.id,
      });
      setHash(h);
      if (isSafe) setProposed(true);
      return h;
    },
    clear: () => {
      setHash(undefined);
      setProposed(false);
    },
    hash,
    proposed,
    busy: signing || (!isSafe && Boolean(hash) && receipt.isLoading),
    stage: signing
      ? "sign"
      : !isSafe && hash && receipt.isLoading
      ? "confirm"
      : null,
    confirmed: receipt.isSuccess,
    block: receipt.data?.blockNumber,
  };
}

function errorMessage(e: unknown) {
  const msg =
    e instanceof Error
      ? (e as { shortMessage?: string }).shortMessage ?? e.message
      : String(e);
  if (/user rejected|denied/i.test(msg)) return "Request rejected in wallet";
  return msg.split("\n")[0];
}

/* ── UI pieces ───────────────────────────────────────────────────────────── */

function AmountField({
  value,
  onChange,
  max,
  maxLabel,
  unit = "LPT",
  autoFocus = true,
}: {
  value: string;
  onChange: (v: string) => void;
  max?: number;
  maxLabel: string;
  unit?: string;
  autoFocus?: boolean;
}) {
  const invalid = max != null && Number(value) > max;
  return (
    <div
      className={cn(
        "rounded-lg border bg-background/40 px-4 pt-3 pb-3 transition-colors focus-within:border-ring light:bg-muted",
        invalid ? "border-destructive/60" : "border-hairline"
      )}
    >
      <div className="flex items-center justify-between text-ui-caption text-muted-foreground">
        <span>Amount</span>
        {max != null && (
          <button
            type="button"
            onClick={() => onChange(String(Math.floor(max * 1e6) / 1e6))}
            className="cursor-pointer rounded-sm px-1 hover:text-foreground"
          >
            {maxLabel}:{" "}
            <span className="font-mono tabular-nums">
              {formatLPT(max).replace(" LPT", "")}
            </span>{" "}
            <span className="font-medium text-foreground">Max</span>
          </button>
        )}
      </div>
      <div className="mt-1 flex items-baseline gap-2">
        <input
          autoFocus={autoFocus}
          inputMode="decimal"
          placeholder="0"
          value={value}
          aria-label={`Amount in ${unit}`}
          aria-invalid={invalid}
          onChange={(e) => {
            const v = e.target.value.replace(/,/g, ".");
            if (/^\d*\.?\d{0,18}$/.test(v)) onChange(v);
          }}
          className="min-w-0 flex-1 bg-transparent font-mono text-[28px] leading-10 tracking-tight outline-none placeholder:text-subtle-foreground"
        />
        <span className="text-ui-body text-muted-foreground">{unit}</span>
      </div>
      {invalid && (
        <p className="mt-1 text-ui-caption text-destructive">
          More than available
        </p>
      )}
    </div>
  );
}

function Row({
  label,
  children,
}: {
  label: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4 text-ui-body">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-mono text-[13px] tabular-nums">
        {children}
      </span>
    </div>
  );
}

function Steps({
  steps,
  current,
  done,
}: {
  steps: Step[];
  current: number;
  done: boolean;
}) {
  if (steps.length < 2) return null;
  return (
    <ol className="flex items-center gap-2 text-ui-caption">
      {steps.map((s, i) => {
        const complete = done || i < current;
        const active = !done && i === current;
        return (
          <li key={s.key} className="flex items-center gap-2">
            {i > 0 && <span className="h-px w-5 bg-border" />}
            <span
              className={cn(
                "flex size-5 items-center justify-center rounded-full border text-[10px]",
                complete &&
                  "border-transparent bg-green-subtle text-green-bright",
                active && "border-foreground text-foreground",
                !complete && !active && "border-border text-subtle-foreground"
              )}
            >
              {complete ? <Check className="size-3" /> : i + 1}
            </span>
            <span
              className={
                active || complete ? "text-foreground" : "text-muted-foreground"
              }
            >
              {s.label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

function Notice({
  children,
  tone = "neutral",
}: {
  children: React.ReactNode;
  tone?: "neutral" | "warning";
}) {
  return (
    <div
      className={cn(
        "flex gap-2.5 rounded-md px-3 py-2.5 text-ui-caption",
        tone === "warning"
          ? "bg-warm-subtle text-warm"
          : "bg-hover text-muted-foreground"
      )}
    >
      <Info className="mt-0.5 size-3.5 shrink-0" />
      <div>{children}</div>
    </div>
  );
}

/** Why the protocol would refuse a transfer, in plain words, if it's a known reason. */
function transferBlocked(e: unknown, toName: string) {
  // The revert reason is on a later line of viem's message.
  const msg = e instanceof Error ? e.message : String(e);
  if (/ILLEGAL_CLAIM_EARNINGS/.test(msg)) {
    return `${toName}'s orchestrator hasn't called reward yet this round. The protocol holds transfers into ${toName} until it does, so it doesn't miss this round's rewards. Try again later this round.`;
  }
  if (/INVALID_DELEGATOR/.test(msg)) {
    return `${toName} is this stake's orchestrator, and an orchestrator can't be given stake delegated to itself this way.`;
  }
  return errorMessage(e);
}

function OrchestratorName({ address }: { address: string }) {
  const { name } = useIdentity(address);
  return (
    <span className="text-foreground">{name ?? shortAddress(address)}</span>
  );
}

/* ── Account gate ────────────────────────────────────────────────────────── */

const VERB: Record<StakingAction["kind"], string> = {
  delegate: "delegate",
  undelegate: "undelegate",
  withdrawStake: "withdraw",
  rebond: "redelegate",
  withdrawFees: "withdraw its fees",
  transfer: "transfer its stake",
};

/**
 * Only the connected account can sign. When an action is for another
 * address in the portfolio, or nothing is connected, the first step is
 * connecting it: the wallet's own connect screen, where you choose the
 * account. Switching accounts in the wallet works too; either way the
 * dialog carries on by itself once the right account is connected.
 */
function AccountGate({
  action,
  onDone,
  onConnect,
}: {
  action: StakingAction;
  onDone: () => void;
  onConnect: () => void;
}) {
  const { address } = useAccount();
  const active = address?.toLowerCase();
  const target = action.account?.toLowerCase() ?? active;
  const { list } = useAddresses();
  const label = list.find((w) => w.address === target)?.label;

  if (target && active && target === active) {
    // Keyed so a later account switch restarts the flow with fresh reads.
    return (
      <StakingFlow
        key={active}
        action={action}
        onDone={onDone}
        signer={active}
      />
    );
  }

  const verb = VERB[action.kind];
  const name = label ?? (target ? shortAddress(target) : null);

  return (
    <>
      <DialogHeader>
        <DialogTitle>
          {name ? `Connect ${name}` : "Connect a wallet"}
        </DialogTitle>
        <DialogDescription>
          {name
            ? `${name} has to sign this, so connect it to ${verb}.`
            : `Connect a wallet to ${verb}.`}
          {active &&
            name &&
            " If it's in the wallet you're using, switching accounts there works too."}
        </DialogDescription>
      </DialogHeader>
      <DialogBody>
        {target && (
          <div className="rounded-lg border border-hairline p-3">
            <Identity
              address={target}
              href={null}
              size={26}
              label={label}
              secondary="Not connected"
            />
          </div>
        )}
        {active && (
          <p className="text-ui-caption text-muted-foreground">
            Connected now:{" "}
            <span className="font-mono">{shortAddress(active)}</span>
          </p>
        )}
      </DialogBody>
      <DialogFooter>
        <Button variant="primary" onClick={onConnect}>
          <Wallet /> {active ? "Connect it" : "Connect wallet"}
        </Button>
      </DialogFooter>
    </>
  );
}

/* ── The flow ────────────────────────────────────────────────────────────── */

function StakingFlow({
  action,
  onDone,
  signer,
}: {
  action: StakingAction;
  onDone: () => void;
  signer: string;
}) {
  const { address, chainId, connector } = useAccount();
  const { switchChainAsync } = useSwitchChain();
  const config = useConfig();
  const queryClient = useQueryClient();
  const bm = useProtocolContract("BondingManager");
  const token = useProtocolContract("LivepeerToken");
  const { data: protocol } = useProtocol();
  const { data: orchestrators } = useOrchestrators();
  const [amount, setAmount] = useState(() =>
    action.kind === "delegate" && action.amount
      ? String(Math.floor(action.amount * 1e4) / 1e4)
      : ""
  );
  const [error, setError] = useState<string | null>(null);

  const account = address?.toLowerCase();
  const activeSet = useMemo(
    () => (orchestrators ?? []).map((o) => ({ id: o.id, stake: o.totalStake })),
    [orchestrators]
  );

  const { data: balanceWei, refetch: refetchBalance } = useReadContract({
    address: token,
    abi: livepeerToken,
    functionName: "balanceOf",
    args: [address!],
    chainId: L2_CHAIN.id,
    query: { enabled: Boolean(token && address) },
  });
  const { data: allowanceWei, refetch: refetchAllowance } = useReadContract({
    address: token,
    abi: livepeerToken,
    functionName: "allowance",
    args: [address!, bm!],
    chainId: L2_CHAIN.id,
    query: { enabled: Boolean(token && address && bm) },
  });
  const { data: delegatorInfo } = useReadContract({
    address: bm,
    abi: bondingManager,
    functionName: "getDelegator",
    args: [address!],
    chainId: L2_CHAIN.id,
    query: { enabled: Boolean(bm && address) },
  });
  const { data: pendingStakeWei } = useReadContract({
    address: bm,
    abi: bondingManager,
    functionName: "pendingStake",
    args: [address!, BigInt(protocol?.currentRound ?? 0)],
    chainId: L2_CHAIN.id,
    query: { enabled: Boolean(bm && address && protocol) },
  });

  const currentDelegate = (
    delegatorInfo as readonly unknown[] | undefined
  )?.[2] as string | undefined;

  // Moving stake: the other portfolio wallets it can go to, and where the
  // chosen one's stake is now, which decides where the moved stake lands.
  const { accounts: portfolio } = usePortfolioAccounts();
  const receivers = portfolio.filter((a) => a.address !== signer);
  const transferring = action.kind === "transfer";
  // Where the stake goes: a portfolio wallet, or an address typed in, which
  // has to be vouched for.
  const [picked, setPicked] = useState<Recipient | null>(() =>
    receivers.length === 1 ? receivers[0] : null
  );
  const [vouched, setVouched] = useState(false);
  const receiver = picked?.address ?? null;
  const external = Boolean(picked?.external);
  const { name: receiverName } = useIdentity(receiver);
  // Where each portfolio wallet's stake is now, for the list.
  const { data: receiverReads } = useReadContracts({
    contracts: receivers.flatMap((r) => [
      {
        address: bm,
        abi: bondingManager,
        functionName: "getDelegator",
        args: [r.address as `0x${string}`],
        chainId: L2_CHAIN.id,
      },
      {
        address: bm,
        abi: bondingManager,
        functionName: "pendingStake",
        args: [r.address as `0x${string}`, BigInt(protocol?.currentRound ?? 0)],
        chainId: L2_CHAIN.id,
      },
    ]),
    query: { enabled: Boolean(transferring && bm && protocol) },
  });
  const receiverPositions = receivers.map((r, i) => {
    const info = receiverReads?.[i * 2]?.result as
      | readonly unknown[]
      | undefined;
    const stake = receiverReads?.[i * 2 + 1]?.result as bigint | undefined;
    const delegate = (info?.[2] as string | undefined)?.toLowerCase();
    return {
      ...r,
      loaded: info != null && stake != null,
      stake: stake != null ? fromWei(stake) : 0,
      delegate: delegate && !/^0x0+$/.test(delegate) ? delegate : null,
    };
  });
  const { data: receiverInfo } = useReadContract({
    address: bm,
    abi: bondingManager,
    functionName: "getDelegator",
    args: [receiver as `0x${string}`],
    chainId: L2_CHAIN.id,
    query: { enabled: Boolean(transferring && bm && receiver) },
  });
  const bonded =
    pendingStakeWei != null ? fromWei(pendingStakeWei as bigint) : 0;
  const balance = balanceWei != null ? fromWei(balanceWei as bigint) : 0;

  // On-chain reads refresh straight away; subgraph data waits for indexing
  // (see the confirmation effect below).
  const refresh = () => {
    refetchBalance();
    refetchAllowance();
  };

  const isSafe = useIsSafe(signer);
  const approveTx = useTx(
    () => {
      refetchAllowance();
    },
    signer,
    isSafe
  );
  const tx = useTx(refresh, signer, isSafe);

  const amountWei = (() => {
    try {
      return amount ? toWei(amount) : 0n;
    } catch {
      return 0n;
    }
  })();

  const receiverBonded =
    ((receiverInfo as readonly unknown[] | undefined)?.[0] as
      | bigint
      | undefined) ?? 0n;
  const receiverDelegate = (
    (receiverInfo as readonly unknown[] | undefined)?.[2] as string | undefined
  )?.toLowerCase();
  // A wallet with no delegation takes the sender's orchestrator; one that
  // has one keeps it, and the moved stake joins it there.
  const receiverFresh =
    receiverInfo != null &&
    receiverBonded === 0n &&
    (!receiverDelegate || /^0x0+$/.test(receiverDelegate));
  const landsWith =
    receiverInfo == null
      ? undefined
      : receiverFresh
      ? currentDelegate?.toLowerCase()
      : receiverDelegate;
  const moveHints =
    transferring && landsWith
      ? transferHints(activeSet, {
          from: action.delegate,
          to: landsWith,
          amount: Number(amount || 0),
        })
      : null;
  // Checked before signing: the protocol refuses some transfers outright.
  const simulation = useSimulateContract({
    address: bm,
    abi: bondingManager,
    functionName: "transferBond",
    args: [
      receiver as `0x${string}`,
      amountWei,
      moveHints?.oldDelegate.prev ?? EMPTY_HINT.prev,
      moveHints?.oldDelegate.next ?? EMPTY_HINT.next,
      moveHints?.newDelegate.prev ?? EMPTY_HINT.prev,
      moveHints?.newDelegate.next ?? EMPTY_HINT.next,
    ],
    account: signer as `0x${string}`,
    chainId: L2_CHAIN.id,
    query: {
      enabled: Boolean(transferring && bm && receiver && amountWei > 0n),
    },
  });

  // Delegation intent: the first time the form has an amount, typed, from
  // Max or pre-filled. Switching orchestrator counts as a redelegation
  // instead, so it waits for the current delegate to know which this is.
  const trackedStart = useRef(false);
  useEffect(() => {
    if (trackedStart.current || action.kind !== "delegate") return;
    if (!delegatorInfo || amountWei === 0n) return;
    const from = currentDelegate?.toLowerCase();
    const switching =
      from && !/^0x0+$/.test(from) && from !== action.to.toLowerCase();
    if (switching) return;
    trackedStart.current = true;
    trackEvent("delegation_form_started");
  }, [action, delegatorInfo, currentDelegate, amountWei]);

  // Funnel events need an on-chain hash, which a Safe proposal doesn't have.
  const track = (events: Parameters<typeof trackTransaction>[1], h: Hex) => {
    if (!isSafe) trackTransaction(config, events, h);
  };

  const unbondingTime = protocol
    ? formatDuration(protocol.unbondingPeriod * protocol.roundSeconds)
    : "about 7 days";

  // Per-action configuration
  let title = "";
  let description: React.ReactNode = null;
  let steps: Step[] = [{ key: "main", label: "Confirm" }];
  let body: React.ReactNode = null;
  let cta = "Confirm";
  let run: () => Promise<void> = async () => {};
  let canRun = Boolean(bm && account);
  let successTitle = "Transaction confirmed";

  const needsApproval =
    action.kind === "delegate" &&
    amountWei > 0n &&
    ((allowanceWei as bigint | undefined) ?? 0n) < amountWei;
  const approvalFlow = needsApproval || approveTx.confirmed;
  // Inside Safe{Wallet} the approval rides along with the delegation.
  const safeApp = connector?.id === "safe";
  const batchApproval = safeApp && needsApproval;

  switch (action.kind) {
    case "delegate": {
      const to = action.to.toLowerCase();
      const moving =
        currentDelegate &&
        currentDelegate !== "0x0000000000000000000000000000000000000000" &&
        currentDelegate.toLowerCase() !== to;
      const adding = currentDelegate?.toLowerCase() === to;
      title = moving
        ? "Switch orchestrator"
        : adding
        ? "Delegate more"
        : "Delegate";
      description = moving
        ? "Switching moves your entire stake to the new orchestrator. Add LPT to delegate more in the same transaction."
        : "Delegated LPT earns inflationary rewards and a share of fees each round. You can undelegate any time; it takes " +
          unbondingTime +
          " to unlock.";
      steps = batchApproval
        ? [
            {
              key: "batch",
              label: `Approve and ${
                moving ? "switch" : "delegate"
              } in one Safe transaction`,
            },
          ]
        : approvalFlow
        ? [
            { key: "approve", label: "Approve LPT" },
            { key: "bond", label: moving ? "Switch" : "Delegate" },
          ]
        : [{ key: "bond", label: moving ? "Switch" : "Delegate" }];
      cta = batchApproval
        ? moving
          ? "Approve and switch"
          : "Approve and delegate"
        : needsApproval
        ? "Approve LPT"
        : moving
        ? amountWei > 0n
          ? "Switch and delegate"
          : "Switch orchestrator"
        : "Delegate";
      canRun =
        canRun &&
        Boolean(token) &&
        (amountWei > 0n || Boolean(moving)) &&
        Number(amount || 0) <= balance;
      successTitle = moving ? "Orchestrator switched" : "Delegated";
      const orch = orchestrators?.find((o) => o.id === to);
      body = (
        <>
          {moving && (
            <div className="flex flex-col gap-1.5 rounded-lg border border-hairline p-3">
              <Identity
                address={currentDelegate!.toLowerCase()}
                href={null}
                size={22}
                secondary={`${formatLPT(bonded)} moving`}
              />
              <ArrowDown className="ml-1.5 size-3.5 text-subtle-foreground" />
              <Identity
                address={to}
                href={null}
                size={22}
                secondary="New orchestrator"
              />
            </div>
          )}
          {!moving && (
            <div className="rounded-lg border border-hairline p-3">
              <Identity
                address={to}
                href={null}
                size={26}
                secondary={
                  orch
                    ? `${orch.rewardCut.toFixed(
                        0
                      )}% reward cut · ${orch.feeShare.toFixed(0)}% fee share`
                    : undefined
                }
              />
            </div>
          )}
          <AmountField
            value={amount}
            onChange={setAmount}
            max={balance}
            maxLabel="Wallet"
          />
          <div className="flex flex-col gap-2">
            {orch?.realizedApr != null && (
              <Row label="Realised yield, 30 rounds">
                {orch.realizedApr.toFixed(1)}% APR
              </Row>
            )}
            {orch?.realizedApr != null &&
              Number(amount || 0) + (moving ? bonded : 0) > 0 && (
                <Row label="Est. rewards per year">
                  {formatLPT(
                    (Number(amount || 0) + (moving ? bonded : 0)) *
                      (orch.realizedApr / 100)
                  )}
                </Row>
              )}
            <Row label="Unlock period">{unbondingTime}</Row>
          </div>
          {orch && orch.rewardCalls < orch.rewardWindow - 2 && (
            <Notice tone="warning">
              This orchestrator called reward in {orch.rewardCalls} of the last{" "}
              {orch.rewardWindow} rounds. Missed calls mean missed rewards for
              its delegators.
            </Notice>
          )}
        </>
      );
      run = async () => {
        const hints = bondHints(activeSet, {
          to,
          from: currentDelegate,
          amount: Number(amount || 0),
          moved: bonded,
        });
        const bond = {
          address: bm!,
          abi: bondingManager,
          functionName: "bondWithHint",
          args: [
            amountWei,
            to as `0x${string}`,
            hints.oldDelegate.prev,
            hints.oldDelegate.next,
            hints.newDelegate.prev,
            hints.newDelegate.next,
          ],
        } as const;
        if (batchApproval) {
          // One proposal, and an approval for exactly this amount.
          await tx.sendBatch([
            {
              to: token!,
              data: encodeFunctionData({
                abi: livepeerToken,
                functionName: "approve",
                args: [bm!, amountWei],
              }),
            },
            { to: bm!, data: encodeFunctionData(bond) },
          ]);
          return;
        }
        if (needsApproval) {
          await approveTx.send({
            address: token!,
            abi: livepeerToken,
            functionName: "approve",
            args: [bm!, maxUint256],
          });
          return;
        }
        track(
          moving ? REDELEGATION_EVENTS : DELEGATION_EVENTS,
          await tx.send(bond)
        );
      };
      break;
    }
    case "undelegate": {
      title = "Undelegate";
      description = `Undelegated LPT stops earning immediately and unlocks after ${unbondingTime}. You can redelegate it any time before withdrawing.`;
      cta = "Undelegate";
      const max = bonded || action.staked;
      canRun = canRun && amountWei > 0n && Number(amount) <= max + 1e-9;
      successTitle = "Undelegation started";
      body = (
        <>
          <div className="rounded-lg border border-hairline p-3">
            <Identity
              address={action.delegate}
              href={null}
              size={26}
              secondary="Current orchestrator"
            />
          </div>
          <AmountField
            value={amount}
            onChange={setAmount}
            max={max}
            maxLabel="Delegated"
          />
          <Row label="Available to withdraw">
            {protocol
              ? `Round ${(
                  protocol.currentRound + protocol.unbondingPeriod
                ).toLocaleString()}`
              : "—"}
          </Row>
        </>
      );
      run = async () => {
        const remaining = Math.max(0, max - Number(amount));
        const hint =
          remaining > 0
            ? simulateHint(activeSet, action.delegate, {
                [action.delegate]: -Number(amount),
              })
            : EMPTY_HINT;
        track(
          UNBONDING_EVENTS,
          await tx.send({
            address: bm!,
            abi: bondingManager,
            functionName: "unbondWithHint",
            args: [amountWei, hint.prev, hint.next],
          })
        );
      };
      break;
    }
    case "withdrawStake": {
      title = "Withdraw stake";
      description = "Send unlocked LPT back to your wallet.";
      cta = `Withdraw ${formatLPT(action.amount)}`;
      successTitle = "Stake withdrawn";
      body = <Row label="Amount">{formatLPT(action.amount)}</Row>;
      run = async () => {
        await tx.send({
          address: bm!,
          abi: bondingManager,
          functionName: "withdrawStake",
          args: [BigInt(action.lockId)],
        });
      };
      break;
    }
    case "rebond": {
      const unbondedNow = !currentDelegate || /^0x0+$/.test(currentDelegate);
      title = "Redelegate";
      description =
        "Put undelegating LPT back to work with the orchestrator it came from. It starts earning again next round.";
      cta = `Redelegate ${formatLPT(action.amount)}`;
      successTitle = "Redelegated";
      body = (
        <>
          <div className="rounded-lg border border-hairline p-3">
            <Identity
              address={action.delegate}
              href={null}
              size={26}
              secondary={formatLPT(action.amount)}
            />
          </div>
        </>
      );
      run = async () => {
        const target = unbondedNow
          ? action.delegate
          : currentDelegate!.toLowerCase();
        const hint = simulateHint(activeSet, target, {
          [target]: action.amount,
        });
        if (unbondedNow) {
          const h = await tx.send({
            address: bm!,
            abi: bondingManager,
            functionName: "rebondFromUnbondedWithHint",
            args: [
              action.delegate as `0x${string}`,
              BigInt(action.lockId),
              hint.prev,
              hint.next,
            ],
          });
          track(REDELEGATION_EVENTS, h);
        } else {
          track(
            REDELEGATION_EVENTS,
            await tx.send({
              address: bm!,
              abi: bondingManager,
              functionName: "rebondWithHint",
              args: [BigInt(action.lockId), hint.prev, hint.next],
            })
          );
        }
      };
      break;
    }
    case "transfer": {
      const max = bonded || action.staked;
      const toName =
        picked?.label ??
        receiverName ??
        (receiver ? shortAddress(receiver) : "");
      const blocked = simulation.error
        ? transferBlocked(simulation.error, toName)
        : null;
      const stakeWith = (stake: number, delegate: string) => (
        <>
          {formatLPT(stake)} with <OrchestratorName address={delegate} />
        </>
      );
      const status = (r: Recipient) => {
        const known = receiverPositions.find((p) => p.address === r.address);
        if (known) {
          if (!known.loaded) return <Skeleton className="h-3 w-32" />;
          return known.delegate && known.stake > 0
            ? stakeWith(known.stake, known.delegate)
            : "No stake";
        }
        if (r.address !== receiver || receiverInfo == null) {
          return "Not in your portfolio";
        }
        return receiverDelegate && receiverBonded > 0n
          ? stakeWith(fromWei(receiverBonded), receiverDelegate)
          : "No stake · not in your portfolio";
      };
      title = "Transfer stake";
      description =
        "Transfers delegated LPT to another wallet without undelegating, so there's no unlock period and it keeps earning. Only the receiving wallet can transfer it back.";
      cta = "Transfer";
      successTitle = "Stake transferred";
      canRun =
        canRun &&
        Boolean(receiver) &&
        (!external || vouched) &&
        amountWei > 0n &&
        Number(amount) <= max + 1e-9 &&
        simulation.isSuccess;
      const sender = portfolio.find((a) => a.address === signer);
      body = (
        <>
          <div className="flex flex-col gap-1.5">
            <div className="text-ui-caption text-muted-foreground">From</div>
            <div className="flex items-center gap-2.5 rounded-lg border border-hairline px-3 py-2.5">
              <RecipientRow
                recipient={{ address: signer, label: sender?.label }}
                status={stakeWith(max, action.delegate)}
              />
            </div>
            <ArrowDown
              aria-hidden="true"
              className="my-0.5 ml-[21px] size-3.5 text-subtle-foreground"
            />
            <div className="text-ui-caption text-muted-foreground">To</div>
            {picked ? (
              <div className="flex items-center gap-2.5 rounded-lg border border-hairline px-3 py-2.5">
                <RecipientRow
                  recipient={picked}
                  status={status(picked)}
                  onClear={() => {
                    setPicked(null);
                    setVouched(false);
                  }}
                />
              </div>
            ) : (
              <RecipientPicker
                wallets={receivers}
                exclude={signer}
                status={status}
                onSelect={(r) => {
                  setPicked(r);
                  setVouched(false);
                }}
              />
            )}
          </div>
          <AmountField
            value={amount}
            onChange={setAmount}
            max={max}
            maxLabel="Delegated"
            autoFocus={false}
          />
          {blocked ? (
            <Notice tone="warning">{blocked}</Notice>
          ) : landsWith && receiver ? (
            receiverFresh ? (
              <Notice>
                It stays with <OrchestratorName address={landsWith} /> and
                starts earning in {toName} from the next round.
              </Notice>
            ) : landsWith === currentDelegate?.toLowerCase() ? (
              <Notice>
                It&apos;s added to {toName}&apos;s stake with{" "}
                <OrchestratorName address={landsWith} />.
              </Notice>
            ) : (
              <Notice tone="warning">
                {toName} is delegated to{" "}
                <OrchestratorName address={landsWith} />, so the stake goes
                there, not to <OrchestratorName address={action.delegate} />.
              </Notice>
            )
          ) : null}
          {external && (
            <label className="flex cursor-pointer items-start gap-2.5 text-ui-caption text-muted-foreground">
              <input
                type="checkbox"
                checked={vouched}
                onChange={(e) => setVouched(e.target.checked)}
                className="mt-0.5 size-4 shrink-0 cursor-pointer accent-(--primary)"
              />
              <span>
                I control {toName}. Stake transferred there can only be
                transferred back from it, and this can&apos;t be undone.
              </span>
            </label>
          )}
        </>
      );
      run = async () => {
        await tx.send(simulation.data!.request);
      };
      break;
    }
    case "withdrawFees": {
      title = "Withdraw fees";
      description =
        "Fees are paid in ETH on Arbitrum and can be withdrawn at any time.";
      cta = `Withdraw ${formatETH(action.amount)}`;
      successTitle = "Fees withdrawn";
      body = <Row label="Amount">{formatETH(action.amount)}</Row>;
      run = async () => {
        await tx.send({
          address: bm!,
          abi: bondingManager,
          functionName: "withdrawFees",
          args: [address!, toWei(action.amount.toFixed(18))],
        });
      };
      break;
    }
  }

  const onChainWrong = chainId !== L2_CHAIN.id;
  const currentStep = approvalFlow && !needsApproval ? 1 : 0;
  const finished = tx.confirmed;
  // Queued in a Safe: the approval alone, or the action itself.
  const proposed = tx.proposed || approveTx.proposed;
  const busy = approveTx.busy || tx.busy;
  const stage = approveTx.stage ?? tx.stage;
  const pendingHash = isSafe
    ? undefined
    : tx.hash ?? (approveTx.busy ? approveTx.hash : undefined);
  // Wait for the Safe check, so a proposal is never tracked as a transaction.
  canRun = canRun && isSafe !== undefined;

  useEffect(() => {
    if (!tx.confirmed || !tx.hash) return;
    const h = tx.hash;
    const view = {
      label: "View",
      onClick: () => window.open(txUrl(h), "_blank"),
    };
    // One toast for the whole lifecycle: confirmed on-chain, then updated
    // once the subgraph has indexed the block and the views have refetched.
    const id = toast.loading(`${successTitle} · updating your portfolio…`, {
      action: view,
    });
    refreshWhenIndexed(queryClient, tx.block, [
      ["portfolio"],
      ["account-events"],
      ["orchestrators"],
      ["orchestrator"],
      ["events"],
    ]).then((indexed) =>
      toast.success(successTitle, {
        id,
        action: view,
        description: indexed
          ? undefined
          : "Still indexing. Figures will catch up shortly.",
      })
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tx.confirmed]);

  return (
    <>
      <DialogHeader>
        <DialogTitle>
          {proposed
            ? approveTx.proposed && !tx.proposed
              ? "Approval sent to your Safe"
              : "Sent to your Safe"
            : finished
            ? successTitle
            : title}
        </DialogTitle>
        {!finished && !proposed && description && (
          <DialogDescription>{description}</DialogDescription>
        )}
      </DialogHeader>
      <DialogBody>
        {proposed ? (
          <SafeProposed
            safe={signer}
            id={tx.hash ?? approveTx.hash}
            onExecuted={(block) => {
              refresh();
              refreshWhenIndexed(queryClient, block, [
                ["portfolio"],
                ["account-events"],
                ["orchestrators"],
                ["orchestrator"],
                ["events"],
              ]);
              toast.success(successTitle);
            }}
          >
            {approveTx.proposed && !tx.proposed
              ? "Once your Safe's owners sign and execute the approval, open this again to finish."
              : undefined}
          </SafeProposed>
        ) : finished ? (
          <div className="flex flex-col items-center gap-3 py-4 text-center">
            <span className="flex size-12 items-center justify-center rounded-full bg-green-subtle text-green-bright">
              <Check className="size-6" />
            </span>
            <p className="text-ui-body text-muted-foreground">
              Your portfolio updates automatically as soon as the network data
              catches up, usually within a few seconds.
            </p>
            {tx.hash && (
              <a
                href={txUrl(tx.hash)}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-ui-caption text-foreground underline-offset-4 hover:underline"
              >
                View on Arbiscan <ExternalLink className="size-3" />
              </a>
            )}
          </div>
        ) : (
          <>
            <Steps steps={steps} current={currentStep} done={false} />
            {batchApproval && (
              <Notice>
                Your Safe approves exactly this amount and delegates in one
                transaction, so its owners only sign once.
              </Notice>
            )}
            {body}
            {error && (
              <p className="text-ui-caption text-destructive">{error}</p>
            )}
          </>
        )}
      </DialogBody>
      <DialogFooter>
        {finished || proposed ? (
          <Button
            variant="primary"
            onClick={onDone}
            className="w-full sm:w-auto"
          >
            Done
          </Button>
        ) : onChainWrong ? (
          <Button
            variant="primary"
            className="w-full sm:w-auto"
            onClick={() =>
              switchChainAsync({ chainId: L2_CHAIN.id }).catch((e) =>
                setError(errorMessage(e))
              )
            }
          >
            Switch to Arbitrum
          </Button>
        ) : (
          <Button
            variant="primary"
            className="w-full sm:w-auto"
            disabled={!canRun || busy}
            onClick={async () => {
              setError(null);
              try {
                await run();
              } catch (e) {
                setError(errorMessage(e));
              }
            }}
          >
            {busy && <Loader2 className="animate-spin" />}
            {stage === "sign"
              ? "Confirm in wallet…"
              : stage === "confirm"
              ? "Confirming…"
              : cta}
          </Button>
        )}
      </DialogFooter>
      {!finished && !proposed && pendingHash && (
        <div className="-mt-2 px-5 pb-4 text-right">
          <a
            href={txUrl(pendingHash)}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground"
          >
            Pending transaction <ExternalLink className="size-3" />
          </a>
        </div>
      )}
    </>
  );
}
