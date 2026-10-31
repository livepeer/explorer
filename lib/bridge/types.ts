/** An LPT withdrawal from Arbitrum to Ethereum, as indexed. */
export type Withdrawal = {
  /** Arbitrum's message number for it; the Outbox's index. */
  id: string;
  /** Sent from, on Arbitrum. */
  from: string;
  /** Paid to, on Ethereum. */
  to: string;
  /** In wei. */
  amount: string;
  /** Arbitrum block, as a string. */
  block: string;
  /** Unix seconds. */
  timestamp: number;
  tx: string;
};

/** An unclaimed withdrawal and whether it can be claimed yet. */
export type BridgeWithdrawal = Withdrawal & {
  status: "ready" | "waiting";
  /** Estimated unix seconds it becomes claimable; null once it is. */
  readyAt: number | null;
};

/**
 * Everything Outbox.executeTransaction needs to pay out a withdrawal on
 * Ethereum. Numbers as strings for JSON.
 */
export type ClaimArgs = {
  proof: `0x${string}`[];
  index: string;
  l2Sender: `0x${string}`;
  to: `0x${string}`;
  l2Block: string;
  l1Block: string;
  l2Timestamp: string;
  value: string;
  data: `0x${string}`;
};

/** Where a deposit to Arbitrum stands; see tickets.ts. */
export type DepositStatus =
  /** Ethereum sent it; Arbitrum hasn't created or redeemed the ticket yet. */
  | "processing"
  /** The automatic redeem failed: it needs a manual retry before `retryBy`. */
  | "retry"
  /**
   * Arbitrum's transaction creating the ticket reverted: no ticket, so no
   * retry, and the LPT didn't arrive. Rare; shown so it isn't lost.
   */
  | "failed"
  /** Redeemed: the LPT is on Arbitrum. */
  | "arrived";

/** An LPT deposit from Ethereum to Arbitrum, and where it stands. */
export type TrackedDeposit = {
  l1Tx: `0x${string}`;
  from: string;
  to: string;
  /** In wei. */
  amount: string;
  /** Unix seconds: when it was sent. */
  sentAt: number;
  status: DepositStatus;
  /** For "retry": the ticket's expiry, unix seconds. */
  retryBy?: number;
  /**
   * Arbitrum's message number for it, once the chain shows it: tells apart
   * deposits that share one Ethereum transaction.
   */
  seq?: string;
};
