import { ProposalExtended } from "@lib/api/treasury";
import { txMessages } from "lib/utils";
import { Address } from "viem";
import { create } from "zustand";

export type StakingAction = "undelegate" | "delegate" | null;
export type YieldResults = {
  roiFees: number;
  roiFeesLpt: number;
  roiRewards: number;
  principle: number;
};

export type InputData = {
  amount?: bigint;
  choiceId?: number;
  choiceName?: string;
  delegate?: Address;
  fees?: bigint;
  isOrchestrator?: boolean;
  newDelegate?: Address;
  newPosNext?: string;
  newPosPrev?: string;
  proposal?: ProposalExtended | string | null;
  reason?: string;
  recipient?: Address;
  stake?: bigint;
  targetAddress?: Address | null;
  to?: string;
  totalRounds?: number;
  type?: string;
  unbondingLockId?: number;
  wasDeactivated?: boolean;
};

export type TransactionStep = "summary" | "started" | "confirmed";
export type TransactionIdentifier = keyof typeof txMessages;
export type TransactionStatus = {
  hash?: string;
  name?: TransactionIdentifier;
  inputData?: InputData | null;
  step: TransactionStep | null;
  error?: string;
};

export type ExplorerState = {
  walletModalOpen: boolean;
  bottomDrawerOpen: boolean;
  selectedStakingAction: StakingAction;
  yieldResults: YieldResults;
  latestTransaction: TransactionStatus | null;

  setWalletModalOpen: (v: boolean) => void;
  setBottomDrawerOpen: (v: boolean) => void;
  setSelectedStakingAction: (v: StakingAction) => void;
  setYieldResults: (v: YieldResults) => void;

  setLatestTransactionDetails: (
    hash: string,
    id: TransactionIdentifier,
    inputData?: InputData
  ) => void;
  setLatestTransactionConfirmed: () => void;
  setLatestTransactionSummary: () => void;
  setLatestTransactionError: (v: string) => void;
  clearLatestTransaction: () => void;
};

export const useExplorerStore = create<ExplorerState>()((set) => ({
  walletModalOpen: false,
  bottomDrawerOpen: false,
  selectedStakingAction: "delegate",
  yieldResults: {
    roiFees: 0.0,
    roiFeesLpt: 0.0,
    roiRewards: 0.0,
    principle: 0.0,
  },
  latestTransaction: null,

  setWalletModalOpen: (v: boolean) => set(() => ({ walletModalOpen: v })),
  setBottomDrawerOpen: (v: boolean) => set(() => ({ bottomDrawerOpen: v })),
  setSelectedStakingAction: (v: StakingAction) =>
    set(() => ({ selectedStakingAction: v })),
  setYieldResults: (v: YieldResults) => set(() => ({ yieldResults: v })),

  setLatestTransactionDetails: (
    hash: string,
    id: TransactionIdentifier,
    inputData?: InputData
  ) =>
    set(() => ({
      latestTransaction: {
        hash,
        name: id,
        step: "started",
        inputData: inputData ?? null,
      },
    })),
  setLatestTransactionConfirmed: () =>
    set(({ latestTransaction }) => ({
      latestTransaction: { ...latestTransaction, step: "confirmed" },
    })),
  setLatestTransactionSummary: () =>
    set(({ latestTransaction }) => ({
      latestTransaction: { ...latestTransaction, step: "summary" },
    })),
  setLatestTransactionError: (v: string) =>
    set(({ latestTransaction }) => ({
      latestTransaction: { ...latestTransaction, error: v } as {
        step: TransactionStep | null;
        error: string;
      },
    })),
  clearLatestTransaction: () =>
    set(() => ({
      latestTransaction: null,
    })),
}));
