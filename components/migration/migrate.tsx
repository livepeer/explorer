"use client";

import { useConnectModal } from "@rainbow-me/rainbowkit";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, ExternalLink, Loader2 } from "lucide-react";
import Link from "next/link";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { formatEther, type Hex, isAddress } from "viem";
import {
  useAccount,
  useBalance,
  useBytecode,
  useConfig,
  useDisconnect,
  usePublicClient,
  useSwitchChain,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";
import { getAccount } from "wagmi/actions";

import { CopyButton, useIdentity } from "@/components/identity";
import { Notice, Row } from "@/components/staking/staking";
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
import { Input, Segmented } from "@/components/ui/misc";
import { DISCORD_URL, L1_CHAIN, L2_CHAIN } from "@/lib/config";
import {
  formatETH,
  formatLPT,
  formatUSD,
  fromWei,
  shortAddress,
} from "@/lib/format";
import { useOrchestrators, usePrices } from "@/lib/hooks/queries";
import { useAddresses } from "@/lib/hooks/watchlist";
import {
  addSentMigration,
  ARRIVAL_MINUTES,
  fetchL1Leftovers,
  type L1Leftovers,
  migrationCall,
  type MigrationKind,
  type MigrationPlan,
  MigrationRejected,
  planMigration,
  priceMigration,
  readSentMigrations,
  retryableUrl,
  type SentMigration,
  signatureIsFrom,
  subscribeSentMigrations,
  typedDataForCli,
} from "@/lib/migration/l1";

/*
 * Moving what an address still has on Ethereum to Arbitrum: an
 * orchestrator's own stake and fees, undelegated stake, or a broadcaster's
 * deposit and reserve. One Ethereum transaction each, landing at the same
 * address on Arbitrum about 15 minutes later.
 */

export type MigrateTarget = { account: string; kind: MigrationKind };

const MigrateContext = createContext<{ open: (t: MigrateTarget) => void }>({
  open: () => {},
});

export const useMigrate = () => useContext(MigrateContext);

export function MigrateProvider({ children }: { children: React.ReactNode }) {
  const [target, setTarget] = useState<MigrateTarget | null>(null);
  const [open, setOpen] = useState(false);
  const start = useCallback((t: MigrateTarget) => {
    setTarget(t);
    setOpen(true);
  }, []);
  return (
    <MigrateContext.Provider value={{ open: start }}>
      {children}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          {target && (
            <MigrateFlow
              key={`${target.account}-${target.kind}`}
              target={target}
              onDone={() => setOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </MigrateContext.Provider>
  );
}

/* ── Reads ───────────────────────────────────────────────────────────── */

/**
 * What an address still has on Ethereum to migrate. Checks every 20s while
 * `poll` (a migration on its way), so it clears once Arbitrum has it.
 */
export function useL1Leftovers(
  address: string | null | undefined,
  { poll = false }: { poll?: boolean } = {}
) {
  const l1 = usePublicClient({ chainId: L1_CHAIN.id });
  const l2 = usePublicClient({ chainId: L2_CHAIN.id });
  const account = address?.toLowerCase();
  return useQuery({
    queryKey: ["l1-leftovers", account],
    enabled: Boolean(account && isAddress(account) && l1 && l2),
    staleTime: 60_000,
    refetchOnWindowFocus: true,
    refetchInterval: poll ? 20_000 : false,
    queryFn: () => fetchL1Leftovers(l1!, l2!, account!),
  });
}

/** Whether a kind of leftover is still there. */
export const stillThere = (l: L1Leftovers | undefined, kind: MigrationKind) =>
  Boolean(
    l &&
      (kind === "orchestrator"
        ? l.orchestrator
        : kind === "locks"
        ? l.locks
        : l.sender)
  );

const EMPTY: SentMigration[] = [];
let cache: { raw: string; list: SentMigration[] } | null = null;
function snapshot() {
  const list = readSentMigrations();
  const raw = JSON.stringify(list);
  if (!cache || cache.raw !== raw) cache = { raw, list };
  return cache.list;
}

/** Migrations this browser sent in the last day, for this address. */
export function useSentMigrations(account: string) {
  const all = useSyncExternalStore(
    subscribeSentMigrations,
    snapshot,
    () => EMPTY
  );
  return all.filter((m) => m.account === account.toLowerCase());
}

/** A migration of this kind this browser sent for this address. */
export function useSentMigration(account: string, kind: MigrationKind) {
  return useSentMigrations(account).find((m) => m.kind === kind);
}

const etherscanTx = (hash: string) => `https://etherscan.io/tx/${hash}`;

/** Ethereum gas for a migration (measured ~150k–250k), for estimates. */
const MIGRATE_GAS = 300_000n;

function errorText(e: unknown) {
  if (e instanceof MigrationRejected) return e.message;
  const msg =
    e instanceof Error
      ? (e as { shortMessage?: string }).shortMessage ?? e.message
      : String(e);
  if (/rejected|denied/i.test(msg)) return "You declined it in your wallet.";
  return msg.split("\n")[0];
}

const TITLE: Record<MigrationKind, string> = {
  orchestrator: "Migrate orchestrator stake",
  locks: "Migrate undelegated stake",
  sender: "Migrate broadcaster funds",
};

const ABOUT: Record<MigrationKind, string> = {
  orchestrator:
    "Your orchestrator's own stake and fees are still on Ethereum, from before Livepeer moved to Arbitrum.",
  locks:
    "This stake was still unbonding when Livepeer moved to Arbitrum, so it stayed on Ethereum.",
  sender:
    "Your broadcaster deposit and reserve are still on Ethereum, from before Livepeer moved to Arbitrum.",
};

/* ── The dialog ──────────────────────────────────────────────────────── */

function MigrateFlow({
  target,
  onDone,
}: {
  target: MigrateTarget;
  onDone: () => void;
}) {
  const account = target.account.toLowerCase() as Hex;
  const { kind } = target;
  const { address, chainId, isConnected } = useAccount();
  const connected = address?.toLowerCase();
  const isSelf = connected === account;
  const config = useConfig();
  const queryClient = useQueryClient();
  const l1 = usePublicClient({ chainId: L1_CHAIN.id });
  const l2 = usePublicClient({ chainId: L2_CHAIN.id });
  const { switchChainAsync, isPending: switching } = useSwitchChain();
  const { openConnectModal } = useConnectModal();
  const { disconnectAsync } = useDisconnect();
  const { data: prices } = usePrices();
  const { list } = useAddresses();
  const { name } = useIdentity(account);
  const label = list.find((w) => w.address === account)?.label;
  const display = label ?? name ?? shortAddress(account);

  const { writeContractAsync, isPending: signing } = useWriteContract();
  const [hash, setHash] = useState<Hex>();
  const receipt = useWaitForTransactionReceipt({ hash, chainId: L1_CHAIN.id });
  const sent = receipt.isSuccess && receipt.data?.status === "success";
  const reverted = receipt.isSuccess && receipt.data?.status === "reverted";

  const { data: leftovers } = useL1Leftovers(account, { poll: sent });
  const lockIds = leftovers?.locks?.ids ?? [];
  const lockKey = lockIds.join(",");
  const arrived = sent && leftovers != null && !stillThere(leftovers, kind);

  // A contract can't be shown to be the same owner on Arbitrum, and the
  // migration always lands at the same address.
  const { data: code } = useBytecode({
    address: account,
    chainId: L1_CHAIN.id,
    query: { staleTime: 5 * 60_000 },
  });
  const isContract = Boolean(
    code && code !== "0x" && !/^0xef0100[0-9a-f]{40}$/i.test(code)
  );

  // The L1Migrator's own figures, and Arbitrum's dry run of them.
  const plan = useQuery({
    queryKey: ["l1-migration-plan", account, kind, lockKey],
    enabled: Boolean(l1 && leftovers && stillThere(leftovers, kind) && !sent),
    staleTime: 60_000,
    queryFn: () => planMigration(l1!, kind, account, lockIds),
  });
  const fee = useQuery({
    queryKey: ["l1-migration-fee", account, kind, plan.data?.data],
    enabled: Boolean(l1 && l2 && plan.data && !sent),
    staleTime: 30_000,
    refetchInterval: 60_000,
    retry: false,
    queryFn: () => priceMigration(l1!, l2!, { data: plan.data!.data, account }),
  });
  const gasPrice = useQuery({
    queryKey: ["l1-gas-price"],
    enabled: Boolean(l1),
    staleTime: 60_000,
    queryFn: () => l1!.getGasPrice(),
  });
  const gasCost = gasPrice.data != null ? MIGRATE_GAS * gasPrice.data : null;
  const { data: eth } = useBalance({
    address: address,
    chainId: L1_CHAIN.id,
    query: { enabled: Boolean(address) },
  });
  const short =
    eth != null &&
    fee.data != null &&
    gasCost != null &&
    eth.value < fee.data.value + gasCost;

  // Signing for an address you can't connect: its signature, from
  // livepeer_cli, and any wallet sends it.
  const [mode, setMode] = useState<"connect" | "cli">("connect");
  const [sig, setSig] = useState("");
  const sigCheck = useQuery({
    queryKey: ["l1-migration-sig", account, kind, lockKey, sig.trim()],
    enabled: sig.trim().length > 0,
    queryFn: () => signatureIsFrom(kind, account, lockIds, sig),
  });
  const signed = !isSelf && mode === "cli" && sigCheck.data === true;

  const [error, setError] = useState<string | null>(null);
  const running = useRef(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (reverted)
      setError("The transaction reverted on Ethereum, so nothing moved.");
  }, [reverted]);
  useEffect(() => {
    if (!sent || !hash) return;
    addSentMigration({
      account,
      kind,
      l1Tx: hash,
      sentAt: Math.floor(Date.now() / 1000),
    });
    queryClient.invalidateQueries({ queryKey: ["l1-leftovers", account] });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sent]);

  const migrate = async () => {
    if (running.current) return;
    running.current = true;
    setBusy(true);
    setError(null);
    try {
      const signature = (isSelf ? "0x" : sig.trim()) as Hex;
      if (
        !isSelf &&
        !(await signatureIsFrom(kind, account, lockIds, signature))
      ) {
        throw new Error(
          `That signature isn't from ${display} for this migration.`
        );
      }
      if (chainId !== L1_CHAIN.id) {
        await switchChainAsync({ chainId: L1_CHAIN.id });
      }
      // Fresh figures, and Arbitrum's dry run of them, right before signing.
      const p = await planMigration(l1!, kind, account, lockIds);
      const f = await priceMigration(l1!, l2!, { data: p.data, account });
      // Read now, not from this render: accounts can switch mid-flow.
      const from = getAccount(config).address?.toLowerCase() as Hex | undefined;
      if (!from) throw new Error("Connect a wallet to send it.");
      if (isSelf && from !== account) {
        throw new Error(`Switch to ${display} in your wallet to continue.`);
      }
      setHash(
        await writeContractAsync({
          ...migrationCall(p, account, signature, f),
          account: from,
        } as unknown as Parameters<typeof writeContractAsync>[0])
      );
    } catch (e) {
      setError(errorText(e));
    } finally {
      running.current = false;
      setBusy(false);
    }
  };

  const connectAccount = async () => {
    if (isConnected) await disconnectAsync().catch(() => {});
    openConnectModal?.();
  };

  const usd = (wei: bigint | null | undefined) => {
    if (wei == null) return "…";
    const v = Number(formatEther(wei));
    if (prices?.eth == null) return `~${v.toFixed(5)} ETH`;
    const d = v * prices.eth;
    return d < 0.01 ? "<$0.01" : `~${formatUSD(d)}`;
  };

  const pending =
    signing || busy || switching || (Boolean(hash) && receipt.isLoading);
  const ready =
    !isContract &&
    plan.data != null &&
    fee.data != null &&
    !short &&
    (isSelf || signed) &&
    isConnected &&
    !pending;
  const nothingLeft =
    leftovers != null && !stillThere(leftovers, kind) && !hash;

  return (
    <>
      <DialogHeader>
        <DialogTitle>{TITLE[kind]}</DialogTitle>
        {!sent && <DialogDescription>{ABOUT[kind]}</DialogDescription>}
      </DialogHeader>
      <DialogBody>
        {sent ? (
          <Sent
            plan={plan.data}
            hash={hash!}
            account={account}
            display={display}
            arrived={arrived}
          />
        ) : nothingLeft ? (
          <Notice>
            Nothing of this kind is left on Ethereum for {display}: it has
            already moved to Arbitrum.
          </Notice>
        ) : (
          <>
            <Summary plan={plan.data} loading={plan.isLoading} />
            <div className="flex flex-col gap-2">
              <Row label="Lands at">{display} on Arbitrum</Row>
              <Row label="Arbitrum's fee">
                <span title="Paid with the transaction; what Arbitrum doesn't use is refunded there">
                  {fee.data ? usd(fee.data.value) : fee.isLoading ? "…" : "—"}
                </span>
              </Row>
              <Row label="Ethereum gas">{usd(gasCost)}</Row>
              <Row label="Arrives">~{ARRIVAL_MINUTES} min</Row>
            </div>
            {isContract && (
              <Notice tone="warning">
                {display} is a contract on Ethereum. Migrating always lands at
                the same address on Arbitrum, where whoever controls it may be
                different, so it can&apos;t be migrated here. Ask in{" "}
                <a
                  href={DISCORD_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="underline underline-offset-2"
                >
                  Livepeer&apos;s Discord
                </a>{" "}
                for help.
              </Notice>
            )}
            {fee.error && (
              <Notice tone="warning">{errorText(fee.error)}</Notice>
            )}
            {!isSelf && !isContract && (
              <SignFor
                kind={kind}
                account={account}
                display={display}
                lockIds={lockIds}
                mode={mode}
                onMode={setMode}
                sig={sig}
                onSig={setSig}
                valid={sigCheck.data}
              />
            )}
            {short && (isSelf || signed) && (
              <Notice tone="warning">
                The connected wallet doesn&apos;t have enough ETH on Ethereum
                for the fees.
              </Notice>
            )}
            {error && (
              <p className="text-ui-caption text-destructive">{error}</p>
            )}
          </>
        )}
      </DialogBody>
      <DialogFooter>
        {sent || nothingLeft ? (
          <Button variant="primary" onClick={onDone}>
            Done
          </Button>
        ) : !isSelf && mode === "connect" ? (
          <Button
            variant="primary"
            disabled={isContract}
            onClick={connectAccount}
          >
            Connect {display}
          </Button>
        ) : !isConnected ? (
          <Button variant="primary" onClick={() => openConnectModal?.()}>
            {isSelf ? `Connect ${display}` : "Connect a wallet to send it"}
          </Button>
        ) : (
          <Button variant="primary" disabled={!ready} onClick={migrate}>
            {pending && <Loader2 className="animate-spin" />}
            {switching
              ? "Switching to Ethereum…"
              : signing
              ? "Confirm in wallet…"
              : hash && receipt.isLoading
              ? "Confirming…"
              : busy
              ? "Checking with Arbitrum…"
              : "Migrate to Arbitrum"}
          </Button>
        )}
      </DialogFooter>
    </>
  );
}

/** What moves, as the L1Migrator itself computes it. */
function Summary({
  plan,
  loading,
}: {
  plan: MigrationPlan | undefined;
  loading: boolean;
}) {
  const { data: orchestrators } = useOrchestrators();
  const { name: delegateName } = useIdentity(
    plan?.kind === "locks" ? plan.delegate : null
  );
  if (!plan) {
    return (
      <div className="flex h-[72px] items-center justify-center rounded-lg border border-hairline text-ui-caption text-muted-foreground">
        {loading ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          "Couldn't read it from Ethereum. Try again in a moment."
        )}
      </div>
    );
  }
  if (plan.kind === "orchestrator") {
    const delegators = plan.delegatedStake - plan.stake;
    return (
      <div className="flex flex-col gap-3 rounded-lg border border-hairline p-3.5">
        <Row label="Your stake">{formatLPT(fromWei(plan.stake))}</Row>
        {plan.fees > 0n && (
          <Row label="Your fees">{formatETH(fromWei(plan.fees))}</Row>
        )}
        <p className="text-ui-caption text-muted-foreground">
          It arrives staked to you as an orchestrator on Arbitrum.
          {delegators > 0n &&
            ` Your delegators' ${formatLPT(
              fromWei(delegators)
            )} moves too, into a pool each of them claims from, still delegated to you.`}
        </p>
      </div>
    );
  }
  if (plan.kind === "locks") {
    const orch = orchestrators?.find((o) => o.id === plan.delegate);
    const delegate = delegateName ?? shortAddress(plan.delegate);
    return (
      <div className="flex flex-col gap-3 rounded-lg border border-hairline p-3.5">
        <Row label="Undelegated stake">{formatLPT(fromWei(plan.total))}</Row>
        <Row label="Arrives delegated to">
          <Link
            href={`/orchestrators/${plan.delegate}`}
            target="_blank"
            className="hover:underline"
          >
            {delegate}
          </Link>
        </Row>
        <p className="text-ui-caption text-muted-foreground">
          It arrives staked with your orchestrator from Ethereum, so you can
          unstake it on Arbitrum or move it to another orchestrator.
          {orchestrators &&
            !orch &&
            ` ${delegate} isn't active on Arbitrum, so move it after it arrives to start earning.`}
        </p>
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-3 rounded-lg border border-hairline p-3.5">
      <Row label="Deposit">{formatETH(fromWei(plan.deposit))}</Row>
      <Row label="Reserve">{formatETH(fromWei(plan.reserve))}</Row>
      <p className="text-ui-caption text-muted-foreground">
        They arrive as your deposit and reserve on Arbitrum, ready to pay for
        transcoding there.
      </p>
    </div>
  );
}

/**
 * For an address that isn't connected: connect it, or, for a key that
 * lives in a node, sign the migration with livepeer_cli and send it from
 * any wallet.
 */
function SignFor({
  kind,
  account,
  display,
  lockIds,
  mode,
  onMode,
  sig,
  onSig,
  valid,
}: {
  kind: MigrationKind;
  account: Hex;
  display: string;
  lockIds: readonly bigint[];
  mode: "connect" | "cli";
  onMode: (m: "connect" | "cli") => void;
  sig: string;
  onSig: (s: string) => void;
  valid: boolean | undefined;
}) {
  const message = typedDataForCli(kind, account, lockIds);
  return (
    <div className="flex flex-col gap-3 rounded-lg border border-hairline p-3.5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-ui-body font-medium">
          {display} has to approve this
        </span>
        <Segmented
          label="How to approve"
          value={mode}
          onChange={onMode}
          options={[
            { value: "connect", label: "Connect it" },
            { value: "cli", label: "Sign with livepeer_cli" },
          ]}
          size="xs"
        />
      </div>
      {mode === "connect" ? (
        <p className="text-ui-caption text-muted-foreground">
          Connect {display} to send it. Key not in a wallet? Sign with
          livepeer_cli instead.
        </p>
      ) : (
        <ol className="flex flex-col gap-3 text-ui-caption text-muted-foreground">
          <li className="flex flex-col gap-1.5">
            <span>
              1. In livepeer_cli, choose{" "}
              <span className="text-foreground">Sign typed data</span> and paste
              this message:
            </span>
            <div className="flex items-start gap-2 rounded-md bg-hover p-2">
              <code className="max-h-24 min-w-0 flex-1 overflow-auto font-mono text-[11px] break-all text-foreground">
                {message}
              </code>
              <CopyButton value={message} label="Copy message" />
            </div>
          </li>
          <li className="flex flex-col gap-1.5">
            <span>2. Paste the signature it gives you:</span>
            <Input
              value={sig}
              onChange={(e) => onSig(e.target.value)}
              placeholder="0x…"
              aria-label="Signature from livepeer_cli"
              aria-invalid={sig.trim().length > 0 && valid === false}
              className="font-mono"
            />
            {sig.trim().length > 0 && valid != null && (
              <span
                className={valid ? "text-green-bright" : "text-destructive"}
              >
                {valid
                  ? `Signed by ${display}`
                  : `Not signed by ${display} for this migration`}
              </span>
            )}
          </li>
          <li>
            3. Send it from any wallet on Ethereum, which pays the fees. It
            still lands at {display}.
          </li>
        </ol>
      )}
    </div>
  );
}

function Sent({
  plan,
  hash,
  account,
  display,
  arrived,
}: {
  plan: MigrationPlan | undefined;
  hash: Hex;
  account: string;
  display: string;
  arrived: boolean;
}) {
  const what =
    plan?.kind === "orchestrator"
      ? formatLPT(fromWei(plan.stake))
      : plan?.kind === "locks"
      ? formatLPT(fromWei(plan.total))
      : plan?.kind === "sender"
      ? formatETH(fromWei(plan.deposit + plan.reserve))
      : "It";
  return (
    <div className="flex items-start gap-3 rounded-lg bg-green-subtle p-3 text-ui-body">
      {arrived ? (
        <Check className="mt-0.5 size-4 shrink-0 text-green-bright" />
      ) : (
        <Loader2 className="mt-0.5 size-4 shrink-0 animate-spin text-green-bright" />
      )}
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <span>
          {arrived
            ? `${what} is on Arbitrum, at ${display}.`
            : `${what} is on its way to Arbitrum. It usually lands in about ${ARRIVAL_MINUTES} minutes; you can close this.`}
        </span>
        <span className="flex flex-wrap gap-3 text-ui-caption">
          <a
            href={etherscanTx(hash)}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground"
          >
            View on Etherscan <ExternalLink className="size-3" />
          </a>
          {arrived ? (
            <Link
              href={`/accounts/${account}`}
              className="text-muted-foreground hover:text-foreground"
            >
              View account
            </Link>
          ) : (
            <a
              href={retryableUrl(hash)}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground"
            >
              Track on Arbitrum <ExternalLink className="size-3" />
            </a>
          )}
        </span>
      </div>
    </div>
  );
}
