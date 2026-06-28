import { ProposalExtended } from "@lib/api/treasury";
import { ROIFactors, ROIInflationChange, ROITimeHorizon } from "@lib/roi";
import { txMessages } from "lib/utils";
import { SortingRule } from "react-table";
import { Address } from "viem";
import { create } from "zustand";

export type StakingAction = "undelegate" | "delegate" | null;
export type OrchestratorListKey = "home" | "orchestrators";
export type OrchestratorListState = {
  factors: ROIFactors;
  inflationChange: ROIInflationChange;
  pageIndex: number;
  principle: number;
  scrollY: number;
  sortBy: SortingRule<object>[];
  timeHorizon: ROITimeHorizon;
};
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
  orchestratorLists: Record<OrchestratorListKey, OrchestratorListState>;
  latestTransaction: TransactionStatus | null;

  setWalletModalOpen: (v: boolean) => void;
  setBottomDrawerOpen: (v: boolean) => void;
  setSelectedStakingAction: (v: StakingAction) => void;
  setYieldResults: (v: YieldResults) => void;
  setOrchestratorListState: (
    key: OrchestratorListKey,
    value: Partial<OrchestratorListState>
  ) => void;

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

const defaultOrchestratorListState: OrchestratorListState = {
  factors: "lpt+eth",
  inflationChange: "none",
  pageIndex: 0,
  principle: 150,
  scrollY: 0,
  sortBy: [{ id: "earnings", desc: true }],
  timeHorizon: "one-year",
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
  orchestratorLists: {
    home: defaultOrchestratorListState,
    orchestrators: defaultOrchestratorListState,
  },
  latestTransaction: null,

  setWalletModalOpen: (v: boolean) => set(() => ({ walletModalOpen: v })),
  setBottomDrawerOpen: (v: boolean) => set(() => ({ bottomDrawerOpen: v })),
  setSelectedStakingAction: (v: StakingAction) =>
    set(() => ({ selectedStakingAction: v })),
  setYieldResults: (v: YieldResults) => set(() => ({ yieldResults: v })),
  setOrchestratorListState: (key, value) =>
    set((state) => {
      const { orchestratorLists } = state;
      const current = orchestratorLists[key];
      const hasChanged = Object.entries(value).some(
        ([field, nextValue]) =>
          current[field as keyof OrchestratorListState] !== nextValue
      );

      if (!hasChanged) {
        return state;
      }

      return {
        orchestratorLists: {
          ...orchestratorLists,
          [key]: {
            ...current,
            ...value,
          },
        },
      };
    }),

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
