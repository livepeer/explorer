"use client";

import { useConnectModal } from "@rainbow-me/rainbowkit";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, ExternalLink, Loader2 } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { formatEther } from "viem";
import {
  useAccount,
  useBalance,
  useBytecode,
  usePublicClient,
  useSwitchChain,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";

import { Identity } from "@/components/identity";
import { Notice, Row } from "@/components/staking/staking";
import { Button } from "@/components/ui/button";
import {
  DialogBody,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { retryableUrl } from "@/lib/bridge/config";
import { usePendingDeposits } from "@/lib/bridge/pending";
import { isSafeProxy } from "@/lib/bridge/safe";
import { ARB_RETRYABLE_TX, arbRetryableTxAbi } from "@/lib/bridge/tickets";
import type { TrackedDeposit } from "@/lib/bridge/types";
import { L2_CHAIN, txUrl } from "@/lib/config";
import { formatDate, formatLPT, fromWei } from "@/lib/format";

import { errorText } from "./error-text";

/** How long to wait for Arbitrum to report the retry before saying so. */
const SETTLE_MS = 2 * 60_000;

/**
 * Retrying a deposit whose automatic finish failed on Arbitrum: one
 * transaction there, ArbRetryableTx.redeem, which runs the deposit again
 * with fresh gas and mints the LPT to whoever the deposit named. Any wallet
 * can send it and pay the gas. The redeem only schedules the retry, so
 * whether the LPT arrived is read back from the deposit's own status.
 */
export function RetryFlow({
  deposit: d,
  onDone,
}: {
  deposit: TrackedDeposit;
  onDone: () => void;
}) {
  const { address, chainId, isConnected, connector } = useAccount();
  const { openConnectModal } = useConnectModal();
  const { switchChainAsync, isPending: switching } = useSwitchChain();
  const queryClient = useQueryClient();
  const l2 = usePublicClient({ chainId: L2_CHAIN.id });
  const [error, setError] = useState<string | null>(null);
  const ticket = d.ticket;
  const amount = formatLPT(fromWei(BigInt(d.amount)));

  // What it costs on Arbitrum, and whether the wallet has it. An estimate
  // that fails means the retry would too (say, it already went through).
  const fee = useQuery({
    queryKey: ["bridge-retry-fee", ticket, address],
    enabled: Boolean(l2 && ticket && address),
    staleTime: 30_000,
    retry: false,
    queryFn: async () => {
      const [gas, price] = await Promise.all([
        l2!.estimateContractGas({
          address: ARB_RETRYABLE_TX,
          abi: arbRetryableTxAbi,
          functionName: "redeem",
          args: [ticket!],
          account: address!,
        }),
        l2!.getGasPrice(),
      ]);
      return gas * price;
    },
  });
  const { data: eth } = useBalance({
    address,
    chainId: L2_CHAIN.id,
    query: { enabled: Boolean(address) },
  });
  // A Safe proposes rather than sends, and a proposal waiting on its owners
  // could miss the deadline. Any wallet can retry, so a regular one does.
  const { data: code, isSuccess: codeRead } = useBytecode({
    address,
    chainId: L2_CHAIN.id,
    query: { enabled: Boolean(address), staleTime: 5 * 60_000 },
  });
  const isSafe = connector?.id === "safe" || isSafeProxy(code ?? undefined);
  const short = fee.data != null && eth != null && eth.value < fee.data;

  const { writeContractAsync, isPending: signing } = useWriteContract();
  const [hash, setHash] = useState<`0x${string}`>();
  const receipt = useWaitForTransactionReceipt({ hash, chainId: L2_CHAIN.id });
  const sent = receipt.isSuccess && receipt.data?.status === "success";

  // After the redeem: the deposit's status says whether the retry minted
  // the LPT. Arrived deposits drop out of the list.
  const watching = useMemo(() => [d.to], [d.to]);
  const pending = usePendingDeposits(watching);
  const still = pending.find(
    (p) =>
      p.l1Tx.toLowerCase() === d.l1Tx.toLowerCase() &&
      (p.seq ?? "") === (d.seq ?? "")
  );
  // Seen in the list at least once, so its absence means it arrived rather
  // than that the list hasn't loaded.
  const [seen, setSeen] = useState(false);
  if (still && !seen) setSeen(true);
  const [sentAt, setSentAt] = useState<number | null>(null);
  const arrived = sent && seen && !still;
  const [stalled, setStalled] = useState(false);

  useEffect(() => {
    if (receipt.isSuccess && receipt.data?.status === "reverted") {
      setError("The retry reverted, so nothing changed. Try again.");
    }
  }, [receipt.isSuccess, receipt.data?.status]);
  useEffect(() => {
    if (!sent) return;
    setSentAt(Date.now());
    queryClient.invalidateQueries({ queryKey: ["bridge-deposits"] });
  }, [sent, queryClient]);
  // Still waiting for a retry a while after the redeem: it ran out of gas
  // again, or Arbitrum hasn't reported it yet.
  useEffect(() => {
    if (sentAt == null || arrived) return;
    const t = setTimeout(() => setStalled(true), SETTLE_MS);
    return () => clearTimeout(t);
  }, [sentAt, arrived]);

  // Held from the click, before anything is awaited, so a second click
  // can't reach the wallet twice.
  const submitting = useRef(false);
  const [submitted, setSubmitted] = useState(false);
  const checking = sent && !arrived && !stalled;
  const busy =
    submitted || signing || (Boolean(hash) && receipt.isLoading) || checking;
  const onArbitrum = chainId === L2_CHAIN.id;

  const retry = async () => {
    if (submitting.current || !ticket || !address) return;
    submitting.current = true;
    setSubmitted(true);
    setError(null);
    setStalled(false);
    setHash(undefined);
    setSentAt(null);
    try {
      // The retry happens on Arbitrum: the wallet moves there as part of
      // it, so the button only ever says Retry.
      if (!onArbitrum) await switchChainAsync({ chainId: L2_CHAIN.id });
      setHash(
        await writeContractAsync({
          account: address,
          address: ARB_RETRYABLE_TX,
          abi: arbRetryableTxAbi,
          functionName: "redeem",
          args: [ticket],
          chainId: L2_CHAIN.id,
        })
      );
    } catch (e) {
      setError(errorText(e));
    } finally {
      submitting.current = false;
      setSubmitted(false);
    }
  };

  const problem = fee.error && !hash ? errorText(fee.error) : null;

  return (
    <>
      <DialogHeader>
        <DialogTitle>
          {arrived ? "LPT arrived" : "Retry deposit on Arbitrum"}
        </DialogTitle>
        {!arrived && (
          <DialogDescription>
            Arbitrum couldn&apos;t finish this deposit on its own. Retrying it
            runs it again, in one transaction on Arbitrum.
          </DialogDescription>
        )}
      </DialogHeader>
      <DialogBody>
        {arrived ? (
          <div className="flex flex-col items-center gap-3 py-4 text-center">
            <span className="flex size-12 items-center justify-center rounded-full bg-green-subtle text-green-bright">
              <Check className="size-6" />
            </span>
            <p className="text-ui-body text-muted-foreground">
              {amount} is now on Arbitrum.
            </p>
            {hash && (
              <a
                href={txUrl(hash)}
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
            <div className="rounded-lg border border-hairline p-3">
              <Identity
                address={d.to}
                href={null}
                size={26}
                secondary="Receives the LPT on Arbitrum"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Row label="Amount">{amount}</Row>
              {d.retryBy != null && (
                <Row label="Retry by">{formatDate(d.retryBy)}</Row>
              )}
              {fee.data != null && (
                <Row label="Network fee">
                  ~{Number(formatEther(fee.data)).toFixed(6)} ETH on Arbitrum
                </Row>
              )}
            </div>
            <Notice>
              Any wallet can retry and pay the network fee. The LPT always goes
              to the address above.
            </Notice>
            {!ticket && (
              <Notice tone="warning">
                Couldn&apos;t find this deposit&apos;s ticket.{" "}
                <a
                  href={retryableUrl(d.l1Tx)}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 font-medium underline-offset-4 hover:underline"
                >
                  Retry it with Arbitrum&apos;s tool
                  <ExternalLink className="size-3" />
                </a>
              </Notice>
            )}
            {isSafe && (
              <Notice tone="warning">
                Retry from a regular wallet: a Safe would have to wait for its
                owners to sign. Any wallet can retry, and the LPT still goes to
                the address above.
              </Notice>
            )}
            {short && !isSafe && (
              <Notice tone="warning">
                This wallet doesn&apos;t have enough ETH on Arbitrum for the
                network fee.
              </Notice>
            )}
            {stalled && (
              <Notice tone="warning">
                Arbitrum hasn&apos;t reported the retry going through yet. If
                this deposit still shows Retry in a few minutes, try again.
              </Notice>
            )}
            {(error ?? problem) && (
              <p className="text-ui-caption text-destructive">
                {error ?? problem}
              </p>
            )}
          </>
        )}
      </DialogBody>
      <DialogFooter>
        {arrived ? (
          <Button
            variant="primary"
            onClick={onDone}
            className="w-full sm:w-auto"
          >
            Done
          </Button>
        ) : !isConnected ? (
          <Button
            variant="primary"
            className="w-full sm:w-auto"
            onClick={() => openConnectModal?.()}
          >
            Connect wallet
          </Button>
        ) : (
          <Button
            variant="primary"
            className="w-full sm:w-auto"
            disabled={
              !ticket ||
              !codeRead ||
              isSafe ||
              busy ||
              switching ||
              short ||
              Boolean(problem)
            }
            onClick={retry}
          >
            {(busy || switching) && <Loader2 className="animate-spin" />}
            {switching
              ? "Switching network…"
              : signing
              ? "Confirm in wallet…"
              : hash && receipt.isLoading
              ? "Confirming…"
              : checking
              ? "Checking it arrived…"
              : "Retry"}
          </Button>
        )}
      </DialogFooter>
    </>
  );
}
