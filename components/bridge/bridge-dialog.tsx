"use client";

import { useConnectModal } from "@rainbow-me/rainbowkit";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeftRight, Check, ExternalLink, Loader2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import {
  encodeFunctionData,
  erc20Abi,
  formatEther,
  formatUnits,
  type Hex,
} from "viem";
import {
  useAccount,
  useBalance,
  useDisconnect,
  usePublicClient,
  useReadContract,
  useSendCalls,
  useSendTransaction,
  useSwitchChain,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";

import { Avatar, useIdentity } from "@/components/identity";
import { useNow } from "@/components/shell/round-clock";
import { AmountField, Notice } from "@/components/staking/staking";
import { Button } from "@/components/ui/button";
import {
  DialogBody,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { SafeProposed } from "@/components/wallet/safe-proposed";
import {
  L1_GATEWAY_ROUTER,
  L1_LPT,
  L1_LPT_GATEWAY,
  l1TxUrl,
  L2_GATEWAY_ROUTER,
  L2_LPT,
  L2_LPT_GATEWAY,
  l2OutboundTransferAbi,
  outboundTransferAbi,
} from "@/lib/bridge/config";
import {
  addPendingDeposit,
  MAX_DEPOSIT_VALUE,
  priceDeposit,
} from "@/lib/bridge/deposit";
import { checkRoute } from "@/lib/bridge/guards";
import { addSentWithdrawal } from "@/lib/bridge/withdrawals";
import { cn } from "@/lib/cn";
import { L1_CHAIN, L2_CHAIN, txUrl } from "@/lib/config";
import {
  formatLPT,
  formatUSD,
  fromWei,
  shortAddress,
  toWei,
} from "@/lib/format";
import { LIVE_READ, refetchUntil } from "@/lib/hooks/live-read";
import { usePrices } from "@/lib/hooks/queries";
import { safeAppUrl } from "@/lib/hooks/safe";
import { useAddresses } from "@/lib/hooks/watchlist";

import type { Direction } from "./context";
import { useDestination } from "./destination";
import { errorText } from "./error-text";
import { Transfers } from "./transfers";

/** Ethereum gas: a claim (measured 164k–183k) and a deposit, for estimates. */
const CLAIM_GAS = 190_000n;
const DEPOSIT_GAS = 200_000n;
const APPROVE_GAS = 60_000n;
/** Arbitrum gas for an approval plus a withdrawal (measured ~150k). */
const WITHDRAW_GAS = 250_000n;
const WITHDRAWAL_DAYS = 7;

const NETWORK = { toArbitrum: "Ethereum", toEthereum: "Arbitrum" } as const;

/**
 * Arbitrum's own bridge, preset for LPT in this direction: for contract
 * wallets, which need to choose a destination address there.
 */
const arbitrumBridgeUrl = (direction: Direction) => {
  const [from, to] =
    direction === "toArbitrum"
      ? ["ethereum", "arbitrum-one"]
      : ["arbitrum-one", "ethereum"];
  return `https://bridge.arbitrum.io/?sourceChain=${from}&destinationChain=${to}&token=${L1_LPT}`;
};

const day = (ms: number) =>
  new Date(ms).toLocaleDateString("en-US", { month: "short", day: "numeric" });

/**
 * Moving LPT between Ethereum and Arbitrum, both ways, in one place: the
 * wallet's LPT on each network, what happens after you sign, and every
 * transfer on its way. Approve and bridge runs both transactions in turn.
 *
 * To Arbitrum: approve Ethereum's gateway for exactly the amount, then
 * deposit through Arbitrum's router with Arbitrum's side priced live; it
 * lands in ~15 minutes. To Ethereum: approve Arbitrum's gateway (Livepeer's
 * LPT is burned with burnFrom, so it needs one), then withdraw through the
 * router; it's claimable on Ethereum after ~7 days.
 *
 * Where it lands is useDestination's call: a wallet's own address, a Safe's
 * own address when the same Safe exists on the other network, or one the
 * Safe chooses. Safes sign by proposal: inside Safe{Wallet} the approval and
 * the bridge go as one batch; elsewhere, one proposal per step.
 */
export function BridgeFlow({
  wallet,
  initialDirection,
}: {
  wallet: string;
  initialDirection?: Direction;
}) {
  const account = wallet as `0x${string}`;
  const { address, chainId, isConnected, connector } = useAccount();
  const { openConnectModal } = useConnectModal();
  const { disconnect } = useDisconnect();

  /*
   * Connecting the wallet that holds this LPT when another is connected.
   * Switching accounts in the wallet isn't enough: a wallet only shows a
   * site the accounts connected to it. A browser wallet can be asked to
   * connect more (wallet_requestPermissions opens its account picker);
   * WalletConnect fixes accounts when pairing and a Safe is the Safe, so
   * there it's disconnect and connect again. The dialog updates itself
   * once the right account arrives.
   */
  const [connectingWallet, setConnectingWallet] = useState(false);
  const [reconnect, setReconnect] = useState(false);
  useEffect(() => {
    if (reconnect && !isConnected && openConnectModal) {
      setReconnect(false);
      openConnectModal();
    }
  }, [reconnect, isConnected, openConnectModal]);
  const connectAgain = () => {
    setReconnect(true);
    disconnect();
  };
  const connectWallet = async () => {
    if (
      !connector ||
      connector.type === "walletConnect" ||
      connector.id === "safe"
    ) {
      connectAgain();
      return;
    }
    setConnectingWallet(true);
    try {
      const provider = (await connector.getProvider()) as {
        request: (a: {
          method: string;
          params?: unknown[];
        }) => Promise<unknown>;
      };
      await provider.request({
        method: "wallet_requestPermissions",
        params: [{ eth_accounts: {} }],
      });
    } catch (e) {
      // Declined in the wallet: leave it. A wallet that can't do this
      // gets the connect dialog instead.
      if (!/rejected|denied/i.test(errorText(e))) connectAgain();
    } finally {
      setConnectingWallet(false);
    }
  };
  const { switchChainAsync, isPending: switching } = useSwitchChain();
  const queryClient = useQueryClient();
  const l1 = usePublicClient({ chainId: L1_CHAIN.id });
  const l2 = usePublicClient({ chainId: L2_CHAIN.id });
  const { data: prices } = usePrices();
  const { name } = useIdentity(wallet);
  const { list } = useAddresses();
  const label = list.find((w) => w.address === wallet)?.label;
  const walletName = label ?? name ?? shortAddress(wallet);
  const nowMs = useNow(60_000);

  const [chosen, setDirection] = useState<Direction | undefined>(
    initialDirection
  );

  // The wallet's LPT on each network, and its approval on the source.
  const { data: l1Wei } = useReadContract({
    address: L1_LPT,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: [account],
    chainId: L1_CHAIN.id,
    query: LIVE_READ,
  });
  const { data: l2Wei } = useReadContract({
    address: L2_LPT,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: [account],
    chainId: L2_CHAIN.id,
    query: LIVE_READ,
  });
  // Without a direction given, start where the LPT is: bringing it to
  // Arbitrum to delegate is the common move.
  const auto: Direction =
    l1Wei != null && fromWei(l1Wei) >= 0.01 ? "toArbitrum" : "toEthereum";
  const direction: Direction = chosen ?? auto;
  // Settled once read, so a deposit emptying Ethereum doesn't flip it.
  useEffect(() => {
    if (chosen === undefined && l1Wei != null) setDirection(auto);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [l1Wei]);
  const toArbitrum = direction === "toArbitrum";
  const sourceChain = toArbitrum ? L1_CHAIN.id : L2_CHAIN.id;
  const sourceWei = toArbitrum ? l1Wei : l2Wei;
  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: toArbitrum ? L1_LPT : L2_LPT,
    abi: erc20Abi,
    functionName: "allowance",
    args: [account, toArbitrum ? L1_LPT_GATEWAY : L2_LPT_GATEWAY],
    chainId: sourceChain,
    query: LIVE_READ,
  });
  const [proposal, setProposal] = useState<{
    id: string;
    kind: "approval" | "bridge";
  } | null>(null);
  const dest = useDestination({
    wallet,
    sourceChain,
    destChain: toArbitrum ? L2_CHAIN.id : L1_CHAIN.id,
    destNetwork: toArbitrum ? "Arbitrum" : "Ethereum",
    locked: Boolean(proposal),
  });
  const to = (dest.to ?? undefined) as `0x${string}` | undefined;
  const { data: l1Eth } = useBalance({
    address: account,
    chainId: L1_CHAIN.id,
    query: LIVE_READ,
  });
  const { data: l2Eth } = useBalance({
    address: account,
    chainId: L2_CHAIN.id,
    query: LIVE_READ,
  });

  // The amount: everything there (to 4 places), refilled on each swap.
  const [amount, setAmount] = useState("");
  const filled = useRef<Direction | null>(null);
  useEffect(() => {
    if (sourceWei == null || filled.current === direction) return;
    filled.current = direction;
    setAmount(
      sourceWei > 0n ? String(Math.floor(fromWei(sourceWei) * 1e4) / 1e4) : ""
    );
  }, [sourceWei, direction]);
  const amountWei = (() => {
    try {
      return amount ? toWei(amount) : 0n;
    } catch {
      return 0n;
    }
  })();
  const tooMuch = sourceWei != null && amountWei > sourceWei;

  // Arbitrum's side of a deposit, priced live.
  const price = useQuery({
    queryKey: ["bridge-deposit-price", wallet, to, amountWei.toString()],
    enabled: Boolean(
      toArbitrum && l1 && l2 && to && amountWei > 0n && !tooMuch
    ),
    staleTime: 30_000,
    refetchInterval: 60_000,
    queryFn: () =>
      priceDeposit(l1!, l2!, { from: account, to: to!, amount: amountWei }),
  });
  const gasPrices = useQuery({
    queryKey: ["bridge-gas-prices"],
    enabled: Boolean(l1 && l2),
    staleTime: 60_000,
    queryFn: async () => {
      const [g1, g2] = await Promise.all([
        l1!.getGasPrice(),
        l2!.getGasPrice(),
      ]);
      return { l1: g1, l2: g2 };
    },
  });
  const g = gasPrices.data;
  const allowanceShort = (allowance ?? 0n) < amountWei;
  // ETH costs: now, on the source network, and later, to claim.
  const sendCost = g
    ? toArbitrum
      ? price.data
        ? (DEPOSIT_GAS + (allowanceShort ? APPROVE_GAS : 0n)) * g.l1 +
          price.data.value
        : undefined
      : WITHDRAW_GAS * g.l2
    : undefined;
  const claimCost = g && !toArbitrum ? CLAIM_GAS * g.l1 : undefined;
  const usd = (wei?: bigint) => {
    if (wei == null) return null;
    const eth = Number(formatEther(wei));
    if (prices?.eth == null) return `~${eth.toFixed(5)} ETH`;
    const v = eth * prices.eth;
    return v < 0.01 ? "<$0.01" : `~${formatUSD(v)}`;
  };
  const shortForDeposit = dest.isSafe
    ? toArbitrum &&
      price.data != null &&
      l1Eth != null &&
      l1Eth.value < price.data.value
    : toArbitrum && sendCost != null && l1Eth != null && l1Eth.value < sendCost;
  const shortForWithdrawal =
    !dest.isSafe &&
    !toArbitrum &&
    sendCost != null &&
    l2Eth != null &&
    l2Eth.value < sendCost;
  const lowForClaim =
    !toArbitrum &&
    claimCost != null &&
    l1Eth != null &&
    l1Eth.value < claimCost;

  // Approve, then bridge: one click, two transactions.
  const { writeContractAsync, isPending: writing } = useWriteContract();
  const { sendCallsAsync, isPending: batching } = useSendCalls();
  const { sendTransactionAsync, isPending: proposing } = useSendTransaction();
  const signing = writing || batching || proposing;
  const [approveTx, setApproveTx] = useState<`0x${string}`>();
  const [sendTx, setSendTx] = useState<`0x${string}`>();
  const [txChain, setTxChain] = useState<number>(sourceChain);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const continueAfterApproval = useRef(false);
  const approval = useWaitForTransactionReceipt({
    hash: approveTx,
    chainId: txChain,
  });
  const sent = useWaitForTransactionReceipt({ hash: sendTx, chainId: txChain });
  const done = sent.isSuccess && sent.data?.status === "success";
  const needsApproval = !syncing && (allowance ?? 0n) < amountWei;

  // Before anything is signed: the bridge still runs the way this app does.
  const guard = () =>
    checkRoute(
      toArbitrum ? l1! : l2!,
      toArbitrum ? "toArbitrum" : "toEthereum"
    );

  const send = async () => {
    await guard();
    setTxChain(sourceChain);
    if (toArbitrum) {
      const { data: p } = await price.refetch();
      if (!p) throw new Error("Couldn't price Arbitrum's fee. Try again.");
      if (p.value > MAX_DEPOSIT_VALUE) throw new Error("Fees look too high.");
      setSendTx(
        await writeContractAsync({
          address: L1_GATEWAY_ROUTER,
          abi: outboundTransferAbi,
          functionName: "outboundTransfer",
          args: [L1_LPT, to!, amountWei, p.maxGas, p.gasPriceBid, p.data],
          value: p.value,
          chainId: L1_CHAIN.id,
        })
      );
    } else {
      setSendTx(
        await writeContractAsync({
          address: L2_GATEWAY_ROUTER,
          abi: l2OutboundTransferAbi,
          functionName: "outboundTransfer",
          // The router takes the Ethereum token's address.
          args: [L1_LPT, to!, amountWei, "0x"],
          chainId: L2_CHAIN.id,
        })
      );
    }
  };

  // A Safe proposes instead. Inside Safe{Wallet} the approval and the
  // bridge go as one batch, so its owners sign once; connected another way,
  // each is its own proposal, and the bridge waits for the approval to run.
  const safeApp = connector?.id === "safe";
  const proposeAsSafe = async () => {
    await guard();
    const approveCall = {
      to: (toArbitrum ? L1_LPT : L2_LPT) as `0x${string}`,
      data: encodeFunctionData({
        abi: erc20Abi,
        functionName: "approve",
        args: [toArbitrum ? L1_LPT_GATEWAY : L2_LPT_GATEWAY, amountWei],
      }),
    };
    let bridgeCall: { to: `0x${string}`; data: Hex; value?: bigint };
    if (toArbitrum) {
      const { data: p } = await price.refetch();
      if (!p) throw new Error("Couldn't price Arbitrum's fee. Try again.");
      if (p.value > MAX_DEPOSIT_VALUE) throw new Error("Fees look too high.");
      bridgeCall = {
        to: L1_GATEWAY_ROUTER,
        data: encodeFunctionData({
          abi: outboundTransferAbi,
          functionName: "outboundTransfer",
          args: [L1_LPT, to!, amountWei, p.maxGas, p.gasPriceBid, p.data],
        }),
        value: p.value,
      };
    } else {
      bridgeCall = {
        to: L2_GATEWAY_ROUTER,
        data: encodeFunctionData({
          abi: l2OutboundTransferAbi,
          functionName: "outboundTransfer",
          args: [L1_LPT, to!, amountWei, "0x"],
        }),
      };
    }
    if (safeApp) {
      const { id } = await sendCallsAsync({
        account,
        chainId: sourceChain,
        calls: needsApproval ? [approveCall, bridgeCall] : [bridgeCall],
      });
      setProposal({ id, kind: "bridge" });
      return;
    }
    const step: { to: `0x${string}`; data: Hex; value?: bigint } = needsApproval
      ? approveCall
      : bridgeCall;
    const id = await sendTransactionAsync({
      account,
      to: step.to,
      data: step.data,
      value: step.value,
      chainId: sourceChain,
    });
    setProposal({ id, kind: needsApproval ? "approval" : "bridge" });
  };
  const approve = async () => {
    await guard();
    setTxChain(sourceChain);
    continueAfterApproval.current = true;
    setApproveTx(
      await writeContractAsync({
        address: toArbitrum ? L1_LPT : L2_LPT,
        abi: erc20Abi,
        functionName: "approve",
        // Exactly this amount, as Arbitrum's bridge does.
        args: [toArbitrum ? L1_LPT_GATEWAY : L2_LPT_GATEWAY, amountWei],
        chainId: sourceChain,
      })
    );
  };

  // Approved: wait for the allowance to read back, then bridge.
  useEffect(() => {
    if (!approval.isSuccess) return;
    if (approval.data?.status !== "success") {
      setError("The approval reverted, so nothing changed.");
      return;
    }
    setSyncing(true);
    refetchUntil(refetchAllowance, (a) => (a ?? 0n) >= amountWei)
      .then((ok) => {
        setSyncing(false);
        if (ok && continueAfterApproval.current) {
          continueAfterApproval.current = false;
          send().catch((e) => setError(errorText(e)));
        }
      })
      .catch(() => setSyncing(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [approval.isSuccess]);

  useEffect(() => {
    if (!sent.isSuccess || !sendTx) return;
    if (sent.data?.status !== "success") {
      setError("The transaction reverted, so your LPT didn't move.");
      return;
    }
    if (toArbitrum) {
      addPendingDeposit({
        l1Tx: sendTx,
        from: wallet,
        to: wallet,
        amount: amountWei.toString(),
        sentAt: Math.floor(Date.now() / 1000),
      });
    } else {
      // Shown everywhere at once, not only once the index picks it up.
      addSentWithdrawal({
        tx: sendTx,
        from: wallet,
        to: to ?? wallet,
        amount: amountWei.toString(),
        timestamp: Math.floor(Date.now() / 1000),
      });
    }
    queryClient.invalidateQueries({ queryKey: ["bridge-withdrawals"] });
    queryClient.invalidateQueries({ queryKey: ["readContracts"] });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sent.isSuccess]);

  const busy =
    signing ||
    syncing ||
    (Boolean(approveTx) && approval.isLoading) ||
    (Boolean(sendTx) && sent.isLoading);

  const swap = () => {
    if (busy) return;
    setDirection(toArbitrum ? "toEthereum" : "toArbitrum");
    filled.current = null;
    setApproveTx(undefined);
    setSendTx(undefined);
    setError(null);
  };
  const startOver = () => {
    filled.current = null;
    setApproveTx(undefined);
    setSendTx(undefined);
    setProposal(null);
    setError(null);
  };

  const signer = address?.toLowerCase() === wallet;
  const onSource = chainId === sourceChain;
  const destination = toArbitrum ? "Arbitrum" : "Ethereum";
  // A Safe can't switch networks: Safe{Wallet} opens it on one.
  const safeElsewhere = dest.isSafe && signer && !onSource;
  const canRun =
    signer &&
    !switching &&
    !safeElsewhere &&
    !dest.unsupported &&
    !dest.loading &&
    Boolean(to) &&
    amountWei > 0n &&
    !tooMuch &&
    !shortForDeposit &&
    !shortForWithdrawal &&
    (!toArbitrum || Boolean(price.data)) &&
    !busy;
  const step = needsApproval ? "1 of 2" : approveTx ? "2 of 2" : null;
  const problem = price.error ? errorText(price.error) : null;

  const balanceOn = (wei?: bigint) =>
    wei == null ? "…" : `${formatLPT(fromWei(wei))}`;

  return (
    <>
      <DialogHeader>
        {/* The title, and whether the wallet whose LPT this is can sign. */}
        <div className="flex items-center gap-3 pr-8">
          <DialogTitle>Bridge LPT</DialogTitle>
          <span className="ml-auto flex shrink-0 items-center gap-1.5 text-ui-caption text-muted-foreground">
            <span
              className={cn(
                "size-1.5 rounded-full",
                signer ? "bg-green-fill" : "bg-muted-foreground/50"
              )}
            />
            {signer ? "Connected" : "Not connected"}
          </span>
        </div>
      </DialogHeader>
      <DialogBody>
        {proposal ? (
          <SafeProposed
            safe={wallet}
            chain={toArbitrum ? "eth" : "arb1"}
            id={safeApp ? proposal.id : undefined}
            onExecuted={(_, tx) => {
              if (proposal.kind === "bridge" && tx && to) {
                if (toArbitrum) {
                  addPendingDeposit({
                    l1Tx: tx,
                    from: wallet,
                    to,
                    amount: amountWei.toString(),
                    sentAt: Math.floor(Date.now() / 1000),
                  });
                } else {
                  addSentWithdrawal({
                    tx,
                    from: wallet,
                    to,
                    amount: amountWei.toString(),
                    timestamp: Math.floor(Date.now() / 1000),
                  });
                }
              }
              queryClient.invalidateQueries({
                queryKey: ["bridge-withdrawals"],
              });
              queryClient.invalidateQueries({ queryKey: ["readContracts"] });
            }}
          >
            {proposal.kind === "approval"
              ? "Once your Safe's owners sign and execute the approval, open this again to bridge."
              : toArbitrum
              ? `Once your Safe's owners sign and execute it, ${formatLPT(
                  fromWei(amountWei)
                )} lands on Arbitrum about 15 minutes later.`
              : `Once your Safe's owners sign and execute it, ${formatLPT(
                  fromWei(amountWei)
                )} can be claimed on Ethereum about 7 days later.`}
          </SafeProposed>
        ) : done ? (
          <div className="flex items-start gap-3 rounded-lg bg-green-subtle p-3 text-ui-body">
            <Check className="mt-0.5 size-4 shrink-0 text-green-bright" />
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <span>
                {formatLPT(fromWei(amountWei))} is on its way to{" "}
                {toArbitrum ? "Arbitrum" : "Ethereum"}.{" "}
                {toArbitrum
                  ? "It usually lands in 10–15 minutes, ready to delegate."
                  : `Claim it on Ethereum around ${day(
                      nowMs + WITHDRAWAL_DAYS * 86_400_000
                    )}, from Withdrawals on your portfolio or here.`}
              </span>
              <span className="flex gap-3 text-ui-caption">
                {sendTx && (
                  <a
                    href={toArbitrum ? l1TxUrl(sendTx) : txUrl(sendTx)}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground"
                  >
                    View transaction <ExternalLink className="size-3" />
                  </a>
                )}
                <button
                  type="button"
                  onClick={startOver}
                  className="text-muted-foreground hover:text-foreground"
                >
                  Bridge more
                </button>
              </span>
            </div>
          </div>
        ) : (
          <>
            {/* The pair: where it's coming from, where it's going. */}
            <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2">
              <NetworkCard
                role="From"
                network={NETWORK[direction]}
                address={wallet}
                safe={dest.isSafe}
                balance={balanceOn(sourceWei)}
                active
              />
              <button
                type="button"
                onClick={swap}
                disabled={busy}
                aria-label="Swap direction"
                className="flex size-8 items-center justify-center rounded-full border border-hairline text-muted-foreground transition-colors hover:bg-hover hover:text-foreground disabled:opacity-50"
              >
                <ArrowLeftRight className="size-3.5" />
              </button>
              <NetworkCard
                role="To"
                network={toArbitrum ? "Arbitrum" : "Ethereum"}
                address={to ?? null}
                safe={dest.isSafe && to === wallet}
                // The wallet's own balance there; another address's isn't read.
                balance={
                  to === wallet
                    ? balanceOn(toArbitrum ? l2Wei : l1Wei)
                    : undefined
                }
                pending={dest.isSafe && !to ? "Choose below" : undefined}
              />
            </div>
            <AmountField
              value={amount}
              onChange={setAmount}
              max={sourceWei != null ? fromWei(sourceWei) : undefined}
              maxExact={
                sourceWei != null ? formatUnits(sourceWei, 18) : undefined
              }
              maxLabel={`On ${NETWORK[direction]}`}
              autoFocus={false}
            />
            <div className="flex flex-col gap-2">
              <span className="text-ui-caption text-muted-foreground">
                What happens
              </span>
              <ol className="flex flex-col gap-2 text-ui-body">
                {(toArbitrum
                  ? [
                      ["Send on Ethereum", usd(sendCost) ?? "now"],
                      ["Arrives on Arbitrum", "~15 min"],
                    ]
                  : [
                      ["Send on Arbitrum", usd(sendCost) ?? "now"],
                      [
                        "Arbitrum's withdrawal period",
                        `${WITHDRAWAL_DAYS} days`,
                      ],
                      [
                        "Claim on Ethereum",
                        `~${day(nowMs + WITHDRAWAL_DAYS * 86_400_000)}${
                          claimCost != null ? ` · ${usd(claimCost)}` : ""
                        }`,
                      ],
                    ]
                ).map(([what, when], i) => (
                  <li key={what} className="flex items-center gap-2.5">
                    <span
                      className={cn(
                        "size-2 shrink-0 rounded-full",
                        i === 0
                          ? "bg-foreground"
                          : "border border-muted-foreground/60"
                      )}
                    />
                    <span className="min-w-0 flex-1">{what}</span>
                    <span className="text-muted-foreground tabular-nums">
                      {when}
                    </span>
                  </li>
                ))}
              </ol>
            </div>
            {dest.ui}
            {safeElsewhere && (
              <Notice tone="warning">
                Your Safe is connected on {toArbitrum ? "Arbitrum" : "Ethereum"}
                . Its LPT here is on {NETWORK[direction]}, so{" "}
                <a
                  href={safeAppUrl(wallet, toArbitrum ? "eth" : "arb1")}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 font-medium underline-offset-4 hover:underline"
                >
                  open the explorer in your Safe on {NETWORK[direction]}
                  <ExternalLink className="size-3" />
                </a>{" "}
                to bridge it.
              </Notice>
            )}
            {dest.unsupported && (
              <Notice tone="warning">
                {walletName} is a contract on {NETWORK[direction]} that
                isn&apos;t a Safe, so there&apos;s no telling who controls its
                address on {toArbitrum ? "Arbitrum" : "Ethereum"}.{" "}
                <a
                  href={arbitrumBridgeUrl(direction)}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 font-medium underline-offset-4 hover:underline"
                >
                  Use Arbitrum&apos;s bridge
                  <ExternalLink className="size-3" />
                </a>
                , where you choose an address you control as the destination.
              </Notice>
            )}
            {!dest.unsupported && shortForDeposit && (
              <Notice tone="warning">
                {dest.isSafe
                  ? `${walletName} needs a little ETH on Ethereum to pay Arbitrum's side of the deposit.`
                  : `${walletName} doesn't have enough ETH on Ethereum for the network fees.`}
              </Notice>
            )}
            {!dest.unsupported && shortForWithdrawal && (
              <Notice tone="warning">
                {walletName} doesn&apos;t have ETH on Arbitrum for the network
                fee, a fraction of a cent.
              </Notice>
            )}
            {!dest.unsupported &&
              !dest.isSafe &&
              !shortForWithdrawal &&
              lowForClaim && (
                <Notice tone="warning">
                  Claiming needs ETH on Ethereum, which {walletName}{" "}
                  doesn&apos;t have yet. Any wallet can claim it for you; the
                  LPT still goes to {walletName}.
                </Notice>
              )}
            {!dest.unsupported && isConnected && !signer && (
              <Notice>
                Only the wallet holding this LPT can bridge it. Connect{" "}
                {walletName} to continue.
              </Notice>
            )}
            {(error ?? problem) && (
              <p className="text-ui-caption text-destructive">
                {error ?? problem}
              </p>
            )}
          </>
        )}
        <Transfers wallet={wallet} />
      </DialogBody>
      {!done && !proposal && (
        <DialogFooter>
          {!isConnected ? (
            <Button
              variant="primary"
              className="w-full sm:w-auto"
              disabled={dest.unsupported}
              onClick={() => openConnectModal?.()}
            >
              Connect wallet
            </Button>
          ) : !signer ? (
            <Button
              variant="primary"
              className="w-full sm:w-auto"
              disabled={connectingWallet || dest.unsupported}
              onClick={connectWallet}
            >
              {connectingWallet && <Loader2 className="animate-spin" />}
              {connectingWallet
                ? "Waiting for your wallet…"
                : `Connect ${walletName}`}
            </Button>
          ) : (
            <Button
              variant="primary"
              className="w-full sm:w-auto"
              disabled={!canRun}
              onClick={async () => {
                setError(null);
                try {
                  if (dest.isSafe) {
                    await proposeAsSafe();
                    return;
                  }
                  // The wallet moves to the source network as part of
                  // bridging; the button only ever names the bridge.
                  if (!onSource) {
                    await switchChainAsync({ chainId: sourceChain });
                  }
                  await (needsApproval ? approve() : send());
                } catch (e) {
                  continueAfterApproval.current = false;
                  setError(errorText(e));
                }
              }}
            >
              {(busy || switching) && <Loader2 className="animate-spin" />}
              {switching
                ? "Switching network…"
                : signing
                ? `Confirm in wallet${step ? ` (${step})` : ""}…`
                : syncing
                ? "Finishing approval…"
                : busy
                ? "Confirming…"
                : needsApproval
                ? `Approve and bridge to ${destination}`
                : `Bridge to ${destination}`}
            </Button>
          )}
        </DialogFooter>
      )}
    </>
  );
}

function NetworkCard({
  role,
  network,
  address,
  safe = false,
  balance,
  pending,
  active = false,
}: {
  role: string;
  network: string;
  /** Whose LPT it is on this side; null while it's being chosen. */
  address: string | null;
  safe?: boolean;
  balance?: string;
  /** Shown in place of the address while it's being chosen. */
  pending?: string;
  active?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex min-w-0 flex-col gap-0.5 rounded-lg border px-3 py-2.5",
        active ? "border-foreground/25" : "border-hairline"
      )}
    >
      <span className="text-ui-caption text-muted-foreground">{role}</span>
      <span className="text-ui-body font-medium">{network}</span>
      {address ? (
        <CardAddress address={address} safe={safe} />
      ) : (
        <span className="text-ui-caption text-muted-foreground">
          {pending ?? "…"}
        </span>
      )}
      {balance != null && (
        <span className="truncate text-ui-caption text-muted-foreground tabular-nums">
          {balance}
        </span>
      )}
    </div>
  );
}

/** A side's address: its avatar and name, as the rest of the app shows it. */
function CardAddress({ address, safe }: { address: string; safe: boolean }) {
  const { name, avatar } = useIdentity(address);
  const { list } = useAddresses();
  const label = list.find((w) => w.address === address.toLowerCase())?.label;
  return (
    <span className="mt-1 flex min-w-0 items-center gap-1.5 text-ui-caption">
      <Avatar address={address} src={avatar} size={14} className="shrink-0" />
      <span className="truncate">{label ?? name ?? shortAddress(address)}</span>
      {safe && <span className="shrink-0 text-muted-foreground">· Safe</span>}
    </span>
  );
}
