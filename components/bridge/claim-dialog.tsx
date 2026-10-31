"use client";

import { useConnectModal } from "@rainbow-me/rainbowkit";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, ExternalLink, Loader2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { formatEther } from "viem";
import {
  useAccount,
  useBalance,
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
import { checkClaim, fetchClaim } from "@/lib/bridge/claim";
import {
  ARB_OUTBOX,
  executeTransactionAbi,
  l1TxUrl,
} from "@/lib/bridge/config";
import { checkOutbox } from "@/lib/bridge/guards";
import type { BridgeWithdrawal } from "@/lib/bridge/types";
import { L1_CHAIN, txUrl } from "@/lib/config";
import { formatLPT, fromWei } from "@/lib/format";

import { errorText } from "./error-text";

/**
 * Claiming a withdrawal that's through Arbitrum's withdrawal period: one
 * transaction on Ethereum, to Arbitrum's Outbox, which pays the LPT out to
 * whoever the withdrawal named. Any wallet can send it and pay the gas;
 * the recipient is fixed by the withdrawal itself.
 */
export function ClaimFlow({
  withdrawal: w,
  onDone,
  onBack,
}: {
  withdrawal: BridgeWithdrawal;
  onDone: () => void;
  /** Opened from the bridge dialog: back returns there. */
  onBack?: () => void;
}) {
  const { address, chainId, isConnected } = useAccount();
  const { openConnectModal } = useConnectModal();
  const { switchChainAsync, isPending: switching } = useSwitchChain();
  const queryClient = useQueryClient();
  const l1 = usePublicClient({ chainId: L1_CHAIN.id });
  const [error, setError] = useState<string | null>(null);

  // Prepared by the server, then checked here against the withdrawal.
  const prepared = useQuery({
    queryKey: ["bridge-claim", w.id],
    queryFn: () => fetchClaim(w.id),
    staleTime: 5 * 60_000,
    retry: 1,
  });
  const checked = useMemo(() => {
    if (!prepared.data) return null;
    try {
      return { call: checkClaim(prepared.data, w), error: null };
    } catch (e) {
      return { call: null, error: (e as Error).message };
    }
  }, [prepared.data, w]);
  const call = checked?.call ?? null;

  // What it costs on Ethereum, and whether the wallet has it.
  const fee = useQuery({
    queryKey: ["bridge-claim-fee", w.id, address],
    enabled: Boolean(l1 && call && address),
    staleTime: 30_000,
    queryFn: async () => {
      const [gas, price] = await Promise.all([
        l1!.estimateContractGas({
          address: ARB_OUTBOX,
          abi: executeTransactionAbi,
          functionName: "executeTransaction",
          args: call!,
          account: address!,
        }),
        l1!.getGasPrice(),
      ]);
      return gas * price;
    },
  });
  const { data: eth } = useBalance({
    address,
    chainId: L1_CHAIN.id,
    query: { enabled: Boolean(address) },
  });
  const short = fee.data != null && eth != null && eth.value < fee.data;

  const { writeContractAsync, isPending: signing } = useWriteContract();
  const [hash, setHash] = useState<`0x${string}`>();
  const receipt = useWaitForTransactionReceipt({ hash, chainId: L1_CHAIN.id });
  const done = receipt.isSuccess && receipt.data?.status === "success";
  const reverted = receipt.isSuccess && receipt.data?.status === "reverted";

  useEffect(() => {
    if (reverted) setError("The claim reverted, so nothing changed.");
  }, [reverted]);
  useEffect(() => {
    if (!done || !hash) return;
    queryClient.invalidateQueries({ queryKey: ["bridge-withdrawals"] });
    toast.success(`Claimed ${formatLPT(fromWei(BigInt(w.amount)))}`, {
      action: {
        label: "View",
        onClick: () => window.open(l1TxUrl(hash), "_blank"),
      },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [done]);

  const amount = formatLPT(fromWei(BigInt(w.amount)));
  const busy = signing || (Boolean(hash) && receipt.isLoading);
  const onEthereum = chainId === L1_CHAIN.id;

  const send = async () => {
    setError(null);
    try {
      if (!call) return;
      await checkOutbox(l1!);
      const h = await writeContractAsync({
        address: ARB_OUTBOX,
        abi: executeTransactionAbi,
        functionName: "executeTransaction",
        args: call,
        chainId: L1_CHAIN.id,
      });
      setHash(h);
    } catch (e) {
      setError(errorText(e));
    }
  };

  const problem =
    checked?.error ??
    (prepared.error ? (prepared.error as Error).message : null) ??
    (fee.error ? errorText(fee.error) : null);

  return (
    <>
      <DialogHeader>
        <DialogTitle>
          {done ? "LPT claimed" : "Claim LPT on Ethereum"}
        </DialogTitle>
        {!done && (
          <DialogDescription>
            Arbitrum&apos;s withdrawal period is over. Claiming releases the LPT
            on Ethereum, in one transaction there.
          </DialogDescription>
        )}
      </DialogHeader>
      <DialogBody>
        {done ? (
          <div className="flex flex-col items-center gap-3 py-4 text-center">
            <span className="flex size-12 items-center justify-center rounded-full bg-green-subtle text-green-bright">
              <Check className="size-6" />
            </span>
            <p className="text-ui-body text-muted-foreground">
              {amount} is now on Ethereum.
            </p>
            {hash && (
              <a
                href={l1TxUrl(hash)}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-ui-caption text-foreground underline-offset-4 hover:underline"
              >
                View on Etherscan <ExternalLink className="size-3" />
              </a>
            )}
          </div>
        ) : (
          <>
            <div className="rounded-lg border border-hairline p-3">
              <Identity
                address={w.to}
                href={null}
                size={26}
                secondary="Receives the LPT on Ethereum"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Row label="Amount">{amount}</Row>
              <Row label="Withdrawn from Arbitrum">
                <a
                  href={txUrl(w.tx)}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 hover:underline"
                >
                  {new Date(w.timestamp * 1000).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                  <ExternalLink className="size-3" />
                </a>
              </Row>
              {fee.data != null && (
                <Row label="Network fee">
                  ~{Number(formatEther(fee.data)).toFixed(5)} ETH on Ethereum
                </Row>
              )}
            </div>
            <Notice>
              Any wallet can claim and pay the network fee. The LPT always goes
              to the address above.
            </Notice>
            {short && (
              <Notice tone="warning">
                This wallet doesn&apos;t have enough ETH on Ethereum for the
                network fee.
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
        {onBack && !done && (
          <Button
            variant="ghost"
            className="w-full sm:w-auto"
            disabled={busy || switching}
            onClick={onBack}
          >
            Back
          </Button>
        )}
        {done ? (
          <Button
            variant="primary"
            onClick={onDone}
            className="w-full sm:w-auto"
          >
            {onBack ? "Back to bridge" : "Done"}
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
            disabled={!call || busy || switching || short || Boolean(problem)}
            onClick={async () => {
              setError(null);
              try {
                // Claiming happens on Ethereum: the wallet moves there as
                // part of it, so the button only ever says Claim.
                if (!onEthereum) {
                  await switchChainAsync({ chainId: L1_CHAIN.id });
                }
                await send();
              } catch (e) {
                setError(errorText(e));
              }
            }}
          >
            {(busy || switching || prepared.isLoading) && (
              <Loader2 className="animate-spin" />
            )}
            {switching
              ? "Switching network…"
              : signing
              ? "Confirm in wallet…"
              : hash && receipt.isLoading
              ? "Confirming…"
              : prepared.isLoading
              ? "Preparing claim…"
              : "Claim"}
          </Button>
        )}
      </DialogFooter>
    </>
  );
}
