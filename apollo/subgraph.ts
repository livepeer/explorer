import { gql } from "@apollo/client";
import * as Apollo from "@apollo/client";
export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = {
  [K in keyof T]: T[K];
};
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & {
  [SubKey in K]?: Maybe<T[SubKey]>;
};
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & {
  [SubKey in K]: Maybe<T[SubKey]>;
};
const defaultOptions = {} as const;
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: string;
  String: string;
  Boolean: boolean;
  Int: number;
  Float: number;
  BigDecimal: string;
  BigInt: string;
  Bytes: any;
  Int8: any;
  Timestamp: any;
};

export enum Aggregation_Interval {
  Day = "day",
  Hour = "hour",
}

export type BlockChangedFilter = {
  number_gte: Scalars["Int"];
};

export type Block_Height = {
  hash?: InputMaybe<Scalars["Bytes"]>;
  number?: InputMaybe<Scalars["Int"]>;
  number_gte?: InputMaybe<Scalars["Int"]>;
};

/**
 * BondEvent entities are created for every emitted Bond event.
 *
 */
export type BondEvent = Event & {
  __typename: "BondEvent";
  /** Additional amount added to bonded amount */
  additionalAmount: Scalars["BigDecimal"];
  /** Delegator's current total bonded amount */
  bondedAmount: Scalars["BigDecimal"];
  /** Reference to the Delegator that bonded */
  delegator: Delegator;
  /** Ethereum transaction hash + event log index */
  id: Scalars["ID"];
  /** Reference to the Delegator's new delegate */
  newDelegate: Transcoder;
  /** Reference to the Delegator's old delegate */
  oldDelegate?: Maybe<Transcoder>;
  /** Reference to the round the event occured in */
  round: Round;
  /** Timestamp of the transaction the event was included in, used to sort */
  timestamp: Scalars["Int"];
  /** Reference to the transaction the event was included in */
  transaction: Transaction;
};

export type BondEvent_Filter = {
  /** Filter for the block changed event. */
  _change_block?: InputMaybe<BlockChangedFilter>;
  additionalAmount?: InputMaybe<Scalars["BigDecimal"]>;
  additionalAmount_gt?: InputMaybe<Scalars["BigDecimal"]>;
  additionalAmount_gte?: InputMaybe<Scalars["BigDecimal"]>;
  additionalAmount_in?: InputMaybe<Array<Scalars["BigDecimal"]>>;
  additionalAmount_lt?: InputMaybe<Scalars["BigDecimal"]>;
  additionalAmount_lte?: InputMaybe<Scalars["BigDecimal"]>;
  additionalAmount_not?: InputMaybe<Scalars["BigDecimal"]>;
  additionalAmount_not_in?: InputMaybe<Array<Scalars["BigDecimal"]>>;
  and?: InputMaybe<Array<InputMaybe<BondEvent_Filter>>>;
  bondedAmount?: InputMaybe<Scalars["BigDecimal"]>;
  bondedAmount_gt?: InputMaybe<Scalars["BigDecimal"]>;
  bondedAmount_gte?: InputMaybe<Scalars["BigDecimal"]>;
  bondedAmount_in?: InputMaybe<Array<Scalars["BigDecimal"]>>;
  bondedAmount_lt?: InputMaybe<Scalars["BigDecimal"]>;
  bondedAmount_lte?: InputMaybe<Scalars["BigDecimal"]>;
  bondedAmount_not?: InputMaybe<Scalars["BigDecimal"]>;
  bondedAmount_not_in?: InputMaybe<Array<Scalars["BigDecimal"]>>;
  delegator?: InputMaybe<Scalars["String"]>;
  delegator_?: InputMaybe<Delegator_Filter>;
  delegator_contains?: InputMaybe<Scalars["String"]>;
  delegator_contains_nocase?: InputMaybe<Scalars["String"]>;
  delegator_ends_with?: InputMaybe<Scalars["String"]>;
  delegator_ends_with_nocase?: InputMaybe<Scalars["String"]>;
  delegator_gt?: InputMaybe<Scalars["String"]>;
  delegator_gte?: InputMaybe<Scalars["String"]>;
  delegator_in?: InputMaybe<Array<Scalars["String"]>>;
  delegator_lt?: InputMaybe<Scalars["String"]>;
  delegator_lte?: InputMaybe<Scalars["String"]>;
  delegator_not?: InputMaybe<Scalars["String"]>;
  delegator_not_contains?: InputMaybe<Scalars["String"]>;
  delegator_not_contains_nocase?: InputMaybe<Scalars["String"]>;
  delegator_not_ends_with?: InputMaybe<Scalars["String"]>;
  delegator_not_ends_with_nocase?: InputMaybe<Scalars["String"]>;
  delegator_not_in?: InputMaybe<Array<Scalars["String"]>>;
  delegator_not_starts_with?: InputMaybe<Scalars["String"]>;
  delegator_not_starts_with_nocase?: InputMaybe<Scalars["String"]>;
  delegator_starts_with?: InputMaybe<Scalars["String"]>;
  delegator_starts_with_nocase?: InputMaybe<Scalars["String"]>;
  id?: InputMaybe<Scalars["ID"]>;
  id_gt?: InputMaybe<Scalars["ID"]>;
  id_gte?: InputMaybe<Scalars["ID"]>;
  id_in?: InputMaybe<Array<Scalars["ID"]>>;
  id_lt?: InputMaybe<Scalars["ID"]>;
  id_lte?: InputMaybe<Scalars["ID"]>;
  id_not?: InputMaybe<Scalars["ID"]>;
  id_not_in?: InputMaybe<Array<Scalars["ID"]>>;
  newDelegate?: InputMaybe<Scalars["String"]>;
  newDelegate_?: InputMaybe<Transcoder_Filter>;
  newDelegate_contains?: InputMaybe<Scalars["String"]>;
  newDelegate_contains_nocase?: InputMaybe<Scalars["String"]>;
  newDelegate_ends_with?: InputMaybe<Scalars["String"]>;
  newDelegate_ends_with_nocase?: InputMaybe<Scalars["String"]>;
  newDelegate_gt?: InputMaybe<Scalars["String"]>;
  newDelegate_gte?: InputMaybe<Scalars["String"]>;
  newDelegate_in?: InputMaybe<Array<Scalars["String"]>>;
  newDelegate_lt?: InputMaybe<Scalars["String"]>;
  newDelegate_lte?: InputMaybe<Scalars["String"]>;
  newDelegate_not?: InputMaybe<Scalars["String"]>;
  newDelegate_not_contains?: InputMaybe<Scalars["String"]>;
  newDelegate_not_contains_nocase?: InputMaybe<Scalars["String"]>;
  newDelegate_not_ends_with?: InputMaybe<Scalars["String"]>;
  newDelegate_not_ends_with_nocase?: InputMaybe<Scalars["String"]>;
  newDelegate_not_in?: InputMaybe<Array<Scalars["String"]>>;
  newDelegate_not_starts_with?: InputMaybe<Scalars["String"]>;
  newDelegate_not_starts_with_nocase?: InputMaybe<Scalars["String"]>;
  newDelegate_starts_with?: InputMaybe<Scalars["String"]>;
  newDelegate_starts_with_nocase?: InputMaybe<Scalars["String"]>;
  oldDelegate?: InputMaybe<Scalars["String"]>;
  oldDelegate_?: InputMaybe<Transcoder_Filter>;
  oldDelegate_contains?: InputMaybe<Scalars["String"]>;
  oldDelegate_contains_nocase?: InputMaybe<Scalars["String"]>;
  oldDelegate_ends_with?: InputMaybe<Scalars["String"]>;
  oldDelegate_ends_with_nocase?: InputMaybe<Scalars["String"]>;
  oldDelegate_gt?: InputMaybe<Scalars["String"]>;
  oldDelegate_gte?: InputMaybe<Scalars["String"]>;
  oldDelegate_in?: InputMaybe<Array<Scalars["String"]>>;
  oldDelegate_lt?: InputMaybe<Scalars["String"]>;
  oldDelegate_lte?: InputMaybe<Scalars["String"]>;
  oldDelegate_not?: InputMaybe<Scalars["String"]>;
  oldDelegate_not_contains?: InputMaybe<Scalars["String"]>;
  oldDelegate_not_contains_nocase?: InputMaybe<Scalars["String"]>;
  oldDelegate_not_ends_with?: InputMaybe<Scalars["String"]>;
  oldDelegate_not_ends_with_nocase?: InputMaybe<Scalars["String"]>;
  oldDelegate_not_in?: InputMaybe<Array<Scalars["String"]>>;
  oldDelegate_not_starts_with?: InputMaybe<Scalars["String"]>;
  oldDelegate_not_starts_with_nocase?: InputMaybe<Scalars["String"]>;
  oldDelegate_starts_with?: InputMaybe<Scalars["String"]>;
  oldDelegate_starts_with_nocase?: InputMaybe<Scalars["String"]>;
  or?: InputMaybe<Array<InputMaybe<BondEvent_Filter>>>;
  round?: InputMaybe<Scalars["String"]>;
  round_?: InputMaybe<Round_Filter>;
  round_contains?: InputMaybe<Scalars["String"]>;
  round_contains_nocase?: InputMaybe<Scalars["String"]>;
  round_ends_with?: InputMaybe<Scalars["String"]>;
  round_ends_with_nocase?: InputMaybe<Scalars["String"]>;
  round_gt?: InputMaybe<Scalars["String"]>;
  round_gte?: InputMaybe<Scalars["String"]>;
  round_in?: InputMaybe<Array<Scalars["String"]>>;
  round_lt?: InputMaybe<Scalars["String"]>;
  round_lte?: InputMaybe<Scalars["String"]>;
  round_not?: InputMaybe<Scalars["String"]>;
  round_not_contains?: InputMaybe<Scalars["String"]>;
  round_not_contains_nocase?: InputMaybe<Scalars["String"]>;
  round_not_ends_with?: InputMaybe<Scalars["String"]>;
  round_not_ends_with_nocase?: InputMaybe<Scalars["String"]>;
  round_not_in?: InputMaybe<Array<Scalars["String"]>>;
  round_not_starts_with?: InputMaybe<Scalars["String"]>;
  round_not_starts_with_nocase?: InputMaybe<Scalars["String"]>;
  round_starts_with?: InputMaybe<Scalars["String"]>;
  round_starts_with_nocase?: InputMaybe<Scalars["String"]>;
  timestamp?: InputMaybe<Scalars["Int"]>;
  timestamp_gt?: InputMaybe<Scalars["Int"]>;
  timestamp_gte?: InputMaybe<Scalars["Int"]>;
  timestamp_in?: InputMaybe<Array<Scalars["Int"]>>;
  timestamp_lt?: InputMaybe<Scalars["Int"]>;
  timestamp_lte?: InputMaybe<Scalars["Int"]>;
  timestamp_not?: InputMaybe<Scalars["Int"]>;
  timestamp_not_in?: InputMaybe<Array<Scalars["Int"]>>;
  transaction?: InputMaybe<Scalars["String"]>;
  transaction_?: InputMaybe<Transaction_Filter>;
  transaction_contains?: InputMaybe<Scalars["String"]>;
  transaction_contains_nocase?: InputMaybe<Scalars["String"]>;
  transaction_ends_with?: InputMaybe<Scalars["String"]>;
  transaction_ends_with_nocase?: InputMaybe<Scalars["String"]>;
  transaction_gt?: InputMaybe<Scalars["String"]>;
  transaction_gte?: InputMaybe<Scalars["String"]>;
  transaction_in?: InputMaybe<Array<Scalars["String"]>>;
  transaction_lt?: InputMaybe<Scalars["String"]>;
  transaction_lte?: InputMaybe<Scalars["String"]>;
  transaction_not?: InputMaybe<Scalars["String"]>;
  transaction_not_contains?: InputMaybe<Scalars["String"]>;
  transaction_not_contains_nocase?: InputMaybe<Scalars["String"]>;
  transaction_not_ends_with?: InputMaybe<Scalars["String"]>;
  transaction_not_ends_with_nocase?: InputMaybe<Scalars["String"]>;
  transaction_not_in?: InputMaybe<Array<Scalars["String"]>>;
  transaction_not_starts_with?: InputMaybe<Scalars["String"]>;
  transaction_not_starts_with_nocase?: InputMaybe<Scalars["String"]>;
  transaction_starts_with?: InputMaybe<Scalars["String"]>;
  transaction_starts_with_nocase?: InputMaybe<Scalars["String"]>;
};

export enum BondEvent_OrderBy {
  AdditionalAmount = "additionalAmount",
  BondedAmount = "bondedAmount",
  Delegator = "delegator",
  DelegatorBondedAmount = "delegator__bondedAmount",
  DelegatorDelegatedAmount = "delegator__delegatedAmount",
  DelegatorFees = "delegator__fees",
  DelegatorId = "delegator__id",
  DelegatorPrincipal = "delegator__principal",
  DelegatorStartRound = "delegator__startRound",
  DelegatorUnbonded = "delegator__unbonded",
  DelegatorWithdrawnFees = "delegator__withdrawnFees",
  Id = "id",
  NewDelegate = "newDelegate",
  NewDelegateActivationRound = "newDelegate__activationRound",
  NewDelegateActivationTimestamp = "newDelegate__activationTimestamp",
  NewDelegateActive = "newDelegate__active",
  NewDelegateDeactivationRound = "newDelegate__deactivationRound",
  NewDelegateFeeShare = "newDelegate__feeShare",
  NewDelegateFeeShareUpdateTimestamp = "newDelegate__feeShareUpdateTimestamp",
  NewDelegateId = "newDelegate__id",
  NewDelegateLastActiveStakeUpdateRound = "newDelegate__lastActiveStakeUpdateRound",
  NewDelegateNinetyDayVolumeEth = "newDelegate__ninetyDayVolumeETH",
  NewDelegateRewardCut = "newDelegate__rewardCut",
  NewDelegateRewardCutUpdateTimestamp = "newDelegate__rewardCutUpdateTimestamp",
  NewDelegateServiceUri = "newDelegate__serviceURI",
  NewDelegateSixtyDayVolumeEth = "newDelegate__sixtyDayVolumeETH",
  NewDelegateStatus = "newDelegate__status",
  NewDelegateThirtyDayVolumeEth = "newDelegate__thirtyDayVolumeETH",
  NewDelegateTotalStake = "newDelegate__totalStake",
  NewDelegateTotalVolumeEth = "newDelegate__totalVolumeETH",
  NewDelegateTotalVolumeUsd = "newDelegate__totalVolumeUSD",
  OldDelegate = "oldDelegate",
  OldDelegateActivationRound = "oldDelegate__activationRound",
  OldDelegateActivationTimestamp = "oldDelegate__activationTimestamp",
  OldDelegateActive = "oldDelegate__active",
  OldDelegateDeactivationRound = "oldDelegate__deactivationRound",
  OldDelegateFeeShare = "oldDelegate__feeShare",
  OldDelegateFeeShareUpdateTimestamp = "oldDelegate__feeShareUpdateTimestamp",
  OldDelegateId = "oldDelegate__id",
  OldDelegateLastActiveStakeUpdateRound = "oldDelegate__lastActiveStakeUpdateRound",
  OldDelegateNinetyDayVolumeEth = "oldDelegate__ninetyDayVolumeETH",
  OldDelegateRewardCut = "oldDelegate__rewardCut",
  OldDelegateRewardCutUpdateTimestamp = "oldDelegate__rewardCutUpdateTimestamp",
  OldDelegateServiceUri = "oldDelegate__serviceURI",
  OldDelegateSixtyDayVolumeEth = "oldDelegate__sixtyDayVolumeETH",
  OldDelegateStatus = "oldDelegate__status",
  OldDelegateThirtyDayVolumeEth = "oldDelegate__thirtyDayVolumeETH",
  OldDelegateTotalStake = "oldDelegate__totalStake",
  OldDelegateTotalVolumeEth = "oldDelegate__totalVolumeETH",
  OldDelegateTotalVolumeUsd = "oldDelegate__totalVolumeUSD",
  Round = "round",
  RoundActiveTranscoderCount = "round__activeTranscoderCount",
  RoundDelegatorsCount = "round__delegatorsCount",
  RoundEndBlock = "round__endBlock",
  RoundId = "round__id",
  RoundInflation = "round__inflation",
  RoundInitialized = "round__initialized",
  RoundLength = "round__length",
  RoundMintableTokens = "round__mintableTokens",
  RoundMovedStake = "round__movedStake",
  RoundNewStake = "round__newStake",
  RoundNumActiveTranscoders = "round__numActiveTranscoders",
  RoundParticipationRate = "round__participationRate",
  RoundStartBlock = "round__startBlock",
  RoundStartTimestamp = "round__startTimestamp",
  RoundTotalActiveStake = "round__totalActiveStake",
  RoundTotalSupply = "round__totalSupply",
  RoundVolumeEth = "round__volumeETH",
  RoundVolumeUsd = "round__volumeUSD",
  Timestamp = "timestamp",
  Transaction = "transaction",
  TransactionBlockNumber = "transaction__blockNumber",
  TransactionFrom = "transaction__from",
  TransactionGasPrice = "transaction__gasPrice",
  TransactionGasUsed = "transaction__gasUsed",
  TransactionId = "transaction__id",
  TransactionTimestamp = "transaction__timestamp",
  TransactionTo = "transaction__to",
}

/**
 * Broadcasters pay transcoders to do the work of transcoding in exchange for fees
 *
 */
export type Broadcaster = {
  __typename: "Broadcaster";
  /** Amount of funds deposited */
  deposit: Scalars["BigDecimal"];
  /** ETH address of a broadcaster */
  id: Scalars["ID"];
  /** Amount of funds in reserve */
  reserve: Scalars["BigDecimal"];
};

export type Broadcaster_Filter = {
  /** Filter for the block changed event. */
  _change_block?: InputMaybe<BlockChangedFilter>;
  and?: InputMaybe<Array<InputMaybe<Broadcaster_Filter>>>;
  deposit?: InputMaybe<Scalars["BigDecimal"]>;
  deposit_gt?: InputMaybe<Scalars["BigDecimal"]>;
  deposit_gte?: InputMaybe<Scalars["BigDecimal"]>;
  deposit_in?: InputMaybe<Array<Scalars["BigDecimal"]>>;
  deposit_lt?: InputMaybe<Scalars["BigDecimal"]>;
  deposit_lte?: InputMaybe<Scalars["BigDecimal"]>;
  deposit_not?: InputMaybe<Scalars["BigDecimal"]>;
  deposit_not_in?: InputMaybe<Array<Scalars["BigDecimal"]>>;
  id?: InputMaybe<Scalars["ID"]>;
  id_gt?: InputMaybe<Scalars["ID"]>;
  id_gte?: InputMaybe<Scalars["ID"]>;
  id_in?: InputMaybe<Array<Scalars["ID"]>>;
  id_lt?: InputMaybe<Scalars["ID"]>;
  id_lte?: InputMaybe<Scalars["ID"]>;
  id_not?: InputMaybe<Scalars["ID"]>;
  id_not_in?: InputMaybe<Array<Scalars["ID"]>>;
  or?: InputMaybe<Array<InputMaybe<Broadcaster_Filter>>>;
  reserve?: InputMaybe<Scalars["BigDecimal"]>;
  reserve_gt?: InputMaybe<Scalars["BigDecimal"]>;
  reserve_gte?: InputMaybe<Scalars["BigDecimal"]>;
  reserve_in?: InputMaybe<Array<Scalars["BigDecimal"]>>;
  reserve_lt?: InputMaybe<Scalars["BigDecimal"]>;
  reserve_lte?: InputMaybe<Scalars["BigDecimal"]>;
  reserve_not?: InputMaybe<Scalars["BigDecimal"]>;
  reserve_not_in?: InputMaybe<Array<Scalars["BigDecimal"]>>;
};

export enum Broadcaster_OrderBy {
  Deposit = "deposit",
  Id = "id",
  Reserve = "reserve",
}

/**
 * BurnEvent entities are created for every emitted Burn event.
 *
 */
export type BurnEvent = Event & {
  __typename: "BurnEvent";
  /** Ethereum transaction hash + event log index */
  id: Scalars["ID"];
  /** Reference to the round the event occured in */
  round: Round;
  /** Timestamp of the transaction the event was included in */
  timestamp: Scalars["Int"];
  /** Reference to the transaction the event was included in */
  transaction: Transaction;
  /** Amount of tokens burned */
  value: Scalars["BigDecimal"];
};

export type BurnEvent_Filter = {
  /** Filter for the block changed event. */
  _change_block?: InputMaybe<BlockChangedFilter>;
  and?: InputMaybe<Array<InputMaybe<BurnEvent_Filter>>>;
  id?: InputMaybe<Scalars["ID"]>;
  id_gt?: InputMaybe<Scalars["ID"]>;
  id_gte?: InputMaybe<Scalars["ID"]>;
  id_in?: InputMaybe<Array<Scalars["ID"]>>;
  id_lt?: InputMaybe<Scalars["ID"]>;
  id_lte?: InputMaybe<Scalars["ID"]>;
  id_not?: InputMaybe<Scalars["ID"]>;
  id_not_in?: InputMaybe<Array<Scalars["ID"]>>;
  or?: InputMaybe<Array<InputMaybe<BurnEvent_Filter>>>;
  round?: InputMaybe<Scalars["String"]>;
  round_?: InputMaybe<Round_Filter>;
  round_contains?: InputMaybe<Scalars["String"]>;
  round_contains_nocase?: InputMaybe<Scalars["String"]>;
  round_ends_with?: InputMaybe<Scalars["String"]>;
  round_ends_with_nocase?: InputMaybe<Scalars["String"]>;
  round_gt?: InputMaybe<Scalars["String"]>;
  round_gte?: InputMaybe<Scalars["String"]>;
  round_in?: InputMaybe<Array<Scalars["String"]>>;
  round_lt?: InputMaybe<Scalars["String"]>;
  round_lte?: InputMaybe<Scalars["String"]>;
  round_not?: InputMaybe<Scalars["String"]>;
  round_not_contains?: InputMaybe<Scalars["String"]>;
  round_not_contains_nocase?: InputMaybe<Scalars["String"]>;
  round_not_ends_with?: InputMaybe<Scalars["String"]>;
  round_not_ends_with_nocase?: InputMaybe<Scalars["String"]>;
  round_not_in?: InputMaybe<Array<Scalars["String"]>>;
  round_not_starts_with?: InputMaybe<Scalars["String"]>;
  round_not_starts_with_nocase?: InputMaybe<Scalars["String"]>;
  round_starts_with?: InputMaybe<Scalars["String"]>;
  round_starts_with_nocase?: InputMaybe<Scalars["String"]>;
  timestamp?: InputMaybe<Scalars["Int"]>;
  timestamp_gt?: InputMaybe<Scalars["Int"]>;
  timestamp_gte?: InputMaybe<Scalars["Int"]>;
  timestamp_in?: InputMaybe<Array<Scalars["Int"]>>;
  timestamp_lt?: InputMaybe<Scalars["Int"]>;
  timestamp_lte?: InputMaybe<Scalars["Int"]>;
  timestamp_not?: InputMaybe<Scalars["Int"]>;
  timestamp_not_in?: InputMaybe<Array<Scalars["Int"]>>;
  transaction?: InputMaybe<Scalars["String"]>;
  transaction_?: InputMaybe<Transaction_Filter>;
  transaction_contains?: InputMaybe<Scalars["String"]>;
  transaction_contains_nocase?: InputMaybe<Scalars["String"]>;
  transaction_ends_with?: InputMaybe<Scalars["String"]>;
  transaction_ends_with_nocase?: InputMaybe<Scalars["String"]>;
  transaction_gt?: InputMaybe<Scalars["String"]>;
  transaction_gte?: InputMaybe<Scalars["String"]>;
  transaction_in?: InputMaybe<Array<Scalars["String"]>>;
  transaction_lt?: InputMaybe<Scalars["String"]>;
  transaction_lte?: InputMaybe<Scalars["String"]>;
  transaction_not?: InputMaybe<Scalars["String"]>;
  transaction_not_contains?: InputMaybe<Scalars["String"]>;
  transaction_not_contains_nocase?: InputMaybe<Scalars["String"]>;
  transaction_not_ends_with?: InputMaybe<Scalars["String"]>;
  transaction_not_ends_with_nocase?: InputMaybe<Scalars["String"]>;
  transaction_not_in?: InputMaybe<Array<Scalars["String"]>>;
  transaction_not_starts_with?: InputMaybe<Scalars["String"]>;
  transaction_not_starts_with_nocase?: InputMaybe<Scalars["String"]>;
  transaction_starts_with?: InputMaybe<Scalars["String"]>;
  transaction_starts_with_nocase?: InputMaybe<Scalars["String"]>;
  value?: InputMaybe<Scalars["BigDecimal"]>;
  value_gt?: InputMaybe<Scalars["BigDecimal"]>;
  value_gte?: InputMaybe<Scalars["BigDecimal"]>;
  value_in?: InputMaybe<Array<Scalars["BigDecimal"]>>;
  value_lt?: InputMaybe<Scalars["BigDecimal"]>;
  value_lte?: InputMaybe<Scalars["BigDecimal"]>;
  value_not?: InputMaybe<Scalars["BigDecimal"]>;
  value_not_in?: InputMaybe<Array<Scalars["BigDecimal"]>>;
};

export enum BurnEvent_OrderBy {
  Id = "id",
  Round = "round",
  RoundActiveTranscoderCount = "round__activeTranscoderCount",
  RoundDelegatorsCount = "round__delegatorsCount",
  RoundEndBlock = "round__endBlock",
  RoundId = "round__id",
  RoundInflation = "round__inflation",
  RoundInitialized = "round__initialized",
  RoundLength = "round__length",
  RoundMintableTokens = "round__mintableTokens",
  RoundMovedStake = "round__movedStake",
  RoundNewStake = "round__newStake",
  RoundNumActiveTranscoders = "round__numActiveTranscoders",
  RoundParticipationRate = "round__participationRate",
  RoundStartBlock = "round__startBlock",
  RoundStartTimestamp = "round__startTimestamp",
  RoundTotalActiveStake = "round__totalActiveStake",
  RoundTotalSupply = "round__totalSupply",
  RoundVolumeEth = "round__volumeETH",
  RoundVolumeUsd = "round__volumeUSD",
  Timestamp = "timestamp",
  Transaction = "transaction",
  TransactionBlockNumber = "transaction__blockNumber",
  TransactionFrom = "transaction__from",
  TransactionGasPrice = "transaction__gasPrice",
  TransactionGasUsed = "transaction__gasUsed",
  TransactionId = "transaction__id",
  TransactionTimestamp = "transaction__timestamp",
  TransactionTo = "transaction__to",
  Value = "value",
}

/**
 * Protocol data accumulated and condensed into day stats
 *
 */
export type Day = {
  __typename: "Day";
  /** Total active transcoders (up to the limit) */
  activeTranscoderCount: Scalars["BigInt"];
  /** The date beginning at 12:00am UTC */
  date: Scalars["Int"];
  /** Total number of delegators at the start of the round */
  delegatorsCount: Scalars["BigInt"];
  /** Timestamp rounded to current day by dividing by 86400 */
  id: Scalars["ID"];
  /** Per round inflation rate */
  inflation: Scalars["BigInt"];
  /** Limit of active transcoders */
  numActiveTranscoders: Scalars["BigInt"];
  /** Participation rate during the day (totalActiveStake/totalSupply) */
  participationRate: Scalars["BigDecimal"];
  /** Total active stake during the day */
  totalActiveStake: Scalars["BigDecimal"];
  /** Total Livepeer token supply during the day */
  totalSupply: Scalars["BigDecimal"];
  /** Fees generated this day in ETH */
  volumeETH: Scalars["BigDecimal"];
  /** Fees generated this day in USD */
  volumeUSD: Scalars["BigDecimal"];
};

export type Day_Filter = {
  /** Filter for the block changed event. */
  _change_block?: InputMaybe<BlockChangedFilter>;
  activeTranscoderCount?: InputMaybe<Scalars["BigInt"]>;
  activeTranscoderCount_gt?: InputMaybe<Scalars["BigInt"]>;
  activeTranscoderCount_gte?: InputMaybe<Scalars["BigInt"]>;
  activeTranscoderCount_in?: InputMaybe<Array<Scalars["BigInt"]>>;
  activeTranscoderCount_lt?: InputMaybe<Scalars["BigInt"]>;
  activeTranscoderCount_lte?: InputMaybe<Scalars["BigInt"]>;
  activeTranscoderCount_not?: InputMaybe<Scalars["BigInt"]>;
  activeTranscoderCount_not_in?: InputMaybe<Array<Scalars["BigInt"]>>;
  and?: InputMaybe<Array<InputMaybe<Day_Filter>>>;
  date?: InputMaybe<Scalars["Int"]>;
  date_gt?: InputMaybe<Scalars["Int"]>;
  date_gte?: InputMaybe<Scalars["Int"]>;
  date_in?: InputMaybe<Array<Scalars["Int"]>>;
  date_lt?: InputMaybe<Scalars["Int"]>;
  date_lte?: InputMaybe<Scalars["Int"]>;
  date_not?: InputMaybe<Scalars["Int"]>;
  date_not_in?: InputMaybe<Array<Scalars["Int"]>>;
  delegatorsCount?: InputMaybe<Scalars["BigInt"]>;
  delegatorsCount_gt?: InputMaybe<Scalars["BigInt"]>;
  delegatorsCount_gte?: InputMaybe<Scalars["BigInt"]>;
  delegatorsCount_in?: InputMaybe<Array<Scalars["BigInt"]>>;
  delegatorsCount_lt?: InputMaybe<Scalars["BigInt"]>;
  delegatorsCount_lte?: InputMaybe<Scalars["BigInt"]>;
  delegatorsCount_not?: InputMaybe<Scalars["BigInt"]>;
  delegatorsCount_not_in?: InputMaybe<Array<Scalars["BigInt"]>>;
  id?: InputMaybe<Scalars["ID"]>;
  id_gt?: InputMaybe<Scalars["ID"]>;
  id_gte?: InputMaybe<Scalars["ID"]>;
  id_in?: InputMaybe<Array<Scalars["ID"]>>;
  id_lt?: InputMaybe<Scalars["ID"]>;
  id_lte?: InputMaybe<Scalars["ID"]>;
  id_not?: InputMaybe<Scalars["ID"]>;
  id_not_in?: InputMaybe<Array<Scalars["ID"]>>;
  inflation?: InputMaybe<Scalars["BigInt"]>;
  inflation_gt?: InputMaybe<Scalars["BigInt"]>;
  inflation_gte?: InputMaybe<Scalars["BigInt"]>;
  inflation_in?: InputMaybe<Array<Scalars["BigInt"]>>;
  inflation_lt?: InputMaybe<Scalars["BigInt"]>;
  inflation_lte?: InputMaybe<Scalars["BigInt"]>;
  inflation_not?: InputMaybe<Scalars["BigInt"]>;
  inflation_not_in?: InputMaybe<Array<Scalars["BigInt"]>>;
  numActiveTranscoders?: InputMaybe<Scalars["BigInt"]>;
  numActiveTranscoders_gt?: InputMaybe<Scalars["BigInt"]>;
  numActiveTranscoders_gte?: InputMaybe<Scalars["BigInt"]>;
  numActiveTranscoders_in?: InputMaybe<Array<Scalars["BigInt"]>>;
  numActiveTranscoders_lt?: InputMaybe<Scalars["BigInt"]>;
  numActiveTranscoders_lte?: InputMaybe<Scalars["BigInt"]>;
  numActiveTranscoders_not?: InputMaybe<Scalars["BigInt"]>;
  numActiveTranscoders_not_in?: InputMaybe<Array<Scalars["BigInt"]>>;
  or?: InputMaybe<Array<InputMaybe<Day_Filter>>>;
  participationRate?: InputMaybe<Scalars["BigDecimal"]>;
  participationRate_gt?: InputMaybe<Scalars["BigDecimal"]>;
  participationRate_gte?: InputMaybe<Scalars["BigDecimal"]>;
  participationRate_in?: InputMaybe<Array<Scalars["BigDecimal"]>>;
  participationRate_lt?: InputMaybe<Scalars["BigDecimal"]>;
  participationRate_lte?: InputMaybe<Scalars["BigDecimal"]>;
  participationRate_not?: InputMaybe<Scalars["BigDecimal"]>;
  participationRate_not_in?: InputMaybe<Array<Scalars["BigDecimal"]>>;
  totalActiveStake?: InputMaybe<Scalars["BigDecimal"]>;
  totalActiveStake_gt?: InputMaybe<Scalars["BigDecimal"]>;
  totalActiveStake_gte?: InputMaybe<Scalars["BigDecimal"]>;
  totalActiveStake_in?: InputMaybe<Array<Scalars["BigDecimal"]>>;
  totalActiveStake_lt?: InputMaybe<Scalars["BigDecimal"]>;
  totalActiveStake_lte?: InputMaybe<Scalars["BigDecimal"]>;
  totalActiveStake_not?: InputMaybe<Scalars["BigDecimal"]>;
  totalActiveStake_not_in?: InputMaybe<Array<Scalars["BigDecimal"]>>;
  totalSupply?: InputMaybe<Scalars["BigDecimal"]>;
  totalSupply_gt?: InputMaybe<Scalars["BigDecimal"]>;
  totalSupply_gte?: InputMaybe<Scalars["BigDecimal"]>;
  totalSupply_in?: InputMaybe<Array<Scalars["BigDecimal"]>>;
  totalSupply_lt?: InputMaybe<Scalars["BigDecimal"]>;
  totalSupply_lte?: InputMaybe<Scalars["BigDecimal"]>;
  totalSupply_not?: InputMaybe<Scalars["BigDecimal"]>;
  totalSupply_not_in?: InputMaybe<Array<Scalars["BigDecimal"]>>;
  volumeETH?: InputMaybe<Scalars["BigDecimal"]>;
  volumeETH_gt?: InputMaybe<Scalars["BigDecimal"]>;
  volumeETH_gte?: InputMaybe<Scalars["BigDecimal"]>;
  volumeETH_in?: InputMaybe<Array<Scalars["BigDecimal"]>>;
  volumeETH_lt?: InputMaybe<Scalars["BigDecimal"]>;
  volumeETH_lte?: InputMaybe<Scalars["BigDecimal"]>;
  volumeETH_not?: InputMaybe<Scalars["BigDecimal"]>;
  volumeETH_not_in?: InputMaybe<Array<Scalars["BigDecimal"]>>;
  volumeUSD?: InputMaybe<Scalars["BigDecimal"]>;
  volumeUSD_gt?: InputMaybe<Scalars["BigDecimal"]>;
  volumeUSD_gte?: InputMaybe<Scalars["BigDecimal"]>;
  volumeUSD_in?: InputMaybe<Array<Scalars["BigDecimal"]>>;
  volumeUSD_lt?: InputMaybe<Scalars["BigDecimal"]>;
  volumeUSD_lte?: InputMaybe<Scalars["BigDecimal"]>;
  volumeUSD_not?: InputMaybe<Scalars["BigDecimal"]>;
  volumeUSD_not_in?: InputMaybe<Array<Scalars["BigDecimal"]>>;
};

export enum Day_OrderBy {
  ActiveTranscoderCount = "activeTranscoderCount",
  Date = "date",
  DelegatorsCount = "delegatorsCount",
  Id = "id",
  Inflation = "inflation",
  NumActiveTranscoders = "numActiveTranscoders",
  ParticipationRate = "participationRate",
  TotalActiveStake = "totalActiveStake",
  TotalSupply = "totalSupply",
  VolumeEth = "volumeETH",
  VolumeUsd = "volumeUSD",
}

/**
 * Bonded accounts who have delegated their stake towards a transcoder candidate
 *
 */
export type Delegator = {
  __typename: "Delegator";
  /** Amount of Livepeer Token a delegator currently has bonded */
  bondedAmount: Scalars["BigDecimal"];
  /** ETH address of the delegate (the one whom the delegator has bonded to) */
  delegate?: Maybe<Transcoder>;
  /** Amount of Livepeer Token the delegator has delegated */
  delegatedAmount: Scalars["BigDecimal"];
  /** Amount of fees a delegator has collected */
  fees: Scalars["BigDecimal"];
  /** ETH address of a delegator */
  id: Scalars["ID"];
  /** Last round that the delegator claimed reward and fee pool shares */
  lastClaimRound?: Maybe<Round>;
  /** Amount of Livepeer Token a delegator has bonded over its lifetime separate from rewards */
  principal: Scalars["BigDecimal"];
  /** Round the delegator becomes bonded and delegated to its delegate */
  startRound: Scalars["BigInt"];
  /** Amount of Livepeer Token a delegator has unbonded over its lifetime */
  unbonded: Scalars["BigDecimal"];
  /** Unbonding locks associated with the delegator */
  unbondingLocks?: Maybe<Array<UnbondingLock>>;
  /** Amount of fees withdrawn */
  withdrawnFees: Scalars["BigDecimal"];
};

/**
 * Bonded accounts who have delegated their stake towards a transcoder candidate
 *
 */
export type DelegatorUnbondingLocksArgs = {
  first?: InputMaybe<Scalars["Int"]>;
  orderBy?: InputMaybe<UnbondingLock_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars["Int"]>;
  where?: InputMaybe<UnbondingLock_Filter>;
};

export type Delegator_Filter = {
  /** Filter for the block changed event. */
  _change_block?: InputMaybe<BlockChangedFilter>;
  and?: InputMaybe<Array<InputMaybe<Delegator_Filter>>>;
  bondedAmount?: InputMaybe<Scalars["BigDecimal"]>;
  bondedAmount_gt?: InputMaybe<Scalars["BigDecimal"]>;
  bondedAmount_gte?: InputMaybe<Scalars["BigDecimal"]>;
  bondedAmount_in?: InputMaybe<Array<Scalars["BigDecimal"]>>;
  bondedAmount_lt?: InputMaybe<Scalars["BigDecimal"]>;
  bondedAmount_lte?: InputMaybe<Scalars["BigDecimal"]>;
  bondedAmount_not?: InputMaybe<Scalars["BigDecimal"]>;
  bondedAmount_not_in?: InputMaybe<Array<Scalars["BigDecimal"]>>;
  delegate?: InputMaybe<Scalars["String"]>;
  delegate_?: InputMaybe<Transcoder_Filter>;
  delegate_contains?: InputMaybe<Scalars["String"]>;
  delegate_contains_nocase?: InputMaybe<Scalars["String"]>;
  delegate_ends_with?: InputMaybe<Scalars["String"]>;
  delegate_ends_with_nocase?: InputMaybe<Scalars["String"]>;
  delegate_gt?: InputMaybe<Scalars["String"]>;
  delegate_gte?: InputMaybe<Scalars["String"]>;
  delegate_in?: InputMaybe<Array<Scalars["String"]>>;
  delegate_lt?: InputMaybe<Scalars["String"]>;
  delegate_lte?: InputMaybe<Scalars["String"]>;
  delegate_not?: InputMaybe<Scalars["String"]>;
  delegate_not_contains?: InputMaybe<Scalars["String"]>;
  delegate_not_contains_nocase?: InputMaybe<Scalars["String"]>;
  delegate_not_ends_with?: InputMaybe<Scalars["String"]>;
  delegate_not_ends_with_nocase?: InputMaybe<Scalars["String"]>;
  delegate_not_in?: InputMaybe<Array<Scalars["String"]>>;
  delegate_not_starts_with?: InputMaybe<Scalars["String"]>;
  delegate_not_starts_with_nocase?: InputMaybe<Scalars["String"]>;
  delegate_starts_with?: InputMaybe<Scalars["String"]>;
  delegate_starts_with_nocase?: InputMaybe<Scalars["String"]>;
  delegatedAmount?: InputMaybe<Scalars["BigDecimal"]>;
  delegatedAmount_gt?: InputMaybe<Scalars["BigDecimal"]>;
  delegatedAmount_gte?: InputMaybe<Scalars["BigDecimal"]>;
  delegatedAmount_in?: InputMaybe<Array<Scalars["BigDecimal"]>>;
  delegatedAmount_lt?: InputMaybe<Scalars["BigDecimal"]>;
  delegatedAmount_lte?: InputMaybe<Scalars["BigDecimal"]>;
  delegatedAmount_not?: InputMaybe<Scalars["BigDecimal"]>;
  delegatedAmount_not_in?: InputMaybe<Array<Scalars["BigDecimal"]>>;
  fees?: InputMaybe<Scalars["BigDecimal"]>;
  fees_gt?: InputMaybe<Scalars["BigDecimal"]>;
  fees_gte?: InputMaybe<Scalars["BigDecimal"]>;
  fees_in?: InputMaybe<Array<Scalars["BigDecimal"]>>;
  fees_lt?: InputMaybe<Scalars["BigDecimal"]>;
  fees_lte?: InputMaybe<Scalars["BigDecimal"]>;
  fees_not?: InputMaybe<Scalars["BigDecimal"]>;
  fees_not_in?: InputMaybe<Array<Scalars["BigDecimal"]>>;
  id?: InputMaybe<Scalars["ID"]>;
  id_gt?: InputMaybe<Scalars["ID"]>;
  id_gte?: InputMaybe<Scalars["ID"]>;
  id_in?: InputMaybe<Array<Scalars["ID"]>>;
  id_lt?: InputMaybe<Scalars["ID"]>;
  id_lte?: InputMaybe<Scalars["ID"]>;
  id_not?: InputMaybe<Scalars["ID"]>;
  id_not_in?: InputMaybe<Array<Scalars["ID"]>>;
  lastClaimRound?: InputMaybe<Scalars["String"]>;
  lastClaimRound_?: InputMaybe<Round_Filter>;
  lastClaimRound_contains?: InputMaybe<Scalars["String"]>;
  lastClaimRound_contains_nocase?: InputMaybe<Scalars["String"]>;
  lastClaimRound_ends_with?: InputMaybe<Scalars["String"]>;
  lastClaimRound_ends_with_nocase?: InputMaybe<Scalars["String"]>;
  lastClaimRound_gt?: InputMaybe<Scalars["String"]>;
  lastClaimRound_gte?: InputMaybe<Scalars["String"]>;
  lastClaimRound_in?: InputMaybe<Array<Scalars["String"]>>;
  lastClaimRound_lt?: InputMaybe<Scalars["String"]>;
  lastClaimRound_lte?: InputMaybe<Scalars["String"]>;
  lastClaimRound_not?: InputMaybe<Scalars["String"]>;
  lastClaimRound_not_contains?: InputMaybe<Scalars["String"]>;
  lastClaimRound_not_contains_nocase?: InputMaybe<Scalars["String"]>;
  lastClaimRound_not_ends_with?: InputMaybe<Scalars["String"]>;
  lastClaimRound_not_ends_with_nocase?: InputMaybe<Scalars["String"]>;
  lastClaimRound_not_in?: InputMaybe<Array<Scalars["String"]>>;
  lastClaimRound_not_starts_with?: InputMaybe<Scalars["String"]>;
  lastClaimRound_not_starts_with_nocase?: InputMaybe<Scalars["String"]>;
  lastClaimRound_starts_with?: InputMaybe<Scalars["String"]>;
  lastClaimRound_starts_with_nocase?: InputMaybe<Scalars["String"]>;
  or?: InputMaybe<Array<InputMaybe<Delegator_Filter>>>;
  principal?: InputMaybe<Scalars["BigDecimal"]>;
  principal_gt?: InputMaybe<Scalars["BigDecimal"]>;
  principal_gte?: InputMaybe<Scalars["BigDecimal"]>;
  principal_in?: InputMaybe<Array<Scalars["BigDecimal"]>>;
  principal_lt?: InputMaybe<Scalars["BigDecimal"]>;
  principal_lte?: InputMaybe<Scalars["BigDecimal"]>;
  principal_not?: InputMaybe<Scalars["BigDecimal"]>;
  principal_not_in?: InputMaybe<Array<Scalars["BigDecimal"]>>;
  startRound?: InputMaybe<Scalars["BigInt"]>;
  startRound_gt?: InputMaybe<Scalars["BigInt"]>;
  startRound_gte?: InputMaybe<Scalars["BigInt"]>;
  startRound_in?: InputMaybe<Array<Scalars["BigInt"]>>;
  startRound_lt?: InputMaybe<Scalars["BigInt"]>;
  startRound_lte?: InputMaybe<Scalars["BigInt"]>;
  startRound_not?: InputMaybe<Scalars["BigInt"]>;
  startRound_not_in?: InputMaybe<Array<Scalars["BigInt"]>>;
  unbonded?: InputMaybe<Scalars["BigDecimal"]>;
  unbonded_gt?: InputMaybe<Scalars["BigDecimal"]>;
  unbonded_gte?: InputMaybe<Scalars["BigDecimal"]>;
  unbonded_in?: InputMaybe<Array<Scalars["BigDecimal"]>>;
  unbonded_lt?: InputMaybe<Scalars["BigDecimal"]>;
  unbonded_lte?: InputMaybe<Scalars["BigDecimal"]>;
  unbonded_not?: InputMaybe<Scalars["BigDecimal"]>;
  unbonded_not_in?: InputMaybe<Array<Scalars["BigDecimal"]>>;
  unbondingLocks_?: InputMaybe<UnbondingLock_Filter>;
  withdrawnFees?: InputMaybe<Scalars["BigDecimal"]>;
  withdrawnFees_gt?: InputMaybe<Scalars["BigDecimal"]>;
  withdrawnFees_gte?: InputMaybe<Scalars["BigDecimal"]>;
  withdrawnFees_in?: InputMaybe<Array<Scalars["BigDecimal"]>>;
  withdrawnFees_lt?: InputMaybe<Scalars["BigDecimal"]>;
  withdrawnFees_lte?: InputMaybe<Scalars["BigDecimal"]>;
  withdrawnFees_not?: InputMaybe<Scalars["BigDecimal"]>;
  withdrawnFees_not_in?: InputMaybe<Array<Scalars["BigDecimal"]>>;
};

export enum Delegator_OrderBy {
  BondedAmount = "bondedAmount",
  Delegate = "delegate",
  DelegateActivationRound = "delegate__activationRound",
  DelegateActivationTimestamp = "delegate__activationTimestamp",
  DelegateActive = "delegate__active",
  DelegateDeactivationRound = "delegate__deactivationRound",
  DelegateFeeShare = "delegate__feeShare",
  DelegateFeeShareUpdateTimestamp = "delegate__feeShareUpdateTimestamp",
  DelegateId = "delegate__id",
  DelegateLastActiveStakeUpdateRound = "delegate__lastActiveStakeUpdateRound",
  DelegateNinetyDayVolumeEth = "delegate__ninetyDayVolumeETH",
  DelegateRewardCut = "delegate__rewardCut",
  DelegateRewardCutUpdateTimestamp = "delegate__rewardCutUpdateTimestamp",
  DelegateServiceUri = "delegate__serviceURI",
  DelegateSixtyDayVolumeEth = "delegate__sixtyDayVolumeETH",
  DelegateStatus = "delegate__status",
  DelegateThirtyDayVolumeEth = "delegate__thirtyDayVolumeETH",
  DelegateTotalStake = "delegate__totalStake",
  DelegateTotalVolumeEth = "delegate__totalVolumeETH",
  DelegateTotalVolumeUsd = "delegate__totalVolumeUSD",
  DelegatedAmount = "delegatedAmount",
  Fees = "fees",
  Id = "id",
  LastClaimRound = "lastClaimRound",
  LastClaimRoundActiveTranscoderCount = "lastClaimRound__activeTranscoderCount",
  LastClaimRoundDelegatorsCount = "lastClaimRound__delegatorsCount",
  LastClaimRoundEndBlock = "lastClaimRound__endBlock",
  LastClaimRoundId = "lastClaimRound__id",
  LastClaimRoundInflation = "lastClaimRound__inflation",
  LastClaimRoundInitialized = "lastClaimRound__initialized",
  LastClaimRoundLength = "lastClaimRound__length",
  LastClaimRoundMintableTokens = "lastClaimRound__mintableTokens",
  LastClaimRoundMovedStake = "lastClaimRound__movedStake",
  LastClaimRoundNewStake = "lastClaimRound__newStake",
  LastClaimRoundNumActiveTranscoders = "lastClaimRound__numActiveTranscoders",
  LastClaimRoundParticipationRate = "lastClaimRound__participationRate",
  LastClaimRoundStartBlock = "lastClaimRound__startBlock",
  LastClaimRoundStartTimestamp = "lastClaimRound__startTimestamp",
  LastClaimRoundTotalActiveStake = "lastClaimRound__totalActiveStake",
  LastClaimRoundTotalSupply = "lastClaimRound__totalSupply",
  LastClaimRoundVolumeEth = "lastClaimRound__volumeETH",
  LastClaimRoundVolumeUsd = "lastClaimRound__volumeUSD",
  Principal = "principal",
  StartRound = "startRound",
  Unbonded = "unbonded",
  UnbondingLocks = "unbondingLocks",
  WithdrawnFees = "withdrawnFees",
}

/**
 * DepositFundedEvent entities are created for every emitted DepositFunded event.
 *
 */
export type DepositFundedEvent = Event & {
  __typename: "DepositFundedEvent";
  /** Amount of broadcasting fees deposited */
  amount: Scalars["BigDecimal"];
  /** Ethereum transaction hash + event log index */
  id: Scalars["ID"];
  /** Reference to the round the event occured in */
  round: Round;
  /** Reference to the broadcaster that deposited the broadcasting fees */
  sender: Broadcaster;
  /** Timestamp of the transaction the event was included in */
  timestamp: Scalars["Int"];
  /** Reference to the transaction the event was included in */
  transaction: Transaction;
};

export type DepositFundedEvent_Filter = {
  /** Filter for the block changed event. */
  _change_block?: InputMaybe<BlockChangedFilter>;
  amount?: InputMaybe<Scalars["BigDecimal"]>;
  amount_gt?: InputMaybe<Scalars["BigDecimal"]>;
  amount_gte?: InputMaybe<Scalars["BigDecimal"]>;
  amount_in?: InputMaybe<Array<Scalars["BigDecimal"]>>;
  amount_lt?: InputMaybe<Scalars["BigDecimal"]>;
  amount_lte?: InputMaybe<Scalars["BigDecimal"]>;
  amount_not?: InputMaybe<Scalars["BigDecimal"]>;
  amount_not_in?: InputMaybe<Array<Scalars["BigDecimal"]>>;
  and?: InputMaybe<Array<InputMaybe<DepositFundedEvent_Filter>>>;
  id?: InputMaybe<Scalars["ID"]>;
  id_gt?: InputMaybe<Scalars["ID"]>;
  id_gte?: InputMaybe<Scalars["ID"]>;
  id_in?: InputMaybe<Array<Scalars["ID"]>>;
  id_lt?: InputMaybe<Scalars["ID"]>;
  id_lte?: InputMaybe<Scalars["ID"]>;
  id_not?: InputMaybe<Scalars["ID"]>;
  id_not_in?: InputMaybe<Array<Scalars["ID"]>>;
  or?: InputMaybe<Array<InputMaybe<DepositFundedEvent_Filter>>>;
  round?: InputMaybe<Scalars["String"]>;
  round_?: InputMaybe<Round_Filter>;
  round_contains?: InputMaybe<Scalars["String"]>;
  round_contains_nocase?: InputMaybe<Scalars["String"]>;
  round_ends_with?: InputMaybe<Scalars["String"]>;
  round_ends_with_nocase?: InputMaybe<Scalars["String"]>;
  round_gt?: InputMaybe<Scalars["String"]>;
  round_gte?: InputMaybe<Scalars["String"]>;
  round_in?: InputMaybe<Array<Scalars["String"]>>;
  round_lt?: InputMaybe<Scalars["String"]>;
  round_lte?: InputMaybe<Scalars["String"]>;
  round_not?: InputMaybe<Scalars["String"]>;
  round_not_contains?: InputMaybe<Scalars["String"]>;
  round_not_contains_nocase?: InputMaybe<Scalars["String"]>;
  round_not_ends_with?: InputMaybe<Scalars["String"]>;
  round_not_ends_with_nocase?: InputMaybe<Scalars["String"]>;
  round_not_in?: InputMaybe<Array<Scalars["String"]>>;
  round_not_starts_with?: InputMaybe<Scalars["String"]>;
  round_not_starts_with_nocase?: InputMaybe<Scalars["String"]>;
  round_starts_with?: InputMaybe<Scalars["String"]>;
  round_starts_with_nocase?: InputMaybe<Scalars["String"]>;
  sender?: InputMaybe<Scalars["String"]>;
  sender_?: InputMaybe<Broadcaster_Filter>;
  sender_contains?: InputMaybe<Scalars["String"]>;
  sender_contains_nocase?: InputMaybe<Scalars["String"]>;
  sender_ends_with?: InputMaybe<Scalars["String"]>;
  sender_ends_with_nocase?: InputMaybe<Scalars["String"]>;
  sender_gt?: InputMaybe<Scalars["String"]>;
  sender_gte?: InputMaybe<Scalars["String"]>;
  sender_in?: InputMaybe<Array<Scalars["String"]>>;
  sender_lt?: InputMaybe<Scalars["String"]>;
  sender_lte?: InputMaybe<Scalars["String"]>;
  sender_not?: InputMaybe<Scalars["String"]>;
  sender_not_contains?: InputMaybe<Scalars["String"]>;
  sender_not_contains_nocase?: InputMaybe<Scalars["String"]>;
  sender_not_ends_with?: InputMaybe<Scalars["String"]>;
  sender_not_ends_with_nocase?: InputMaybe<Scalars["String"]>;
  sender_not_in?: InputMaybe<Array<Scalars["String"]>>;
  sender_not_starts_with?: InputMaybe<Scalars["String"]>;
  sender_not_starts_with_nocase?: InputMaybe<Scalars["String"]>;
  sender_starts_with?: InputMaybe<Scalars["String"]>;
  sender_starts_with_nocase?: InputMaybe<Scalars["String"]>;
  timestamp?: InputMaybe<Scalars["Int"]>;
  timestamp_gt?: InputMaybe<Scalars["Int"]>;
  timestamp_gte?: InputMaybe<Scalars["Int"]>;
  timestamp_in?: InputMaybe<Array<Scalars["Int"]>>;
  timestamp_lt?: InputMaybe<Scalars["Int"]>;
  timestamp_lte?: InputMaybe<Scalars["Int"]>;
  timestamp_not?: InputMaybe<Scalars["Int"]>;
  timestamp_not_in?: InputMaybe<Array<Scalars["Int"]>>;
  transaction?: InputMaybe<Scalars["String"]>;
  transaction_?: InputMaybe<Transaction_Filter>;
  transaction_contains?: InputMaybe<Scalars["String"]>;
  transaction_contains_nocase?: InputMaybe<Scalars["String"]>;
  transaction_ends_with?: InputMaybe<Scalars["String"]>;
  transaction_ends_with_nocase?: InputMaybe<Scalars["String"]>;
  transaction_gt?: InputMaybe<Scalars["String"]>;
  transaction_gte?: InputMaybe<Scalars["String"]>;
  transaction_in?: InputMaybe<Array<Scalars["String"]>>;
  transaction_lt?: InputMaybe<Scalars["String"]>;
  transaction_lte?: InputMaybe<Scalars["String"]>;
  transaction_not?: InputMaybe<Scalars["String"]>;
  transaction_not_contains?: InputMaybe<Scalars["String"]>;
  transaction_not_contains_nocase?: InputMaybe<Scalars["String"]>;
  transaction_not_ends_with?: InputMaybe<Scalars["String"]>;
  transaction_not_ends_with_nocase?: InputMaybe<Scalars["String"]>;
  transaction_not_in?: InputMaybe<Array<Scalars["String"]>>;
  transaction_not_starts_with?: InputMaybe<Scalars["String"]>;
  transaction_not_starts_with_nocase?: InputMaybe<Scalars["String"]>;
  transaction_starts_with?: InputMaybe<Scalars["String"]>;
  transaction_starts_with_nocase?: InputMaybe<Scalars["String"]>;
};

export enum DepositFundedEvent_OrderBy {
  Amount = "amount",
  Id = "id",
  Round = "round",
  RoundActiveTranscoderCount = "round__activeTranscoderCount",
  RoundDelegatorsCount = "round__delegatorsCount",
  RoundEndBlock = "round__endBlock",
  RoundId = "round__id",
  RoundInflation = "round__inflation",
  RoundInitialized = "round__initialized",
  RoundLength = "round__length",
  RoundMintableTokens = "round__mintableTokens",
  RoundMovedStake = "round__movedStake",
  RoundNewStake = "round__newStake",
  RoundNumActiveTranscoders = "round__numActiveTranscoders",
  RoundParticipationRate = "round__participationRate",
  RoundStartBlock = "round__startBlock",
  RoundStartTimestamp = "round__startTimestamp",
  RoundTotalActiveStake = "round__totalActiveStake",
  RoundTotalSupply = "round__totalSupply",
  RoundVolumeEth = "round__volumeETH",
  RoundVolumeUsd = "round__volumeUSD",
  Sender = "sender",
  SenderDeposit = "sender__deposit",
  SenderId = "sender__id",
  SenderReserve = "sender__reserve",
  Timestamp = "timestamp",
  Transaction = "transaction",
  TransactionBlockNumber = "transaction__blockNumber",
  TransactionFrom = "transaction__from",
  TransactionGasPrice = "transaction__gasPrice",
  TransactionGasUsed = "transaction__gasUsed",
  TransactionId = "transaction__id",
  TransactionTimestamp = "transaction__timestamp",
  TransactionTo = "transaction__to",
}

/**
 * EarningsClaimedEvent entities are created for every emitted EarningsClaimed event.
 *
 */
export type EarningsClaimedEvent = Event & {
  __typename: "EarningsClaimedEvent";
  /** Reference to the delegator's delegate */
  delegate: Transcoder;
  /** Reference to the delegator that claimed its earnings */
  delegator: Delegator;
  /** Last round that the delegator's pending stake was computed from */
  endRound: Round;
  /** Fees claimed by the delegator */
  fees: Scalars["BigDecimal"];
  /** Ethereum transaction hash + event log index */
  id: Scalars["ID"];
  /** Reward tokens claimed by the delegator */
  rewardTokens: Scalars["BigDecimal"];
  /** Reference to the round the event occured in */
  round: Round;
  /** First round that the delegator's pending stake was computed from */
  startRound: Scalars["BigInt"];
  /** Timestamp of the transaction the event was included in */
  timestamp: Scalars["Int"];
  /** Reference to the transaction the event was included in */
  transaction: Transaction;
};

export type EarningsClaimedEvent_Filter = {
  /** Filter for the block changed event. */
  _change_block?: InputMaybe<BlockChangedFilter>;
  and?: InputMaybe<Array<InputMaybe<EarningsClaimedEvent_Filter>>>;
  delegate?: InputMaybe<Scalars["String"]>;
  delegate_?: InputMaybe<Transcoder_Filter>;
  delegate_contains?: InputMaybe<Scalars["String"]>;
  delegate_contains_nocase?: InputMaybe<Scalars["String"]>;
  delegate_ends_with?: InputMaybe<Scalars["String"]>;
  delegate_ends_with_nocase?: InputMaybe<Scalars["String"]>;
  delegate_gt?: InputMaybe<Scalars["String"]>;
  delegate_gte?: InputMaybe<Scalars["String"]>;
  delegate_in?: InputMaybe<Array<Scalars["String"]>>;
  delegate_lt?: InputMaybe<Scalars["String"]>;
  delegate_lte?: InputMaybe<Scalars["String"]>;
  delegate_not?: InputMaybe<Scalars["String"]>;
  delegate_not_contains?: InputMaybe<Scalars["String"]>;
  delegate_not_contains_nocase?: InputMaybe<Scalars["String"]>;
  delegate_not_ends_with?: InputMaybe<Scalars["String"]>;
  delegate_not_ends_with_nocase?: InputMaybe<Scalars["String"]>;
  delegate_not_in?: InputMaybe<Array<Scalars["String"]>>;
  delegate_not_starts_with?: InputMaybe<Scalars["String"]>;
  delegate_not_starts_with_nocase?: InputMaybe<Scalars["String"]>;
  delegate_starts_with?: InputMaybe<Scalars["String"]>;
  delegate_starts_with_nocase?: InputMaybe<Scalars["String"]>;
  delegator?: InputMaybe<Scalars["String"]>;
  delegator_?: InputMaybe<Delegator_Filter>;
  delegator_contains?: InputMaybe<Scalars["String"]>;
  delegator_contains_nocase?: InputMaybe<Scalars["String"]>;
  delegator_ends_with?: InputMaybe<Scalars["String"]>;
  delegator_ends_with_nocase?: InputMaybe<Scalars["String"]>;
  delegator_gt?: InputMaybe<Scalars["String"]>;
  delegator_gte?: InputMaybe<Scalars["String"]>;
  delegator_in?: InputMaybe<Array<Scalars["String"]>>;
  delegator_lt?: InputMaybe<Scalars["String"]>;
  delegator_lte?: InputMaybe<Scalars["String"]>;
  delegator_not?: InputMaybe<Scalars["String"]>;
  delegator_not_contains?: InputMaybe<Scalars["String"]>;
  delegator_not_contains_nocase?: InputMaybe<Scalars["String"]>;
  delegator_not_ends_with?: InputMaybe<Scalars["String"]>;
  delegator_not_ends_with_nocase?: InputMaybe<Scalars["String"]>;
  delegator_not_in?: InputMaybe<Array<Scalars["String"]>>;
  delegator_not_starts_with?: InputMaybe<Scalars["String"]>;
  delegator_not_starts_with_nocase?: InputMaybe<Scalars["String"]>;
  delegator_starts_with?: InputMaybe<Scalars["String"]>;
  delegator_starts_with_nocase?: InputMaybe<Scalars["String"]>;
  endRound?: InputMaybe<Scalars["String"]>;
  endRound_?: InputMaybe<Round_Filter>;
  endRound_contains?: InputMaybe<Scalars["String"]>;
  endRound_contains_nocase?: InputMaybe<Scalars["String"]>;
  endRound_ends_with?: InputMaybe<Scalars["String"]>;
  endRound_ends_with_nocase?: InputMaybe<Scalars["String"]>;
  endRound_gt?: InputMaybe<Scalars["String"]>;
  endRound_gte?: InputMaybe<Scalars["String"]>;
  endRound_in?: InputMaybe<Array<Scalars["String"]>>;
  endRound_lt?: InputMaybe<Scalars["String"]>;
  endRound_lte?: InputMaybe<Scalars["String"]>;
  endRound_not?: InputMaybe<Scalars["String"]>;
  endRound_not_contains?: InputMaybe<Scalars["String"]>;
  endRound_not_contains_nocase?: InputMaybe<Scalars["String"]>;
  endRound_not_ends_with?: InputMaybe<Scalars["String"]>;
  endRound_not_ends_with_nocase?: InputMaybe<Scalars["String"]>;
  endRound_not_in?: InputMaybe<Array<Scalars["String"]>>;
  endRound_not_starts_with?: InputMaybe<Scalars["String"]>;
  endRound_not_starts_with_nocase?: InputMaybe<Scalars["String"]>;
  endRound_starts_with?: InputMaybe<Scalars["String"]>;
  endRound_starts_with_nocase?: InputMaybe<Scalars["String"]>;
  fees?: InputMaybe<Scalars["BigDecimal"]>;
  fees_gt?: InputMaybe<Scalars["BigDecimal"]>;
  fees_gte?: InputMaybe<Scalars["BigDecimal"]>;
  fees_in?: InputMaybe<Array<Scalars["BigDecimal"]>>;
  fees_lt?: InputMaybe<Scalars["BigDecimal"]>;
  fees_lte?: InputMaybe<Scalars["BigDecimal"]>;
  fees_not?: InputMaybe<Scalars["BigDecimal"]>;
  fees_not_in?: InputMaybe<Array<Scalars["BigDecimal"]>>;
  id?: InputMaybe<Scalars["ID"]>;
  id_gt?: InputMaybe<Scalars["ID"]>;
  id_gte?: InputMaybe<Scalars["ID"]>;
  id_in?: InputMaybe<Array<Scalars["ID"]>>;
  id_lt?: InputMaybe<Scalars["ID"]>;
  id_lte?: InputMaybe<Scalars["ID"]>;
  id_not?: InputMaybe<Scalars["ID"]>;
  id_not_in?: InputMaybe<Array<Scalars["ID"]>>;
  or?: InputMaybe<Array<InputMaybe<EarningsClaimedEvent_Filter>>>;
  rewardTokens?: InputMaybe<Scalars["BigDecimal"]>;
  rewardTokens_gt?: InputMaybe<Scalars["BigDecimal"]>;
  rewardTokens_gte?: InputMaybe<Scalars["BigDecimal"]>;
  rewardTokens_in?: InputMaybe<Array<Scalars["BigDecimal"]>>;
  rewardTokens_lt?: InputMaybe<Scalars["BigDecimal"]>;
  rewardTokens_lte?: InputMaybe<Scalars["BigDecimal"]>;
  rewardTokens_not?: InputMaybe<Scalars["BigDecimal"]>;
  rewardTokens_not_in?: InputMaybe<Array<Scalars["BigDecimal"]>>;
  round?: InputMaybe<Scalars["String"]>;
  round_?: InputMaybe<Round_Filter>;
  round_contains?: InputMaybe<Scalars["String"]>;
  round_contains_nocase?: InputMaybe<Scalars["String"]>;
  round_ends_with?: InputMaybe<Scalars["String"]>;
  round_ends_with_nocase?: InputMaybe<Scalars["String"]>;
  round_gt?: InputMaybe<Scalars["String"]>;
  round_gte?: InputMaybe<Scalars["String"]>;
  round_in?: InputMaybe<Array<Scalars["String"]>>;
  round_lt?: InputMaybe<Scalars["String"]>;
  round_lte?: InputMaybe<Scalars["String"]>;
  round_not?: InputMaybe<Scalars["String"]>;
  round_not_contains?: InputMaybe<Scalars["String"]>;
  round_not_contains_nocase?: InputMaybe<Scalars["String"]>;
  round_not_ends_with?: InputMaybe<Scalars["String"]>;
  round_not_ends_with_nocase?: InputMaybe<Scalars["String"]>;
  round_not_in?: InputMaybe<Array<Scalars["String"]>>;
  round_not_starts_with?: InputMaybe<Scalars["String"]>;
  round_not_starts_with_nocase?: InputMaybe<Scalars["String"]>;
  round_starts_with?: InputMaybe<Scalars["String"]>;
  round_starts_with_nocase?: InputMaybe<Scalars["String"]>;
  startRound?: InputMaybe<Scalars["BigInt"]>;
  startRound_gt?: InputMaybe<Scalars["BigInt"]>;
  startRound_gte?: InputMaybe<Scalars["BigInt"]>;
  startRound_in?: InputMaybe<Array<Scalars["BigInt"]>>;
  startRound_lt?: InputMaybe<Scalars["BigInt"]>;
  startRound_lte?: InputMaybe<Scalars["BigInt"]>;
  startRound_not?: InputMaybe<Scalars["BigInt"]>;
  startRound_not_in?: InputMaybe<Array<Scalars["BigInt"]>>;
  timestamp?: InputMaybe<Scalars["Int"]>;
  timestamp_gt?: InputMaybe<Scalars["Int"]>;
  timestamp_gte?: InputMaybe<Scalars["Int"]>;
  timestamp_in?: InputMaybe<Array<Scalars["Int"]>>;
  timestamp_lt?: InputMaybe<Scalars["Int"]>;
  timestamp_lte?: InputMaybe<Scalars["Int"]>;
  timestamp_not?: InputMaybe<Scalars["Int"]>;
  timestamp_not_in?: InputMaybe<Array<Scalars["Int"]>>;
  transaction?: InputMaybe<Scalars["String"]>;
  transaction_?: InputMaybe<Transaction_Filter>;
  transaction_contains?: InputMaybe<Scalars["String"]>;
  transaction_contains_nocase?: InputMaybe<Scalars["String"]>;
  transaction_ends_with?: InputMaybe<Scalars["String"]>;
  transaction_ends_with_nocase?: InputMaybe<Scalars["String"]>;
  transaction_gt?: InputMaybe<Scalars["String"]>;
  transaction_gte?: InputMaybe<Scalars["String"]>;
  transaction_in?: InputMaybe<Array<Scalars["String"]>>;
  transaction_lt?: InputMaybe<Scalars["String"]>;
  transaction_lte?: InputMaybe<Scalars["String"]>;
  transaction_not?: InputMaybe<Scalars["String"]>;
  transaction_not_contains?: InputMaybe<Scalars["String"]>;
  transaction_not_contains_nocase?: InputMaybe<Scalars["String"]>;
  transaction_not_ends_with?: InputMaybe<Scalars["String"]>;
  transaction_not_ends_with_nocase?: InputMaybe<Scalars["String"]>;
  transaction_not_in?: InputMaybe<Array<Scalars["String"]>>;
  transaction_not_starts_with?: InputMaybe<Scalars["String"]>;
  transaction_not_starts_with_nocase?: InputMaybe<Scalars["String"]>;
  transaction_starts_with?: InputMaybe<Scalars["String"]>;
  transaction_starts_with_nocase?: InputMaybe<Scalars["String"]>;
};

export enum EarningsClaimedEvent_OrderBy {
  Delegate = "delegate",
  DelegateActivationRound = "delegate__activationRound",
  DelegateActivationTimestamp = "delegate__activationTimestamp",
  DelegateActive = "delegate__active",
  DelegateDeactivationRound = "delegate__deactivationRound",
  DelegateFeeShare = "delegate__feeShare",
  DelegateFeeShareUpdateTimestamp = "delegate__feeShareUpdateTimestamp",
  DelegateId = "delegate__id",
  DelegateLastActiveStakeUpdateRound = "delegate__lastActiveStakeUpdateRound",
  DelegateNinetyDayVolumeEth = "delegate__ninetyDayVolumeETH",
  DelegateRewardCut = "delegate__rewardCut",
  DelegateRewardCutUpdateTimestamp = "delegate__rewardCutUpdateTimestamp",
  DelegateServiceUri = "delegate__serviceURI",
  DelegateSixtyDayVolumeEth = "delegate__sixtyDayVolumeETH",
  DelegateStatus = "delegate__status",
  DelegateThirtyDayVolumeEth = "delegate__thirtyDayVolumeETH",
  DelegateTotalStake = "delegate__totalStake",
  DelegateTotalVolumeEth = "delegate__totalVolumeETH",
  DelegateTotalVolumeUsd = "delegate__totalVolumeUSD",
  Delegator = "delegator",
  DelegatorBondedAmount = "delegator__bondedAmount",
  DelegatorDelegatedAmount = "delegator__delegatedAmount",
  DelegatorFees = "delegator__fees",
  DelegatorId = "delegator__id",
  DelegatorPrincipal = "delegator__principal",
  DelegatorStartRound = "delegator__startRound",
  DelegatorUnbonded = "delegator__unbonded",
  DelegatorWithdrawnFees = "delegator__withdrawnFees",
  EndRound = "endRound",
  EndRoundActiveTranscoderCount = "endRound__activeTranscoderCount",
  EndRoundDelegatorsCount = "endRound__delegatorsCount",
  EndRoundEndBlock = "endRound__endBlock",
  EndRoundId = "endRound__id",
  EndRoundInflation = "endRound__inflation",
  EndRoundInitialized = "endRound__initialized",
  EndRoundLength = "endRound__length",
  EndRoundMintableTokens = "endRound__mintableTokens",
  EndRoundMovedStake = "endRound__movedStake",
  EndRoundNewStake = "endRound__newStake",
  EndRoundNumActiveTranscoders = "endRound__numActiveTranscoders",
  EndRoundParticipationRate = "endRound__participationRate",
  EndRoundStartBlock = "endRound__startBlock",
  EndRoundStartTimestamp = "endRound__startTimestamp",
  EndRoundTotalActiveStake = "endRound__totalActiveStake",
  EndRoundTotalSupply = "endRound__totalSupply",
  EndRoundVolumeEth = "endRound__volumeETH",
  EndRoundVolumeUsd = "endRound__volumeUSD",
  Fees = "fees",
  Id = "id",
  RewardTokens = "rewardTokens",
  Round = "round",
  RoundActiveTranscoderCount = "round__activeTranscoderCount",
  RoundDelegatorsCount = "round__delegatorsCount",
  RoundEndBlock = "round__endBlock",
  RoundId = "round__id",
  RoundInflation = "round__inflation",
  RoundInitialized = "round__initialized",
  RoundLength = "round__length",
  RoundMintableTokens = "round__mintableTokens",
  RoundMovedStake = "round__movedStake",
  RoundNewStake = "round__newStake",
  RoundNumActiveTranscoders = "round__numActiveTranscoders",
  RoundParticipationRate = "round__participationRate",
  RoundStartBlock = "round__startBlock",
  RoundStartTimestamp = "round__startTimestamp",
  RoundTotalActiveStake = "round__totalActiveStake",
  RoundTotalSupply = "round__totalSupply",
  RoundVolumeEth = "round__volumeETH",
  RoundVolumeUsd = "round__volumeUSD",
  StartRound = "startRound",
  Timestamp = "timestamp",
  Transaction = "transaction",
  TransactionBlockNumber = "transaction__blockNumber",
  TransactionFrom = "transaction__from",
  TransactionGasPrice = "transaction__gasPrice",
  TransactionGasUsed = "transaction__gasUsed",
  TransactionId = "transaction__id",
  TransactionTimestamp = "transaction__timestamp",
  TransactionTo = "transaction__to",
}

export type Event = {
  id: Scalars["ID"];
  round: Round;
  timestamp: Scalars["Int"];
  transaction: Transaction;
};

export type Event_Filter = {
  /** Filter for the block changed event. */
  _change_block?: InputMaybe<BlockChangedFilter>;
  and?: InputMaybe<Array<InputMaybe<Event_Filter>>>;
  id?: InputMaybe<Scalars["ID"]>;
  id_gt?: InputMaybe<Scalars["ID"]>;
  id_gte?: InputMaybe<Scalars["ID"]>;
  id_in?: InputMaybe<Array<Scalars["ID"]>>;
  id_lt?: InputMaybe<Scalars["ID"]>;
  id_lte?: InputMaybe<Scalars["ID"]>;
  id_not?: InputMaybe<Scalars["ID"]>;
  id_not_in?: InputMaybe<Array<Scalars["ID"]>>;
  or?: InputMaybe<Array<InputMaybe<Event_Filter>>>;
  round?: InputMaybe<Scalars["String"]>;
  round_?: InputMaybe<Round_Filter>;
  round_contains?: InputMaybe<Scalars["String"]>;
  round_contains_nocase?: InputMaybe<Scalars["String"]>;
  round_ends_with?: InputMaybe<Scalars["String"]>;
  round_ends_with_nocase?: InputMaybe<Scalars["String"]>;
  round_gt?: InputMaybe<Scalars["String"]>;
  round_gte?: InputMaybe<Scalars["String"]>;
  round_in?: InputMaybe<Array<Scalars["String"]>>;
  round_lt?: InputMaybe<Scalars["String"]>;
  round_lte?: InputMaybe<Scalars["String"]>;
  round_not?: InputMaybe<Scalars["String"]>;
  round_not_contains?: InputMaybe<Scalars["String"]>;
  round_not_contains_nocase?: InputMaybe<Scalars["String"]>;
  round_not_ends_with?: InputMaybe<Scalars["String"]>;
  round_not_ends_with_nocase?: InputMaybe<Scalars["String"]>;
  round_not_in?: InputMaybe<Array<Scalars["String"]>>;
  round_not_starts_with?: InputMaybe<Scalars["String"]>;
  round_not_starts_with_nocase?: InputMaybe<Scalars["String"]>;
  round_starts_with?: InputMaybe<Scalars["String"]>;
  round_starts_with_nocase?: InputMaybe<Scalars["String"]>;
  timestamp?: InputMaybe<Scalars["Int"]>;
  timestamp_gt?: InputMaybe<Scalars["Int"]>;
  timestamp_gte?: InputMaybe<Scalars["Int"]>;
  timestamp_in?: InputMaybe<Array<Scalars["Int"]>>;
  timestamp_lt?: InputMaybe<Scalars["Int"]>;
  timestamp_lte?: InputMaybe<Scalars["Int"]>;
  timestamp_not?: InputMaybe<Scalars["Int"]>;
  timestamp_not_in?: InputMaybe<Array<Scalars["Int"]>>;
  transaction?: InputMaybe<Scalars["String"]>;
  transaction_?: InputMaybe<Transaction_Filter>;
  transaction_contains?: InputMaybe<Scalars["String"]>;
  transaction_contains_nocase?: InputMaybe<Scalars["String"]>;
  transaction_ends_with?: InputMaybe<Scalars["String"]>;
  transaction_ends_with_nocase?: InputMaybe<Scalars["String"]>;
  transaction_gt?: InputMaybe<Scalars["String"]>;
  transaction_gte?: InputMaybe<Scalars["String"]>;
  transaction_in?: InputMaybe<Array<Scalars["String"]>>;
  transaction_lt?: InputMaybe<Scalars["String"]>;
  transaction_lte?: InputMaybe<Scalars["String"]>;
  transaction_not?: InputMaybe<Scalars["String"]>;
  transaction_not_contains?: InputMaybe<Scalars["String"]>;
  transaction_not_contains_nocase?: InputMaybe<Scalars["String"]>;
  transaction_not_ends_with?: InputMaybe<Scalars["String"]>;
  transaction_not_ends_with_nocase?: InputMaybe<Scalars["String"]>;
  transaction_not_in?: InputMaybe<Array<Scalars["String"]>>;
  transaction_not_starts_with?: InputMaybe<Scalars["String"]>;
  transaction_not_starts_with_nocase?: InputMaybe<Scalars["String"]>;
  transaction_starts_with?: InputMaybe<Scalars["String"]>;
  transaction_starts_with_nocase?: InputMaybe<Scalars["String"]>;
};

export enum Event_OrderBy {
  Id = "id",
  Round = "round",
  RoundActiveTranscoderCount = "round__activeTranscoderCount",
  RoundDelegatorsCount = "round__delegatorsCount",
  RoundEndBlock = "round__endBlock",
  RoundId = "round__id",
  RoundInflation = "round__inflation",
  RoundInitialized = "round__initialized",
  RoundLength = "round__length",
  RoundMintableTokens = "round__mintableTokens",
  RoundMovedStake = "round__movedStake",
  RoundNewStake = "round__newStake",
  RoundNumActiveTranscoders = "round__numActiveTranscoders",
  RoundParticipationRate = "round__participationRate",
  RoundStartBlock = "round__startBlock",
  RoundStartTimestamp = "round__startTimestamp",
  RoundTotalActiveStake = "round__totalActiveStake",
  RoundTotalSupply = "round__totalSupply",
  RoundVolumeEth = "round__volumeETH",
  RoundVolumeUsd = "round__volumeUSD",
  Timestamp = "timestamp",
  Transaction = "transaction",
  TransactionBlockNumber = "transaction__blockNumber",
  TransactionFrom = "transaction__from",
  TransactionGasPrice = "transaction__gasPrice",
  TransactionGasUsed = "transaction__gasUsed",
  TransactionId = "transaction__id",
  TransactionTimestamp = "transaction__timestamp",
  TransactionTo = "transaction__to",
}

/**
 * Abstraction for accounts/delegators bonded with the protocol
 *
 */
export type LivepeerAccount = {
  __typename: "LivepeerAccount";
  /** Reference to the Delegate this address is bonded to */
  delegate?: Maybe<Transcoder>;
  /** Delegator details for this account */
  delegator?: Maybe<Delegator>;
  /** ETH address of the bonded delegator */
  id: Scalars["ID"];
  /** The date the account was last associated with an event, beginning at 12:00am UTC */
  lastUpdatedTimestamp: Scalars["Int"];
};

export type LivepeerAccount_Filter = {
  /** Filter for the block changed event. */
  _change_block?: InputMaybe<BlockChangedFilter>;
  and?: InputMaybe<Array<InputMaybe<LivepeerAccount_Filter>>>;
  delegate?: InputMaybe<Scalars["String"]>;
  delegate_?: InputMaybe<Transcoder_Filter>;
  delegate_contains?: InputMaybe<Scalars["String"]>;
  delegate_contains_nocase?: InputMaybe<Scalars["String"]>;
  delegate_ends_with?: InputMaybe<Scalars["String"]>;
  delegate_ends_with_nocase?: InputMaybe<Scalars["String"]>;
  delegate_gt?: InputMaybe<Scalars["String"]>;
  delegate_gte?: InputMaybe<Scalars["String"]>;
  delegate_in?: InputMaybe<Array<Scalars["String"]>>;
  delegate_lt?: InputMaybe<Scalars["String"]>;
  delegate_lte?: InputMaybe<Scalars["String"]>;
  delegate_not?: InputMaybe<Scalars["String"]>;
  delegate_not_contains?: InputMaybe<Scalars["String"]>;
  delegate_not_contains_nocase?: InputMaybe<Scalars["String"]>;
  delegate_not_ends_with?: InputMaybe<Scalars["String"]>;
  delegate_not_ends_with_nocase?: InputMaybe<Scalars["String"]>;
  delegate_not_in?: InputMaybe<Array<Scalars["String"]>>;
  delegate_not_starts_with?: InputMaybe<Scalars["String"]>;
  delegate_not_starts_with_nocase?: InputMaybe<Scalars["String"]>;
  delegate_starts_with?: InputMaybe<Scalars["String"]>;
  delegate_starts_with_nocase?: InputMaybe<Scalars["String"]>;
  delegator?: InputMaybe<Scalars["String"]>;
  delegator_?: InputMaybe<Delegator_Filter>;
  delegator_contains?: InputMaybe<Scalars["String"]>;
  delegator_contains_nocase?: InputMaybe<Scalars["String"]>;
  delegator_ends_with?: InputMaybe<Scalars["String"]>;
  delegator_ends_with_nocase?: InputMaybe<Scalars["String"]>;
  delegator_gt?: InputMaybe<Scalars["String"]>;
  delegator_gte?: InputMaybe<Scalars["String"]>;
  delegator_in?: InputMaybe<Array<Scalars["String"]>>;
  delegator_lt?: InputMaybe<Scalars["String"]>;
  delegator_lte?: InputMaybe<Scalars["String"]>;
  delegator_not?: InputMaybe<Scalars["String"]>;
  delegator_not_contains?: InputMaybe<Scalars["String"]>;
  delegator_not_contains_nocase?: InputMaybe<Scalars["String"]>;
  delegator_not_ends_with?: InputMaybe<Scalars["String"]>;
  delegator_not_ends_with_nocase?: InputMaybe<Scalars["String"]>;
  delegator_not_in?: InputMaybe<Array<Scalars["String"]>>;
  delegator_not_starts_with?: InputMaybe<Scalars["String"]>;
  delegator_not_starts_with_nocase?: InputMaybe<Scalars["String"]>;
  delegator_starts_with?: InputMaybe<Scalars["String"]>;
  delegator_starts_with_nocase?: InputMaybe<Scalars["String"]>;
  id?: InputMaybe<Scalars["ID"]>;
  id_gt?: InputMaybe<Scalars["ID"]>;
  id_gte?: InputMaybe<Scalars["ID"]>;
  id_in?: InputMaybe<Array<Scalars["ID"]>>;
  id_lt?: InputMaybe<Scalars["ID"]>;
  id_lte?: InputMaybe<Scalars["ID"]>;
  id_not?: InputMaybe<Scalars["ID"]>;
  id_not_in?: InputMaybe<Array<Scalars["ID"]>>;
  lastUpdatedTimestamp?: InputMaybe<Scalars["Int"]>;
  lastUpdatedTimestamp_gt?: InputMaybe<Scalars["Int"]>;
  lastUpdatedTimestamp_gte?: InputMaybe<Scalars["Int"]>;
  lastUpdatedTimestamp_in?: InputMaybe<Array<Scalars["Int"]>>;
  lastUpdatedTimestamp_lt?: InputMaybe<Scalars["Int"]>;
  lastUpdatedTimestamp_lte?: InputMaybe<Scalars["Int"]>;
  lastUpdatedTimestamp_not?: InputMaybe<Scalars["Int"]>;
  lastUpdatedTimestamp_not_in?: InputMaybe<Array<Scalars["Int"]>>;
  or?: InputMaybe<Array<InputMaybe<LivepeerAccount_Filter>>>;
};

export enum LivepeerAccount_OrderBy {
  Delegate = "delegate",
  DelegateActivationRound = "delegate__activationRound",
  DelegateActivationTimestamp = "delegate__activationTimestamp",
  DelegateActive = "delegate__active",
  DelegateDeactivationRound = "delegate__deactivationRound",
  DelegateFeeShare = "delegate__feeShare",
  DelegateFeeShareUpdateTimestamp = "delegate__feeShareUpdateTimestamp",
  DelegateId = "delegate__id",
  DelegateLastActiveStakeUpdateRound = "delegate__lastActiveStakeUpdateRound",
  DelegateNinetyDayVolumeEth = "delegate__ninetyDayVolumeETH",
  DelegateRewardCut = "delegate__rewardCut",
  DelegateRewardCutUpdateTimestamp = "delegate__rewardCutUpdateTimestamp",
  DelegateServiceUri = "delegate__serviceURI",
  DelegateSixtyDayVolumeEth = "delegate__sixtyDayVolumeETH",
  DelegateStatus = "delegate__status",
  DelegateThirtyDayVolumeEth = "delegate__thirtyDayVolumeETH",
  DelegateTotalStake = "delegate__totalStake",
  DelegateTotalVolumeEth = "delegate__totalVolumeETH",
  DelegateTotalVolumeUsd = "delegate__totalVolumeUSD",
  Delegator = "delegator",
  DelegatorBondedAmount = "delegator__bondedAmount",
  DelegatorDelegatedAmount = "delegator__delegatedAmount",
  DelegatorFees = "delegator__fees",
  DelegatorId = "delegator__id",
  DelegatorPrincipal = "delegator__principal",
  DelegatorStartRound = "delegator__startRound",
  DelegatorUnbonded = "delegator__unbonded",
  DelegatorWithdrawnFees = "delegator__withdrawnFees",
  Id = "id",
  LastUpdatedTimestamp = "lastUpdatedTimestamp",
}

/**
 * MigrateDelegatorFinalizedEvent entities are created for every emitted WithdrawStake event.
 *
 */
export type MigrateDelegatorFinalizedEvent = Event & {
  __typename: "MigrateDelegatorFinalizedEvent";
  delegate: Scalars["String"];
  delegatedStake: Scalars["BigDecimal"];
  fees: Scalars["BigDecimal"];
  /** Ethereum transaction hash + event log index */
  id: Scalars["ID"];
  l1Addr: Scalars["String"];
  l2Addr: Scalars["String"];
  /** Reference to the round the event occured in */
  round: Round;
  stake: Scalars["BigDecimal"];
  /** Timestamp of the transaction the event was included in */
  timestamp: Scalars["Int"];
  /** Reference to the transaction the event was included in */
  transaction: Transaction;
};

export type MigrateDelegatorFinalizedEvent_Filter = {
  /** Filter for the block changed event. */
  _change_block?: InputMaybe<BlockChangedFilter>;
  and?: InputMaybe<Array<InputMaybe<MigrateDelegatorFinalizedEvent_Filter>>>;
  delegate?: InputMaybe<Scalars["String"]>;
  delegate_contains?: InputMaybe<Scalars["String"]>;
  delegate_contains_nocase?: InputMaybe<Scalars["String"]>;
  delegate_ends_with?: InputMaybe<Scalars["String"]>;
  delegate_ends_with_nocase?: InputMaybe<Scalars["String"]>;
  delegate_gt?: InputMaybe<Scalars["String"]>;
  delegate_gte?: InputMaybe<Scalars["String"]>;
  delegate_in?: InputMaybe<Array<Scalars["String"]>>;
  delegate_lt?: InputMaybe<Scalars["String"]>;
  delegate_lte?: InputMaybe<Scalars["String"]>;
  delegate_not?: InputMaybe<Scalars["String"]>;
  delegate_not_contains?: InputMaybe<Scalars["String"]>;
  delegate_not_contains_nocase?: InputMaybe<Scalars["String"]>;
  delegate_not_ends_with?: InputMaybe<Scalars["String"]>;
  delegate_not_ends_with_nocase?: InputMaybe<Scalars["String"]>;
  delegate_not_in?: InputMaybe<Array<Scalars["String"]>>;
  delegate_not_starts_with?: InputMaybe<Scalars["String"]>;
  delegate_not_starts_with_nocase?: InputMaybe<Scalars["String"]>;
  delegate_starts_with?: InputMaybe<Scalars["String"]>;
  delegate_starts_with_nocase?: InputMaybe<Scalars["String"]>;
  delegatedStake?: InputMaybe<Scalars["BigDecimal"]>;
  delegatedStake_gt?: InputMaybe<Scalars["BigDecimal"]>;
  delegatedStake_gte?: InputMaybe<Scalars["BigDecimal"]>;
  delegatedStake_in?: InputMaybe<Array<Scalars["BigDecimal"]>>;
  delegatedStake_lt?: InputMaybe<Scalars["BigDecimal"]>;
  delegatedStake_lte?: InputMaybe<Scalars["BigDecimal"]>;
  delegatedStake_not?: InputMaybe<Scalars["BigDecimal"]>;
  delegatedStake_not_in?: InputMaybe<Array<Scalars["BigDecimal"]>>;
  fees?: InputMaybe<Scalars["BigDecimal"]>;
  fees_gt?: InputMaybe<Scalars["BigDecimal"]>;
  fees_gte?: InputMaybe<Scalars["BigDecimal"]>;
  fees_in?: InputMaybe<Array<Scalars["BigDecimal"]>>;
  fees_lt?: InputMaybe<Scalars["BigDecimal"]>;
  fees_lte?: InputMaybe<Scalars["BigDecimal"]>;
  fees_not?: InputMaybe<Scalars["BigDecimal"]>;
  fees_not_in?: InputMaybe<Array<Scalars["BigDecimal"]>>;
  id?: InputMaybe<Scalars["ID"]>;
  id_gt?: InputMaybe<Scalars["ID"]>;
  id_gte?: InputMaybe<Scalars["ID"]>;
  id_in?: InputMaybe<Array<Scalars["ID"]>>;
  id_lt?: InputMaybe<Scalars["ID"]>;
  id_lte?: InputMaybe<Scalars["ID"]>;
  id_not?: InputMaybe<Scalars["ID"]>;
  id_not_in?: InputMaybe<Array<Scalars["ID"]>>;
  l1Addr?: InputMaybe<Scalars["String"]>;
  l1Addr_contains?: InputMaybe<Scalars["String"]>;
  l1Addr_contains_nocase?: InputMaybe<Scalars["String"]>;
  l1Addr_ends_with?: InputMaybe<Scalars["String"]>;
  l1Addr_ends_with_nocase?: InputMaybe<Scalars["String"]>;
  l1Addr_gt?: InputMaybe<Scalars["String"]>;
  l1Addr_gte?: InputMaybe<Scalars["String"]>;
  l1Addr_in?: InputMaybe<Array<Scalars["String"]>>;
  l1Addr_lt?: InputMaybe<Scalars["String"]>;
  l1Addr_lte?: InputMaybe<Scalars["String"]>;
  l1Addr_not?: InputMaybe<Scalars["String"]>;
  l1Addr_not_contains?: InputMaybe<Scalars["String"]>;
  l1Addr_not_contains_nocase?: InputMaybe<Scalars["String"]>;
  l1Addr_not_ends_with?: InputMaybe<Scalars["String"]>;
  l1Addr_not_ends_with_nocase?: InputMaybe<Scalars["String"]>;
  l1Addr_not_in?: InputMaybe<Array<Scalars["String"]>>;
  l1Addr_not_starts_with?: InputMaybe<Scalars["String"]>;
  l1Addr_not_starts_with_nocase?: InputMaybe<Scalars["String"]>;
  l1Addr_starts_with?: InputMaybe<Scalars["String"]>;
  l1Addr_starts_with_nocase?: InputMaybe<Scalars["String"]>;
  l2Addr?: InputMaybe<Scalars["String"]>;
  l2Addr_contains?: InputMaybe<Scalars["String"]>;
  l2Addr_contains_nocase?: InputMaybe<Scalars["String"]>;
  l2Addr_ends_with?: InputMaybe<Scalars["String"]>;
  l2Addr_ends_with_nocase?: InputMaybe<Scalars["String"]>;
  l2Addr_gt?: InputMaybe<Scalars["String"]>;
  l2Addr_gte?: InputMaybe<Scalars["String"]>;
  l2Addr_in?: InputMaybe<Array<Scalars["String"]>>;
  l2Addr_lt?: InputMaybe<Scalars["String"]>;
  l2Addr_lte?: InputMaybe<Scalars["String"]>;
  l2Addr_not?: InputMaybe<Scalars["String"]>;
  l2Addr_not_contains?: InputMaybe<Scalars["String"]>;
  l2Addr_not_contains_nocase?: InputMaybe<Scalars["String"]>;
  l2Addr_not_ends_with?: InputMaybe<Scalars["String"]>;
  l2Addr_not_ends_with_nocase?: InputMaybe<Scalars["String"]>;
  l2Addr_not_in?: InputMaybe<Array<Scalars["String"]>>;
  l2Addr_not_starts_with?: InputMaybe<Scalars["String"]>;
  l2Addr_not_starts_with_nocase?: InputMaybe<Scalars["String"]>;
  l2Addr_starts_with?: InputMaybe<Scalars["String"]>;
  l2Addr_starts_with_nocase?: InputMaybe<Scalars["String"]>;
  or?: InputMaybe<Array<InputMaybe<MigrateDelegatorFinalizedEvent_Filter>>>;
  round?: InputMaybe<Scalars["String"]>;
  round_?: InputMaybe<Round_Filter>;
  round_contains?: InputMaybe<Scalars["String"]>;
  round_contains_nocase?: InputMaybe<Scalars["String"]>;
  round_ends_with?: InputMaybe<Scalars["String"]>;
  round_ends_with_nocase?: InputMaybe<Scalars["String"]>;
  round_gt?: InputMaybe<Scalars["String"]>;
  round_gte?: InputMaybe<Scalars["String"]>;
  round_in?: InputMaybe<Array<Scalars["String"]>>;
  round_lt?: InputMaybe<Scalars["String"]>;
  round_lte?: InputMaybe<Scalars["String"]>;
  round_not?: InputMaybe<Scalars["String"]>;
  round_not_contains?: InputMaybe<Scalars["String"]>;
  round_not_contains_nocase?: InputMaybe<Scalars["String"]>;
  round_not_ends_with?: InputMaybe<Scalars["String"]>;
  round_not_ends_with_nocase?: InputMaybe<Scalars["String"]>;
  round_not_in?: InputMaybe<Array<Scalars["String"]>>;
  round_not_starts_with?: InputMaybe<Scalars["String"]>;
  round_not_starts_with_nocase?: InputMaybe<Scalars["String"]>;
  round_starts_with?: InputMaybe<Scalars["String"]>;
  round_starts_with_nocase?: InputMaybe<Scalars["String"]>;
  stake?: InputMaybe<Scalars["BigDecimal"]>;
  stake_gt?: InputMaybe<Scalars["BigDecimal"]>;
  stake_gte?: InputMaybe<Scalars["BigDecimal"]>;
  stake_in?: InputMaybe<Array<Scalars["BigDecimal"]>>;
  stake_lt?: InputMaybe<Scalars["BigDecimal"]>;
  stake_lte?: InputMaybe<Scalars["BigDecimal"]>;
  stake_not?: InputMaybe<Scalars["BigDecimal"]>;
  stake_not_in?: InputMaybe<Array<Scalars["BigDecimal"]>>;
  timestamp?: InputMaybe<Scalars["Int"]>;
  timestamp_gt?: InputMaybe<Scalars["Int"]>;
  timestamp_gte?: InputMaybe<Scalars["Int"]>;
  timestamp_in?: InputMaybe<Array<Scalars["Int"]>>;
  timestamp_lt?: InputMaybe<Scalars["Int"]>;
  timestamp_lte?: InputMaybe<Scalars["Int"]>;
  timestamp_not?: InputMaybe<Scalars["Int"]>;
  timestamp_not_in?: InputMaybe<Array<Scalars["Int"]>>;
  transaction?: InputMaybe<Scalars["String"]>;
  transaction_?: InputMaybe<Transaction_Filter>;
  transaction_contains?: InputMaybe<Scalars["String"]>;
  transaction_contains_nocase?: InputMaybe<Scalars["String"]>;
  transaction_ends_with?: InputMaybe<Scalars["String"]>;
  transaction_ends_with_nocase?: InputMaybe<Scalars["String"]>;
  transaction_gt?: InputMaybe<Scalars["String"]>;
  transaction_gte?: InputMaybe<Scalars["String"]>;
  transaction_in?: InputMaybe<Array<Scalars["String"]>>;
  transaction_lt?: InputMaybe<Scalars["String"]>;
  transaction_lte?: InputMaybe<Scalars["String"]>;
  transaction_not?: InputMaybe<Scalars["String"]>;
  transaction_not_contains?: InputMaybe<Scalars["String"]>;
  transaction_not_contains_nocase?: InputMaybe<Scalars["String"]>;
  transaction_not_ends_with?: InputMaybe<Scalars["String"]>;
  transaction_not_ends_with_nocase?: InputMaybe<Scalars["String"]>;
  transaction_not_in?: InputMaybe<Array<Scalars["String"]>>;
  transaction_not_starts_with?: InputMaybe<Scalars["String"]>;
  transaction_not_starts_with_nocase?: InputMaybe<Scalars["String"]>;
  transaction_starts_with?: InputMaybe<Scalars["String"]>;
  transaction_starts_with_nocase?: InputMaybe<Scalars["String"]>;
};

export enum MigrateDelegatorFinalizedEvent_OrderBy {
  Delegate = "delegate",
  DelegatedStake = "delegatedStake",
  Fees = "fees",
  Id = "id",
  L1Addr = "l1Addr",
  L2Addr = "l2Addr",
  Round = "round",
  RoundActiveTranscoderCount = "round__activeTranscoderCount",
  RoundDelegatorsCount = "round__delegatorsCount",
  RoundEndBlock = "round__endBlock",
  RoundId = "round__id",
  RoundInflation = "round__inflation",
  RoundInitialized = "round__initialized",
  RoundLength = "round__length",
  RoundMintableTokens = "round__mintableTokens",
  RoundMovedStake = "round__movedStake",
  RoundNewStake = "round__newStake",
  RoundNumActiveTranscoders = "round__numActiveTranscoders",
  RoundParticipationRate = "round__participationRate",
  RoundStartBlock = "round__startBlock",
  RoundStartTimestamp = "round__startTimestamp",
  RoundTotalActiveStake = "round__totalActiveStake",
  RoundTotalSupply = "round__totalSupply",
  RoundVolumeEth = "round__volumeETH",
  RoundVolumeUsd = "round__volumeUSD",
  Stake = "stake",
  Timestamp = "timestamp",
  Transaction = "transaction",
  TransactionBlockNumber = "transaction__blockNumber",
  TransactionFrom = "transaction__from",
  TransactionGasPrice = "transaction__gasPrice",
  TransactionGasUsed = "transaction__gasUsed",
  TransactionId = "transaction__id",
  TransactionTimestamp = "transaction__timestamp",
  TransactionTo = "transaction__to",
}

/**
 * MintEvent entities are created for every emitted Mint event.
 *
 */
export type MintEvent = Event & {
  __typename: "MintEvent";
  /** Amount of tokens minted */
  amount: Scalars["BigDecimal"];
  /** Ethereum transaction hash + event log index */
  id: Scalars["ID"];
  /** Reference to the round the event occured in */
  round: Round;
  /** Timestamp of the transaction the event was included in */
  timestamp: Scalars["Int"];
  /** Token smart contract address */
  to: Scalars["String"];
  /** Reference to the transaction the event was included in */
  transaction: Transaction;
};

export type MintEvent_Filter = {
  /** Filter for the block changed event. */
  _change_block?: InputMaybe<BlockChangedFilter>;
  amount?: InputMaybe<Scalars["BigDecimal"]>;
  amount_gt?: InputMaybe<Scalars["BigDecimal"]>;
  amount_gte?: InputMaybe<Scalars["BigDecimal"]>;
  amount_in?: InputMaybe<Array<Scalars["BigDecimal"]>>;
  amount_lt?: InputMaybe<Scalars["BigDecimal"]>;
  amount_lte?: InputMaybe<Scalars["BigDecimal"]>;
  amount_not?: InputMaybe<Scalars["BigDecimal"]>;
  amount_not_in?: InputMaybe<Array<Scalars["BigDecimal"]>>;
  and?: InputMaybe<Array<InputMaybe<MintEvent_Filter>>>;
  id?: InputMaybe<Scalars["ID"]>;
  id_gt?: InputMaybe<Scalars["ID"]>;
  id_gte?: InputMaybe<Scalars["ID"]>;
  id_in?: InputMaybe<Array<Scalars["ID"]>>;
  id_lt?: InputMaybe<Scalars["ID"]>;
  id_lte?: InputMaybe<Scalars["ID"]>;
  id_not?: InputMaybe<Scalars["ID"]>;
  id_not_in?: InputMaybe<Array<Scalars["ID"]>>;
  or?: InputMaybe<Array<InputMaybe<MintEvent_Filter>>>;
  round?: InputMaybe<Scalars["String"]>;
  round_?: InputMaybe<Round_Filter>;
  round_contains?: InputMaybe<Scalars["String"]>;
  round_contains_nocase?: InputMaybe<Scalars["String"]>;
  round_ends_with?: InputMaybe<Scalars["String"]>;
  round_ends_with_nocase?: InputMaybe<Scalars["String"]>;
  round_gt?: InputMaybe<Scalars["String"]>;
  round_gte?: InputMaybe<Scalars["String"]>;
  round_in?: InputMaybe<Array<Scalars["String"]>>;
  round_lt?: InputMaybe<Scalars["String"]>;
  round_lte?: InputMaybe<Scalars["String"]>;
  round_not?: InputMaybe<Scalars["String"]>;
  round_not_contains?: InputMaybe<Scalars["String"]>;
  round_not_contains_nocase?: InputMaybe<Scalars["String"]>;
  round_not_ends_with?: InputMaybe<Scalars["String"]>;
  round_not_ends_with_nocase?: InputMaybe<Scalars["String"]>;
  round_not_in?: InputMaybe<Array<Scalars["String"]>>;
  round_not_starts_with?: InputMaybe<Scalars["String"]>;
  round_not_starts_with_nocase?: InputMaybe<Scalars["String"]>;
  round_starts_with?: InputMaybe<Scalars["String"]>;
  round_starts_with_nocase?: InputMaybe<Scalars["String"]>;
  timestamp?: InputMaybe<Scalars["Int"]>;
  timestamp_gt?: InputMaybe<Scalars["Int"]>;
  timestamp_gte?: InputMaybe<Scalars["Int"]>;
  timestamp_in?: InputMaybe<Array<Scalars["Int"]>>;
  timestamp_lt?: InputMaybe<Scalars["Int"]>;
  timestamp_lte?: InputMaybe<Scalars["Int"]>;
  timestamp_not?: InputMaybe<Scalars["Int"]>;
  timestamp_not_in?: InputMaybe<Array<Scalars["Int"]>>;
  to?: InputMaybe<Scalars["String"]>;
  to_contains?: InputMaybe<Scalars["String"]>;
  to_contains_nocase?: InputMaybe<Scalars["String"]>;
  to_ends_with?: InputMaybe<Scalars["String"]>;
  to_ends_with_nocase?: InputMaybe<Scalars["String"]>;
  to_gt?: InputMaybe<Scalars["String"]>;
  to_gte?: InputMaybe<Scalars["String"]>;
  to_in?: InputMaybe<Array<Scalars["String"]>>;
  to_lt?: InputMaybe<Scalars["String"]>;
  to_lte?: InputMaybe<Scalars["String"]>;
  to_not?: InputMaybe<Scalars["String"]>;
  to_not_contains?: InputMaybe<Scalars["String"]>;
  to_not_contains_nocase?: InputMaybe<Scalars["String"]>;
  to_not_ends_with?: InputMaybe<Scalars["String"]>;
  to_not_ends_with_nocase?: InputMaybe<Scalars["String"]>;
  to_not_in?: InputMaybe<Array<Scalars["String"]>>;
  to_not_starts_with?: InputMaybe<Scalars["String"]>;
  to_not_starts_with_nocase?: InputMaybe<Scalars["String"]>;
  to_starts_with?: InputMaybe<Scalars["String"]>;
  to_starts_with_nocase?: InputMaybe<Scalars["String"]>;
  transaction?: InputMaybe<Scalars["String"]>;
  transaction_?: InputMaybe<Transaction_Filter>;
  transaction_contains?: InputMaybe<Scalars["String"]>;
  transaction_contains_nocase?: InputMaybe<Scalars["String"]>;
  transaction_ends_with?: InputMaybe<Scalars["String"]>;
  transaction_ends_with_nocase?: InputMaybe<Scalars["String"]>;
  transaction_gt?: InputMaybe<Scalars["String"]>;
  transaction_gte?: InputMaybe<Scalars["String"]>;
  transaction_in?: InputMaybe<Array<Scalars["String"]>>;
  transaction_lt?: InputMaybe<Scalars["String"]>;
  transaction_lte?: InputMaybe<Scalars["String"]>;
  transaction_not?: InputMaybe<Scalars["String"]>;
  transaction_not_contains?: InputMaybe<Scalars["String"]>;
  transaction_not_contains_nocase?: InputMaybe<Scalars["String"]>;
  transaction_not_ends_with?: InputMaybe<Scalars["String"]>;
  transaction_not_ends_with_nocase?: InputMaybe<Scalars["String"]>;
  transaction_not_in?: InputMaybe<Array<Scalars["String"]>>;
  transaction_not_starts_with?: InputMaybe<Scalars["String"]>;
  transaction_not_starts_with_nocase?: InputMaybe<Scalars["String"]>;
  transaction_starts_with?: InputMaybe<Scalars["String"]>;
  transaction_starts_with_nocase?: InputMaybe<Scalars["String"]>;
};

export enum MintEvent_OrderBy {
  Amount = "amount",
  Id = "id",
  Round = "round",
  RoundActiveTranscoderCount = "round__activeTranscoderCount",
  RoundDelegatorsCount = "round__delegatorsCount",
  RoundEndBlock = "round__endBlock",
  RoundId = "round__id",
  RoundInflation = "round__inflation",
  RoundInitialized = "round__initialized",
  RoundLength = "round__length",
  RoundMintableTokens = "round__mintableTokens",
  RoundMovedStake = "round__movedStake",
  RoundNewStake = "round__newStake",
  RoundNumActiveTranscoders = "round__numActiveTranscoders",
  RoundParticipationRate = "round__participationRate",
  RoundStartBlock = "round__startBlock",
  RoundStartTimestamp = "round__startTimestamp",
  RoundTotalActiveStake = "round__totalActiveStake",
  RoundTotalSupply = "round__totalSupply",
  RoundVolumeEth = "round__volumeETH",
  RoundVolumeUsd = "round__volumeUSD",
  Timestamp = "timestamp",
  To = "to",
  Transaction = "transaction",
  TransactionBlockNumber = "transaction__blockNumber",
  TransactionFrom = "transaction__from",
  TransactionGasPrice = "transaction__gasPrice",
  TransactionGasUsed = "transaction__gasUsed",
  TransactionId = "transaction__id",
  TransactionTimestamp = "transaction__timestamp",
  TransactionTo = "transaction__to",
}

/**
 * NewRoundEvent entities are created for every emitted NewRound event.
 *
 */
export type NewRoundEvent = Event & {
  __typename: "NewRoundEvent";
  /** Block hash for the round */
  blockHash: Scalars["String"];
  /** Ethereum transaction hash + event log index */
  id: Scalars["ID"];
  /** Reference to the round the event occured in */
  round: Round;
  /** Timestamp of the transaction the event was included in */
  timestamp: Scalars["Int"];
  /** Reference to the transaction the event was included in */
  transaction: Transaction;
};

export type NewRoundEvent_Filter = {
  /** Filter for the block changed event. */
  _change_block?: InputMaybe<BlockChangedFilter>;
  and?: InputMaybe<Array<InputMaybe<NewRoundEvent_Filter>>>;
  blockHash?: InputMaybe<Scalars["String"]>;
  blockHash_contains?: InputMaybe<Scalars["String"]>;
  blockHash_contains_nocase?: InputMaybe<Scalars["String"]>;
  blockHash_ends_with?: InputMaybe<Scalars["String"]>;
  blockHash_ends_with_nocase?: InputMaybe<Scalars["String"]>;
  blockHash_gt?: InputMaybe<Scalars["String"]>;
  blockHash_gte?: InputMaybe<Scalars["String"]>;
  blockHash_in?: InputMaybe<Array<Scalars["String"]>>;
  blockHash_lt?: InputMaybe<Scalars["String"]>;
  blockHash_lte?: InputMaybe<Scalars["String"]>;
  blockHash_not?: InputMaybe<Scalars["String"]>;
  blockHash_not_contains?: InputMaybe<Scalars["String"]>;
  blockHash_not_contains_nocase?: InputMaybe<Scalars["String"]>;
  blockHash_not_ends_with?: InputMaybe<Scalars["String"]>;
  blockHash_not_ends_with_nocase?: InputMaybe<Scalars["String"]>;
  blockHash_not_in?: InputMaybe<Array<Scalars["String"]>>;
  blockHash_not_starts_with?: InputMaybe<Scalars["String"]>;
  blockHash_not_starts_with_nocase?: InputMaybe<Scalars["String"]>;
  blockHash_starts_with?: InputMaybe<Scalars["String"]>;
  blockHash_starts_with_nocase?: InputMaybe<Scalars["String"]>;
  id?: InputMaybe<Scalars["ID"]>;
  id_gt?: InputMaybe<Scalars["ID"]>;
  id_gte?: InputMaybe<Scalars["ID"]>;
  id_in?: InputMaybe<Array<Scalars["ID"]>>;
  id_lt?: InputMaybe<Scalars["ID"]>;
  id_lte?: InputMaybe<Scalars["ID"]>;
  id_not?: InputMaybe<Scalars["ID"]>;
  id_not_in?: InputMaybe<Array<Scalars["ID"]>>;
  or?: InputMaybe<Array<InputMaybe<NewRoundEvent_Filter>>>;
  round?: InputMaybe<Scalars["String"]>;
  round_?: InputMaybe<Round_Filter>;
  round_contains?: InputMaybe<Scalars["String"]>;
  round_contains_nocase?: InputMaybe<Scalars["String"]>;
  round_ends_with?: InputMaybe<Scalars["String"]>;
  round_ends_with_nocase?: InputMaybe<Scalars["String"]>;
  round_gt?: InputMaybe<Scalars["String"]>;
  round_gte?: InputMaybe<Scalars["String"]>;
  round_in?: InputMaybe<Array<Scalars["String"]>>;
  round_lt?: InputMaybe<Scalars["String"]>;
  round_lte?: InputMaybe<Scalars["String"]>;
  round_not?: InputMaybe<Scalars["String"]>;
  round_not_contains?: InputMaybe<Scalars["String"]>;
  round_not_contains_nocase?: InputMaybe<Scalars["String"]>;
  round_not_ends_with?: InputMaybe<Scalars["String"]>;
  round_not_ends_with_nocase?: InputMaybe<Scalars["String"]>;
  round_not_in?: InputMaybe<Array<Scalars["String"]>>;
  round_not_starts_with?: InputMaybe<Scalars["String"]>;
  round_not_starts_with_nocase?: InputMaybe<Scalars["String"]>;
  round_starts_with?: InputMaybe<Scalars["String"]>;
  round_starts_with_nocase?: InputMaybe<Scalars["String"]>;
  timestamp?: InputMaybe<Scalars["Int"]>;
  timestamp_gt?: InputMaybe<Scalars["Int"]>;
  timestamp_gte?: InputMaybe<Scalars["Int"]>;
  timestamp_in?: InputMaybe<Array<Scalars["Int"]>>;
  timestamp_lt?: InputMaybe<Scalars["Int"]>;
  timestamp_lte?: InputMaybe<Scalars["Int"]>;
  timestamp_not?: InputMaybe<Scalars["Int"]>;
  timestamp_not_in?: InputMaybe<Array<Scalars["Int"]>>;
  transaction?: InputMaybe<Scalars["String"]>;
  transaction_?: InputMaybe<Transaction_Filter>;
  transaction_contains?: InputMaybe<Scalars["String"]>;
  transaction_contains_nocase?: InputMaybe<Scalars["String"]>;
  transaction_ends_with?: InputMaybe<Scalars["String"]>;
  transaction_ends_with_nocase?: InputMaybe<Scalars["String"]>;
  transaction_gt?: InputMaybe<Scalars["String"]>;
  transaction_gte?: InputMaybe<Scalars["String"]>;
  transaction_in?: InputMaybe<Array<Scalars["String"]>>;
  transaction_lt?: InputMaybe<Scalars["String"]>;
  transaction_lte?: InputMaybe<Scalars["String"]>;
  transaction_not?: InputMaybe<Scalars["String"]>;
  transaction_not_contains?: InputMaybe<Scalars["String"]>;
  transaction_not_contains_nocase?: InputMaybe<Scalars["String"]>;
  transaction_not_ends_with?: InputMaybe<Scalars["String"]>;
  transaction_not_ends_with_nocase?: InputMaybe<Scalars["String"]>;
  transaction_not_in?: InputMaybe<Array<Scalars["String"]>>;
  transaction_not_starts_with?: InputMaybe<Scalars["String"]>;
  transaction_not_starts_with_nocase?: InputMaybe<Scalars["String"]>;
  transaction_starts_with?: InputMaybe<Scalars["String"]>;
  transaction_starts_with_nocase?: InputMaybe<Scalars["String"]>;
};

export enum NewRoundEvent_OrderBy {
  BlockHash = "blockHash",
  Id = "id",
  Round = "round",
  RoundActiveTranscoderCount = "round__activeTranscoderCount",
  RoundDelegatorsCount = "round__delegatorsCount",
  RoundEndBlock = "round__endBlock",
  RoundId = "round__id",
  RoundInflation = "round__inflation",
  RoundInitialized = "round__initialized",
  RoundLength = "round__length",
  RoundMintableTokens = "round__mintableTokens",
  RoundMovedStake = "round__movedStake",
  RoundNewStake = "round__newStake",
  RoundNumActiveTranscoders = "round__numActiveTranscoders",
  RoundParticipationRate = "round__participationRate",
  RoundStartBlock = "round__startBlock",
  RoundStartTimestamp = "round__startTimestamp",
  RoundTotalActiveStake = "round__totalActiveStake",
  RoundTotalSupply = "round__totalSupply",
  RoundVolumeEth = "round__volumeETH",
  RoundVolumeUsd = "round__volumeUSD",
  Timestamp = "timestamp",
  Transaction = "transaction",
  TransactionBlockNumber = "transaction__blockNumber",
  TransactionFrom = "transaction__from",
  TransactionGasPrice = "transaction__gasPrice",
  TransactionGasUsed = "transaction__gasUsed",
  TransactionId = "transaction__id",
  TransactionTimestamp = "transaction__timestamp",
  TransactionTo = "transaction__to",
}

/** Defines the order direction, either ascending or descending */
export enum OrderDirection {
  Asc = "asc",
  Desc = "desc",
}

/**
 * ParameterUpdateEvent entities are created for every emitted ParameterUpdate event.
 *
 */
export type ParameterUpdateEvent = Event & {
  __typename: "ParameterUpdateEvent";
  /** Ethereum transaction hash + event log index */
  id: Scalars["ID"];
  /** Parameter that was updated */
  param: Scalars["String"];
  /** Reference to the round the event occured in */
  round: Round;
  /** Timestamp of the transaction the event was included in */
  timestamp: Scalars["Int"];
  /** Reference to the transaction the event was included in */
  transaction: Transaction;
};

export type ParameterUpdateEvent_Filter = {
  /** Filter for the block changed event. */
  _change_block?: InputMaybe<BlockChangedFilter>;
  and?: InputMaybe<Array<InputMaybe<ParameterUpdateEvent_Filter>>>;
  id?: InputMaybe<Scalars["ID"]>;
  id_gt?: InputMaybe<Scalars["ID"]>;
  id_gte?: InputMaybe<Scalars["ID"]>;
  id_in?: InputMaybe<Array<Scalars["ID"]>>;
  id_lt?: InputMaybe<Scalars["ID"]>;
  id_lte?: InputMaybe<Scalars["ID"]>;
  id_not?: InputMaybe<Scalars["ID"]>;
  id_not_in?: InputMaybe<Array<Scalars["ID"]>>;
  or?: InputMaybe<Array<InputMaybe<ParameterUpdateEvent_Filter>>>;
  param?: InputMaybe<Scalars["String"]>;
  param_contains?: InputMaybe<Scalars["String"]>;
  param_contains_nocase?: InputMaybe<Scalars["String"]>;
  param_ends_with?: InputMaybe<Scalars["String"]>;
  param_ends_with_nocase?: InputMaybe<Scalars["String"]>;
  param_gt?: InputMaybe<Scalars["String"]>;
  param_gte?: InputMaybe<Scalars["String"]>;
  param_in?: InputMaybe<Array<Scalars["String"]>>;
  param_lt?: InputMaybe<Scalars["String"]>;
  param_lte?: InputMaybe<Scalars["String"]>;
  param_not?: InputMaybe<Scalars["String"]>;
  param_not_contains?: InputMaybe<Scalars["String"]>;
  param_not_contains_nocase?: InputMaybe<Scalars["String"]>;
  param_not_ends_with?: InputMaybe<Scalars["String"]>;
  param_not_ends_with_nocase?: InputMaybe<Scalars["String"]>;
  param_not_in?: InputMaybe<Array<Scalars["String"]>>;
  param_not_starts_with?: InputMaybe<Scalars["String"]>;
  param_not_starts_with_nocase?: InputMaybe<Scalars["String"]>;
  param_starts_with?: InputMaybe<Scalars["String"]>;
  param_starts_with_nocase?: InputMaybe<Scalars["String"]>;
  round?: InputMaybe<Scalars["String"]>;
  round_?: InputMaybe<Round_Filter>;
  round_contains?: InputMaybe<Scalars["String"]>;
  round_contains_nocase?: InputMaybe<Scalars["String"]>;
  round_ends_with?: InputMaybe<Scalars["String"]>;
  round_ends_with_nocase?: InputMaybe<Scalars["String"]>;
  round_gt?: InputMaybe<Scalars["String"]>;
  round_gte?: InputMaybe<Scalars["String"]>;
  round_in?: InputMaybe<Array<Scalars["String"]>>;
  round_lt?: InputMaybe<Scalars["String"]>;
  round_lte?: InputMaybe<Scalars["String"]>;
  round_not?: InputMaybe<Scalars["String"]>;
  round_not_contains?: InputMaybe<Scalars["String"]>;
  round_not_contains_nocase?: InputMaybe<Scalars["String"]>;
  round_not_ends_with?: InputMaybe<Scalars["String"]>;
  round_not_ends_with_nocase?: InputMaybe<Scalars["String"]>;
  round_not_in?: InputMaybe<Array<Scalars["String"]>>;
  round_not_starts_with?: InputMaybe<Scalars["String"]>;
  round_not_starts_with_nocase?: InputMaybe<Scalars["String"]>;
  round_starts_with?: InputMaybe<Scalars["String"]>;
  round_starts_with_nocase?: InputMaybe<Scalars["String"]>;
  timestamp?: InputMaybe<Scalars["Int"]>;
  timestamp_gt?: InputMaybe<Scalars["Int"]>;
  timestamp_gte?: InputMaybe<Scalars["Int"]>;
  timestamp_in?: InputMaybe<Array<Scalars["Int"]>>;
  timestamp_lt?: InputMaybe<Scalars["Int"]>;
  timestamp_lte?: InputMaybe<Scalars["Int"]>;
  timestamp_not?: InputMaybe<Scalars["Int"]>;
  timestamp_not_in?: InputMaybe<Array<Scalars["Int"]>>;
  transaction?: InputMaybe<Scalars["String"]>;
  transaction_?: InputMaybe<Transaction_Filter>;
  transaction_contains?: InputMaybe<Scalars["String"]>;
  transaction_contains_nocase?: InputMaybe<Scalars["String"]>;
  transaction_ends_with?: InputMaybe<Scalars["String"]>;
  transaction_ends_with_nocase?: InputMaybe<Scalars["String"]>;
  transaction_gt?: InputMaybe<Scalars["String"]>;
  transaction_gte?: InputMaybe<Scalars["String"]>;
  transaction_in?: InputMaybe<Array<Scalars["String"]>>;
  transaction_lt?: InputMaybe<Scalars["String"]>;
  transaction_lte?: InputMaybe<Scalars["String"]>;
  transaction_not?: InputMaybe<Scalars["String"]>;
  transaction_not_contains?: InputMaybe<Scalars["String"]>;
  transaction_not_contains_nocase?: InputMaybe<Scalars["String"]>;
  transaction_not_ends_with?: InputMaybe<Scalars["String"]>;
  transaction_not_ends_with_nocase?: InputMaybe<Scalars["String"]>;
  transaction_not_in?: InputMaybe<Array<Scalars["String"]>>;
  transaction_not_starts_with?: InputMaybe<Scalars["String"]>;
  transaction_not_starts_with_nocase?: InputMaybe<Scalars["String"]>;
  transaction_starts_with?: InputMaybe<Scalars["String"]>;
  transaction_starts_with_nocase?: InputMaybe<Scalars["String"]>;
};

export enum ParameterUpdateEvent_OrderBy {
  Id = "id",
  Param = "param",
  Round = "round",
  RoundActiveTranscoderCount = "round__activeTranscoderCount",
  RoundDelegatorsCount = "round__delegatorsCount",
  RoundEndBlock = "round__endBlock",
  RoundId = "round__id",
  RoundInflation = "round__inflation",
  RoundInitialized = "round__initialized",
  RoundLength = "round__length",
  RoundMintableTokens = "round__mintableTokens",
  RoundMovedStake = "round__movedStake",
  RoundNewStake = "round__newStake",
  RoundNumActiveTranscoders = "round__numActiveTranscoders",
  RoundParticipationRate = "round__participationRate",
  RoundStartBlock = "round__startBlock",
  RoundStartTimestamp = "round__startTimestamp",
  RoundTotalActiveStake = "round__totalActiveStake",
  RoundTotalSupply = "round__totalSupply",
  RoundVolumeEth = "round__volumeETH",
  RoundVolumeUsd = "round__volumeUSD",
  Timestamp = "timestamp",
  Transaction = "transaction",
  TransactionBlockNumber = "transaction__blockNumber",
  TransactionFrom = "transaction__from",
  TransactionGasPrice = "transaction__gasPrice",
  TransactionGasUsed = "transaction__gasUsed",
  TransactionId = "transaction__id",
  TransactionTimestamp = "transaction__timestamp",
  TransactionTo = "transaction__to",
}

/**
 * PauseEvent entities are created for every emitted Pause event.
 *
 */
export type PauseEvent = Event & {
  __typename: "PauseEvent";
  /** Ethereum transaction hash + event log index */
  id: Scalars["ID"];
  /** Reference to the round the event occured in */
  round: Round;
  /** Timestamp of the transaction the event was included in */
  timestamp: Scalars["Int"];
  /** Reference to the transaction the event was included in */
  transaction: Transaction;
};

export type PauseEvent_Filter = {
  /** Filter for the block changed event. */
  _change_block?: InputMaybe<BlockChangedFilter>;
  and?: InputMaybe<Array<InputMaybe<PauseEvent_Filter>>>;
  id?: InputMaybe<Scalars["ID"]>;
  id_gt?: InputMaybe<Scalars["ID"]>;
  id_gte?: InputMaybe<Scalars["ID"]>;
  id_in?: InputMaybe<Array<Scalars["ID"]>>;
  id_lt?: InputMaybe<Scalars["ID"]>;
  id_lte?: InputMaybe<Scalars["ID"]>;
  id_not?: InputMaybe<Scalars["ID"]>;
  id_not_in?: InputMaybe<Array<Scalars["ID"]>>;
  or?: InputMaybe<Array<InputMaybe<PauseEvent_Filter>>>;
  round?: InputMaybe<Scalars["String"]>;
  round_?: InputMaybe<Round_Filter>;
  round_contains?: InputMaybe<Scalars["String"]>;
  round_contains_nocase?: InputMaybe<Scalars["String"]>;
  round_ends_with?: InputMaybe<Scalars["String"]>;
  round_ends_with_nocase?: InputMaybe<Scalars["String"]>;
  round_gt?: InputMaybe<Scalars["String"]>;
  round_gte?: InputMaybe<Scalars["String"]>;
  round_in?: InputMaybe<Array<Scalars["String"]>>;
  round_lt?: InputMaybe<Scalars["String"]>;
  round_lte?: InputMaybe<Scalars["String"]>;
  round_not?: InputMaybe<Scalars["String"]>;
  round_not_contains?: InputMaybe<Scalars["String"]>;
  round_not_contains_nocase?: InputMaybe<Scalars["String"]>;
  round_not_ends_with?: InputMaybe<Scalars["String"]>;
  round_not_ends_with_nocase?: InputMaybe<Scalars["String"]>;
  round_not_in?: InputMaybe<Array<Scalars["String"]>>;
  round_not_starts_with?: InputMaybe<Scalars["String"]>;
  round_not_starts_with_nocase?: InputMaybe<Scalars["String"]>;
  round_starts_with?: InputMaybe<Scalars["String"]>;
  round_starts_with_nocase?: InputMaybe<Scalars["String"]>;
  timestamp?: InputMaybe<Scalars["Int"]>;
  timestamp_gt?: InputMaybe<Scalars["Int"]>;
  timestamp_gte?: InputMaybe<Scalars["Int"]>;
  timestamp_in?: InputMaybe<Array<Scalars["Int"]>>;
  timestamp_lt?: InputMaybe<Scalars["Int"]>;
  timestamp_lte?: InputMaybe<Scalars["Int"]>;
  timestamp_not?: InputMaybe<Scalars["Int"]>;
  timestamp_not_in?: InputMaybe<Array<Scalars["Int"]>>;
  transaction?: InputMaybe<Scalars["String"]>;
  transaction_?: InputMaybe<Transaction_Filter>;
  transaction_contains?: InputMaybe<Scalars["String"]>;
  transaction_contains_nocase?: InputMaybe<Scalars["String"]>;
  transaction_ends_with?: InputMaybe<Scalars["String"]>;
  transaction_ends_with_nocase?: InputMaybe<Scalars["String"]>;
  transaction_gt?: InputMaybe<Scalars["String"]>;
  transaction_gte?: InputMaybe<Scalars["String"]>;
  transaction_in?: InputMaybe<Array<Scalars["String"]>>;
  transaction_lt?: InputMaybe<Scalars["String"]>;
  transaction_lte?: InputMaybe<Scalars["String"]>;
  transaction_not?: InputMaybe<Scalars["String"]>;
  transaction_not_contains?: InputMaybe<Scalars["String"]>;
  transaction_not_contains_nocase?: InputMaybe<Scalars["String"]>;
  transaction_not_ends_with?: InputMaybe<Scalars["String"]>;
  transaction_not_ends_with_nocase?: InputMaybe<Scalars["String"]>;
  transaction_not_in?: InputMaybe<Array<Scalars["String"]>>;
  transaction_not_starts_with?: InputMaybe<Scalars["String"]>;
  transaction_not_starts_with_nocase?: InputMaybe<Scalars["String"]>;
  transaction_starts_with?: InputMaybe<Scalars["String"]>;
  transaction_starts_with_nocase?: InputMaybe<Scalars["String"]>;
};

export enum PauseEvent_OrderBy {
  Id = "id",
  Round = "round",
  RoundActiveTranscoderCount = "round__activeTranscoderCount",
  RoundDelegatorsCount = "round__delegatorsCount",
  RoundEndBlock = "round__endBlock",
  RoundId = "round__id",
  RoundInflation = "round__inflation",
  RoundInitialized = "round__initialized",
  RoundLength = "round__length",
  RoundMintableTokens = "round__mintableTokens",
  RoundMovedStake = "round__movedStake",
  RoundNewStake = "round__newStake",
  RoundNumActiveTranscoders = "round__numActiveTranscoders",
  RoundParticipationRate = "round__participationRate",
  RoundStartBlock = "round__startBlock",
  RoundStartTimestamp = "round__startTimestamp",
  RoundTotalActiveStake = "round__totalActiveStake",
  RoundTotalSupply = "round__totalSupply",
  RoundVolumeEth = "round__volumeETH",
  RoundVolumeUsd = "round__volumeUSD",
  Timestamp = "timestamp",
  Transaction = "transaction",
  TransactionBlockNumber = "transaction__blockNumber",
  TransactionFrom = "transaction__from",
  TransactionGasPrice = "transaction__gasPrice",
  TransactionGasUsed = "transaction__gasUsed",
  TransactionId = "transaction__id",
  TransactionTimestamp = "transaction__timestamp",
  TransactionTo = "transaction__to",
}

/**
 * Stake weighted poll
 *
 */
export type Poll = {
  __typename: "Poll";
  /** Block at which the poll ends and votes can no longer be submitted */
  endBlock: Scalars["BigInt"];
  /** Poll address */
  id: Scalars["ID"];
  /** IPFS multihash for the proposal */
  proposal: Scalars["String"];
  /** Minimum amount of participation (total stake including inactive stake) required for a poll to pass */
  quorum: Scalars["BigInt"];
  /** Minimum amount of yes votes required for a poll to pass */
  quota: Scalars["BigInt"];
  /** Poll tally */
  tally?: Maybe<PollTally>;
  /** Votes belonging to a poll */
  votes: Array<Vote>;
};

/**
 * Stake weighted poll
 *
 */
export type PollVotesArgs = {
  first?: InputMaybe<Scalars["Int"]>;
  orderBy?: InputMaybe<Vote_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars["Int"]>;
  where?: InputMaybe<Vote_Filter>;
};

export enum PollChoice {
  No = "No",
  Yes = "Yes",
}

/**
 * PollCreatedEvent entities are created for every emitted PollCreated event.
 *
 */
export type PollCreatedEvent = Event & {
  __typename: "PollCreatedEvent";
  /** Ethereum block in which this poll ends */
  endBlock: Scalars["BigInt"];
  /** Ethereum transaction hash + event log index */
  id: Scalars["ID"];
  /** Reference to the poll that was created */
  poll: Poll;
  /** IPFS content hash representing proposal */
  proposal: Scalars["Bytes"];
  /** The minimum amount of stake-weighted votes for this poll's outcome to be considered valid */
  quorum: Scalars["BigInt"];
  /** The minimum amount of stake-weighted 'yes' votes needed for the poll to pass */
  quota: Scalars["BigInt"];
  /** Reference to the round the event occured in */
  round: Round;
  /** Timestamp of the transaction the event was included in */
  timestamp: Scalars["Int"];
  /** Reference to the transaction the event was included in */
  transaction: Transaction;
};

export type PollCreatedEvent_Filter = {
  /** Filter for the block changed event. */
  _change_block?: InputMaybe<BlockChangedFilter>;
  and?: InputMaybe<Array<InputMaybe<PollCreatedEvent_Filter>>>;
  endBlock?: InputMaybe<Scalars["BigInt"]>;
  endBlock_gt?: InputMaybe<Scalars["BigInt"]>;
  endBlock_gte?: InputMaybe<Scalars["BigInt"]>;
  endBlock_in?: InputMaybe<Array<Scalars["BigInt"]>>;
  endBlock_lt?: InputMaybe<Scalars["BigInt"]>;
  endBlock_lte?: InputMaybe<Scalars["BigInt"]>;
  endBlock_not?: InputMaybe<Scalars["BigInt"]>;
  endBlock_not_in?: InputMaybe<Array<Scalars["BigInt"]>>;
  id?: InputMaybe<Scalars["ID"]>;
  id_gt?: InputMaybe<Scalars["ID"]>;
  id_gte?: InputMaybe<Scalars["ID"]>;
  id_in?: InputMaybe<Array<Scalars["ID"]>>;
  id_lt?: InputMaybe<Scalars["ID"]>;
  id_lte?: InputMaybe<Scalars["ID"]>;
  id_not?: InputMaybe<Scalars["ID"]>;
  id_not_in?: InputMaybe<Array<Scalars["ID"]>>;
  or?: InputMaybe<Array<InputMaybe<PollCreatedEvent_Filter>>>;
  poll?: InputMaybe<Scalars["String"]>;
  poll_?: InputMaybe<Poll_Filter>;
  poll_contains?: InputMaybe<Scalars["String"]>;
  poll_contains_nocase?: InputMaybe<Scalars["String"]>;
  poll_ends_with?: InputMaybe<Scalars["String"]>;
  poll_ends_with_nocase?: InputMaybe<Scalars["String"]>;
  poll_gt?: InputMaybe<Scalars["String"]>;
  poll_gte?: InputMaybe<Scalars["String"]>;
  poll_in?: InputMaybe<Array<Scalars["String"]>>;
  poll_lt?: InputMaybe<Scalars["String"]>;
  poll_lte?: InputMaybe<Scalars["String"]>;
  poll_not?: InputMaybe<Scalars["String"]>;
  poll_not_contains?: InputMaybe<Scalars["String"]>;
  poll_not_contains_nocase?: InputMaybe<Scalars["String"]>;
  poll_not_ends_with?: InputMaybe<Scalars["String"]>;
  poll_not_ends_with_nocase?: InputMaybe<Scalars["String"]>;
  poll_not_in?: InputMaybe<Array<Scalars["String"]>>;
  poll_not_starts_with?: InputMaybe<Scalars["String"]>;
  poll_not_starts_with_nocase?: InputMaybe<Scalars["String"]>;
  poll_starts_with?: InputMaybe<Scalars["String"]>;
  poll_starts_with_nocase?: InputMaybe<Scalars["String"]>;
  proposal?: InputMaybe<Scalars["Bytes"]>;
  proposal_contains?: InputMaybe<Scalars["Bytes"]>;
  proposal_gt?: InputMaybe<Scalars["Bytes"]>;
  proposal_gte?: InputMaybe<Scalars["Bytes"]>;
  proposal_in?: InputMaybe<Array<Scalars["Bytes"]>>;
  proposal_lt?: InputMaybe<Scalars["Bytes"]>;
  proposal_lte?: InputMaybe<Scalars["Bytes"]>;
  proposal_not?: InputMaybe<Scalars["Bytes"]>;
  proposal_not_contains?: InputMaybe<Scalars["Bytes"]>;
  proposal_not_in?: InputMaybe<Array<Scalars["Bytes"]>>;
  quorum?: InputMaybe<Scalars["BigInt"]>;
  quorum_gt?: InputMaybe<Scalars["BigInt"]>;
  quorum_gte?: InputMaybe<Scalars["BigInt"]>;
  quorum_in?: InputMaybe<Array<Scalars["BigInt"]>>;
  quorum_lt?: InputMaybe<Scalars["BigInt"]>;
  quorum_lte?: InputMaybe<Scalars["BigInt"]>;
  quorum_not?: InputMaybe<Scalars["BigInt"]>;
  quorum_not_in?: InputMaybe<Array<Scalars["BigInt"]>>;
  quota?: InputMaybe<Scalars["BigInt"]>;
  quota_gt?: InputMaybe<Scalars["BigInt"]>;
  quota_gte?: InputMaybe<Scalars["BigInt"]>;
  quota_in?: InputMaybe<Array<Scalars["BigInt"]>>;
  quota_lt?: InputMaybe<Scalars["BigInt"]>;
  quota_lte?: InputMaybe<Scalars["BigInt"]>;
  quota_not?: InputMaybe<Scalars["BigInt"]>;
  quota_not_in?: InputMaybe<Array<Scalars["BigInt"]>>;
  round?: InputMaybe<Scalars["String"]>;
  round_?: InputMaybe<Round_Filter>;
  round_contains?: InputMaybe<Scalars["String"]>;
  round_contains_nocase?: InputMaybe<Scalars["String"]>;
  round_ends_with?: InputMaybe<Scalars["String"]>;
  round_ends_with_nocase?: InputMaybe<Scalars["String"]>;
  round_gt?: InputMaybe<Scalars["String"]>;
  round_gte?: InputMaybe<Scalars["String"]>;
  round_in?: InputMaybe<Array<Scalars["String"]>>;
  round_lt?: InputMaybe<Scalars["String"]>;
  round_lte?: InputMaybe<Scalars["String"]>;
  round_not?: InputMaybe<Scalars["String"]>;
  round_not_contains?: InputMaybe<Scalars["String"]>;
  round_not_contains_nocase?: InputMaybe<Scalars["String"]>;
  round_not_ends_with?: InputMaybe<Scalars["String"]>;
  round_not_ends_with_nocase?: InputMaybe<Scalars["String"]>;
  round_not_in?: InputMaybe<Array<Scalars["String"]>>;
  round_not_starts_with?: InputMaybe<Scalars["String"]>;
  round_not_starts_with_nocase?: InputMaybe<Scalars["String"]>;
  round_starts_with?: InputMaybe<Scalars["String"]>;
  round_starts_with_nocase?: InputMaybe<Scalars["String"]>;
  timestamp?: InputMaybe<Scalars["Int"]>;
  timestamp_gt?: InputMaybe<Scalars["Int"]>;
  timestamp_gte?: InputMaybe<Scalars["Int"]>;
  timestamp_in?: InputMaybe<Array<Scalars["Int"]>>;
  timestamp_lt?: InputMaybe<Scalars["Int"]>;
  timestamp_lte?: InputMaybe<Scalars["Int"]>;
  timestamp_not?: InputMaybe<Scalars["Int"]>;
  timestamp_not_in?: InputMaybe<Array<Scalars["Int"]>>;
  transaction?: InputMaybe<Scalars["String"]>;
  transaction_?: InputMaybe<Transaction_Filter>;
  transaction_contains?: InputMaybe<Scalars["String"]>;
  transaction_contains_nocase?: InputMaybe<Scalars["String"]>;
  transaction_ends_with?: InputMaybe<Scalars["String"]>;
  transaction_ends_with_nocase?: InputMaybe<Scalars["String"]>;
  transaction_gt?: InputMaybe<Scalars["String"]>;
  transaction_gte?: InputMaybe<Scalars["String"]>;
  transaction_in?: InputMaybe<Array<Scalars["String"]>>;
  transaction_lt?: InputMaybe<Scalars["String"]>;
  transaction_lte?: InputMaybe<Scalars["String"]>;
  transaction_not?: InputMaybe<Scalars["String"]>;
  transaction_not_contains?: InputMaybe<Scalars["String"]>;
  transaction_not_contains_nocase?: InputMaybe<Scalars["String"]>;
  transaction_not_ends_with?: InputMaybe<Scalars["String"]>;
  transaction_not_ends_with_nocase?: InputMaybe<Scalars["String"]>;
  transaction_not_in?: InputMaybe<Array<Scalars["String"]>>;
  transaction_not_starts_with?: InputMaybe<Scalars["String"]>;
  transaction_not_starts_with_nocase?: InputMaybe<Scalars["String"]>;
  transaction_starts_with?: InputMaybe<Scalars["String"]>;
  transaction_starts_with_nocase?: InputMaybe<Scalars["String"]>;
};

export enum PollCreatedEvent_OrderBy {
  EndBlock = "endBlock",
  Id = "id",
  Poll = "poll",
  PollEndBlock = "poll__endBlock",
  PollId = "poll__id",
  PollProposal = "poll__proposal",
  PollQuorum = "poll__quorum",
  PollQuota = "poll__quota",
  Proposal = "proposal",
  Quorum = "quorum",
  Quota = "quota",
  Round = "round",
  RoundActiveTranscoderCount = "round__activeTranscoderCount",
  RoundDelegatorsCount = "round__delegatorsCount",
  RoundEndBlock = "round__endBlock",
  RoundId = "round__id",
  RoundInflation = "round__inflation",
  RoundInitialized = "round__initialized",
  RoundLength = "round__length",
  RoundMintableTokens = "round__mintableTokens",
  RoundMovedStake = "round__movedStake",
  RoundNewStake = "round__newStake",
  RoundNumActiveTranscoders = "round__numActiveTranscoders",
  RoundParticipationRate = "round__participationRate",
  RoundStartBlock = "round__startBlock",
  RoundStartTimestamp = "round__startTimestamp",
  RoundTotalActiveStake = "round__totalActiveStake",
  RoundTotalSupply = "round__totalSupply",
  RoundVolumeEth = "round__volumeETH",
  RoundVolumeUsd = "round__volumeUSD",
  Timestamp = "timestamp",
  Transaction = "transaction",
  TransactionBlockNumber = "transaction__blockNumber",
  TransactionFrom = "transaction__from",
  TransactionGasPrice = "transaction__gasPrice",
  TransactionGasUsed = "transaction__gasUsed",
  TransactionId = "transaction__id",
  TransactionTimestamp = "transaction__timestamp",
  TransactionTo = "transaction__to",
}

/**
 * Stake weighted tally associated with a poll
 *
 */
export type PollTally = {
  __typename: "PollTally";
  /** Poll address */
  id: Scalars["ID"];
  /** Stake voted no */
  no: Scalars["BigDecimal"];
  /** Stake voted yes */
  yes: Scalars["BigDecimal"];
};

export type PollTally_Filter = {
  /** Filter for the block changed event. */
  _change_block?: InputMaybe<BlockChangedFilter>;
  and?: InputMaybe<Array<InputMaybe<PollTally_Filter>>>;
  id?: InputMaybe<Scalars["ID"]>;
  id_gt?: InputMaybe<Scalars["ID"]>;
  id_gte?: InputMaybe<Scalars["ID"]>;
  id_in?: InputMaybe<Array<Scalars["ID"]>>;
  id_lt?: InputMaybe<Scalars["ID"]>;
  id_lte?: InputMaybe<Scalars["ID"]>;
  id_not?: InputMaybe<Scalars["ID"]>;
  id_not_in?: InputMaybe<Array<Scalars["ID"]>>;
  no?: InputMaybe<Scalars["BigDecimal"]>;
  no_gt?: InputMaybe<Scalars["BigDecimal"]>;
  no_gte?: InputMaybe<Scalars["BigDecimal"]>;
  no_in?: InputMaybe<Array<Scalars["BigDecimal"]>>;
  no_lt?: InputMaybe<Scalars["BigDecimal"]>;
  no_lte?: InputMaybe<Scalars["BigDecimal"]>;
  no_not?: InputMaybe<Scalars["BigDecimal"]>;
  no_not_in?: InputMaybe<Array<Scalars["BigDecimal"]>>;
  or?: InputMaybe<Array<InputMaybe<PollTally_Filter>>>;
  yes?: InputMaybe<Scalars["BigDecimal"]>;
  yes_gt?: InputMaybe<Scalars["BigDecimal"]>;
  yes_gte?: InputMaybe<Scalars["BigDecimal"]>;
  yes_in?: InputMaybe<Array<Scalars["BigDecimal"]>>;
  yes_lt?: InputMaybe<Scalars["BigDecimal"]>;
  yes_lte?: InputMaybe<Scalars["BigDecimal"]>;
  yes_not?: InputMaybe<Scalars["BigDecimal"]>;
  yes_not_in?: InputMaybe<Array<Scalars["BigDecimal"]>>;
};

export enum PollTally_OrderBy {
  Id = "id",
  No = "no",
  Yes = "yes",
}

export type Poll_Filter = {
  /** Filter for the block changed event. */
  _change_block?: InputMaybe<BlockChangedFilter>;
  and?: InputMaybe<Array<InputMaybe<Poll_Filter>>>;
  endBlock?: InputMaybe<Scalars["BigInt"]>;
  endBlock_gt?: InputMaybe<Scalars["BigInt"]>;
  endBlock_gte?: InputMaybe<Scalars["BigInt"]>;
  endBlock_in?: InputMaybe<Array<Scalars["BigInt"]>>;
  endBlock_lt?: InputMaybe<Scalars["BigInt"]>;
  endBlock_lte?: InputMaybe<Scalars["BigInt"]>;
  endBlock_not?: InputMaybe<Scalars["BigInt"]>;
  endBlock_not_in?: InputMaybe<Array<Scalars["BigInt"]>>;
  id?: InputMaybe<Scalars["ID"]>;
  id_gt?: InputMaybe<Scalars["ID"]>;
  id_gte?: InputMaybe<Scalars["ID"]>;
  id_in?: InputMaybe<Array<Scalars["ID"]>>;
  id_lt?: InputMaybe<Scalars["ID"]>;
  id_lte?: InputMaybe<Scalars["ID"]>;
  id_not?: InputMaybe<Scalars["ID"]>;
  id_not_in?: InputMaybe<Array<Scalars["ID"]>>;
  or?: InputMaybe<Array<InputMaybe<Poll_Filter>>>;
  proposal?: InputMaybe<Scalars["String"]>;
  proposal_contains?: InputMaybe<Scalars["String"]>;
  proposal_contains_nocase?: InputMaybe<Scalars["String"]>;
  proposal_ends_with?: InputMaybe<Scalars["String"]>;
  proposal_ends_with_nocase?: InputMaybe<Scalars["String"]>;
  proposal_gt?: InputMaybe<Scalars["String"]>;
  proposal_gte?: InputMaybe<Scalars["String"]>;
  proposal_in?: InputMaybe<Array<Scalars["String"]>>;
  proposal_lt?: InputMaybe<Scalars["String"]>;
  proposal_lte?: InputMaybe<Scalars["String"]>;
  proposal_not?: InputMaybe<Scalars["String"]>;
  proposal_not_contains?: InputMaybe<Scalars["String"]>;
  proposal_not_contains_nocase?: InputMaybe<Scalars["String"]>;
  proposal_not_ends_with?: InputMaybe<Scalars["String"]>;
  proposal_not_ends_with_nocase?: InputMaybe<Scalars["String"]>;
  proposal_not_in?: InputMaybe<Array<Scalars["String"]>>;
  proposal_not_starts_with?: InputMaybe<Scalars["String"]>;
  proposal_not_starts_with_nocase?: InputMaybe<Scalars["String"]>;
  proposal_starts_with?: InputMaybe<Scalars["String"]>;
  proposal_starts_with_nocase?: InputMaybe<Scalars["String"]>;
  quorum?: InputMaybe<Scalars["BigInt"]>;
  quorum_gt?: InputMaybe<Scalars["BigInt"]>;
  quorum_gte?: InputMaybe<Scalars["BigInt"]>;
  quorum_in?: InputMaybe<Array<Scalars["BigInt"]>>;
  quorum_lt?: InputMaybe<Scalars["BigInt"]>;
  quorum_lte?: InputMaybe<Scalars["BigInt"]>;
  quorum_not?: InputMaybe<Scalars["BigInt"]>;
  quorum_not_in?: InputMaybe<Array<Scalars["BigInt"]>>;
  quota?: InputMaybe<Scalars["BigInt"]>;
  quota_gt?: InputMaybe<Scalars["BigInt"]>;
  quota_gte?: InputMaybe<Scalars["BigInt"]>;
  quota_in?: InputMaybe<Array<Scalars["BigInt"]>>;
  quota_lt?: InputMaybe<Scalars["BigInt"]>;
  quota_lte?: InputMaybe<Scalars["BigInt"]>;
  quota_not?: InputMaybe<Scalars["BigInt"]>;
  quota_not_in?: InputMaybe<Array<Scalars["BigInt"]>>;
  tally?: InputMaybe<Scalars["String"]>;
  tally_?: InputMaybe<PollTally_Filter>;
  tally_contains?: InputMaybe<Scalars["String"]>;
  tally_contains_nocase?: InputMaybe<Scalars["String"]>;
  tally_ends_with?: InputMaybe<Scalars["String"]>;
  tally_ends_with_nocase?: InputMaybe<Scalars["String"]>;
  tally_gt?: InputMaybe<Scalars["String"]>;
  tally_gte?: InputMaybe<Scalars["String"]>;
  tally_in?: InputMaybe<Array<Scalars["String"]>>;
  tally_lt?: InputMaybe<Scalars["String"]>;
  tally_lte?: InputMaybe<Scalars["String"]>;
  tally_not?: InputMaybe<Scalars["String"]>;
  tally_not_contains?: InputMaybe<Scalars["String"]>;
  tally_not_contains_nocase?: InputMaybe<Scalars["String"]>;
  tally_not_ends_with?: InputMaybe<Scalars["String"]>;
  tally_not_ends_with_nocase?: InputMaybe<Scalars["String"]>;
  tally_not_in?: InputMaybe<Array<Scalars["String"]>>;
  tally_not_starts_with?: InputMaybe<Scalars["String"]>;
  tally_not_starts_with_nocase?: InputMaybe<Scalars["String"]>;
  tally_starts_with?: InputMaybe<Scalars["String"]>;
  tally_starts_with_nocase?: InputMaybe<Scalars["String"]>;
  votes?: InputMaybe<Array<Scalars["String"]>>;
  votes_?: InputMaybe<Vote_Filter>;
  votes_contains?: InputMaybe<Array<Scalars["String"]>>;
  votes_contains_nocase?: InputMaybe<Array<Scalars["String"]>>;
  votes_not?: InputMaybe<Array<Scalars["String"]>>;
  votes_not_contains?: InputMaybe<Array<Scalars["String"]>>;
  votes_not_contains_nocase?: InputMaybe<Array<Scalars["String"]>>;
};

export enum Poll_OrderBy {
  EndBlock = "endBlock",
  Id = "id",
  Proposal = "proposal",
  Quorum = "quorum",
  Quota = "quota",
  Tally = "tally",
  TallyId = "tally__id",
  TallyNo = "tally__no",
  TallyYes = "tally__yes",
  Votes = "votes",
}

/**
 * Represents a transcoder's rewards and fees to be distributed to delegators
 *
 */
export type Pool = {
  __typename: "Pool";
  /** Transcoder associated with the pool */
  delegate: Transcoder;
  /** Transcoder's fee share during the earnings pool's round */
  feeShare: Scalars["BigInt"];
  /** Fees collected in the pool */
  fees: Scalars["BigDecimal"];
  /** Unique identifer for the pool (formed using the transcoder's address and round number) */
  id: Scalars["ID"];
  /** Transcoder's reward cut during the earnings pool's round */
  rewardCut: Scalars["BigInt"];
  /** Total reward tokens collected in the pool */
  rewardTokens?: Maybe<Scalars["BigDecimal"]>;
  /** Round associated with the pool */
  round: Round;
  /** Transcoder's total stake during the earnings pool's round */
  totalStake: Scalars["BigDecimal"];
};

export type Pool_Filter = {
  /** Filter for the block changed event. */
  _change_block?: InputMaybe<BlockChangedFilter>;
  and?: InputMaybe<Array<InputMaybe<Pool_Filter>>>;
  delegate?: InputMaybe<Scalars["String"]>;
  delegate_?: InputMaybe<Transcoder_Filter>;
  delegate_contains?: InputMaybe<Scalars["String"]>;
  delegate_contains_nocase?: InputMaybe<Scalars["String"]>;
  delegate_ends_with?: InputMaybe<Scalars["String"]>;
  delegate_ends_with_nocase?: InputMaybe<Scalars["String"]>;
  delegate_gt?: InputMaybe<Scalars["String"]>;
  delegate_gte?: InputMaybe<Scalars["String"]>;
  delegate_in?: InputMaybe<Array<Scalars["String"]>>;
  delegate_lt?: InputMaybe<Scalars["String"]>;
  delegate_lte?: InputMaybe<Scalars["String"]>;
  delegate_not?: InputMaybe<Scalars["String"]>;
  delegate_not_contains?: InputMaybe<Scalars["String"]>;
  delegate_not_contains_nocase?: InputMaybe<Scalars["String"]>;
  delegate_not_ends_with?: InputMaybe<Scalars["String"]>;
  delegate_not_ends_with_nocase?: InputMaybe<Scalars["String"]>;
  delegate_not_in?: InputMaybe<Array<Scalars["String"]>>;
  delegate_not_starts_with?: InputMaybe<Scalars["String"]>;
  delegate_not_starts_with_nocase?: InputMaybe<Scalars["String"]>;
  delegate_starts_with?: InputMaybe<Scalars["String"]>;
  delegate_starts_with_nocase?: InputMaybe<Scalars["String"]>;
  feeShare?: InputMaybe<Scalars["BigInt"]>;
  feeShare_gt?: InputMaybe<Scalars["BigInt"]>;
  feeShare_gte?: InputMaybe<Scalars["BigInt"]>;
  feeShare_in?: InputMaybe<Array<Scalars["BigInt"]>>;
  feeShare_lt?: InputMaybe<Scalars["BigInt"]>;
  feeShare_lte?: InputMaybe<Scalars["BigInt"]>;
  feeShare_not?: InputMaybe<Scalars["BigInt"]>;
  feeShare_not_in?: InputMaybe<Array<Scalars["BigInt"]>>;
  fees?: InputMaybe<Scalars["BigDecimal"]>;
  fees_gt?: InputMaybe<Scalars["BigDecimal"]>;
  fees_gte?: InputMaybe<Scalars["BigDecimal"]>;
  fees_in?: InputMaybe<Array<Scalars["BigDecimal"]>>;
  fees_lt?: InputMaybe<Scalars["BigDecimal"]>;
  fees_lte?: InputMaybe<Scalars["BigDecimal"]>;
  fees_not?: InputMaybe<Scalars["BigDecimal"]>;
  fees_not_in?: InputMaybe<Array<Scalars["BigDecimal"]>>;
  id?: InputMaybe<Scalars["ID"]>;
  id_gt?: InputMaybe<Scalars["ID"]>;
  id_gte?: InputMaybe<Scalars["ID"]>;
  id_in?: InputMaybe<Array<Scalars["ID"]>>;
  id_lt?: InputMaybe<Scalars["ID"]>;
  id_lte?: InputMaybe<Scalars["ID"]>;
  id_not?: InputMaybe<Scalars["ID"]>;
  id_not_in?: InputMaybe<Array<Scalars["ID"]>>;
  or?: InputMaybe<Array<InputMaybe<Pool_Filter>>>;
  rewardCut?: InputMaybe<Scalars["BigInt"]>;
  rewardCut_gt?: InputMaybe<Scalars["BigInt"]>;
  rewardCut_gte?: InputMaybe<Scalars["BigInt"]>;
  rewardCut_in?: InputMaybe<Array<Scalars["BigInt"]>>;
  rewardCut_lt?: InputMaybe<Scalars["BigInt"]>;
  rewardCut_lte?: InputMaybe<Scalars["BigInt"]>;
  rewardCut_not?: InputMaybe<Scalars["BigInt"]>;
  rewardCut_not_in?: InputMaybe<Array<Scalars["BigInt"]>>;
  rewardTokens?: InputMaybe<Scalars["BigDecimal"]>;
  rewardTokens_gt?: InputMaybe<Scalars["BigDecimal"]>;
  rewardTokens_gte?: InputMaybe<Scalars["BigDecimal"]>;
  rewardTokens_in?: InputMaybe<Array<Scalars["BigDecimal"]>>;
  rewardTokens_lt?: InputMaybe<Scalars["BigDecimal"]>;
  rewardTokens_lte?: InputMaybe<Scalars["BigDecimal"]>;
  rewardTokens_not?: InputMaybe<Scalars["BigDecimal"]>;
  rewardTokens_not_in?: InputMaybe<Array<Scalars["BigDecimal"]>>;
  round?: InputMaybe<Scalars["String"]>;
  round_?: InputMaybe<Round_Filter>;
  round_contains?: InputMaybe<Scalars["String"]>;
  round_contains_nocase?: InputMaybe<Scalars["String"]>;
  round_ends_with?: InputMaybe<Scalars["String"]>;
  round_ends_with_nocase?: InputMaybe<Scalars["String"]>;
  round_gt?: InputMaybe<Scalars["String"]>;
  round_gte?: InputMaybe<Scalars["String"]>;
  round_in?: InputMaybe<Array<Scalars["String"]>>;
  round_lt?: InputMaybe<Scalars["String"]>;
  round_lte?: InputMaybe<Scalars["String"]>;
  round_not?: InputMaybe<Scalars["String"]>;
  round_not_contains?: InputMaybe<Scalars["String"]>;
  round_not_contains_nocase?: InputMaybe<Scalars["String"]>;
  round_not_ends_with?: InputMaybe<Scalars["String"]>;
  round_not_ends_with_nocase?: InputMaybe<Scalars["String"]>;
  round_not_in?: InputMaybe<Array<Scalars["String"]>>;
  round_not_starts_with?: InputMaybe<Scalars["String"]>;
  round_not_starts_with_nocase?: InputMaybe<Scalars["String"]>;
  round_starts_with?: InputMaybe<Scalars["String"]>;
  round_starts_with_nocase?: InputMaybe<Scalars["String"]>;
  totalStake?: InputMaybe<Scalars["BigDecimal"]>;
  totalStake_gt?: InputMaybe<Scalars["BigDecimal"]>;
  totalStake_gte?: InputMaybe<Scalars["BigDecimal"]>;
  totalStake_in?: InputMaybe<Array<Scalars["BigDecimal"]>>;
  totalStake_lt?: InputMaybe<Scalars["BigDecimal"]>;
  totalStake_lte?: InputMaybe<Scalars["BigDecimal"]>;
  totalStake_not?: InputMaybe<Scalars["BigDecimal"]>;
  totalStake_not_in?: InputMaybe<Array<Scalars["BigDecimal"]>>;
};

export enum Pool_OrderBy {
  Delegate = "delegate",
  DelegateActivationRound = "delegate__activationRound",
  DelegateActivationTimestamp = "delegate__activationTimestamp",
  DelegateActive = "delegate__active",
  DelegateDeactivationRound = "delegate__deactivationRound",
  DelegateFeeShare = "delegate__feeShare",
  DelegateFeeShareUpdateTimestamp = "delegate__feeShareUpdateTimestamp",
  DelegateId = "delegate__id",
  DelegateLastActiveStakeUpdateRound = "delegate__lastActiveStakeUpdateRound",
  DelegateNinetyDayVolumeEth = "delegate__ninetyDayVolumeETH",
  DelegateRewardCut = "delegate__rewardCut",
  DelegateRewardCutUpdateTimestamp = "delegate__rewardCutUpdateTimestamp",
  DelegateServiceUri = "delegate__serviceURI",
  DelegateSixtyDayVolumeEth = "delegate__sixtyDayVolumeETH",
  DelegateStatus = "delegate__status",
  DelegateThirtyDayVolumeEth = "delegate__thirtyDayVolumeETH",
  DelegateTotalStake = "delegate__totalStake",
  DelegateTotalVolumeEth = "delegate__totalVolumeETH",
  DelegateTotalVolumeUsd = "delegate__totalVolumeUSD",
  FeeShare = "feeShare",
  Fees = "fees",
  Id = "id",
  RewardCut = "rewardCut",
  RewardTokens = "rewardTokens",
  Round = "round",
  RoundActiveTranscoderCount = "round__activeTranscoderCount",
  RoundDelegatorsCount = "round__delegatorsCount",
  RoundEndBlock = "round__endBlock",
  RoundId = "round__id",
  RoundInflation = "round__inflation",
  RoundInitialized = "round__initialized",
  RoundLength = "round__length",
  RoundMintableTokens = "round__mintableTokens",
  RoundMovedStake = "round__movedStake",
  RoundNewStake = "round__newStake",
  RoundNumActiveTranscoders = "round__numActiveTranscoders",
  RoundParticipationRate = "round__participationRate",
  RoundStartBlock = "round__startBlock",
  RoundStartTimestamp = "round__startTimestamp",
  RoundTotalActiveStake = "round__totalActiveStake",
  RoundTotalSupply = "round__totalSupply",
  RoundVolumeEth = "round__volumeETH",
  RoundVolumeUsd = "round__volumeUSD",
  TotalStake = "totalStake",
}

/**
 * Livepeer protocol global parameters
 *
 */
export type Protocol = {
  __typename: "Protocol";
  /** Total active transcoders (up to the limit) */
  activeTranscoderCount: Scalars["BigInt"];
  /** Current round the protocol is in */
  currentRound: Round;
  /** Total number of delegators on the network */
  delegatorsCount: Scalars["BigInt"];
  /** ID is set to 0 */
  id: Scalars["ID"];
  /** Per round inflation rate */
  inflation: Scalars["BigInt"];
  /** Change in inflation rate per round until the target bonding rate is achieved */
  inflationChange: Scalars["BigInt"];
  /** Round that was last initialized */
  lastInitializedRound: Round;
  /** Round when round length was last updated */
  lastRoundLengthUpdateRound: Round;
  /** Block when round length was last updated */
  lastRoundLengthUpdateStartBlock: Scalars["BigInt"];
  /** Time in blocks delegators have to review transcoder information without changes */
  lockPeriod: Scalars["BigInt"];
  /** Livepeer Token price in ETH (not to be used for trading - updated only every round) */
  lptPriceEth: Scalars["BigDecimal"];
  /** Limit of active transcoders */
  numActiveTranscoders: Scalars["BigInt"];
  /** Ratio of total active stake to total supply */
  participationRate: Scalars["BigDecimal"];
  /** True if the protocol is paused */
  paused: Scalars["Boolean"];
  /** Transcoders pending activation */
  pendingActivation: Array<Transcoder>;
  /** Transcoders pending deactivation */
  pendingDeactivation: Array<Transcoder>;
  /** Total rounds */
  roundCount: Scalars["Int"];
  /** Round length in blocks */
  roundLength: Scalars["BigInt"];
  /** Lock period of a round as a % of round length */
  roundLockAmount: Scalars["BigInt"];
  /** Target bonding rate (participation) that determines whether inflation should increase or decrease */
  targetBondingRate: Scalars["BigInt"];
  /** The total amount of active LPT staked */
  totalActiveStake: Scalars["BigDecimal"];
  /** Livepeer Token supply */
  totalSupply: Scalars["BigDecimal"];
  /** Total broadcaster fees transcoders have accumulated in ETH */
  totalVolumeETH: Scalars["BigDecimal"];
  /** Total broadcaster fees transcoders have accumulated in USD */
  totalVolumeUSD: Scalars["BigDecimal"];
  /** Time in blocks needed to wait to unstake */
  unbondingPeriod: Scalars["BigInt"];
  /** Total winning tickets */
  winningTicketCount: Scalars["Int"];
};

/**
 * Livepeer protocol global parameters
 *
 */
export type ProtocolPendingActivationArgs = {
  first?: InputMaybe<Scalars["Int"]>;
  orderBy?: InputMaybe<Transcoder_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars["Int"]>;
  where?: InputMaybe<Transcoder_Filter>;
};

/**
 * Livepeer protocol global parameters
 *
 */
export type ProtocolPendingDeactivationArgs = {
  first?: InputMaybe<Scalars["Int"]>;
  orderBy?: InputMaybe<Transcoder_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars["Int"]>;
  where?: InputMaybe<Transcoder_Filter>;
};

export type Protocol_Filter = {
  /** Filter for the block changed event. */
  _change_block?: InputMaybe<BlockChangedFilter>;
  activeTranscoderCount?: InputMaybe<Scalars["BigInt"]>;
  activeTranscoderCount_gt?: InputMaybe<Scalars["BigInt"]>;
  activeTranscoderCount_gte?: InputMaybe<Scalars["BigInt"]>;
  activeTranscoderCount_in?: InputMaybe<Array<Scalars["BigInt"]>>;
  activeTranscoderCount_lt?: InputMaybe<Scalars["BigInt"]>;
  activeTranscoderCount_lte?: InputMaybe<Scalars["BigInt"]>;
  activeTranscoderCount_not?: InputMaybe<Scalars["BigInt"]>;
  activeTranscoderCount_not_in?: InputMaybe<Array<Scalars["BigInt"]>>;
  and?: InputMaybe<Array<InputMaybe<Protocol_Filter>>>;
  currentRound?: InputMaybe<Scalars["String"]>;
  currentRound_?: InputMaybe<Round_Filter>;
  currentRound_contains?: InputMaybe<Scalars["String"]>;
  currentRound_contains_nocase?: InputMaybe<Scalars["String"]>;
  currentRound_ends_with?: InputMaybe<Scalars["String"]>;
  currentRound_ends_with_nocase?: InputMaybe<Scalars["String"]>;
  currentRound_gt?: InputMaybe<Scalars["String"]>;
  currentRound_gte?: InputMaybe<Scalars["String"]>;
  currentRound_in?: InputMaybe<Array<Scalars["String"]>>;
  currentRound_lt?: InputMaybe<Scalars["String"]>;
  currentRound_lte?: InputMaybe<Scalars["String"]>;
  currentRound_not?: InputMaybe<Scalars["String"]>;
  currentRound_not_contains?: InputMaybe<Scalars["String"]>;
  currentRound_not_contains_nocase?: InputMaybe<Scalars["String"]>;
  currentRound_not_ends_with?: InputMaybe<Scalars["String"]>;
  currentRound_not_ends_with_nocase?: InputMaybe<Scalars["String"]>;
  currentRound_not_in?: InputMaybe<Array<Scalars["String"]>>;
  currentRound_not_starts_with?: InputMaybe<Scalars["String"]>;
  currentRound_not_starts_with_nocase?: InputMaybe<Scalars["String"]>;
  currentRound_starts_with?: InputMaybe<Scalars["String"]>;
  currentRound_starts_with_nocase?: InputMaybe<Scalars["String"]>;
  delegatorsCount?: InputMaybe<Scalars["BigInt"]>;
  delegatorsCount_gt?: InputMaybe<Scalars["BigInt"]>;
  delegatorsCount_gte?: InputMaybe<Scalars["BigInt"]>;
  delegatorsCount_in?: InputMaybe<Array<Scalars["BigInt"]>>;
  delegatorsCount_lt?: InputMaybe<Scalars["BigInt"]>;
  delegatorsCount_lte?: InputMaybe<Scalars["BigInt"]>;
  delegatorsCount_not?: InputMaybe<Scalars["BigInt"]>;
  delegatorsCount_not_in?: InputMaybe<Array<Scalars["BigInt"]>>;
  id?: InputMaybe<Scalars["ID"]>;
  id_gt?: InputMaybe<Scalars["ID"]>;
  id_gte?: InputMaybe<Scalars["ID"]>;
  id_in?: InputMaybe<Array<Scalars["ID"]>>;
  id_lt?: InputMaybe<Scalars["ID"]>;
  id_lte?: InputMaybe<Scalars["ID"]>;
  id_not?: InputMaybe<Scalars["ID"]>;
  id_not_in?: InputMaybe<Array<Scalars["ID"]>>;
  inflation?: InputMaybe<Scalars["BigInt"]>;
  inflationChange?: InputMaybe<Scalars["BigInt"]>;
  inflationChange_gt?: InputMaybe<Scalars["BigInt"]>;
  inflationChange_gte?: InputMaybe<Scalars["BigInt"]>;
  inflationChange_in?: InputMaybe<Array<Scalars["BigInt"]>>;
  inflationChange_lt?: InputMaybe<Scalars["BigInt"]>;
  inflationChange_lte?: InputMaybe<Scalars["BigInt"]>;
  inflationChange_not?: InputMaybe<Scalars["BigInt"]>;
  inflationChange_not_in?: InputMaybe<Array<Scalars["BigInt"]>>;
  inflation_gt?: InputMaybe<Scalars["BigInt"]>;
  inflation_gte?: InputMaybe<Scalars["BigInt"]>;
  inflation_in?: InputMaybe<Array<Scalars["BigInt"]>>;
  inflation_lt?: InputMaybe<Scalars["BigInt"]>;
  inflation_lte?: InputMaybe<Scalars["BigInt"]>;
  inflation_not?: InputMaybe<Scalars["BigInt"]>;
  inflation_not_in?: InputMaybe<Array<Scalars["BigInt"]>>;
  lastInitializedRound?: InputMaybe<Scalars["String"]>;
  lastInitializedRound_?: InputMaybe<Round_Filter>;
  lastInitializedRound_contains?: InputMaybe<Scalars["String"]>;
  lastInitializedRound_contains_nocase?: InputMaybe<Scalars["String"]>;
  lastInitializedRound_ends_with?: InputMaybe<Scalars["String"]>;
  lastInitializedRound_ends_with_nocase?: InputMaybe<Scalars["String"]>;
  lastInitializedRound_gt?: InputMaybe<Scalars["String"]>;
  lastInitializedRound_gte?: InputMaybe<Scalars["String"]>;
  lastInitializedRound_in?: InputMaybe<Array<Scalars["String"]>>;
  lastInitializedRound_lt?: InputMaybe<Scalars["String"]>;
  lastInitializedRound_lte?: InputMaybe<Scalars["String"]>;
  lastInitializedRound_not?: InputMaybe<Scalars["String"]>;
  lastInitializedRound_not_contains?: InputMaybe<Scalars["String"]>;
  lastInitializedRound_not_contains_nocase?: InputMaybe<Scalars["String"]>;
  lastInitializedRound_not_ends_with?: InputMaybe<Scalars["String"]>;
  lastInitializedRound_not_ends_with_nocase?: InputMaybe<Scalars["String"]>;
  lastInitializedRound_not_in?: InputMaybe<Array<Scalars["String"]>>;
  lastInitializedRound_not_starts_with?: InputMaybe<Scalars["String"]>;
  lastInitializedRound_not_starts_with_nocase?: InputMaybe<Scalars["String"]>;
  lastInitializedRound_starts_with?: InputMaybe<Scalars["String"]>;
  lastInitializedRound_starts_with_nocase?: InputMaybe<Scalars["String"]>;
  lastRoundLengthUpdateRound?: InputMaybe<Scalars["String"]>;
  lastRoundLengthUpdateRound_?: InputMaybe<Round_Filter>;
  lastRoundLengthUpdateRound_contains?: InputMaybe<Scalars["String"]>;
  lastRoundLengthUpdateRound_contains_nocase?: InputMaybe<Scalars["String"]>;
  lastRoundLengthUpdateRound_ends_with?: InputMaybe<Scalars["String"]>;
  lastRoundLengthUpdateRound_ends_with_nocase?: InputMaybe<Scalars["String"]>;
  lastRoundLengthUpdateRound_gt?: InputMaybe<Scalars["String"]>;
  lastRoundLengthUpdateRound_gte?: InputMaybe<Scalars["String"]>;
  lastRoundLengthUpdateRound_in?: InputMaybe<Array<Scalars["String"]>>;
  lastRoundLengthUpdateRound_lt?: InputMaybe<Scalars["String"]>;
  lastRoundLengthUpdateRound_lte?: InputMaybe<Scalars["String"]>;
  lastRoundLengthUpdateRound_not?: InputMaybe<Scalars["String"]>;
  lastRoundLengthUpdateRound_not_contains?: InputMaybe<Scalars["String"]>;
  lastRoundLengthUpdateRound_not_contains_nocase?: InputMaybe<
    Scalars["String"]
  >;
  lastRoundLengthUpdateRound_not_ends_with?: InputMaybe<Scalars["String"]>;
  lastRoundLengthUpdateRound_not_ends_with_nocase?: InputMaybe<
    Scalars["String"]
  >;
  lastRoundLengthUpdateRound_not_in?: InputMaybe<Array<Scalars["String"]>>;
  lastRoundLengthUpdateRound_not_starts_with?: InputMaybe<Scalars["String"]>;
  lastRoundLengthUpdateRound_not_starts_with_nocase?: InputMaybe<
    Scalars["String"]
  >;
  lastRoundLengthUpdateRound_starts_with?: InputMaybe<Scalars["String"]>;
  lastRoundLengthUpdateRound_starts_with_nocase?: InputMaybe<Scalars["String"]>;
  lastRoundLengthUpdateStartBlock?: InputMaybe<Scalars["BigInt"]>;
  lastRoundLengthUpdateStartBlock_gt?: InputMaybe<Scalars["BigInt"]>;
  lastRoundLengthUpdateStartBlock_gte?: InputMaybe<Scalars["BigInt"]>;
  lastRoundLengthUpdateStartBlock_in?: InputMaybe<Array<Scalars["BigInt"]>>;
  lastRoundLengthUpdateStartBlock_lt?: InputMaybe<Scalars["BigInt"]>;
  lastRoundLengthUpdateStartBlock_lte?: InputMaybe<Scalars["BigInt"]>;
  lastRoundLengthUpdateStartBlock_not?: InputMaybe<Scalars["BigInt"]>;
  lastRoundLengthUpdateStartBlock_not_in?: InputMaybe<Array<Scalars["BigInt"]>>;
  lockPeriod?: InputMaybe<Scalars["BigInt"]>;
  lockPeriod_gt?: InputMaybe<Scalars["BigInt"]>;
  lockPeriod_gte?: InputMaybe<Scalars["BigInt"]>;
  lockPeriod_in?: InputMaybe<Array<Scalars["BigInt"]>>;
  lockPeriod_lt?: InputMaybe<Scalars["BigInt"]>;
  lockPeriod_lte?: InputMaybe<Scalars["BigInt"]>;
  lockPeriod_not?: InputMaybe<Scalars["BigInt"]>;
  lockPeriod_not_in?: InputMaybe<Array<Scalars["BigInt"]>>;
  lptPriceEth?: InputMaybe<Scalars["BigDecimal"]>;
  lptPriceEth_gt?: InputMaybe<Scalars["BigDecimal"]>;
  lptPriceEth_gte?: InputMaybe<Scalars["BigDecimal"]>;
  lptPriceEth_in?: InputMaybe<Array<Scalars["BigDecimal"]>>;
  lptPriceEth_lt?: InputMaybe<Scalars["BigDecimal"]>;
  lptPriceEth_lte?: InputMaybe<Scalars["BigDecimal"]>;
  lptPriceEth_not?: InputMaybe<Scalars["BigDecimal"]>;
  lptPriceEth_not_in?: InputMaybe<Array<Scalars["BigDecimal"]>>;
  numActiveTranscoders?: InputMaybe<Scalars["BigInt"]>;
  numActiveTranscoders_gt?: InputMaybe<Scalars["BigInt"]>;
  numActiveTranscoders_gte?: InputMaybe<Scalars["BigInt"]>;
  numActiveTranscoders_in?: InputMaybe<Array<Scalars["BigInt"]>>;
  numActiveTranscoders_lt?: InputMaybe<Scalars["BigInt"]>;
  numActiveTranscoders_lte?: InputMaybe<Scalars["BigInt"]>;
  numActiveTranscoders_not?: InputMaybe<Scalars["BigInt"]>;
  numActiveTranscoders_not_in?: InputMaybe<Array<Scalars["BigInt"]>>;
  or?: InputMaybe<Array<InputMaybe<Protocol_Filter>>>;
  participationRate?: InputMaybe<Scalars["BigDecimal"]>;
  participationRate_gt?: InputMaybe<Scalars["BigDecimal"]>;
  participationRate_gte?: InputMaybe<Scalars["BigDecimal"]>;
  participationRate_in?: InputMaybe<Array<Scalars["BigDecimal"]>>;
  participationRate_lt?: InputMaybe<Scalars["BigDecimal"]>;
  participationRate_lte?: InputMaybe<Scalars["BigDecimal"]>;
  participationRate_not?: InputMaybe<Scalars["BigDecimal"]>;
  participationRate_not_in?: InputMaybe<Array<Scalars["BigDecimal"]>>;
  paused?: InputMaybe<Scalars["Boolean"]>;
  paused_in?: InputMaybe<Array<Scalars["Boolean"]>>;
  paused_not?: InputMaybe<Scalars["Boolean"]>;
  paused_not_in?: InputMaybe<Array<Scalars["Boolean"]>>;
  pendingActivation?: InputMaybe<Array<Scalars["String"]>>;
  pendingActivation_?: InputMaybe<Transcoder_Filter>;
  pendingActivation_contains?: InputMaybe<Array<Scalars["String"]>>;
  pendingActivation_contains_nocase?: InputMaybe<Array<Scalars["String"]>>;
  pendingActivation_not?: InputMaybe<Array<Scalars["String"]>>;
  pendingActivation_not_contains?: InputMaybe<Array<Scalars["String"]>>;
  pendingActivation_not_contains_nocase?: InputMaybe<Array<Scalars["String"]>>;
  pendingDeactivation?: InputMaybe<Array<Scalars["String"]>>;
  pendingDeactivation_?: InputMaybe<Transcoder_Filter>;
  pendingDeactivation_contains?: InputMaybe<Array<Scalars["String"]>>;
  pendingDeactivation_contains_nocase?: InputMaybe<Array<Scalars["String"]>>;
  pendingDeactivation_not?: InputMaybe<Array<Scalars["String"]>>;
  pendingDeactivation_not_contains?: InputMaybe<Array<Scalars["String"]>>;
  pendingDeactivation_not_contains_nocase?: InputMaybe<
    Array<Scalars["String"]>
  >;
  roundCount?: InputMaybe<Scalars["Int"]>;
  roundCount_gt?: InputMaybe<Scalars["Int"]>;
  roundCount_gte?: InputMaybe<Scalars["Int"]>;
  roundCount_in?: InputMaybe<Array<Scalars["Int"]>>;
  roundCount_lt?: InputMaybe<Scalars["Int"]>;
  roundCount_lte?: InputMaybe<Scalars["Int"]>;
  roundCount_not?: InputMaybe<Scalars["Int"]>;
  roundCount_not_in?: InputMaybe<Array<Scalars["Int"]>>;
  roundLength?: InputMaybe<Scalars["BigInt"]>;
  roundLength_gt?: InputMaybe<Scalars["BigInt"]>;
  roundLength_gte?: InputMaybe<Scalars["BigInt"]>;
  roundLength_in?: InputMaybe<Array<Scalars["BigInt"]>>;
  roundLength_lt?: InputMaybe<Scalars["BigInt"]>;
  roundLength_lte?: InputMaybe<Scalars["BigInt"]>;
  roundLength_not?: InputMaybe<Scalars["BigInt"]>;
  roundLength_not_in?: InputMaybe<Array<Scalars["BigInt"]>>;
  roundLockAmount?: InputMaybe<Scalars["BigInt"]>;
  roundLockAmount_gt?: InputMaybe<Scalars["BigInt"]>;
  roundLockAmount_gte?: InputMaybe<Scalars["BigInt"]>;
  roundLockAmount_in?: InputMaybe<Array<Scalars["BigInt"]>>;
  roundLockAmount_lt?: InputMaybe<Scalars["BigInt"]>;
  roundLockAmount_lte?: InputMaybe<Scalars["BigInt"]>;
  roundLockAmount_not?: InputMaybe<Scalars["BigInt"]>;
  roundLockAmount_not_in?: InputMaybe<Array<Scalars["BigInt"]>>;
  targetBondingRate?: InputMaybe<Scalars["BigInt"]>;
  targetBondingRate_gt?: InputMaybe<Scalars["BigInt"]>;
  targetBondingRate_gte?: InputMaybe<Scalars["BigInt"]>;
  targetBondingRate_in?: InputMaybe<Array<Scalars["BigInt"]>>;
  targetBondingRate_lt?: InputMaybe<Scalars["BigInt"]>;
  targetBondingRate_lte?: InputMaybe<Scalars["BigInt"]>;
  targetBondingRate_not?: InputMaybe<Scalars["BigInt"]>;
  targetBondingRate_not_in?: InputMaybe<Array<Scalars["BigInt"]>>;
  totalActiveStake?: InputMaybe<Scalars["BigDecimal"]>;
  totalActiveStake_gt?: InputMaybe<Scalars["BigDecimal"]>;
  totalActiveStake_gte?: InputMaybe<Scalars["BigDecimal"]>;
  totalActiveStake_in?: InputMaybe<Array<Scalars["BigDecimal"]>>;
  totalActiveStake_lt?: InputMaybe<Scalars["BigDecimal"]>;
  totalActiveStake_lte?: InputMaybe<Scalars["BigDecimal"]>;
  totalActiveStake_not?: InputMaybe<Scalars["BigDecimal"]>;
  totalActiveStake_not_in?: InputMaybe<Array<Scalars["BigDecimal"]>>;
  totalSupply?: InputMaybe<Scalars["BigDecimal"]>;
  totalSupply_gt?: InputMaybe<Scalars["BigDecimal"]>;
  totalSupply_gte?: InputMaybe<Scalars["BigDecimal"]>;
  totalSupply_in?: InputMaybe<Array<Scalars["BigDecimal"]>>;
  totalSupply_lt?: InputMaybe<Scalars["BigDecimal"]>;
  totalSupply_lte?: InputMaybe<Scalars["BigDecimal"]>;
  totalSupply_not?: InputMaybe<Scalars["BigDecimal"]>;
  totalSupply_not_in?: InputMaybe<Array<Scalars["BigDecimal"]>>;
  totalVolumeETH?: InputMaybe<Scalars["BigDecimal"]>;
  totalVolumeETH_gt?: InputMaybe<Scalars["BigDecimal"]>;
  totalVolumeETH_gte?: InputMaybe<Scalars["BigDecimal"]>;
  totalVolumeETH_in?: InputMaybe<Array<Scalars["BigDecimal"]>>;
  totalVolumeETH_lt?: InputMaybe<Scalars["BigDecimal"]>;
  totalVolumeETH_lte?: InputMaybe<Scalars["BigDecimal"]>;
  totalVolumeETH_not?: InputMaybe<Scalars["BigDecimal"]>;
  totalVolumeETH_not_in?: InputMaybe<Array<Scalars["BigDecimal"]>>;
  totalVolumeUSD?: InputMaybe<Scalars["BigDecimal"]>;
  totalVolumeUSD_gt?: InputMaybe<Scalars["BigDecimal"]>;
  totalVolumeUSD_gte?: InputMaybe<Scalars["BigDecimal"]>;
  totalVolumeUSD_in?: InputMaybe<Array<Scalars["BigDecimal"]>>;
  totalVolumeUSD_lt?: InputMaybe<Scalars["BigDecimal"]>;
  totalVolumeUSD_lte?: InputMaybe<Scalars["BigDecimal"]>;
  totalVolumeUSD_not?: InputMaybe<Scalars["BigDecimal"]>;
  totalVolumeUSD_not_in?: InputMaybe<Array<Scalars["BigDecimal"]>>;
  unbondingPeriod?: InputMaybe<Scalars["BigInt"]>;
  unbondingPeriod_gt?: InputMaybe<Scalars["BigInt"]>;
  unbondingPeriod_gte?: InputMaybe<Scalars["BigInt"]>;
  unbondingPeriod_in?: InputMaybe<Array<Scalars["BigInt"]>>;
  unbondingPeriod_lt?: InputMaybe<Scalars["BigInt"]>;
  unbondingPeriod_lte?: InputMaybe<Scalars["BigInt"]>;
  unbondingPeriod_not?: InputMaybe<Scalars["BigInt"]>;
  unbondingPeriod_not_in?: InputMaybe<Array<Scalars["BigInt"]>>;
  winningTicketCount?: InputMaybe<Scalars["Int"]>;
  winningTicketCount_gt?: InputMaybe<Scalars["Int"]>;
  winningTicketCount_gte?: InputMaybe<Scalars["Int"]>;
  winningTicketCount_in?: InputMaybe<Array<Scalars["Int"]>>;
  winningTicketCount_lt?: InputMaybe<Scalars["Int"]>;
  winningTicketCount_lte?: InputMaybe<Scalars["Int"]>;
  winningTicketCount_not?: InputMaybe<Scalars["Int"]>;
  winningTicketCount_not_in?: InputMaybe<Array<Scalars["Int"]>>;
};

export enum Protocol_OrderBy {
  ActiveTranscoderCount = "activeTranscoderCount",
  CurrentRound = "currentRound",
  CurrentRoundActiveTranscoderCount = "currentRound__activeTranscoderCount",
  CurrentRoundDelegatorsCount = "currentRound__delegatorsCount",
  CurrentRoundEndBlock = "currentRound__endBlock",
  CurrentRoundId = "currentRound__id",
  CurrentRoundInflation = "currentRound__inflation",
  CurrentRoundInitialized = "currentRound__initialized",
  CurrentRoundLength = "currentRound__length",
  CurrentRoundMintableTokens = "currentRound__mintableTokens",
  CurrentRoundMovedStake = "currentRound__movedStake",
  CurrentRoundNewStake = "currentRound__newStake",
  CurrentRoundNumActiveTranscoders = "currentRound__numActiveTranscoders",
  CurrentRoundParticipationRate = "currentRound__participationRate",
  CurrentRoundStartBlock = "currentRound__startBlock",
  CurrentRoundStartTimestamp = "currentRound__startTimestamp",
  CurrentRoundTotalActiveStake = "currentRound__totalActiveStake",
  CurrentRoundTotalSupply = "currentRound__totalSupply",
  CurrentRoundVolumeEth = "currentRound__volumeETH",
  CurrentRoundVolumeUsd = "currentRound__volumeUSD",
  DelegatorsCount = "delegatorsCount",
  Id = "id",
  Inflation = "inflation",
  InflationChange = "inflationChange",
  LastInitializedRound = "lastInitializedRound",
  LastInitializedRoundActiveTranscoderCount = "lastInitializedRound__activeTranscoderCount",
  LastInitializedRoundDelegatorsCount = "lastInitializedRound__delegatorsCount",
  LastInitializedRoundEndBlock = "lastInitializedRound__endBlock",
  LastInitializedRoundId = "lastInitializedRound__id",
  LastInitializedRoundInflation = "lastInitializedRound__inflation",
  LastInitializedRoundInitialized = "lastInitializedRound__initialized",
  LastInitializedRoundLength = "lastInitializedRound__length",
  LastInitializedRoundMintableTokens = "lastInitializedRound__mintableTokens",
  LastInitializedRoundMovedStake = "lastInitializedRound__movedStake",
  LastInitializedRoundNewStake = "lastInitializedRound__newStake",
  LastInitializedRoundNumActiveTranscoders = "lastInitializedRound__numActiveTranscoders",
  LastInitializedRoundParticipationRate = "lastInitializedRound__participationRate",
  LastInitializedRoundStartBlock = "lastInitializedRound__startBlock",
  LastInitializedRoundStartTimestamp = "lastInitializedRound__startTimestamp",
  LastInitializedRoundTotalActiveStake = "lastInitializedRound__totalActiveStake",
  LastInitializedRoundTotalSupply = "lastInitializedRound__totalSupply",
  LastInitializedRoundVolumeEth = "lastInitializedRound__volumeETH",
  LastInitializedRoundVolumeUsd = "lastInitializedRound__volumeUSD",
  LastRoundLengthUpdateRound = "lastRoundLengthUpdateRound",
  LastRoundLengthUpdateRoundActiveTranscoderCount = "lastRoundLengthUpdateRound__activeTranscoderCount",
  LastRoundLengthUpdateRoundDelegatorsCount = "lastRoundLengthUpdateRound__delegatorsCount",
  LastRoundLengthUpdateRoundEndBlock = "lastRoundLengthUpdateRound__endBlock",
  LastRoundLengthUpdateRoundId = "lastRoundLengthUpdateRound__id",
  LastRoundLengthUpdateRoundInflation = "lastRoundLengthUpdateRound__inflation",
  LastRoundLengthUpdateRoundInitialized = "lastRoundLengthUpdateRound__initialized",
  LastRoundLengthUpdateRoundLength = "lastRoundLengthUpdateRound__length",
  LastRoundLengthUpdateRoundMintableTokens = "lastRoundLengthUpdateRound__mintableTokens",
  LastRoundLengthUpdateRoundMovedStake = "lastRoundLengthUpdateRound__movedStake",
  LastRoundLengthUpdateRoundNewStake = "lastRoundLengthUpdateRound__newStake",
  LastRoundLengthUpdateRoundNumActiveTranscoders = "lastRoundLengthUpdateRound__numActiveTranscoders",
  LastRoundLengthUpdateRoundParticipationRate = "lastRoundLengthUpdateRound__participationRate",
  LastRoundLengthUpdateRoundStartBlock = "lastRoundLengthUpdateRound__startBlock",
  LastRoundLengthUpdateRoundStartTimestamp = "lastRoundLengthUpdateRound__startTimestamp",
  LastRoundLengthUpdateRoundTotalActiveStake = "lastRoundLengthUpdateRound__totalActiveStake",
  LastRoundLengthUpdateRoundTotalSupply = "lastRoundLengthUpdateRound__totalSupply",
  LastRoundLengthUpdateRoundVolumeEth = "lastRoundLengthUpdateRound__volumeETH",
  LastRoundLengthUpdateRoundVolumeUsd = "lastRoundLengthUpdateRound__volumeUSD",
  LastRoundLengthUpdateStartBlock = "lastRoundLengthUpdateStartBlock",
  LockPeriod = "lockPeriod",
  LptPriceEth = "lptPriceEth",
  NumActiveTranscoders = "numActiveTranscoders",
  ParticipationRate = "participationRate",
  Paused = "paused",
  PendingActivation = "pendingActivation",
  PendingDeactivation = "pendingDeactivation",
  RoundCount = "roundCount",
  RoundLength = "roundLength",
  RoundLockAmount = "roundLockAmount",
  TargetBondingRate = "targetBondingRate",
  TotalActiveStake = "totalActiveStake",
  TotalSupply = "totalSupply",
  TotalVolumeEth = "totalVolumeETH",
  TotalVolumeUsd = "totalVolumeUSD",
  UnbondingPeriod = "unbondingPeriod",
  WinningTicketCount = "winningTicketCount",
}

export type Query = {
  __typename: "Query";
  /** Access to subgraph metadata */
  _meta?: Maybe<_Meta_>;
  bondEvent?: Maybe<BondEvent>;
  bondEvents: Array<BondEvent>;
  broadcaster?: Maybe<Broadcaster>;
  broadcasters: Array<Broadcaster>;
  burnEvent?: Maybe<BurnEvent>;
  burnEvents: Array<BurnEvent>;
  day?: Maybe<Day>;
  days: Array<Day>;
  delegator?: Maybe<Delegator>;
  delegators: Array<Delegator>;
  depositFundedEvent?: Maybe<DepositFundedEvent>;
  depositFundedEvents: Array<DepositFundedEvent>;
  earningsClaimedEvent?: Maybe<EarningsClaimedEvent>;
  earningsClaimedEvents: Array<EarningsClaimedEvent>;
  event?: Maybe<Event>;
  events: Array<Event>;
  livepeerAccount?: Maybe<LivepeerAccount>;
  livepeerAccounts: Array<LivepeerAccount>;
  migrateDelegatorFinalizedEvent?: Maybe<MigrateDelegatorFinalizedEvent>;
  migrateDelegatorFinalizedEvents: Array<MigrateDelegatorFinalizedEvent>;
  mintEvent?: Maybe<MintEvent>;
  mintEvents: Array<MintEvent>;
  newRoundEvent?: Maybe<NewRoundEvent>;
  newRoundEvents: Array<NewRoundEvent>;
  parameterUpdateEvent?: Maybe<ParameterUpdateEvent>;
  parameterUpdateEvents: Array<ParameterUpdateEvent>;
  pauseEvent?: Maybe<PauseEvent>;
  pauseEvents: Array<PauseEvent>;
  poll?: Maybe<Poll>;
  pollCreatedEvent?: Maybe<PollCreatedEvent>;
  pollCreatedEvents: Array<PollCreatedEvent>;
  pollTallies: Array<PollTally>;
  pollTally?: Maybe<PollTally>;
  polls: Array<Poll>;
  pool?: Maybe<Pool>;
  pools: Array<Pool>;
  protocol?: Maybe<Protocol>;
  protocols: Array<Protocol>;
  rebondEvent?: Maybe<RebondEvent>;
  rebondEvents: Array<RebondEvent>;
  reserveClaimedEvent?: Maybe<ReserveClaimedEvent>;
  reserveClaimedEvents: Array<ReserveClaimedEvent>;
  reserveFundedEvent?: Maybe<ReserveFundedEvent>;
  reserveFundedEvents: Array<ReserveFundedEvent>;
  rewardEvent?: Maybe<RewardEvent>;
  rewardEvents: Array<RewardEvent>;
  round?: Maybe<Round>;
  rounds: Array<Round>;
  serviceURIUpdateEvent?: Maybe<ServiceUriUpdateEvent>;
  serviceURIUpdateEvents: Array<ServiceUriUpdateEvent>;
  setCurrentRewardTokensEvent?: Maybe<SetCurrentRewardTokensEvent>;
  setCurrentRewardTokensEvents: Array<SetCurrentRewardTokensEvent>;
  stakeClaimedEvent?: Maybe<StakeClaimedEvent>;
  stakeClaimedEvents: Array<StakeClaimedEvent>;
  transaction?: Maybe<Transaction>;
  transactions: Array<Transaction>;
  transcoder?: Maybe<Transcoder>;
  transcoderActivatedEvent?: Maybe<TranscoderActivatedEvent>;
  transcoderActivatedEvents: Array<TranscoderActivatedEvent>;
  transcoderDay?: Maybe<TranscoderDay>;
  transcoderDays: Array<TranscoderDay>;
  transcoderDeactivatedEvent?: Maybe<TranscoderDeactivatedEvent>;
  transcoderDeactivatedEvents: Array<TranscoderDeactivatedEvent>;
  transcoderEvictedEvent?: Maybe<TranscoderEvictedEvent>;
  transcoderEvictedEvents: Array<TranscoderEvictedEvent>;
  transcoderResignedEvent?: Maybe<TranscoderResignedEvent>;
  transcoderResignedEvents: Array<TranscoderResignedEvent>;
  transcoderSlashedEvent?: Maybe<TranscoderSlashedEvent>;
  transcoderSlashedEvents: Array<TranscoderSlashedEvent>;
  transcoderUpdateEvent?: Maybe<TranscoderUpdateEvent>;
  transcoderUpdateEvents: Array<TranscoderUpdateEvent>;
  transcoders: Array<Transcoder>;
  transferBondEvent?: Maybe<TransferBondEvent>;
  transferBondEvents: Array<TransferBondEvent>;
  treasuryProposal?: Maybe<TreasuryProposal>;
  treasuryProposals: Array<TreasuryProposal>;
  unbondEvent?: Maybe<UnbondEvent>;
  unbondEvents: Array<UnbondEvent>;
  unbondingLock?: Maybe<UnbondingLock>;
  unbondingLocks: Array<UnbondingLock>;
  unpauseEvent?: Maybe<UnpauseEvent>;
  unpauseEvents: Array<UnpauseEvent>;
  vote?: Maybe<Vote>;
  voteEvent?: Maybe<VoteEvent>;
  voteEvents: Array<VoteEvent>;
  votes: Array<Vote>;
  winningTicketRedeemedEvent?: Maybe<WinningTicketRedeemedEvent>;
  winningTicketRedeemedEvents: Array<WinningTicketRedeemedEvent>;
  withdrawFeesEvent?: Maybe<WithdrawFeesEvent>;
  withdrawFeesEvents: Array<WithdrawFeesEvent>;
  withdrawStakeEvent?: Maybe<WithdrawStakeEvent>;
  withdrawStakeEvents: Array<WithdrawStakeEvent>;
  withdrawalEvent?: Maybe<WithdrawalEvent>;
  withdrawalEvents: Array<WithdrawalEvent>;
};

export type Query_MetaArgs = {
  block?: InputMaybe<Block_Height>;
};

export type QueryBondEventArgs = {
  block?: InputMaybe<Block_Height>;
  id: Scalars["ID"];
  subgraphError?: _SubgraphErrorPolicy_;
};

export type QueryBondEventsArgs = {
  block?: InputMaybe<Block_Height>;
  first?: InputMaybe<Scalars["Int"]>;
  orderBy?: InputMaybe<BondEvent_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars["Int"]>;
  subgraphError?: _SubgraphErrorPolicy_;
  where?: InputMaybe<BondEvent_Filter>;
};

export type QueryBroadcasterArgs = {
  block?: InputMaybe<Block_Height>;
  id: Scalars["ID"];
  subgraphError?: _SubgraphErrorPolicy_;
};

export type QueryBroadcastersArgs = {
  block?: InputMaybe<Block_Height>;
  first?: InputMaybe<Scalars["Int"]>;
  orderBy?: InputMaybe<Broadcaster_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars["Int"]>;
  subgraphError?: _SubgraphErrorPolicy_;
  where?: InputMaybe<Broadcaster_Filter>;
};

export type QueryBurnEventArgs = {
  block?: InputMaybe<Block_Height>;
  id: Scalars["ID"];
  subgraphError?: _SubgraphErrorPolicy_;
};

export type QueryBurnEventsArgs = {
  block?: InputMaybe<Block_Height>;
  first?: InputMaybe<Scalars["Int"]>;
  orderBy?: InputMaybe<BurnEvent_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars["Int"]>;
  subgraphError?: _SubgraphErrorPolicy_;
  where?: InputMaybe<BurnEvent_Filter>;
};

export type QueryDayArgs = {
  block?: InputMaybe<Block_Height>;
  id: Scalars["ID"];
  subgraphError?: _SubgraphErrorPolicy_;
};

export type QueryDaysArgs = {
  block?: InputMaybe<Block_Height>;
  first?: InputMaybe<Scalars["Int"]>;
  orderBy?: InputMaybe<Day_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars["Int"]>;
  subgraphError?: _SubgraphErrorPolicy_;
  where?: InputMaybe<Day_Filter>;
};

export type QueryDelegatorArgs = {
  block?: InputMaybe<Block_Height>;
  id: Scalars["ID"];
  subgraphError?: _SubgraphErrorPolicy_;
};

export type QueryDelegatorsArgs = {
  block?: InputMaybe<Block_Height>;
  first?: InputMaybe<Scalars["Int"]>;
  orderBy?: InputMaybe<Delegator_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars["Int"]>;
  subgraphError?: _SubgraphErrorPolicy_;
  where?: InputMaybe<Delegator_Filter>;
};

export type QueryDepositFundedEventArgs = {
  block?: InputMaybe<Block_Height>;
  id: Scalars["ID"];
  subgraphError?: _SubgraphErrorPolicy_;
};

export type QueryDepositFundedEventsArgs = {
  block?: InputMaybe<Block_Height>;
  first?: InputMaybe<Scalars["Int"]>;
  orderBy?: InputMaybe<DepositFundedEvent_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars["Int"]>;
  subgraphError?: _SubgraphErrorPolicy_;
  where?: InputMaybe<DepositFundedEvent_Filter>;
};

export type QueryEarningsClaimedEventArgs = {
  block?: InputMaybe<Block_Height>;
  id: Scalars["ID"];
  subgraphError?: _SubgraphErrorPolicy_;
};

export type QueryEarningsClaimedEventsArgs = {
  block?: InputMaybe<Block_Height>;
  first?: InputMaybe<Scalars["Int"]>;
  orderBy?: InputMaybe<EarningsClaimedEvent_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars["Int"]>;
  subgraphError?: _SubgraphErrorPolicy_;
  where?: InputMaybe<EarningsClaimedEvent_Filter>;
};

export type QueryEventArgs = {
  block?: InputMaybe<Block_Height>;
  id: Scalars["ID"];
  subgraphError?: _SubgraphErrorPolicy_;
};

export type QueryEventsArgs = {
  block?: InputMaybe<Block_Height>;
  first?: InputMaybe<Scalars["Int"]>;
  orderBy?: InputMaybe<Event_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars["Int"]>;
  subgraphError?: _SubgraphErrorPolicy_;
  where?: InputMaybe<Event_Filter>;
};

export type QueryLivepeerAccountArgs = {
  block?: InputMaybe<Block_Height>;
  id: Scalars["ID"];
  subgraphError?: _SubgraphErrorPolicy_;
};

export type QueryLivepeerAccountsArgs = {
  block?: InputMaybe<Block_Height>;
  first?: InputMaybe<Scalars["Int"]>;
  orderBy?: InputMaybe<LivepeerAccount_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars["Int"]>;
  subgraphError?: _SubgraphErrorPolicy_;
  where?: InputMaybe<LivepeerAccount_Filter>;
};

export type QueryMigrateDelegatorFinalizedEventArgs = {
  block?: InputMaybe<Block_Height>;
  id: Scalars["ID"];
  subgraphError?: _SubgraphErrorPolicy_;
};

export type QueryMigrateDelegatorFinalizedEventsArgs = {
  block?: InputMaybe<Block_Height>;
  first?: InputMaybe<Scalars["Int"]>;
  orderBy?: InputMaybe<MigrateDelegatorFinalizedEvent_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars["Int"]>;
  subgraphError?: _SubgraphErrorPolicy_;
  where?: InputMaybe<MigrateDelegatorFinalizedEvent_Filter>;
};

export type QueryMintEventArgs = {
  block?: InputMaybe<Block_Height>;
  id: Scalars["ID"];
  subgraphError?: _SubgraphErrorPolicy_;
};

export type QueryMintEventsArgs = {
  block?: InputMaybe<Block_Height>;
  first?: InputMaybe<Scalars["Int"]>;
  orderBy?: InputMaybe<MintEvent_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars["Int"]>;
  subgraphError?: _SubgraphErrorPolicy_;
  where?: InputMaybe<MintEvent_Filter>;
};

export type QueryNewRoundEventArgs = {
  block?: InputMaybe<Block_Height>;
  id: Scalars["ID"];
  subgraphError?: _SubgraphErrorPolicy_;
};

export type QueryNewRoundEventsArgs = {
  block?: InputMaybe<Block_Height>;
  first?: InputMaybe<Scalars["Int"]>;
  orderBy?: InputMaybe<NewRoundEvent_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars["Int"]>;
  subgraphError?: _SubgraphErrorPolicy_;
  where?: InputMaybe<NewRoundEvent_Filter>;
};

export type QueryParameterUpdateEventArgs = {
  block?: InputMaybe<Block_Height>;
  id: Scalars["ID"];
  subgraphError?: _SubgraphErrorPolicy_;
};

export type QueryParameterUpdateEventsArgs = {
  block?: InputMaybe<Block_Height>;
  first?: InputMaybe<Scalars["Int"]>;
  orderBy?: InputMaybe<ParameterUpdateEvent_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars["Int"]>;
  subgraphError?: _SubgraphErrorPolicy_;
  where?: InputMaybe<ParameterUpdateEvent_Filter>;
};

export type QueryPauseEventArgs = {
  block?: InputMaybe<Block_Height>;
  id: Scalars["ID"];
  subgraphError?: _SubgraphErrorPolicy_;
};

export type QueryPauseEventsArgs = {
  block?: InputMaybe<Block_Height>;
  first?: InputMaybe<Scalars["Int"]>;
  orderBy?: InputMaybe<PauseEvent_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars["Int"]>;
  subgraphError?: _SubgraphErrorPolicy_;
  where?: InputMaybe<PauseEvent_Filter>;
};

export type QueryPollArgs = {
  block?: InputMaybe<Block_Height>;
  id: Scalars["ID"];
  subgraphError?: _SubgraphErrorPolicy_;
};

export type QueryPollCreatedEventArgs = {
  block?: InputMaybe<Block_Height>;
  id: Scalars["ID"];
  subgraphError?: _SubgraphErrorPolicy_;
};

export type QueryPollCreatedEventsArgs = {
  block?: InputMaybe<Block_Height>;
  first?: InputMaybe<Scalars["Int"]>;
  orderBy?: InputMaybe<PollCreatedEvent_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars["Int"]>;
  subgraphError?: _SubgraphErrorPolicy_;
  where?: InputMaybe<PollCreatedEvent_Filter>;
};

export type QueryPollTalliesArgs = {
  block?: InputMaybe<Block_Height>;
  first?: InputMaybe<Scalars["Int"]>;
  orderBy?: InputMaybe<PollTally_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars["Int"]>;
  subgraphError?: _SubgraphErrorPolicy_;
  where?: InputMaybe<PollTally_Filter>;
};

export type QueryPollTallyArgs = {
  block?: InputMaybe<Block_Height>;
  id: Scalars["ID"];
  subgraphError?: _SubgraphErrorPolicy_;
};

export type QueryPollsArgs = {
  block?: InputMaybe<Block_Height>;
  first?: InputMaybe<Scalars["Int"]>;
  orderBy?: InputMaybe<Poll_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars["Int"]>;
  subgraphError?: _SubgraphErrorPolicy_;
  where?: InputMaybe<Poll_Filter>;
};

export type QueryPoolArgs = {
  block?: InputMaybe<Block_Height>;
  id: Scalars["ID"];
  subgraphError?: _SubgraphErrorPolicy_;
};

export type QueryPoolsArgs = {
  block?: InputMaybe<Block_Height>;
  first?: InputMaybe<Scalars["Int"]>;
  orderBy?: InputMaybe<Pool_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars["Int"]>;
  subgraphError?: _SubgraphErrorPolicy_;
  where?: InputMaybe<Pool_Filter>;
};

export type QueryProtocolArgs = {
  block?: InputMaybe<Block_Height>;
  id: Scalars["ID"];
  subgraphError?: _SubgraphErrorPolicy_;
};

export type QueryProtocolsArgs = {
  block?: InputMaybe<Block_Height>;
  first?: InputMaybe<Scalars["Int"]>;
  orderBy?: InputMaybe<Protocol_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars["Int"]>;
  subgraphError?: _SubgraphErrorPolicy_;
  where?: InputMaybe<Protocol_Filter>;
};

export type QueryRebondEventArgs = {
  block?: InputMaybe<Block_Height>;
  id: Scalars["ID"];
  subgraphError?: _SubgraphErrorPolicy_;
};

export type QueryRebondEventsArgs = {
  block?: InputMaybe<Block_Height>;
  first?: InputMaybe<Scalars["Int"]>;
  orderBy?: InputMaybe<RebondEvent_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars["Int"]>;
  subgraphError?: _SubgraphErrorPolicy_;
  where?: InputMaybe<RebondEvent_Filter>;
};

export type QueryReserveClaimedEventArgs = {
  block?: InputMaybe<Block_Height>;
  id: Scalars["ID"];
  subgraphError?: _SubgraphErrorPolicy_;
};

export type QueryReserveClaimedEventsArgs = {
  block?: InputMaybe<Block_Height>;
  first?: InputMaybe<Scalars["Int"]>;
  orderBy?: InputMaybe<ReserveClaimedEvent_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars["Int"]>;
  subgraphError?: _SubgraphErrorPolicy_;
  where?: InputMaybe<ReserveClaimedEvent_Filter>;
};

export type QueryReserveFundedEventArgs = {
  block?: InputMaybe<Block_Height>;
  id: Scalars["ID"];
  subgraphError?: _SubgraphErrorPolicy_;
};

export type QueryReserveFundedEventsArgs = {
  block?: InputMaybe<Block_Height>;
  first?: InputMaybe<Scalars["Int"]>;
  orderBy?: InputMaybe<ReserveFundedEvent_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars["Int"]>;
  subgraphError?: _SubgraphErrorPolicy_;
  where?: InputMaybe<ReserveFundedEvent_Filter>;
};

export type QueryRewardEventArgs = {
  block?: InputMaybe<Block_Height>;
  id: Scalars["ID"];
  subgraphError?: _SubgraphErrorPolicy_;
};

export type QueryRewardEventsArgs = {
  block?: InputMaybe<Block_Height>;
  first?: InputMaybe<Scalars["Int"]>;
  orderBy?: InputMaybe<RewardEvent_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars["Int"]>;
  subgraphError?: _SubgraphErrorPolicy_;
  where?: InputMaybe<RewardEvent_Filter>;
};

export type QueryRoundArgs = {
  block?: InputMaybe<Block_Height>;
  id: Scalars["ID"];
  subgraphError?: _SubgraphErrorPolicy_;
};

export type QueryRoundsArgs = {
  block?: InputMaybe<Block_Height>;
  first?: InputMaybe<Scalars["Int"]>;
  orderBy?: InputMaybe<Round_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars["Int"]>;
  subgraphError?: _SubgraphErrorPolicy_;
  where?: InputMaybe<Round_Filter>;
};

export type QueryServiceUriUpdateEventArgs = {
  block?: InputMaybe<Block_Height>;
  id: Scalars["ID"];
  subgraphError?: _SubgraphErrorPolicy_;
};

export type QueryServiceUriUpdateEventsArgs = {
  block?: InputMaybe<Block_Height>;
  first?: InputMaybe<Scalars["Int"]>;
  orderBy?: InputMaybe<ServiceUriUpdateEvent_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars["Int"]>;
  subgraphError?: _SubgraphErrorPolicy_;
  where?: InputMaybe<ServiceUriUpdateEvent_Filter>;
};

export type QuerySetCurrentRewardTokensEventArgs = {
  block?: InputMaybe<Block_Height>;
  id: Scalars["ID"];
  subgraphError?: _SubgraphErrorPolicy_;
};

export type QuerySetCurrentRewardTokensEventsArgs = {
  block?: InputMaybe<Block_Height>;
  first?: InputMaybe<Scalars["Int"]>;
  orderBy?: InputMaybe<SetCurrentRewardTokensEvent_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars["Int"]>;
  subgraphError?: _SubgraphErrorPolicy_;
  where?: InputMaybe<SetCurrentRewardTokensEvent_Filter>;
};

export type QueryStakeClaimedEventArgs = {
  block?: InputMaybe<Block_Height>;
  id: Scalars["ID"];
  subgraphError?: _SubgraphErrorPolicy_;
};

export type QueryStakeClaimedEventsArgs = {
  block?: InputMaybe<Block_Height>;
  first?: InputMaybe<Scalars["Int"]>;
  orderBy?: InputMaybe<StakeClaimedEvent_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars["Int"]>;
  subgraphError?: _SubgraphErrorPolicy_;
  where?: InputMaybe<StakeClaimedEvent_Filter>;
};

export type QueryTransactionArgs = {
  block?: InputMaybe<Block_Height>;
  id: Scalars["ID"];
  subgraphError?: _SubgraphErrorPolicy_;
};

export type QueryTransactionsArgs = {
  block?: InputMaybe<Block_Height>;
  first?: InputMaybe<Scalars["Int"]>;
  orderBy?: InputMaybe<Transaction_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars["Int"]>;
  subgraphError?: _SubgraphErrorPolicy_;
  where?: InputMaybe<Transaction_Filter>;
};

export type QueryTranscoderArgs = {
  block?: InputMaybe<Block_Height>;
  id: Scalars["ID"];
  subgraphError?: _SubgraphErrorPolicy_;
};

export type QueryTranscoderActivatedEventArgs = {
  block?: InputMaybe<Block_Height>;
  id: Scalars["ID"];
  subgraphError?: _SubgraphErrorPolicy_;
};

export type QueryTranscoderActivatedEventsArgs = {
  block?: InputMaybe<Block_Height>;
  first?: InputMaybe<Scalars["Int"]>;
  orderBy?: InputMaybe<TranscoderActivatedEvent_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars["Int"]>;
  subgraphError?: _SubgraphErrorPolicy_;
  where?: InputMaybe<TranscoderActivatedEvent_Filter>;
};

export type QueryTranscoderDayArgs = {
  block?: InputMaybe<Block_Height>;
  id: Scalars["ID"];
  subgraphError?: _SubgraphErrorPolicy_;
};

export type QueryTranscoderDaysArgs = {
  block?: InputMaybe<Block_Height>;
  first?: InputMaybe<Scalars["Int"]>;
  orderBy?: InputMaybe<TranscoderDay_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars["Int"]>;
  subgraphError?: _SubgraphErrorPolicy_;
  where?: InputMaybe<TranscoderDay_Filter>;
};

export type QueryTranscoderDeactivatedEventArgs = {
  block?: InputMaybe<Block_Height>;
  id: Scalars["ID"];
  subgraphError?: _SubgraphErrorPolicy_;
};

export type QueryTranscoderDeactivatedEventsArgs = {
  block?: InputMaybe<Block_Height>;
  first?: InputMaybe<Scalars["Int"]>;
  orderBy?: InputMaybe<TranscoderDeactivatedEvent_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars["Int"]>;
  subgraphError?: _SubgraphErrorPolicy_;
  where?: InputMaybe<TranscoderDeactivatedEvent_Filter>;
};

export type QueryTranscoderEvictedEventArgs = {
  block?: InputMaybe<Block_Height>;
  id: Scalars["ID"];
  subgraphError?: _SubgraphErrorPolicy_;
};

export type QueryTranscoderEvictedEventsArgs = {
  block?: InputMaybe<Block_Height>;
  first?: InputMaybe<Scalars["Int"]>;
  orderBy?: InputMaybe<TranscoderEvictedEvent_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars["Int"]>;
  subgraphError?: _SubgraphErrorPolicy_;
  where?: InputMaybe<TranscoderEvictedEvent_Filter>;
};

export type QueryTranscoderResignedEventArgs = {
  block?: InputMaybe<Block_Height>;
  id: Scalars["ID"];
  subgraphError?: _SubgraphErrorPolicy_;
};

export type QueryTranscoderResignedEventsArgs = {
  block?: InputMaybe<Block_Height>;
  first?: InputMaybe<Scalars["Int"]>;
  orderBy?: InputMaybe<TranscoderResignedEvent_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars["Int"]>;
  subgraphError?: _SubgraphErrorPolicy_;
  where?: InputMaybe<TranscoderResignedEvent_Filter>;
};

export type QueryTranscoderSlashedEventArgs = {
  block?: InputMaybe<Block_Height>;
  id: Scalars["ID"];
  subgraphError?: _SubgraphErrorPolicy_;
};

export type QueryTranscoderSlashedEventsArgs = {
  block?: InputMaybe<Block_Height>;
  first?: InputMaybe<Scalars["Int"]>;
  orderBy?: InputMaybe<TranscoderSlashedEvent_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars["Int"]>;
  subgraphError?: _SubgraphErrorPolicy_;
  where?: InputMaybe<TranscoderSlashedEvent_Filter>;
};

export type QueryTranscoderUpdateEventArgs = {
  block?: InputMaybe<Block_Height>;
  id: Scalars["ID"];
  subgraphError?: _SubgraphErrorPolicy_;
};

export type QueryTranscoderUpdateEventsArgs = {
  block?: InputMaybe<Block_Height>;
  first?: InputMaybe<Scalars["Int"]>;
  orderBy?: InputMaybe<TranscoderUpdateEvent_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars["Int"]>;
  subgraphError?: _SubgraphErrorPolicy_;
  where?: InputMaybe<TranscoderUpdateEvent_Filter>;
};

export type QueryTranscodersArgs = {
  block?: InputMaybe<Block_Height>;
  first?: InputMaybe<Scalars["Int"]>;
  orderBy?: InputMaybe<Transcoder_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars["Int"]>;
  subgraphError?: _SubgraphErrorPolicy_;
  where?: InputMaybe<Transcoder_Filter>;
};

export type QueryTransferBondEventArgs = {
  block?: InputMaybe<Block_Height>;
  id: Scalars["ID"];
  subgraphError?: _SubgraphErrorPolicy_;
};

export type QueryTransferBondEventsArgs = {
  block?: InputMaybe<Block_Height>;
  first?: InputMaybe<Scalars["Int"]>;
  orderBy?: InputMaybe<TransferBondEvent_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars["Int"]>;
  subgraphError?: _SubgraphErrorPolicy_;
  where?: InputMaybe<TransferBondEvent_Filter>;
};

export type QueryTreasuryProposalArgs = {
  block?: InputMaybe<Block_Height>;
  id: Scalars["ID"];
  subgraphError?: _SubgraphErrorPolicy_;
};

export type QueryTreasuryProposalsArgs = {
  block?: InputMaybe<Block_Height>;
  first?: InputMaybe<Scalars["Int"]>;
  orderBy?: InputMaybe<TreasuryProposal_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars["Int"]>;
  subgraphError?: _SubgraphErrorPolicy_;
  where?: InputMaybe<TreasuryProposal_Filter>;
};

export type QueryUnbondEventArgs = {
  block?: InputMaybe<Block_Height>;
  id: Scalars["ID"];
  subgraphError?: _SubgraphErrorPolicy_;
};

export type QueryUnbondEventsArgs = {
  block?: InputMaybe<Block_Height>;
  first?: InputMaybe<Scalars["Int"]>;
  orderBy?: InputMaybe<UnbondEvent_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars["Int"]>;
  subgraphError?: _SubgraphErrorPolicy_;
  where?: InputMaybe<UnbondEvent_Filter>;
};

export type QueryUnbondingLockArgs = {
  block?: InputMaybe<Block_Height>;
  id: Scalars["ID"];
  subgraphError?: _SubgraphErrorPolicy_;
};

export type QueryUnbondingLocksArgs = {
  block?: InputMaybe<Block_Height>;
  first?: InputMaybe<Scalars["Int"]>;
  orderBy?: InputMaybe<UnbondingLock_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars["Int"]>;
  subgraphError?: _SubgraphErrorPolicy_;
  where?: InputMaybe<UnbondingLock_Filter>;
};

export type QueryUnpauseEventArgs = {
  block?: InputMaybe<Block_Height>;
  id: Scalars["ID"];
  subgraphError?: _SubgraphErrorPolicy_;
};

export type QueryUnpauseEventsArgs = {
  block?: InputMaybe<Block_Height>;
  first?: InputMaybe<Scalars["Int"]>;
  orderBy?: InputMaybe<UnpauseEvent_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars["Int"]>;
  subgraphError?: _SubgraphErrorPolicy_;
  where?: InputMaybe<UnpauseEvent_Filter>;
};

export type QueryVoteArgs = {
  block?: InputMaybe<Block_Height>;
  id: Scalars["ID"];
  subgraphError?: _SubgraphErrorPolicy_;
};

export type QueryVoteEventArgs = {
  block?: InputMaybe<Block_Height>;
  id: Scalars["ID"];
  subgraphError?: _SubgraphErrorPolicy_;
};

export type QueryVoteEventsArgs = {
  block?: InputMaybe<Block_Height>;
  first?: InputMaybe<Scalars["Int"]>;
  orderBy?: InputMaybe<VoteEvent_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars["Int"]>;
  subgraphError?: _SubgraphErrorPolicy_;
  where?: InputMaybe<VoteEvent_Filter>;
};

export type QueryVotesArgs = {
  block?: InputMaybe<Block_Height>;
  first?: InputMaybe<Scalars["Int"]>;
  orderBy?: InputMaybe<Vote_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars["Int"]>;
  subgraphError?: _SubgraphErrorPolicy_;
  where?: InputMaybe<Vote_Filter>;
};

export type QueryWinningTicketRedeemedEventArgs = {
  block?: InputMaybe<Block_Height>;
  id: Scalars["ID"];
  subgraphError?: _SubgraphErrorPolicy_;
};

export type QueryWinningTicketRedeemedEventsArgs = {
  block?: InputMaybe<Block_Height>;
  first?: InputMaybe<Scalars["Int"]>;
  orderBy?: InputMaybe<WinningTicketRedeemedEvent_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars["Int"]>;
  subgraphError?: _SubgraphErrorPolicy_;
  where?: InputMaybe<WinningTicketRedeemedEvent_Filter>;
};

export type QueryWithdrawFeesEventArgs = {
  block?: InputMaybe<Block_Height>;
  id: Scalars["ID"];
  subgraphError?: _SubgraphErrorPolicy_;
};

export type QueryWithdrawFeesEventsArgs = {
  block?: InputMaybe<Block_Height>;
  first?: InputMaybe<Scalars["Int"]>;
  orderBy?: InputMaybe<WithdrawFeesEvent_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars["Int"]>;
  subgraphError?: _SubgraphErrorPolicy_;
  where?: InputMaybe<WithdrawFeesEvent_Filter>;
};

export type QueryWithdrawStakeEventArgs = {
  block?: InputMaybe<Block_Height>;
  id: Scalars["ID"];
  subgraphError?: _SubgraphErrorPolicy_;
};

export type QueryWithdrawStakeEventsArgs = {
  block?: InputMaybe<Block_Height>;
  first?: InputMaybe<Scalars["Int"]>;
  orderBy?: InputMaybe<WithdrawStakeEvent_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars["Int"]>;
  subgraphError?: _SubgraphErrorPolicy_;
  where?: InputMaybe<WithdrawStakeEvent_Filter>;
};

export type QueryWithdrawalEventArgs = {
  block?: InputMaybe<Block_Height>;
  id: Scalars["ID"];
  subgraphError?: _SubgraphErrorPolicy_;
};

export type QueryWithdrawalEventsArgs = {
  block?: InputMaybe<Block_Height>;
  first?: InputMaybe<Scalars["Int"]>;
  orderBy?: InputMaybe<WithdrawalEvent_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars["Int"]>;
  subgraphError?: _SubgraphErrorPolicy_;
  where?: InputMaybe<WithdrawalEvent_Filter>;
};

/**
 * RebondEvent entities are created for every emitted Rebond event.
 *
 */
export type RebondEvent = Event & {
  __typename: "RebondEvent";
  amount: Scalars["BigDecimal"];
  delegate: Transcoder;
  /** Reference to the delegator that rebonded */
  delegator: Delegator;
  /** Ethereum transaction hash + event log index */
  id: Scalars["ID"];
  /** Reference to the round the event occured in */
  round: Round;
  /** Timestamp of the transaction the event was included in */
  timestamp: Scalars["Int"];
  /** Reference to the transaction the event was included in */
  transaction: Transaction;
  unbondingLockId: Scalars["Int"];
};

export type RebondEvent_Filter = {
  /** Filter for the block changed event. */
  _change_block?: InputMaybe<BlockChangedFilter>;
  amount?: InputMaybe<Scalars["BigDecimal"]>;
  amount_gt?: InputMaybe<Scalars["BigDecimal"]>;
  amount_gte?: InputMaybe<Scalars["BigDecimal"]>;
  amount_in?: InputMaybe<Array<Scalars["BigDecimal"]>>;
  amount_lt?: InputMaybe<Scalars["BigDecimal"]>;
  amount_lte?: InputMaybe<Scalars["BigDecimal"]>;
  amount_not?: InputMaybe<Scalars["BigDecimal"]>;
  amount_not_in?: InputMaybe<Array<Scalars["BigDecimal"]>>;
  and?: InputMaybe<Array<InputMaybe<RebondEvent_Filter>>>;
  delegate?: InputMaybe<Scalars["String"]>;
  delegate_?: InputMaybe<Transcoder_Filter>;
  delegate_contains?: InputMaybe<Scalars["String"]>;
  delegate_contains_nocase?: InputMaybe<Scalars["String"]>;
  delegate_ends_with?: InputMaybe<Scalars["String"]>;
  delegate_ends_with_nocase?: InputMaybe<Scalars["String"]>;
  delegate_gt?: InputMaybe<Scalars["String"]>;
  delegate_gte?: InputMaybe<Scalars["String"]>;
  delegate_in?: InputMaybe<Array<Scalars["String"]>>;
  delegate_lt?: InputMaybe<Scalars["String"]>;
  delegate_lte?: InputMaybe<Scalars["String"]>;
  delegate_not?: InputMaybe<Scalars["String"]>;
  delegate_not_contains?: InputMaybe<Scalars["String"]>;
  delegate_not_contains_nocase?: InputMaybe<Scalars["String"]>;
  delegate_not_ends_with?: InputMaybe<Scalars["String"]>;
  delegate_not_ends_with_nocase?: InputMaybe<Scalars["String"]>;
  delegate_not_in?: InputMaybe<Array<Scalars["String"]>>;
  delegate_not_starts_with?: InputMaybe<Scalars["String"]>;
  delegate_not_starts_with_nocase?: InputMaybe<Scalars["String"]>;
  delegate_starts_with?: InputMaybe<Scalars["String"]>;
  delegate_starts_with_nocase?: InputMaybe<Scalars["String"]>;
  delegator?: InputMaybe<Scalars["String"]>;
  delegator_?: InputMaybe<Delegator_Filter>;
  delegator_contains?: InputMaybe<Scalars["String"]>;
  delegator_contains_nocase?: InputMaybe<Scalars["String"]>;
  delegator_ends_with?: InputMaybe<Scalars["String"]>;
  delegator_ends_with_nocase?: InputMaybe<Scalars["String"]>;
  delegator_gt?: InputMaybe<Scalars["String"]>;
  delegator_gte?: InputMaybe<Scalars["String"]>;
  delegator_in?: InputMaybe<Array<Scalars["String"]>>;
  delegator_lt?: InputMaybe<Scalars["String"]>;
  delegator_lte?: InputMaybe<Scalars["String"]>;
  delegator_not?: InputMaybe<Scalars["String"]>;
  delegator_not_contains?: InputMaybe<Scalars["String"]>;
  delegator_not_contains_nocase?: InputMaybe<Scalars["String"]>;
  delegator_not_ends_with?: InputMaybe<Scalars["String"]>;
  delegator_not_ends_with_nocase?: InputMaybe<Scalars["String"]>;
  delegator_not_in?: InputMaybe<Array<Scalars["String"]>>;
  delegator_not_starts_with?: InputMaybe<Scalars["String"]>;
  delegator_not_starts_with_nocase?: InputMaybe<Scalars["String"]>;
  delegator_starts_with?: InputMaybe<Scalars["String"]>;
  delegator_starts_with_nocase?: InputMaybe<Scalars["String"]>;
  id?: InputMaybe<Scalars["ID"]>;
  id_gt?: InputMaybe<Scalars["ID"]>;
  id_gte?: InputMaybe<Scalars["ID"]>;
  id_in?: InputMaybe<Array<Scalars["ID"]>>;
  id_lt?: InputMaybe<Scalars["ID"]>;
  id_lte?: InputMaybe<Scalars["ID"]>;
  id_not?: InputMaybe<Scalars["ID"]>;
  id_not_in?: InputMaybe<Array<Scalars["ID"]>>;
  or?: InputMaybe<Array<InputMaybe<RebondEvent_Filter>>>;
  round?: InputMaybe<Scalars["String"]>;
  round_?: InputMaybe<Round_Filter>;
  round_contains?: InputMaybe<Scalars["String"]>;
  round_contains_nocase?: InputMaybe<Scalars["String"]>;
  round_ends_with?: InputMaybe<Scalars["String"]>;
  round_ends_with_nocase?: InputMaybe<Scalars["String"]>;
  round_gt?: InputMaybe<Scalars["String"]>;
  round_gte?: InputMaybe<Scalars["String"]>;
  round_in?: InputMaybe<Array<Scalars["String"]>>;
  round_lt?: InputMaybe<Scalars["String"]>;
  round_lte?: InputMaybe<Scalars["String"]>;
  round_not?: InputMaybe<Scalars["String"]>;
  round_not_contains?: InputMaybe<Scalars["String"]>;
  round_not_contains_nocase?: InputMaybe<Scalars["String"]>;
  round_not_ends_with?: InputMaybe<Scalars["String"]>;
  round_not_ends_with_nocase?: InputMaybe<Scalars["String"]>;
  round_not_in?: InputMaybe<Array<Scalars["String"]>>;
  round_not_starts_with?: InputMaybe<Scalars["String"]>;
  round_not_starts_with_nocase?: InputMaybe<Scalars["String"]>;
  round_starts_with?: InputMaybe<Scalars["String"]>;
  round_starts_with_nocase?: InputMaybe<Scalars["String"]>;
  timestamp?: InputMaybe<Scalars["Int"]>;
  timestamp_gt?: InputMaybe<Scalars["Int"]>;
  timestamp_gte?: InputMaybe<Scalars["Int"]>;
  timestamp_in?: InputMaybe<Array<Scalars["Int"]>>;
  timestamp_lt?: InputMaybe<Scalars["Int"]>;
  timestamp_lte?: InputMaybe<Scalars["Int"]>;
  timestamp_not?: InputMaybe<Scalars["Int"]>;
  timestamp_not_in?: InputMaybe<Array<Scalars["Int"]>>;
  transaction?: InputMaybe<Scalars["String"]>;
  transaction_?: InputMaybe<Transaction_Filter>;
  transaction_contains?: InputMaybe<Scalars["String"]>;
  transaction_contains_nocase?: InputMaybe<Scalars["String"]>;
  transaction_ends_with?: InputMaybe<Scalars["String"]>;
  transaction_ends_with_nocase?: InputMaybe<Scalars["String"]>;
  transaction_gt?: InputMaybe<Scalars["String"]>;
  transaction_gte?: InputMaybe<Scalars["String"]>;
  transaction_in?: InputMaybe<Array<Scalars["String"]>>;
  transaction_lt?: InputMaybe<Scalars["String"]>;
  transaction_lte?: InputMaybe<Scalars["String"]>;
  transaction_not?: InputMaybe<Scalars["String"]>;
  transaction_not_contains?: InputMaybe<Scalars["String"]>;
  transaction_not_contains_nocase?: InputMaybe<Scalars["String"]>;
  transaction_not_ends_with?: InputMaybe<Scalars["String"]>;
  transaction_not_ends_with_nocase?: InputMaybe<Scalars["String"]>;
  transaction_not_in?: InputMaybe<Array<Scalars["String"]>>;
  transaction_not_starts_with?: InputMaybe<Scalars["String"]>;
  transaction_not_starts_with_nocase?: InputMaybe<Scalars["String"]>;
  transaction_starts_with?: InputMaybe<Scalars["String"]>;
  transaction_starts_with_nocase?: InputMaybe<Scalars["String"]>;
  unbondingLockId?: InputMaybe<Scalars["Int"]>;
  unbondingLockId_gt?: InputMaybe<Scalars["Int"]>;
  unbondingLockId_gte?: InputMaybe<Scalars["Int"]>;
  unbondingLockId_in?: InputMaybe<Array<Scalars["Int"]>>;
  unbondingLockId_lt?: InputMaybe<Scalars["Int"]>;
  unbondingLockId_lte?: InputMaybe<Scalars["Int"]>;
  unbondingLockId_not?: InputMaybe<Scalars["Int"]>;
  unbondingLockId_not_in?: InputMaybe<Array<Scalars["Int"]>>;
};

export enum RebondEvent_OrderBy {
  Amount = "amount",
  Delegate = "delegate",
  DelegateActivationRound = "delegate__activationRound",
  DelegateActivationTimestamp = "delegate__activationTimestamp",
  DelegateActive = "delegate__active",
  DelegateDeactivationRound = "delegate__deactivationRound",
  DelegateFeeShare = "delegate__feeShare",
  DelegateFeeShareUpdateTimestamp = "delegate__feeShareUpdateTimestamp",
  DelegateId = "delegate__id",
  DelegateLastActiveStakeUpdateRound = "delegate__lastActiveStakeUpdateRound",
  DelegateNinetyDayVolumeEth = "delegate__ninetyDayVolumeETH",
  DelegateRewardCut = "delegate__rewardCut",
  DelegateRewardCutUpdateTimestamp = "delegate__rewardCutUpdateTimestamp",
  DelegateServiceUri = "delegate__serviceURI",
  DelegateSixtyDayVolumeEth = "delegate__sixtyDayVolumeETH",
  DelegateStatus = "delegate__status",
  DelegateThirtyDayVolumeEth = "delegate__thirtyDayVolumeETH",
  DelegateTotalStake = "delegate__totalStake",
  DelegateTotalVolumeEth = "delegate__totalVolumeETH",
  DelegateTotalVolumeUsd = "delegate__totalVolumeUSD",
  Delegator = "delegator",
  DelegatorBondedAmount = "delegator__bondedAmount",
  DelegatorDelegatedAmount = "delegator__delegatedAmount",
  DelegatorFees = "delegator__fees",
  DelegatorId = "delegator__id",
  DelegatorPrincipal = "delegator__principal",
  DelegatorStartRound = "delegator__startRound",
  DelegatorUnbonded = "delegator__unbonded",
  DelegatorWithdrawnFees = "delegator__withdrawnFees",
  Id = "id",
  Round = "round",
  RoundActiveTranscoderCount = "round__activeTranscoderCount",
  RoundDelegatorsCount = "round__delegatorsCount",
  RoundEndBlock = "round__endBlock",
  RoundId = "round__id",
  RoundInflation = "round__inflation",
  RoundInitialized = "round__initialized",
  RoundLength = "round__length",
  RoundMintableTokens = "round__mintableTokens",
  RoundMovedStake = "round__movedStake",
  RoundNewStake = "round__newStake",
  RoundNumActiveTranscoders = "round__numActiveTranscoders",
  RoundParticipationRate = "round__participationRate",
  RoundStartBlock = "round__startBlock",
  RoundStartTimestamp = "round__startTimestamp",
  RoundTotalActiveStake = "round__totalActiveStake",
  RoundTotalSupply = "round__totalSupply",
  RoundVolumeEth = "round__volumeETH",
  RoundVolumeUsd = "round__volumeUSD",
  Timestamp = "timestamp",
  Transaction = "transaction",
  TransactionBlockNumber = "transaction__blockNumber",
  TransactionFrom = "transaction__from",
  TransactionGasPrice = "transaction__gasPrice",
  TransactionGasUsed = "transaction__gasUsed",
  TransactionId = "transaction__id",
  TransactionTimestamp = "transaction__timestamp",
  TransactionTo = "transaction__to",
  UnbondingLockId = "unbondingLockId",
}

/**
 * ReserveClaimedEvent entities are created for every emitted ReserveClaimed event.
 *
 */
export type ReserveClaimedEvent = Event & {
  __typename: "ReserveClaimedEvent";
  /** Amount of funds claimed by claimant from the reserve for the reserve holder */
  amount: Scalars["BigDecimal"];
  /** Reference to the claimant */
  claimant: Transcoder;
  /** Ethereum transaction hash + event log index */
  id: Scalars["ID"];
  /** Reference to the reserve holder */
  reserveHolder: Broadcaster;
  /** Reference to the round the event occured in */
  round: Round;
  /** Timestamp of the transaction the event was included in */
  timestamp: Scalars["Int"];
  /** Reference to the transaction the event was included in */
  transaction: Transaction;
};

export type ReserveClaimedEvent_Filter = {
  /** Filter for the block changed event. */
  _change_block?: InputMaybe<BlockChangedFilter>;
  amount?: InputMaybe<Scalars["BigDecimal"]>;
  amount_gt?: InputMaybe<Scalars["BigDecimal"]>;
  amount_gte?: InputMaybe<Scalars["BigDecimal"]>;
  amount_in?: InputMaybe<Array<Scalars["BigDecimal"]>>;
  amount_lt?: InputMaybe<Scalars["BigDecimal"]>;
  amount_lte?: InputMaybe<Scalars["BigDecimal"]>;
  amount_not?: InputMaybe<Scalars["BigDecimal"]>;
  amount_not_in?: InputMaybe<Array<Scalars["BigDecimal"]>>;
  and?: InputMaybe<Array<InputMaybe<ReserveClaimedEvent_Filter>>>;
  claimant?: InputMaybe<Scalars["String"]>;
  claimant_?: InputMaybe<Transcoder_Filter>;
  claimant_contains?: InputMaybe<Scalars["String"]>;
  claimant_contains_nocase?: InputMaybe<Scalars["String"]>;
  claimant_ends_with?: InputMaybe<Scalars["String"]>;
  claimant_ends_with_nocase?: InputMaybe<Scalars["String"]>;
  claimant_gt?: InputMaybe<Scalars["String"]>;
  claimant_gte?: InputMaybe<Scalars["String"]>;
  claimant_in?: InputMaybe<Array<Scalars["String"]>>;
  claimant_lt?: InputMaybe<Scalars["String"]>;
  claimant_lte?: InputMaybe<Scalars["String"]>;
  claimant_not?: InputMaybe<Scalars["String"]>;
  claimant_not_contains?: InputMaybe<Scalars["String"]>;
  claimant_not_contains_nocase?: InputMaybe<Scalars["String"]>;
  claimant_not_ends_with?: InputMaybe<Scalars["String"]>;
  claimant_not_ends_with_nocase?: InputMaybe<Scalars["String"]>;
  claimant_not_in?: InputMaybe<Array<Scalars["String"]>>;
  claimant_not_starts_with?: InputMaybe<Scalars["String"]>;
  claimant_not_starts_with_nocase?: InputMaybe<Scalars["String"]>;
  claimant_starts_with?: InputMaybe<Scalars["String"]>;
  claimant_starts_with_nocase?: InputMaybe<Scalars["String"]>;
  id?: InputMaybe<Scalars["ID"]>;
  id_gt?: InputMaybe<Scalars["ID"]>;
  id_gte?: InputMaybe<Scalars["ID"]>;
  id_in?: InputMaybe<Array<Scalars["ID"]>>;
  id_lt?: InputMaybe<Scalars["ID"]>;
  id_lte?: InputMaybe<Scalars["ID"]>;
  id_not?: InputMaybe<Scalars["ID"]>;
  id_not_in?: InputMaybe<Array<Scalars["ID"]>>;
  or?: InputMaybe<Array<InputMaybe<ReserveClaimedEvent_Filter>>>;
  reserveHolder?: InputMaybe<Scalars["String"]>;
  reserveHolder_?: InputMaybe<Broadcaster_Filter>;
  reserveHolder_contains?: InputMaybe<Scalars["String"]>;
  reserveHolder_contains_nocase?: InputMaybe<Scalars["String"]>;
  reserveHolder_ends_with?: InputMaybe<Scalars["String"]>;
  reserveHolder_ends_with_nocase?: InputMaybe<Scalars["String"]>;
  reserveHolder_gt?: InputMaybe<Scalars["String"]>;
  reserveHolder_gte?: InputMaybe<Scalars["String"]>;
  reserveHolder_in?: InputMaybe<Array<Scalars["String"]>>;
  reserveHolder_lt?: InputMaybe<Scalars["String"]>;
  reserveHolder_lte?: InputMaybe<Scalars["String"]>;
  reserveHolder_not?: InputMaybe<Scalars["String"]>;
  reserveHolder_not_contains?: InputMaybe<Scalars["String"]>;
  reserveHolder_not_contains_nocase?: InputMaybe<Scalars["String"]>;
  reserveHolder_not_ends_with?: InputMaybe<Scalars["String"]>;
  reserveHolder_not_ends_with_nocase?: InputMaybe<Scalars["String"]>;
  reserveHolder_not_in?: InputMaybe<Array<Scalars["String"]>>;
  reserveHolder_not_starts_with?: InputMaybe<Scalars["String"]>;
  reserveHolder_not_starts_with_nocase?: InputMaybe<Scalars["String"]>;
  reserveHolder_starts_with?: InputMaybe<Scalars["String"]>;
  reserveHolder_starts_with_nocase?: InputMaybe<Scalars["String"]>;
  round?: InputMaybe<Scalars["String"]>;
  round_?: InputMaybe<Round_Filter>;
  round_contains?: InputMaybe<Scalars["String"]>;
  round_contains_nocase?: InputMaybe<Scalars["String"]>;
  round_ends_with?: InputMaybe<Scalars["String"]>;
  round_ends_with_nocase?: InputMaybe<Scalars["String"]>;
  round_gt?: InputMaybe<Scalars["String"]>;
  round_gte?: InputMaybe<Scalars["String"]>;
  round_in?: InputMaybe<Array<Scalars["String"]>>;
  round_lt?: InputMaybe<Scalars["String"]>;
  round_lte?: InputMaybe<Scalars["String"]>;
  round_not?: InputMaybe<Scalars["String"]>;
  round_not_contains?: InputMaybe<Scalars["String"]>;
  round_not_contains_nocase?: InputMaybe<Scalars["String"]>;
  round_not_ends_with?: InputMaybe<Scalars["String"]>;
  round_not_ends_with_nocase?: InputMaybe<Scalars["String"]>;
  round_not_in?: InputMaybe<Array<Scalars["String"]>>;
  round_not_starts_with?: InputMaybe<Scalars["String"]>;
  round_not_starts_with_nocase?: InputMaybe<Scalars["String"]>;
  round_starts_with?: InputMaybe<Scalars["String"]>;
  round_starts_with_nocase?: InputMaybe<Scalars["String"]>;
  timestamp?: InputMaybe<Scalars["Int"]>;
  timestamp_gt?: InputMaybe<Scalars["Int"]>;
  timestamp_gte?: InputMaybe<Scalars["Int"]>;
  timestamp_in?: InputMaybe<Array<Scalars["Int"]>>;
  timestamp_lt?: InputMaybe<Scalars["Int"]>;
  timestamp_lte?: InputMaybe<Scalars["Int"]>;
  timestamp_not?: InputMaybe<Scalars["Int"]>;
  timestamp_not_in?: InputMaybe<Array<Scalars["Int"]>>;
  transaction?: InputMaybe<Scalars["String"]>;
  transaction_?: InputMaybe<Transaction_Filter>;
  transaction_contains?: InputMaybe<Scalars["String"]>;
  transaction_contains_nocase?: InputMaybe<Scalars["String"]>;
  transaction_ends_with?: InputMaybe<Scalars["String"]>;
  transaction_ends_with_nocase?: InputMaybe<Scalars["String"]>;
  transaction_gt?: InputMaybe<Scalars["String"]>;
  transaction_gte?: InputMaybe<Scalars["String"]>;
  transaction_in?: InputMaybe<Array<Scalars["String"]>>;
  transaction_lt?: InputMaybe<Scalars["String"]>;
  transaction_lte?: InputMaybe<Scalars["String"]>;
  transaction_not?: InputMaybe<Scalars["String"]>;
  transaction_not_contains?: InputMaybe<Scalars["String"]>;
  transaction_not_contains_nocase?: InputMaybe<Scalars["String"]>;
  transaction_not_ends_with?: InputMaybe<Scalars["String"]>;
  transaction_not_ends_with_nocase?: InputMaybe<Scalars["String"]>;
  transaction_not_in?: InputMaybe<Array<Scalars["String"]>>;
  transaction_not_starts_with?: InputMaybe<Scalars["String"]>;
  transaction_not_starts_with_nocase?: InputMaybe<Scalars["String"]>;
  transaction_starts_with?: InputMaybe<Scalars["String"]>;
  transaction_starts_with_nocase?: InputMaybe<Scalars["String"]>;
};

export enum ReserveClaimedEvent_OrderBy {
  Amount = "amount",
  Claimant = "claimant",
  ClaimantActivationRound = "claimant__activationRound",
  ClaimantActivationTimestamp = "claimant__activationTimestamp",
  ClaimantActive = "claimant__active",
  ClaimantDeactivationRound = "claimant__deactivationRound",
  ClaimantFeeShare = "claimant__feeShare",
  ClaimantFeeShareUpdateTimestamp = "claimant__feeShareUpdateTimestamp",
  ClaimantId = "claimant__id",
  ClaimantLastActiveStakeUpdateRound = "claimant__lastActiveStakeUpdateRound",
  ClaimantNinetyDayVolumeEth = "claimant__ninetyDayVolumeETH",
  ClaimantRewardCut = "claimant__rewardCut",
  ClaimantRewardCutUpdateTimestamp = "claimant__rewardCutUpdateTimestamp",
  ClaimantServiceUri = "claimant__serviceURI",
  ClaimantSixtyDayVolumeEth = "claimant__sixtyDayVolumeETH",
  ClaimantStatus = "claimant__status",
  ClaimantThirtyDayVolumeEth = "claimant__thirtyDayVolumeETH",
  ClaimantTotalStake = "claimant__totalStake",
  ClaimantTotalVolumeEth = "claimant__totalVolumeETH",
  ClaimantTotalVolumeUsd = "claimant__totalVolumeUSD",
  Id = "id",
  ReserveHolder = "reserveHolder",
  ReserveHolderDeposit = "reserveHolder__deposit",
  ReserveHolderId = "reserveHolder__id",
  ReserveHolderReserve = "reserveHolder__reserve",
  Round = "round",
  RoundActiveTranscoderCount = "round__activeTranscoderCount",
  RoundDelegatorsCount = "round__delegatorsCount",
  RoundEndBlock = "round__endBlock",
  RoundId = "round__id",
  RoundInflation = "round__inflation",
  RoundInitialized = "round__initialized",
  RoundLength = "round__length",
  RoundMintableTokens = "round__mintableTokens",
  RoundMovedStake = "round__movedStake",
  RoundNewStake = "round__newStake",
  RoundNumActiveTranscoders = "round__numActiveTranscoders",
  RoundParticipationRate = "round__participationRate",
  RoundStartBlock = "round__startBlock",
  RoundStartTimestamp = "round__startTimestamp",
  RoundTotalActiveStake = "round__totalActiveStake",
  RoundTotalSupply = "round__totalSupply",
  RoundVolumeEth = "round__volumeETH",
  RoundVolumeUsd = "round__volumeUSD",
  Timestamp = "timestamp",
  Transaction = "transaction",
  TransactionBlockNumber = "transaction__blockNumber",
  TransactionFrom = "transaction__from",
  TransactionGasPrice = "transaction__gasPrice",
  TransactionGasUsed = "transaction__gasUsed",
  TransactionId = "transaction__id",
  TransactionTimestamp = "transaction__timestamp",
  TransactionTo = "transaction__to",
}

/**
 * ReserveFundedEvent entities are created for every emitted ReserveFunded event.
 *
 */
export type ReserveFundedEvent = Event & {
  __typename: "ReserveFundedEvent";
  /** Amount of funds added to reserve */
  amount: Scalars["BigDecimal"];
  /** Ethereum transaction hash + event log index */
  id: Scalars["ID"];
  /** Reference to reserve holder */
  reserveHolder: Broadcaster;
  /** Reference to the round the event occured in */
  round: Round;
  /** Timestamp of the transaction the event was included in */
  timestamp: Scalars["Int"];
  /** Reference to the transaction the event was included in */
  transaction: Transaction;
};

export type ReserveFundedEvent_Filter = {
  /** Filter for the block changed event. */
  _change_block?: InputMaybe<BlockChangedFilter>;
  amount?: InputMaybe<Scalars["BigDecimal"]>;
  amount_gt?: InputMaybe<Scalars["BigDecimal"]>;
  amount_gte?: InputMaybe<Scalars["BigDecimal"]>;
  amount_in?: InputMaybe<Array<Scalars["BigDecimal"]>>;
  amount_lt?: InputMaybe<Scalars["BigDecimal"]>;
  amount_lte?: InputMaybe<Scalars["BigDecimal"]>;
  amount_not?: InputMaybe<Scalars["BigDecimal"]>;
  amount_not_in?: InputMaybe<Array<Scalars["BigDecimal"]>>;
  and?: InputMaybe<Array<InputMaybe<ReserveFundedEvent_Filter>>>;
  id?: InputMaybe<Scalars["ID"]>;
  id_gt?: InputMaybe<Scalars["ID"]>;
  id_gte?: InputMaybe<Scalars["ID"]>;
  id_in?: InputMaybe<Array<Scalars["ID"]>>;
  id_lt?: InputMaybe<Scalars["ID"]>;
  id_lte?: InputMaybe<Scalars["ID"]>;
  id_not?: InputMaybe<Scalars["ID"]>;
  id_not_in?: InputMaybe<Array<Scalars["ID"]>>;
  or?: InputMaybe<Array<InputMaybe<ReserveFundedEvent_Filter>>>;
  reserveHolder?: InputMaybe<Scalars["String"]>;
  reserveHolder_?: InputMaybe<Broadcaster_Filter>;
  reserveHolder_contains?: InputMaybe<Scalars["String"]>;
  reserveHolder_contains_nocase?: InputMaybe<Scalars["String"]>;
  reserveHolder_ends_with?: InputMaybe<Scalars["String"]>;
  reserveHolder_ends_with_nocase?: InputMaybe<Scalars["String"]>;
  reserveHolder_gt?: InputMaybe<Scalars["String"]>;
  reserveHolder_gte?: InputMaybe<Scalars["String"]>;
  reserveHolder_in?: InputMaybe<Array<Scalars["String"]>>;
  reserveHolder_lt?: InputMaybe<Scalars["String"]>;
  reserveHolder_lte?: InputMaybe<Scalars["String"]>;
  reserveHolder_not?: InputMaybe<Scalars["String"]>;
  reserveHolder_not_contains?: InputMaybe<Scalars["String"]>;
  reserveHolder_not_contains_nocase?: InputMaybe<Scalars["String"]>;
  reserveHolder_not_ends_with?: InputMaybe<Scalars["String"]>;
  reserveHolder_not_ends_with_nocase?: InputMaybe<Scalars["String"]>;
  reserveHolder_not_in?: InputMaybe<Array<Scalars["String"]>>;
  reserveHolder_not_starts_with?: InputMaybe<Scalars["String"]>;
  reserveHolder_not_starts_with_nocase?: InputMaybe<Scalars["String"]>;
  reserveHolder_starts_with?: InputMaybe<Scalars["String"]>;
  reserveHolder_starts_with_nocase?: InputMaybe<Scalars["String"]>;
  round?: InputMaybe<Scalars["String"]>;
  round_?: InputMaybe<Round_Filter>;
  round_contains?: InputMaybe<Scalars["String"]>;
  round_contains_nocase?: InputMaybe<Scalars["String"]>;
  round_ends_with?: InputMaybe<Scalars["String"]>;
  round_ends_with_nocase?: InputMaybe<Scalars["String"]>;
  round_gt?: InputMaybe<Scalars["String"]>;
  round_gte?: InputMaybe<Scalars["String"]>;
  round_in?: InputMaybe<Array<Scalars["String"]>>;
  round_lt?: InputMaybe<Scalars["String"]>;
  round_lte?: InputMaybe<Scalars["String"]>;
  round_not?: InputMaybe<Scalars["String"]>;
  round_not_contains?: InputMaybe<Scalars["String"]>;
  round_not_contains_nocase?: InputMaybe<Scalars["String"]>;
  round_not_ends_with?: InputMaybe<Scalars["String"]>;
  round_not_ends_with_nocase?: InputMaybe<Scalars["String"]>;
  round_not_in?: InputMaybe<Array<Scalars["String"]>>;
  round_not_starts_with?: InputMaybe<Scalars["String"]>;
  round_not_starts_with_nocase?: InputMaybe<Scalars["String"]>;
  round_starts_with?: InputMaybe<Scalars["String"]>;
  round_starts_with_nocase?: InputMaybe<Scalars["String"]>;
  timestamp?: InputMaybe<Scalars["Int"]>;
  timestamp_gt?: InputMaybe<Scalars["Int"]>;
  timestamp_gte?: InputMaybe<Scalars["Int"]>;
  timestamp_in?: InputMaybe<Array<Scalars["Int"]>>;
  timestamp_lt?: InputMaybe<Scalars["Int"]>;
  timestamp_lte?: InputMaybe<Scalars["Int"]>;
  timestamp_not?: InputMaybe<Scalars["Int"]>;
  timestamp_not_in?: InputMaybe<Array<Scalars["Int"]>>;
  transaction?: InputMaybe<Scalars["String"]>;
  transaction_?: InputMaybe<Transaction_Filter>;
  transaction_contains?: InputMaybe<Scalars["String"]>;
  transaction_contains_nocase?: InputMaybe<Scalars["String"]>;
  transaction_ends_with?: InputMaybe<Scalars["String"]>;
  transaction_ends_with_nocase?: InputMaybe<Scalars["String"]>;
  transaction_gt?: InputMaybe<Scalars["String"]>;
  transaction_gte?: InputMaybe<Scalars["String"]>;
  transaction_in?: InputMaybe<Array<Scalars["String"]>>;
  transaction_lt?: InputMaybe<Scalars["String"]>;
  transaction_lte?: InputMaybe<Scalars["String"]>;
  transaction_not?: InputMaybe<Scalars["String"]>;
  transaction_not_contains?: InputMaybe<Scalars["String"]>;
  transaction_not_contains_nocase?: InputMaybe<Scalars["String"]>;
  transaction_not_ends_with?: InputMaybe<Scalars["String"]>;
  transaction_not_ends_with_nocase?: InputMaybe<Scalars["String"]>;
  transaction_not_in?: InputMaybe<Array<Scalars["String"]>>;
  transaction_not_starts_with?: InputMaybe<Scalars["String"]>;
  transaction_not_starts_with_nocase?: InputMaybe<Scalars["String"]>;
  transaction_starts_with?: InputMaybe<Scalars["String"]>;
  transaction_starts_with_nocase?: InputMaybe<Scalars["String"]>;
};

export enum ReserveFundedEvent_OrderBy {
  Amount = "amount",
  Id = "id",
  ReserveHolder = "reserveHolder",
  ReserveHolderDeposit = "reserveHolder__deposit",
  ReserveHolderId = "reserveHolder__id",
  ReserveHolderReserve = "reserveHolder__reserve",
  Round = "round",
  RoundActiveTranscoderCount = "round__activeTranscoderCount",
  RoundDelegatorsCount = "round__delegatorsCount",
  RoundEndBlock = "round__endBlock",
  RoundId = "round__id",
  RoundInflation = "round__inflation",
  RoundInitialized = "round__initialized",
  RoundLength = "round__length",
  RoundMintableTokens = "round__mintableTokens",
  RoundMovedStake = "round__movedStake",
  RoundNewStake = "round__newStake",
  RoundNumActiveTranscoders = "round__numActiveTranscoders",
  RoundParticipationRate = "round__participationRate",
  RoundStartBlock = "round__startBlock",
  RoundStartTimestamp = "round__startTimestamp",
  RoundTotalActiveStake = "round__totalActiveStake",
  RoundTotalSupply = "round__totalSupply",
  RoundVolumeEth = "round__volumeETH",
  RoundVolumeUsd = "round__volumeUSD",
  Timestamp = "timestamp",
  Transaction = "transaction",
  TransactionBlockNumber = "transaction__blockNumber",
  TransactionFrom = "transaction__from",
  TransactionGasPrice = "transaction__gasPrice",
  TransactionGasUsed = "transaction__gasUsed",
  TransactionId = "transaction__id",
  TransactionTimestamp = "transaction__timestamp",
  TransactionTo = "transaction__to",
}

/**
 * RewardEvent entities are created for every emitted Reward event.
 *
 */
export type RewardEvent = Event & {
  __typename: "RewardEvent";
  /** Reference to the delegate that claimed its inflationary token reward */
  delegate: Transcoder;
  /** Ethereum transaction hash + event log index */
  id: Scalars["ID"];
  /** Amount of inflationary token rewards claimed */
  rewardTokens: Scalars["BigDecimal"];
  /** Reference to the round the event occured in */
  round: Round;
  /** Timestamp of the transaction the event was included in */
  timestamp: Scalars["Int"];
  /** Reference to the transaction the event was included in */
  transaction: Transaction;
};

export type RewardEvent_Filter = {
  /** Filter for the block changed event. */
  _change_block?: InputMaybe<BlockChangedFilter>;
  and?: InputMaybe<Array<InputMaybe<RewardEvent_Filter>>>;
  delegate?: InputMaybe<Scalars["String"]>;
  delegate_?: InputMaybe<Transcoder_Filter>;
  delegate_contains?: InputMaybe<Scalars["String"]>;
  delegate_contains_nocase?: InputMaybe<Scalars["String"]>;
  delegate_ends_with?: InputMaybe<Scalars["String"]>;
  delegate_ends_with_nocase?: InputMaybe<Scalars["String"]>;
  delegate_gt?: InputMaybe<Scalars["String"]>;
  delegate_gte?: InputMaybe<Scalars["String"]>;
  delegate_in?: InputMaybe<Array<Scalars["String"]>>;
  delegate_lt?: InputMaybe<Scalars["String"]>;
  delegate_lte?: InputMaybe<Scalars["String"]>;
  delegate_not?: InputMaybe<Scalars["String"]>;
  delegate_not_contains?: InputMaybe<Scalars["String"]>;
  delegate_not_contains_nocase?: InputMaybe<Scalars["String"]>;
  delegate_not_ends_with?: InputMaybe<Scalars["String"]>;
  delegate_not_ends_with_nocase?: InputMaybe<Scalars["String"]>;
  delegate_not_in?: InputMaybe<Array<Scalars["String"]>>;
  delegate_not_starts_with?: InputMaybe<Scalars["String"]>;
  delegate_not_starts_with_nocase?: InputMaybe<Scalars["String"]>;
  delegate_starts_with?: InputMaybe<Scalars["String"]>;
  delegate_starts_with_nocase?: InputMaybe<Scalars["String"]>;
  id?: InputMaybe<Scalars["ID"]>;
  id_gt?: InputMaybe<Scalars["ID"]>;
  id_gte?: InputMaybe<Scalars["ID"]>;
  id_in?: InputMaybe<Array<Scalars["ID"]>>;
  id_lt?: InputMaybe<Scalars["ID"]>;
  id_lte?: InputMaybe<Scalars["ID"]>;
  id_not?: InputMaybe<Scalars["ID"]>;
  id_not_in?: InputMaybe<Array<Scalars["ID"]>>;
  or?: InputMaybe<Array<InputMaybe<RewardEvent_Filter>>>;
  rewardTokens?: InputMaybe<Scalars["BigDecimal"]>;
  rewardTokens_gt?: InputMaybe<Scalars["BigDecimal"]>;
  rewardTokens_gte?: InputMaybe<Scalars["BigDecimal"]>;
  rewardTokens_in?: InputMaybe<Array<Scalars["BigDecimal"]>>;
  rewardTokens_lt?: InputMaybe<Scalars["BigDecimal"]>;
  rewardTokens_lte?: InputMaybe<Scalars["BigDecimal"]>;
  rewardTokens_not?: InputMaybe<Scalars["BigDecimal"]>;
  rewardTokens_not_in?: InputMaybe<Array<Scalars["BigDecimal"]>>;
  round?: InputMaybe<Scalars["String"]>;
  round_?: InputMaybe<Round_Filter>;
  round_contains?: InputMaybe<Scalars["String"]>;
  round_contains_nocase?: InputMaybe<Scalars["String"]>;
  round_ends_with?: InputMaybe<Scalars["String"]>;
  round_ends_with_nocase?: InputMaybe<Scalars["String"]>;
  round_gt?: InputMaybe<Scalars["String"]>;
  round_gte?: InputMaybe<Scalars["String"]>;
  round_in?: InputMaybe<Array<Scalars["String"]>>;
  round_lt?: InputMaybe<Scalars["String"]>;
  round_lte?: InputMaybe<Scalars["String"]>;
  round_not?: InputMaybe<Scalars["String"]>;
  round_not_contains?: InputMaybe<Scalars["String"]>;
  round_not_contains_nocase?: InputMaybe<Scalars["String"]>;
  round_not_ends_with?: InputMaybe<Scalars["String"]>;
  round_not_ends_with_nocase?: InputMaybe<Scalars["String"]>;
  round_not_in?: InputMaybe<Array<Scalars["String"]>>;
  round_not_starts_with?: InputMaybe<Scalars["String"]>;
  round_not_starts_with_nocase?: InputMaybe<Scalars["String"]>;
  round_starts_with?: InputMaybe<Scalars["String"]>;
  round_starts_with_nocase?: InputMaybe<Scalars["String"]>;
  timestamp?: InputMaybe<Scalars["Int"]>;
  timestamp_gt?: InputMaybe<Scalars["Int"]>;
  timestamp_gte?: InputMaybe<Scalars["Int"]>;
  timestamp_in?: InputMaybe<Array<Scalars["Int"]>>;
  timestamp_lt?: InputMaybe<Scalars["Int"]>;
  timestamp_lte?: InputMaybe<Scalars["Int"]>;
  timestamp_not?: InputMaybe<Scalars["Int"]>;
  timestamp_not_in?: InputMaybe<Array<Scalars["Int"]>>;
  transaction?: InputMaybe<Scalars["String"]>;
  transaction_?: InputMaybe<Transaction_Filter>;
  transaction_contains?: InputMaybe<Scalars["String"]>;
  transaction_contains_nocase?: InputMaybe<Scalars["String"]>;
  transaction_ends_with?: InputMaybe<Scalars["String"]>;
  transaction_ends_with_nocase?: InputMaybe<Scalars["String"]>;
  transaction_gt?: InputMaybe<Scalars["String"]>;
  transaction_gte?: InputMaybe<Scalars["String"]>;
  transaction_in?: InputMaybe<Array<Scalars["String"]>>;
  transaction_lt?: InputMaybe<Scalars["String"]>;
  transaction_lte?: InputMaybe<Scalars["String"]>;
  transaction_not?: InputMaybe<Scalars["String"]>;
  transaction_not_contains?: InputMaybe<Scalars["String"]>;
  transaction_not_contains_nocase?: InputMaybe<Scalars["String"]>;
  transaction_not_ends_with?: InputMaybe<Scalars["String"]>;
  transaction_not_ends_with_nocase?: InputMaybe<Scalars["String"]>;
  transaction_not_in?: InputMaybe<Array<Scalars["String"]>>;
  transaction_not_starts_with?: InputMaybe<Scalars["String"]>;
  transaction_not_starts_with_nocase?: InputMaybe<Scalars["String"]>;
  transaction_starts_with?: InputMaybe<Scalars["String"]>;
  transaction_starts_with_nocase?: InputMaybe<Scalars["String"]>;
};

export enum RewardEvent_OrderBy {
  Delegate = "delegate",
  DelegateActivationRound = "delegate__activationRound",
  DelegateActivationTimestamp = "delegate__activationTimestamp",
  DelegateActive = "delegate__active",
  DelegateDeactivationRound = "delegate__deactivationRound",
  DelegateFeeShare = "delegate__feeShare",
  DelegateFeeShareUpdateTimestamp = "delegate__feeShareUpdateTimestamp",
  DelegateId = "delegate__id",
  DelegateLastActiveStakeUpdateRound = "delegate__lastActiveStakeUpdateRound",
  DelegateNinetyDayVolumeEth = "delegate__ninetyDayVolumeETH",
  DelegateRewardCut = "delegate__rewardCut",
  DelegateRewardCutUpdateTimestamp = "delegate__rewardCutUpdateTimestamp",
  DelegateServiceUri = "delegate__serviceURI",
  DelegateSixtyDayVolumeEth = "delegate__sixtyDayVolumeETH",
  DelegateStatus = "delegate__status",
  DelegateThirtyDayVolumeEth = "delegate__thirtyDayVolumeETH",
  DelegateTotalStake = "delegate__totalStake",
  DelegateTotalVolumeEth = "delegate__totalVolumeETH",
  DelegateTotalVolumeUsd = "delegate__totalVolumeUSD",
  Id = "id",
  RewardTokens = "rewardTokens",
  Round = "round",
  RoundActiveTranscoderCount = "round__activeTranscoderCount",
  RoundDelegatorsCount = "round__delegatorsCount",
  RoundEndBlock = "round__endBlock",
  RoundId = "round__id",
  RoundInflation = "round__inflation",
  RoundInitialized = "round__initialized",
  RoundLength = "round__length",
  RoundMintableTokens = "round__mintableTokens",
  RoundMovedStake = "round__movedStake",
  RoundNewStake = "round__newStake",
  RoundNumActiveTranscoders = "round__numActiveTranscoders",
  RoundParticipationRate = "round__participationRate",
  RoundStartBlock = "round__startBlock",
  RoundStartTimestamp = "round__startTimestamp",
  RoundTotalActiveStake = "round__totalActiveStake",
  RoundTotalSupply = "round__totalSupply",
  RoundVolumeEth = "round__volumeETH",
  RoundVolumeUsd = "round__volumeUSD",
  Timestamp = "timestamp",
  Transaction = "transaction",
  TransactionBlockNumber = "transaction__blockNumber",
  TransactionFrom = "transaction__from",
  TransactionGasPrice = "transaction__gasPrice",
  TransactionGasUsed = "transaction__gasUsed",
  TransactionId = "transaction__id",
  TransactionTimestamp = "transaction__timestamp",
  TransactionTo = "transaction__to",
}

/**
 * The Livepeer protocol is round based and each round is represented by some number of Ethereum blocks.
 *
 */
export type Round = {
  __typename: "Round";
  /** Total active transcoders (up to the limit) */
  activeTranscoderCount: Scalars["BigInt"];
  /** Total number of delegators at the start of the round */
  delegatorsCount: Scalars["BigInt"];
  /** End block for the round */
  endBlock: Scalars["BigInt"];
  /** Round number */
  id: Scalars["ID"];
  /** Per round inflation rate */
  inflation: Scalars["BigInt"];
  /** Whether the round was initialized */
  initialized: Scalars["Boolean"];
  /** Number of blocks this round lasts for */
  length: Scalars["BigInt"];
  /** Mintable tokens for the round */
  mintableTokens: Scalars["BigDecimal"];
  /** Total stake moved from one delegate to another during the round */
  movedStake: Scalars["BigDecimal"];
  /** Total amount of new stake introduced during the round */
  newStake: Scalars["BigDecimal"];
  /** Limit of active transcoders */
  numActiveTranscoders: Scalars["BigInt"];
  /** Participation rate during the round (totalActiveStake/totalSupply) */
  participationRate: Scalars["BigDecimal"];
  /** Pools associated with the round */
  pools?: Maybe<Array<Pool>>;
  /** Start block for the round */
  startBlock: Scalars["BigInt"];
  /** The start date beginning at 12:00am UTC */
  startTimestamp: Scalars["Int"];
  /** Total active stake during the round */
  totalActiveStake: Scalars["BigDecimal"];
  /** Total Livepeer token supply during the round */
  totalSupply: Scalars["BigDecimal"];
  /** Fees generated this round in ETH */
  volumeETH: Scalars["BigDecimal"];
  /** Fees generated this round in USD */
  volumeUSD: Scalars["BigDecimal"];
};

/**
 * The Livepeer protocol is round based and each round is represented by some number of Ethereum blocks.
 *
 */
export type RoundPoolsArgs = {
  first?: InputMaybe<Scalars["Int"]>;
  orderBy?: InputMaybe<Pool_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars["Int"]>;
  where?: InputMaybe<Pool_Filter>;
};

export type Round_Filter = {
  /** Filter for the block changed event. */
  _change_block?: InputMaybe<BlockChangedFilter>;
  activeTranscoderCount?: InputMaybe<Scalars["BigInt"]>;
  activeTranscoderCount_gt?: InputMaybe<Scalars["BigInt"]>;
  activeTranscoderCount_gte?: InputMaybe<Scalars["BigInt"]>;
  activeTranscoderCount_in?: InputMaybe<Array<Scalars["BigInt"]>>;
  activeTranscoderCount_lt?: InputMaybe<Scalars["BigInt"]>;
  activeTranscoderCount_lte?: InputMaybe<Scalars["BigInt"]>;
  activeTranscoderCount_not?: InputMaybe<Scalars["BigInt"]>;
  activeTranscoderCount_not_in?: InputMaybe<Array<Scalars["BigInt"]>>;
  and?: InputMaybe<Array<InputMaybe<Round_Filter>>>;
  delegatorsCount?: InputMaybe<Scalars["BigInt"]>;
  delegatorsCount_gt?: InputMaybe<Scalars["BigInt"]>;
  delegatorsCount_gte?: InputMaybe<Scalars["BigInt"]>;
  delegatorsCount_in?: InputMaybe<Array<Scalars["BigInt"]>>;
  delegatorsCount_lt?: InputMaybe<Scalars["BigInt"]>;
  delegatorsCount_lte?: InputMaybe<Scalars["BigInt"]>;
  delegatorsCount_not?: InputMaybe<Scalars["BigInt"]>;
  delegatorsCount_not_in?: InputMaybe<Array<Scalars["BigInt"]>>;
  endBlock?: InputMaybe<Scalars["BigInt"]>;
  endBlock_gt?: InputMaybe<Scalars["BigInt"]>;
  endBlock_gte?: InputMaybe<Scalars["BigInt"]>;
  endBlock_in?: InputMaybe<Array<Scalars["BigInt"]>>;
  endBlock_lt?: InputMaybe<Scalars["BigInt"]>;
  endBlock_lte?: InputMaybe<Scalars["BigInt"]>;
  endBlock_not?: InputMaybe<Scalars["BigInt"]>;
  endBlock_not_in?: InputMaybe<Array<Scalars["BigInt"]>>;
  id?: InputMaybe<Scalars["ID"]>;
  id_gt?: InputMaybe<Scalars["ID"]>;
  id_gte?: InputMaybe<Scalars["ID"]>;
  id_in?: InputMaybe<Array<Scalars["ID"]>>;
  id_lt?: InputMaybe<Scalars["ID"]>;
  id_lte?: InputMaybe<Scalars["ID"]>;
  id_not?: InputMaybe<Scalars["ID"]>;
  id_not_in?: InputMaybe<Array<Scalars["ID"]>>;
  inflation?: InputMaybe<Scalars["BigInt"]>;
  inflation_gt?: InputMaybe<Scalars["BigInt"]>;
  inflation_gte?: InputMaybe<Scalars["BigInt"]>;
  inflation_in?: InputMaybe<Array<Scalars["BigInt"]>>;
  inflation_lt?: InputMaybe<Scalars["BigInt"]>;
  inflation_lte?: InputMaybe<Scalars["BigInt"]>;
  inflation_not?: InputMaybe<Scalars["BigInt"]>;
  inflation_not_in?: InputMaybe<Array<Scalars["BigInt"]>>;
  initialized?: InputMaybe<Scalars["Boolean"]>;
  initialized_in?: InputMaybe<Array<Scalars["Boolean"]>>;
  initialized_not?: InputMaybe<Scalars["Boolean"]>;
  initialized_not_in?: InputMaybe<Array<Scalars["Boolean"]>>;
  length?: InputMaybe<Scalars["BigInt"]>;
  length_gt?: InputMaybe<Scalars["BigInt"]>;
  length_gte?: InputMaybe<Scalars["BigInt"]>;
  length_in?: InputMaybe<Array<Scalars["BigInt"]>>;
  length_lt?: InputMaybe<Scalars["BigInt"]>;
  length_lte?: InputMaybe<Scalars["BigInt"]>;
  length_not?: InputMaybe<Scalars["BigInt"]>;
  length_not_in?: InputMaybe<Array<Scalars["BigInt"]>>;
  mintableTokens?: InputMaybe<Scalars["BigDecimal"]>;
  mintableTokens_gt?: InputMaybe<Scalars["BigDecimal"]>;
  mintableTokens_gte?: InputMaybe<Scalars["BigDecimal"]>;
  mintableTokens_in?: InputMaybe<Array<Scalars["BigDecimal"]>>;
  mintableTokens_lt?: InputMaybe<Scalars["BigDecimal"]>;
  mintableTokens_lte?: InputMaybe<Scalars["BigDecimal"]>;
  mintableTokens_not?: InputMaybe<Scalars["BigDecimal"]>;
  mintableTokens_not_in?: InputMaybe<Array<Scalars["BigDecimal"]>>;
  movedStake?: InputMaybe<Scalars["BigDecimal"]>;
  movedStake_gt?: InputMaybe<Scalars["BigDecimal"]>;
  movedStake_gte?: InputMaybe<Scalars["BigDecimal"]>;
  movedStake_in?: InputMaybe<Array<Scalars["BigDecimal"]>>;
  movedStake_lt?: InputMaybe<Scalars["BigDecimal"]>;
  movedStake_lte?: InputMaybe<Scalars["BigDecimal"]>;
  movedStake_not?: InputMaybe<Scalars["BigDecimal"]>;
  movedStake_not_in?: InputMaybe<Array<Scalars["BigDecimal"]>>;
  newStake?: InputMaybe<Scalars["BigDecimal"]>;
  newStake_gt?: InputMaybe<Scalars["BigDecimal"]>;
  newStake_gte?: InputMaybe<Scalars["BigDecimal"]>;
  newStake_in?: InputMaybe<Array<Scalars["BigDecimal"]>>;
  newStake_lt?: InputMaybe<Scalars["BigDecimal"]>;
  newStake_lte?: InputMaybe<Scalars["BigDecimal"]>;
  newStake_not?: InputMaybe<Scalars["BigDecimal"]>;
  newStake_not_in?: InputMaybe<Array<Scalars["BigDecimal"]>>;
  numActiveTranscoders?: InputMaybe<Scalars["BigInt"]>;
  numActiveTranscoders_gt?: InputMaybe<Scalars["BigInt"]>;
  numActiveTranscoders_gte?: InputMaybe<Scalars["BigInt"]>;
  numActiveTranscoders_in?: InputMaybe<Array<Scalars["BigInt"]>>;
  numActiveTranscoders_lt?: InputMaybe<Scalars["BigInt"]>;
  numActiveTranscoders_lte?: InputMaybe<Scalars["BigInt"]>;
  numActiveTranscoders_not?: InputMaybe<Scalars["BigInt"]>;
  numActiveTranscoders_not_in?: InputMaybe<Array<Scalars["BigInt"]>>;
  or?: InputMaybe<Array<InputMaybe<Round_Filter>>>;
  participationRate?: InputMaybe<Scalars["BigDecimal"]>;
  participationRate_gt?: InputMaybe<Scalars["BigDecimal"]>;
  participationRate_gte?: InputMaybe<Scalars["BigDecimal"]>;
  participationRate_in?: InputMaybe<Array<Scalars["BigDecimal"]>>;
  participationRate_lt?: InputMaybe<Scalars["BigDecimal"]>;
  participationRate_lte?: InputMaybe<Scalars["BigDecimal"]>;
  participationRate_not?: InputMaybe<Scalars["BigDecimal"]>;
  participationRate_not_in?: InputMaybe<Array<Scalars["BigDecimal"]>>;
  pools_?: InputMaybe<Pool_Filter>;
  startBlock?: InputMaybe<Scalars["BigInt"]>;
  startBlock_gt?: InputMaybe<Scalars["BigInt"]>;
  startBlock_gte?: InputMaybe<Scalars["BigInt"]>;
  startBlock_in?: InputMaybe<Array<Scalars["BigInt"]>>;
  startBlock_lt?: InputMaybe<Scalars["BigInt"]>;
  startBlock_lte?: InputMaybe<Scalars["BigInt"]>;
  startBlock_not?: InputMaybe<Scalars["BigInt"]>;
  startBlock_not_in?: InputMaybe<Array<Scalars["BigInt"]>>;
  startTimestamp?: InputMaybe<Scalars["Int"]>;
  startTimestamp_gt?: InputMaybe<Scalars["Int"]>;
  startTimestamp_gte?: InputMaybe<Scalars["Int"]>;
  startTimestamp_in?: InputMaybe<Array<Scalars["Int"]>>;
  startTimestamp_lt?: InputMaybe<Scalars["Int"]>;
  startTimestamp_lte?: InputMaybe<Scalars["Int"]>;
  startTimestamp_not?: InputMaybe<Scalars["Int"]>;
  startTimestamp_not_in?: InputMaybe<Array<Scalars["Int"]>>;
  totalActiveStake?: InputMaybe<Scalars["BigDecimal"]>;
  totalActiveStake_gt?: InputMaybe<Scalars["BigDecimal"]>;
  totalActiveStake_gte?: InputMaybe<Scalars["BigDecimal"]>;
  totalActiveStake_in?: InputMaybe<Array<Scalars["BigDecimal"]>>;
  totalActiveStake_lt?: InputMaybe<Scalars["BigDecimal"]>;
  totalActiveStake_lte?: InputMaybe<Scalars["BigDecimal"]>;
  totalActiveStake_not?: InputMaybe<Scalars["BigDecimal"]>;
  totalActiveStake_not_in?: InputMaybe<Array<Scalars["BigDecimal"]>>;
  totalSupply?: InputMaybe<Scalars["BigDecimal"]>;
  totalSupply_gt?: InputMaybe<Scalars["BigDecimal"]>;
  totalSupply_gte?: InputMaybe<Scalars["BigDecimal"]>;
  totalSupply_in?: InputMaybe<Array<Scalars["BigDecimal"]>>;
  totalSupply_lt?: InputMaybe<Scalars["BigDecimal"]>;
  totalSupply_lte?: InputMaybe<Scalars["BigDecimal"]>;
  totalSupply_not?: InputMaybe<Scalars["BigDecimal"]>;
  totalSupply_not_in?: InputMaybe<Array<Scalars["BigDecimal"]>>;
  volumeETH?: InputMaybe<Scalars["BigDecimal"]>;
  volumeETH_gt?: InputMaybe<Scalars["BigDecimal"]>;
  volumeETH_gte?: InputMaybe<Scalars["BigDecimal"]>;
  volumeETH_in?: InputMaybe<Array<Scalars["BigDecimal"]>>;
  volumeETH_lt?: InputMaybe<Scalars["BigDecimal"]>;
  volumeETH_lte?: InputMaybe<Scalars["BigDecimal"]>;
  volumeETH_not?: InputMaybe<Scalars["BigDecimal"]>;
  volumeETH_not_in?: InputMaybe<Array<Scalars["BigDecimal"]>>;
  volumeUSD?: InputMaybe<Scalars["BigDecimal"]>;
  volumeUSD_gt?: InputMaybe<Scalars["BigDecimal"]>;
  volumeUSD_gte?: InputMaybe<Scalars["BigDecimal"]>;
  volumeUSD_in?: InputMaybe<Array<Scalars["BigDecimal"]>>;
  volumeUSD_lt?: InputMaybe<Scalars["BigDecimal"]>;
  volumeUSD_lte?: InputMaybe<Scalars["BigDecimal"]>;
  volumeUSD_not?: InputMaybe<Scalars["BigDecimal"]>;
  volumeUSD_not_in?: InputMaybe<Array<Scalars["BigDecimal"]>>;
};

export enum Round_OrderBy {
  ActiveTranscoderCount = "activeTranscoderCount",
  DelegatorsCount = "delegatorsCount",
  EndBlock = "endBlock",
  Id = "id",
  Inflation = "inflation",
  Initialized = "initialized",
  Length = "length",
  MintableTokens = "mintableTokens",
  MovedStake = "movedStake",
  NewStake = "newStake",
  NumActiveTranscoders = "numActiveTranscoders",
  ParticipationRate = "participationRate",
  Pools = "pools",
  StartBlock = "startBlock",
  StartTimestamp = "startTimestamp",
  TotalActiveStake = "totalActiveStake",
  TotalSupply = "totalSupply",
  VolumeEth = "volumeETH",
  VolumeUsd = "volumeUSD",
}

/**
 * ServiceURIUpdateEvent entities are created for every emitted ServiceURIUpdate event.
 *
 */
export type ServiceUriUpdateEvent = Event & {
  __typename: "ServiceURIUpdateEvent";
  /** Address of sender */
  addr: Scalars["String"];
  /** Ethereum transaction hash + event log index */
  id: Scalars["ID"];
  /** Reference to the round the event occured in */
  round: Round;
  /** Service URI endpoint for the caller */
  serviceURI: Scalars["String"];
  /** Timestamp of the transaction the event was included in */
  timestamp: Scalars["Int"];
  /** Reference to the transaction the event was included in */
  transaction: Transaction;
};

export type ServiceUriUpdateEvent_Filter = {
  /** Filter for the block changed event. */
  _change_block?: InputMaybe<BlockChangedFilter>;
  addr?: InputMaybe<Scalars["String"]>;
  addr_contains?: InputMaybe<Scalars["String"]>;
  addr_contains_nocase?: InputMaybe<Scalars["String"]>;
  addr_ends_with?: InputMaybe<Scalars["String"]>;
  addr_ends_with_nocase?: InputMaybe<Scalars["String"]>;
  addr_gt?: InputMaybe<Scalars["String"]>;
  addr_gte?: InputMaybe<Scalars["String"]>;
  addr_in?: InputMaybe<Array<Scalars["String"]>>;
  addr_lt?: InputMaybe<Scalars["String"]>;
  addr_lte?: InputMaybe<Scalars["String"]>;
  addr_not?: InputMaybe<Scalars["String"]>;
  addr_not_contains?: InputMaybe<Scalars["String"]>;
  addr_not_contains_nocase?: InputMaybe<Scalars["String"]>;
  addr_not_ends_with?: InputMaybe<Scalars["String"]>;
  addr_not_ends_with_nocase?: InputMaybe<Scalars["String"]>;
  addr_not_in?: InputMaybe<Array<Scalars["String"]>>;
  addr_not_starts_with?: InputMaybe<Scalars["String"]>;
  addr_not_starts_with_nocase?: InputMaybe<Scalars["String"]>;
  addr_starts_with?: InputMaybe<Scalars["String"]>;
  addr_starts_with_nocase?: InputMaybe<Scalars["String"]>;
  and?: InputMaybe<Array<InputMaybe<ServiceUriUpdateEvent_Filter>>>;
  id?: InputMaybe<Scalars["ID"]>;
  id_gt?: InputMaybe<Scalars["ID"]>;
  id_gte?: InputMaybe<Scalars["ID"]>;
  id_in?: InputMaybe<Array<Scalars["ID"]>>;
  id_lt?: InputMaybe<Scalars["ID"]>;
  id_lte?: InputMaybe<Scalars["ID"]>;
  id_not?: InputMaybe<Scalars["ID"]>;
  id_not_in?: InputMaybe<Array<Scalars["ID"]>>;
  or?: InputMaybe<Array<InputMaybe<ServiceUriUpdateEvent_Filter>>>;
  round?: InputMaybe<Scalars["String"]>;
  round_?: InputMaybe<Round_Filter>;
  round_contains?: InputMaybe<Scalars["String"]>;
  round_contains_nocase?: InputMaybe<Scalars["String"]>;
  round_ends_with?: InputMaybe<Scalars["String"]>;
  round_ends_with_nocase?: InputMaybe<Scalars["String"]>;
  round_gt?: InputMaybe<Scalars["String"]>;
  round_gte?: InputMaybe<Scalars["String"]>;
  round_in?: InputMaybe<Array<Scalars["String"]>>;
  round_lt?: InputMaybe<Scalars["String"]>;
  round_lte?: InputMaybe<Scalars["String"]>;
  round_not?: InputMaybe<Scalars["String"]>;
  round_not_contains?: InputMaybe<Scalars["String"]>;
  round_not_contains_nocase?: InputMaybe<Scalars["String"]>;
  round_not_ends_with?: InputMaybe<Scalars["String"]>;
  round_not_ends_with_nocase?: InputMaybe<Scalars["String"]>;
  round_not_in?: InputMaybe<Array<Scalars["String"]>>;
  round_not_starts_with?: InputMaybe<Scalars["String"]>;
  round_not_starts_with_nocase?: InputMaybe<Scalars["String"]>;
  round_starts_with?: InputMaybe<Scalars["String"]>;
  round_starts_with_nocase?: InputMaybe<Scalars["String"]>;
  serviceURI?: InputMaybe<Scalars["String"]>;
  serviceURI_contains?: InputMaybe<Scalars["String"]>;
  serviceURI_contains_nocase?: InputMaybe<Scalars["String"]>;
  serviceURI_ends_with?: InputMaybe<Scalars["String"]>;
  serviceURI_ends_with_nocase?: InputMaybe<Scalars["String"]>;
  serviceURI_gt?: InputMaybe<Scalars["String"]>;
  serviceURI_gte?: InputMaybe<Scalars["String"]>;
  serviceURI_in?: InputMaybe<Array<Scalars["String"]>>;
  serviceURI_lt?: InputMaybe<Scalars["String"]>;
  serviceURI_lte?: InputMaybe<Scalars["String"]>;
  serviceURI_not?: InputMaybe<Scalars["String"]>;
  serviceURI_not_contains?: InputMaybe<Scalars["String"]>;
  serviceURI_not_contains_nocase?: InputMaybe<Scalars["String"]>;
  serviceURI_not_ends_with?: InputMaybe<Scalars["String"]>;
  serviceURI_not_ends_with_nocase?: InputMaybe<Scalars["String"]>;
  serviceURI_not_in?: InputMaybe<Array<Scalars["String"]>>;
  serviceURI_not_starts_with?: InputMaybe<Scalars["String"]>;
  serviceURI_not_starts_with_nocase?: InputMaybe<Scalars["String"]>;
  serviceURI_starts_with?: InputMaybe<Scalars["String"]>;
  serviceURI_starts_with_nocase?: InputMaybe<Scalars["String"]>;
  timestamp?: InputMaybe<Scalars["Int"]>;
  timestamp_gt?: InputMaybe<Scalars["Int"]>;
  timestamp_gte?: InputMaybe<Scalars["Int"]>;
  timestamp_in?: InputMaybe<Array<Scalars["Int"]>>;
  timestamp_lt?: InputMaybe<Scalars["Int"]>;
  timestamp_lte?: InputMaybe<Scalars["Int"]>;
  timestamp_not?: InputMaybe<Scalars["Int"]>;
  timestamp_not_in?: InputMaybe<Array<Scalars["Int"]>>;
  transaction?: InputMaybe<Scalars["String"]>;
  transaction_?: InputMaybe<Transaction_Filter>;
  transaction_contains?: InputMaybe<Scalars["String"]>;
  transaction_contains_nocase?: InputMaybe<Scalars["String"]>;
  transaction_ends_with?: InputMaybe<Scalars["String"]>;
  transaction_ends_with_nocase?: InputMaybe<Scalars["String"]>;
  transaction_gt?: InputMaybe<Scalars["String"]>;
  transaction_gte?: InputMaybe<Scalars["String"]>;
  transaction_in?: InputMaybe<Array<Scalars["String"]>>;
  transaction_lt?: InputMaybe<Scalars["String"]>;
  transaction_lte?: InputMaybe<Scalars["String"]>;
  transaction_not?: InputMaybe<Scalars["String"]>;
  transaction_not_contains?: InputMaybe<Scalars["String"]>;
  transaction_not_contains_nocase?: InputMaybe<Scalars["String"]>;
  transaction_not_ends_with?: InputMaybe<Scalars["String"]>;
  transaction_not_ends_with_nocase?: InputMaybe<Scalars["String"]>;
  transaction_not_in?: InputMaybe<Array<Scalars["String"]>>;
  transaction_not_starts_with?: InputMaybe<Scalars["String"]>;
  transaction_not_starts_with_nocase?: InputMaybe<Scalars["String"]>;
  transaction_starts_with?: InputMaybe<Scalars["String"]>;
  transaction_starts_with_nocase?: InputMaybe<Scalars["String"]>;
};

export enum ServiceUriUpdateEvent_OrderBy {
  Addr = "addr",
  Id = "id",
  Round = "round",
  RoundActiveTranscoderCount = "round__activeTranscoderCount",
  RoundDelegatorsCount = "round__delegatorsCount",
  RoundEndBlock = "round__endBlock",
  RoundId = "round__id",
  RoundInflation = "round__inflation",
  RoundInitialized = "round__initialized",
  RoundLength = "round__length",
  RoundMintableTokens = "round__mintableTokens",
  RoundMovedStake = "round__movedStake",
  RoundNewStake = "round__newStake",
  RoundNumActiveTranscoders = "round__numActiveTranscoders",
  RoundParticipationRate = "round__participationRate",
  RoundStartBlock = "round__startBlock",
  RoundStartTimestamp = "round__startTimestamp",
  RoundTotalActiveStake = "round__totalActiveStake",
  RoundTotalSupply = "round__totalSupply",
  RoundVolumeEth = "round__volumeETH",
  RoundVolumeUsd = "round__volumeUSD",
  ServiceUri = "serviceURI",
  Timestamp = "timestamp",
  Transaction = "transaction",
  TransactionBlockNumber = "transaction__blockNumber",
  TransactionFrom = "transaction__from",
  TransactionGasPrice = "transaction__gasPrice",
  TransactionGasUsed = "transaction__gasUsed",
  TransactionId = "transaction__id",
  TransactionTimestamp = "transaction__timestamp",
  TransactionTo = "transaction__to",
}

/**
 * SetCurrentRewardTokensEvent entities are created for every emitted SetCurrentRewardTokens event.
 *
 */
export type SetCurrentRewardTokensEvent = Event & {
  __typename: "SetCurrentRewardTokensEvent";
  /** Current inflation during the round */
  currentInflation: Scalars["BigInt"];
  /** Number of mintable tokens for the round */
  currentMintableTokens: Scalars["BigDecimal"];
  /** Ethereum transaction hash + event log index */
  id: Scalars["ID"];
  /** Reference to the round the event occured in */
  round: Round;
  /** Timestamp of the transaction the event was included in */
  timestamp: Scalars["Int"];
  /** Reference to the transaction the event was included in */
  transaction: Transaction;
};

export type SetCurrentRewardTokensEvent_Filter = {
  /** Filter for the block changed event. */
  _change_block?: InputMaybe<BlockChangedFilter>;
  and?: InputMaybe<Array<InputMaybe<SetCurrentRewardTokensEvent_Filter>>>;
  currentInflation?: InputMaybe<Scalars["BigInt"]>;
  currentInflation_gt?: InputMaybe<Scalars["BigInt"]>;
  currentInflation_gte?: InputMaybe<Scalars["BigInt"]>;
  currentInflation_in?: InputMaybe<Array<Scalars["BigInt"]>>;
  currentInflation_lt?: InputMaybe<Scalars["BigInt"]>;
  currentInflation_lte?: InputMaybe<Scalars["BigInt"]>;
  currentInflation_not?: InputMaybe<Scalars["BigInt"]>;
  currentInflation_not_in?: InputMaybe<Array<Scalars["BigInt"]>>;
  currentMintableTokens?: InputMaybe<Scalars["BigDecimal"]>;
  currentMintableTokens_gt?: InputMaybe<Scalars["BigDecimal"]>;
  currentMintableTokens_gte?: InputMaybe<Scalars["BigDecimal"]>;
  currentMintableTokens_in?: InputMaybe<Array<Scalars["BigDecimal"]>>;
  currentMintableTokens_lt?: InputMaybe<Scalars["BigDecimal"]>;
  currentMintableTokens_lte?: InputMaybe<Scalars["BigDecimal"]>;
  currentMintableTokens_not?: InputMaybe<Scalars["BigDecimal"]>;
  currentMintableTokens_not_in?: InputMaybe<Array<Scalars["BigDecimal"]>>;
  id?: InputMaybe<Scalars["ID"]>;
  id_gt?: InputMaybe<Scalars["ID"]>;
  id_gte?: InputMaybe<Scalars["ID"]>;
  id_in?: InputMaybe<Array<Scalars["ID"]>>;
  id_lt?: InputMaybe<Scalars["ID"]>;
  id_lte?: InputMaybe<Scalars["ID"]>;
  id_not?: InputMaybe<Scalars["ID"]>;
  id_not_in?: InputMaybe<Array<Scalars["ID"]>>;
  or?: InputMaybe<Array<InputMaybe<SetCurrentRewardTokensEvent_Filter>>>;
  round?: InputMaybe<Scalars["String"]>;
  round_?: InputMaybe<Round_Filter>;
  round_contains?: InputMaybe<Scalars["String"]>;
  round_contains_nocase?: InputMaybe<Scalars["String"]>;
  round_ends_with?: InputMaybe<Scalars["String"]>;
  round_ends_with_nocase?: InputMaybe<Scalars["String"]>;
  round_gt?: InputMaybe<Scalars["String"]>;
  round_gte?: InputMaybe<Scalars["String"]>;
  round_in?: InputMaybe<Array<Scalars["String"]>>;
  round_lt?: InputMaybe<Scalars["String"]>;
  round_lte?: InputMaybe<Scalars["String"]>;
  round_not?: InputMaybe<Scalars["String"]>;
  round_not_contains?: InputMaybe<Scalars["String"]>;
  round_not_contains_nocase?: InputMaybe<Scalars["String"]>;
  round_not_ends_with?: InputMaybe<Scalars["String"]>;
  round_not_ends_with_nocase?: InputMaybe<Scalars["String"]>;
  round_not_in?: InputMaybe<Array<Scalars["String"]>>;
  round_not_starts_with?: InputMaybe<Scalars["String"]>;
  round_not_starts_with_nocase?: InputMaybe<Scalars["String"]>;
  round_starts_with?: InputMaybe<Scalars["String"]>;
  round_starts_with_nocase?: InputMaybe<Scalars["String"]>;
  timestamp?: InputMaybe<Scalars["Int"]>;
  timestamp_gt?: InputMaybe<Scalars["Int"]>;
  timestamp_gte?: InputMaybe<Scalars["Int"]>;
  timestamp_in?: InputMaybe<Array<Scalars["Int"]>>;
  timestamp_lt?: InputMaybe<Scalars["Int"]>;
  timestamp_lte?: InputMaybe<Scalars["Int"]>;
  timestamp_not?: InputMaybe<Scalars["Int"]>;
  timestamp_not_in?: InputMaybe<Array<Scalars["Int"]>>;
  transaction?: InputMaybe<Scalars["String"]>;
  transaction_?: InputMaybe<Transaction_Filter>;
  transaction_contains?: InputMaybe<Scalars["String"]>;
  transaction_contains_nocase?: InputMaybe<Scalars["String"]>;
  transaction_ends_with?: InputMaybe<Scalars["String"]>;
  transaction_ends_with_nocase?: InputMaybe<Scalars["String"]>;
  transaction_gt?: InputMaybe<Scalars["String"]>;
  transaction_gte?: InputMaybe<Scalars["String"]>;
  transaction_in?: InputMaybe<Array<Scalars["String"]>>;
  transaction_lt?: InputMaybe<Scalars["String"]>;
  transaction_lte?: InputMaybe<Scalars["String"]>;
  transaction_not?: InputMaybe<Scalars["String"]>;
  transaction_not_contains?: InputMaybe<Scalars["String"]>;
  transaction_not_contains_nocase?: InputMaybe<Scalars["String"]>;
  transaction_not_ends_with?: InputMaybe<Scalars["String"]>;
  transaction_not_ends_with_nocase?: InputMaybe<Scalars["String"]>;
  transaction_not_in?: InputMaybe<Array<Scalars["String"]>>;
  transaction_not_starts_with?: InputMaybe<Scalars["String"]>;
  transaction_not_starts_with_nocase?: InputMaybe<Scalars["String"]>;
  transaction_starts_with?: InputMaybe<Scalars["String"]>;
  transaction_starts_with_nocase?: InputMaybe<Scalars["String"]>;
};

export enum SetCurrentRewardTokensEvent_OrderBy {
  CurrentInflation = "currentInflation",
  CurrentMintableTokens = "currentMintableTokens",
  Id = "id",
  Round = "round",
  RoundActiveTranscoderCount = "round__activeTranscoderCount",
  RoundDelegatorsCount = "round__delegatorsCount",
  RoundEndBlock = "round__endBlock",
  RoundId = "round__id",
  RoundInflation = "round__inflation",
  RoundInitialized = "round__initialized",
  RoundLength = "round__length",
  RoundMintableTokens = "round__mintableTokens",
  RoundMovedStake = "round__movedStake",
  RoundNewStake = "round__newStake",
  RoundNumActiveTranscoders = "round__numActiveTranscoders",
  RoundParticipationRate = "round__participationRate",
  RoundStartBlock = "round__startBlock",
  RoundStartTimestamp = "round__startTimestamp",
  RoundTotalActiveStake = "round__totalActiveStake",
  RoundTotalSupply = "round__totalSupply",
  RoundVolumeEth = "round__volumeETH",
  RoundVolumeUsd = "round__volumeUSD",
  Timestamp = "timestamp",
  Transaction = "transaction",
  TransactionBlockNumber = "transaction__blockNumber",
  TransactionFrom = "transaction__from",
  TransactionGasPrice = "transaction__gasPrice",
  TransactionGasUsed = "transaction__gasUsed",
  TransactionId = "transaction__id",
  TransactionTimestamp = "transaction__timestamp",
  TransactionTo = "transaction__to",
}

/**
 * StakeClaimedEvent entities are created for every emitted StakeClaimed event.
 *
 */
export type StakeClaimedEvent = Event & {
  __typename: "StakeClaimedEvent";
  delegate: Scalars["String"];
  delegator: Scalars["String"];
  fees: Scalars["BigDecimal"];
  /** Ethereum transaction hash + event log index */
  id: Scalars["ID"];
  /** Reference to the round the event occured in */
  round: Round;
  stake: Scalars["BigDecimal"];
  /** Timestamp of the transaction the event was included in */
  timestamp: Scalars["Int"];
  /** Reference to the transaction the event was included in */
  transaction: Transaction;
};

export type StakeClaimedEvent_Filter = {
  /** Filter for the block changed event. */
  _change_block?: InputMaybe<BlockChangedFilter>;
  and?: InputMaybe<Array<InputMaybe<StakeClaimedEvent_Filter>>>;
  delegate?: InputMaybe<Scalars["String"]>;
  delegate_contains?: InputMaybe<Scalars["String"]>;
  delegate_contains_nocase?: InputMaybe<Scalars["String"]>;
  delegate_ends_with?: InputMaybe<Scalars["String"]>;
  delegate_ends_with_nocase?: InputMaybe<Scalars["String"]>;
  delegate_gt?: InputMaybe<Scalars["String"]>;
  delegate_gte?: InputMaybe<Scalars["String"]>;
  delegate_in?: InputMaybe<Array<Scalars["String"]>>;
  delegate_lt?: InputMaybe<Scalars["String"]>;
  delegate_lte?: InputMaybe<Scalars["String"]>;
  delegate_not?: InputMaybe<Scalars["String"]>;
  delegate_not_contains?: InputMaybe<Scalars["String"]>;
  delegate_not_contains_nocase?: InputMaybe<Scalars["String"]>;
  delegate_not_ends_with?: InputMaybe<Scalars["String"]>;
  delegate_not_ends_with_nocase?: InputMaybe<Scalars["String"]>;
  delegate_not_in?: InputMaybe<Array<Scalars["String"]>>;
  delegate_not_starts_with?: InputMaybe<Scalars["String"]>;
  delegate_not_starts_with_nocase?: InputMaybe<Scalars["String"]>;
  delegate_starts_with?: InputMaybe<Scalars["String"]>;
  delegate_starts_with_nocase?: InputMaybe<Scalars["String"]>;
  delegator?: InputMaybe<Scalars["String"]>;
  delegator_contains?: InputMaybe<Scalars["String"]>;
  delegator_contains_nocase?: InputMaybe<Scalars["String"]>;
  delegator_ends_with?: InputMaybe<Scalars["String"]>;
  delegator_ends_with_nocase?: InputMaybe<Scalars["String"]>;
  delegator_gt?: InputMaybe<Scalars["String"]>;
  delegator_gte?: InputMaybe<Scalars["String"]>;
  delegator_in?: InputMaybe<Array<Scalars["String"]>>;
  delegator_lt?: InputMaybe<Scalars["String"]>;
  delegator_lte?: InputMaybe<Scalars["String"]>;
  delegator_not?: InputMaybe<Scalars["String"]>;
  delegator_not_contains?: InputMaybe<Scalars["String"]>;
  delegator_not_contains_nocase?: InputMaybe<Scalars["String"]>;
  delegator_not_ends_with?: InputMaybe<Scalars["String"]>;
  delegator_not_ends_with_nocase?: InputMaybe<Scalars["String"]>;
  delegator_not_in?: InputMaybe<Array<Scalars["String"]>>;
  delegator_not_starts_with?: InputMaybe<Scalars["String"]>;
  delegator_not_starts_with_nocase?: InputMaybe<Scalars["String"]>;
  delegator_starts_with?: InputMaybe<Scalars["String"]>;
  delegator_starts_with_nocase?: InputMaybe<Scalars["String"]>;
  fees?: InputMaybe<Scalars["BigDecimal"]>;
  fees_gt?: InputMaybe<Scalars["BigDecimal"]>;
  fees_gte?: InputMaybe<Scalars["BigDecimal"]>;
  fees_in?: InputMaybe<Array<Scalars["BigDecimal"]>>;
  fees_lt?: InputMaybe<Scalars["BigDecimal"]>;
  fees_lte?: InputMaybe<Scalars["BigDecimal"]>;
  fees_not?: InputMaybe<Scalars["BigDecimal"]>;
  fees_not_in?: InputMaybe<Array<Scalars["BigDecimal"]>>;
  id?: InputMaybe<Scalars["ID"]>;
  id_gt?: InputMaybe<Scalars["ID"]>;
  id_gte?: InputMaybe<Scalars["ID"]>;
  id_in?: InputMaybe<Array<Scalars["ID"]>>;
  id_lt?: InputMaybe<Scalars["ID"]>;
  id_lte?: InputMaybe<Scalars["ID"]>;
  id_not?: InputMaybe<Scalars["ID"]>;
  id_not_in?: InputMaybe<Array<Scalars["ID"]>>;
  or?: InputMaybe<Array<InputMaybe<StakeClaimedEvent_Filter>>>;
  round?: InputMaybe<Scalars["String"]>;
  round_?: InputMaybe<Round_Filter>;
  round_contains?: InputMaybe<Scalars["String"]>;
  round_contains_nocase?: InputMaybe<Scalars["String"]>;
  round_ends_with?: InputMaybe<Scalars["String"]>;
  round_ends_with_nocase?: InputMaybe<Scalars["String"]>;
  round_gt?: InputMaybe<Scalars["String"]>;
  round_gte?: InputMaybe<Scalars["String"]>;
  round_in?: InputMaybe<Array<Scalars["String"]>>;
  round_lt?: InputMaybe<Scalars["String"]>;
  round_lte?: InputMaybe<Scalars["String"]>;
  round_not?: InputMaybe<Scalars["String"]>;
  round_not_contains?: InputMaybe<Scalars["String"]>;
  round_not_contains_nocase?: InputMaybe<Scalars["String"]>;
  round_not_ends_with?: InputMaybe<Scalars["String"]>;
  round_not_ends_with_nocase?: InputMaybe<Scalars["String"]>;
  round_not_in?: InputMaybe<Array<Scalars["String"]>>;
  round_not_starts_with?: InputMaybe<Scalars["String"]>;
  round_not_starts_with_nocase?: InputMaybe<Scalars["String"]>;
  round_starts_with?: InputMaybe<Scalars["String"]>;
  round_starts_with_nocase?: InputMaybe<Scalars["String"]>;
  stake?: InputMaybe<Scalars["BigDecimal"]>;
  stake_gt?: InputMaybe<Scalars["BigDecimal"]>;
  stake_gte?: InputMaybe<Scalars["BigDecimal"]>;
  stake_in?: InputMaybe<Array<Scalars["BigDecimal"]>>;
  stake_lt?: InputMaybe<Scalars["BigDecimal"]>;
  stake_lte?: InputMaybe<Scalars["BigDecimal"]>;
  stake_not?: InputMaybe<Scalars["BigDecimal"]>;
  stake_not_in?: InputMaybe<Array<Scalars["BigDecimal"]>>;
  timestamp?: InputMaybe<Scalars["Int"]>;
  timestamp_gt?: InputMaybe<Scalars["Int"]>;
  timestamp_gte?: InputMaybe<Scalars["Int"]>;
  timestamp_in?: InputMaybe<Array<Scalars["Int"]>>;
  timestamp_lt?: InputMaybe<Scalars["Int"]>;
  timestamp_lte?: InputMaybe<Scalars["Int"]>;
  timestamp_not?: InputMaybe<Scalars["Int"]>;
  timestamp_not_in?: InputMaybe<Array<Scalars["Int"]>>;
  transaction?: InputMaybe<Scalars["String"]>;
  transaction_?: InputMaybe<Transaction_Filter>;
  transaction_contains?: InputMaybe<Scalars["String"]>;
  transaction_contains_nocase?: InputMaybe<Scalars["String"]>;
  transaction_ends_with?: InputMaybe<Scalars["String"]>;
  transaction_ends_with_nocase?: InputMaybe<Scalars["String"]>;
  transaction_gt?: InputMaybe<Scalars["String"]>;
  transaction_gte?: InputMaybe<Scalars["String"]>;
  transaction_in?: InputMaybe<Array<Scalars["String"]>>;
  transaction_lt?: InputMaybe<Scalars["String"]>;
  transaction_lte?: InputMaybe<Scalars["String"]>;
  transaction_not?: InputMaybe<Scalars["String"]>;
  transaction_not_contains?: InputMaybe<Scalars["String"]>;
  transaction_not_contains_nocase?: InputMaybe<Scalars["String"]>;
  transaction_not_ends_with?: InputMaybe<Scalars["String"]>;
  transaction_not_ends_with_nocase?: InputMaybe<Scalars["String"]>;
  transaction_not_in?: InputMaybe<Array<Scalars["String"]>>;
  transaction_not_starts_with?: InputMaybe<Scalars["String"]>;
  transaction_not_starts_with_nocase?: InputMaybe<Scalars["String"]>;
  transaction_starts_with?: InputMaybe<Scalars["String"]>;
  transaction_starts_with_nocase?: InputMaybe<Scalars["String"]>;
};

export enum StakeClaimedEvent_OrderBy {
  Delegate = "delegate",
  Delegator = "delegator",
  Fees = "fees",
  Id = "id",
  Round = "round",
  RoundActiveTranscoderCount = "round__activeTranscoderCount",
  RoundDelegatorsCount = "round__delegatorsCount",
  RoundEndBlock = "round__endBlock",
  RoundId = "round__id",
  RoundInflation = "round__inflation",
  RoundInitialized = "round__initialized",
  RoundLength = "round__length",
  RoundMintableTokens = "round__mintableTokens",
  RoundMovedStake = "round__movedStake",
  RoundNewStake = "round__newStake",
  RoundNumActiveTranscoders = "round__numActiveTranscoders",
  RoundParticipationRate = "round__participationRate",
  RoundStartBlock = "round__startBlock",
  RoundStartTimestamp = "round__startTimestamp",
  RoundTotalActiveStake = "round__totalActiveStake",
  RoundTotalSupply = "round__totalSupply",
  RoundVolumeEth = "round__volumeETH",
  RoundVolumeUsd = "round__volumeUSD",
  Stake = "stake",
  Timestamp = "timestamp",
  Transaction = "transaction",
  TransactionBlockNumber = "transaction__blockNumber",
  TransactionFrom = "transaction__from",
  TransactionGasPrice = "transaction__gasPrice",
  TransactionGasUsed = "transaction__gasUsed",
  TransactionId = "transaction__id",
  TransactionTimestamp = "transaction__timestamp",
  TransactionTo = "transaction__to",
}

export type Subscription = {
  __typename: "Subscription";
  /** Access to subgraph metadata */
  _meta?: Maybe<_Meta_>;
  bondEvent?: Maybe<BondEvent>;
  bondEvents: Array<BondEvent>;
  broadcaster?: Maybe<Broadcaster>;
  broadcasters: Array<Broadcaster>;
  burnEvent?: Maybe<BurnEvent>;
  burnEvents: Array<BurnEvent>;
  day?: Maybe<Day>;
  days: Array<Day>;
  delegator?: Maybe<Delegator>;
  delegators: Array<Delegator>;
  depositFundedEvent?: Maybe<DepositFundedEvent>;
  depositFundedEvents: Array<DepositFundedEvent>;
  earningsClaimedEvent?: Maybe<EarningsClaimedEvent>;
  earningsClaimedEvents: Array<EarningsClaimedEvent>;
  event?: Maybe<Event>;
  events: Array<Event>;
  livepeerAccount?: Maybe<LivepeerAccount>;
  livepeerAccounts: Array<LivepeerAccount>;
  migrateDelegatorFinalizedEvent?: Maybe<MigrateDelegatorFinalizedEvent>;
  migrateDelegatorFinalizedEvents: Array<MigrateDelegatorFinalizedEvent>;
  mintEvent?: Maybe<MintEvent>;
  mintEvents: Array<MintEvent>;
  newRoundEvent?: Maybe<NewRoundEvent>;
  newRoundEvents: Array<NewRoundEvent>;
  parameterUpdateEvent?: Maybe<ParameterUpdateEvent>;
  parameterUpdateEvents: Array<ParameterUpdateEvent>;
  pauseEvent?: Maybe<PauseEvent>;
  pauseEvents: Array<PauseEvent>;
  poll?: Maybe<Poll>;
  pollCreatedEvent?: Maybe<PollCreatedEvent>;
  pollCreatedEvents: Array<PollCreatedEvent>;
  pollTallies: Array<PollTally>;
  pollTally?: Maybe<PollTally>;
  polls: Array<Poll>;
  pool?: Maybe<Pool>;
  pools: Array<Pool>;
  protocol?: Maybe<Protocol>;
  protocols: Array<Protocol>;
  rebondEvent?: Maybe<RebondEvent>;
  rebondEvents: Array<RebondEvent>;
  reserveClaimedEvent?: Maybe<ReserveClaimedEvent>;
  reserveClaimedEvents: Array<ReserveClaimedEvent>;
  reserveFundedEvent?: Maybe<ReserveFundedEvent>;
  reserveFundedEvents: Array<ReserveFundedEvent>;
  rewardEvent?: Maybe<RewardEvent>;
  rewardEvents: Array<RewardEvent>;
  round?: Maybe<Round>;
  rounds: Array<Round>;
  serviceURIUpdateEvent?: Maybe<ServiceUriUpdateEvent>;
  serviceURIUpdateEvents: Array<ServiceUriUpdateEvent>;
  setCurrentRewardTokensEvent?: Maybe<SetCurrentRewardTokensEvent>;
  setCurrentRewardTokensEvents: Array<SetCurrentRewardTokensEvent>;
  stakeClaimedEvent?: Maybe<StakeClaimedEvent>;
  stakeClaimedEvents: Array<StakeClaimedEvent>;
  transaction?: Maybe<Transaction>;
  transactions: Array<Transaction>;
  transcoder?: Maybe<Transcoder>;
  transcoderActivatedEvent?: Maybe<TranscoderActivatedEvent>;
  transcoderActivatedEvents: Array<TranscoderActivatedEvent>;
  transcoderDay?: Maybe<TranscoderDay>;
  transcoderDays: Array<TranscoderDay>;
  transcoderDeactivatedEvent?: Maybe<TranscoderDeactivatedEvent>;
  transcoderDeactivatedEvents: Array<TranscoderDeactivatedEvent>;
  transcoderEvictedEvent?: Maybe<TranscoderEvictedEvent>;
  transcoderEvictedEvents: Array<TranscoderEvictedEvent>;
  transcoderResignedEvent?: Maybe<TranscoderResignedEvent>;
  transcoderResignedEvents: Array<TranscoderResignedEvent>;
  transcoderSlashedEvent?: Maybe<TranscoderSlashedEvent>;
  transcoderSlashedEvents: Array<TranscoderSlashedEvent>;
  transcoderUpdateEvent?: Maybe<TranscoderUpdateEvent>;
  transcoderUpdateEvents: Array<TranscoderUpdateEvent>;
  transcoders: Array<Transcoder>;
  transferBondEvent?: Maybe<TransferBondEvent>;
  transferBondEvents: Array<TransferBondEvent>;
  treasuryProposal?: Maybe<TreasuryProposal>;
  treasuryProposals: Array<TreasuryProposal>;
  unbondEvent?: Maybe<UnbondEvent>;
  unbondEvents: Array<UnbondEvent>;
  unbondingLock?: Maybe<UnbondingLock>;
  unbondingLocks: Array<UnbondingLock>;
  unpauseEvent?: Maybe<UnpauseEvent>;
  unpauseEvents: Array<UnpauseEvent>;
  vote?: Maybe<Vote>;
  voteEvent?: Maybe<VoteEvent>;
  voteEvents: Array<VoteEvent>;
  votes: Array<Vote>;
  winningTicketRedeemedEvent?: Maybe<WinningTicketRedeemedEvent>;
  winningTicketRedeemedEvents: Array<WinningTicketRedeemedEvent>;
  withdrawFeesEvent?: Maybe<WithdrawFeesEvent>;
  withdrawFeesEvents: Array<WithdrawFeesEvent>;
  withdrawStakeEvent?: Maybe<WithdrawStakeEvent>;
  withdrawStakeEvents: Array<WithdrawStakeEvent>;
  withdrawalEvent?: Maybe<WithdrawalEvent>;
  withdrawalEvents: Array<WithdrawalEvent>;
};

export type Subscription_MetaArgs = {
  block?: InputMaybe<Block_Height>;
};

export type SubscriptionBondEventArgs = {
  block?: InputMaybe<Block_Height>;
  id: Scalars["ID"];
  subgraphError?: _SubgraphErrorPolicy_;
};

export type SubscriptionBondEventsArgs = {
  block?: InputMaybe<Block_Height>;
  first?: InputMaybe<Scalars["Int"]>;
  orderBy?: InputMaybe<BondEvent_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars["Int"]>;
  subgraphError?: _SubgraphErrorPolicy_;
  where?: InputMaybe<BondEvent_Filter>;
};

export type SubscriptionBroadcasterArgs = {
  block?: InputMaybe<Block_Height>;
  id: Scalars["ID"];
  subgraphError?: _SubgraphErrorPolicy_;
};

export type SubscriptionBroadcastersArgs = {
  block?: InputMaybe<Block_Height>;
  first?: InputMaybe<Scalars["Int"]>;
  orderBy?: InputMaybe<Broadcaster_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars["Int"]>;
  subgraphError?: _SubgraphErrorPolicy_;
  where?: InputMaybe<Broadcaster_Filter>;
};

export type SubscriptionBurnEventArgs = {
  block?: InputMaybe<Block_Height>;
  id: Scalars["ID"];
  subgraphError?: _SubgraphErrorPolicy_;
};

export type SubscriptionBurnEventsArgs = {
  block?: InputMaybe<Block_Height>;
  first?: InputMaybe<Scalars["Int"]>;
  orderBy?: InputMaybe<BurnEvent_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars["Int"]>;
  subgraphError?: _SubgraphErrorPolicy_;
  where?: InputMaybe<BurnEvent_Filter>;
};

export type SubscriptionDayArgs = {
  block?: InputMaybe<Block_Height>;
  id: Scalars["ID"];
  subgraphError?: _SubgraphErrorPolicy_;
};

export type SubscriptionDaysArgs = {
  block?: InputMaybe<Block_Height>;
  first?: InputMaybe<Scalars["Int"]>;
  orderBy?: InputMaybe<Day_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars["Int"]>;
  subgraphError?: _SubgraphErrorPolicy_;
  where?: InputMaybe<Day_Filter>;
};

export type SubscriptionDelegatorArgs = {
  block?: InputMaybe<Block_Height>;
  id: Scalars["ID"];
  subgraphError?: _SubgraphErrorPolicy_;
};

export type SubscriptionDelegatorsArgs = {
  block?: InputMaybe<Block_Height>;
  first?: InputMaybe<Scalars["Int"]>;
  orderBy?: InputMaybe<Delegator_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars["Int"]>;
  subgraphError?: _SubgraphErrorPolicy_;
  where?: InputMaybe<Delegator_Filter>;
};

export type SubscriptionDepositFundedEventArgs = {
  block?: InputMaybe<Block_Height>;
  id: Scalars["ID"];
  subgraphError?: _SubgraphErrorPolicy_;
};

export type SubscriptionDepositFundedEventsArgs = {
  block?: InputMaybe<Block_Height>;
  first?: InputMaybe<Scalars["Int"]>;
  orderBy?: InputMaybe<DepositFundedEvent_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars["Int"]>;
  subgraphError?: _SubgraphErrorPolicy_;
  where?: InputMaybe<DepositFundedEvent_Filter>;
};

export type SubscriptionEarningsClaimedEventArgs = {
  block?: InputMaybe<Block_Height>;
  id: Scalars["ID"];
  subgraphError?: _SubgraphErrorPolicy_;
};

export type SubscriptionEarningsClaimedEventsArgs = {
  block?: InputMaybe<Block_Height>;
  first?: InputMaybe<Scalars["Int"]>;
  orderBy?: InputMaybe<EarningsClaimedEvent_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars["Int"]>;
  subgraphError?: _SubgraphErrorPolicy_;
  where?: InputMaybe<EarningsClaimedEvent_Filter>;
};

export type SubscriptionEventArgs = {
  block?: InputMaybe<Block_Height>;
  id: Scalars["ID"];
  subgraphError?: _SubgraphErrorPolicy_;
};

export type SubscriptionEventsArgs = {
  block?: InputMaybe<Block_Height>;
  first?: InputMaybe<Scalars["Int"]>;
  orderBy?: InputMaybe<Event_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars["Int"]>;
  subgraphError?: _SubgraphErrorPolicy_;
  where?: InputMaybe<Event_Filter>;
};

export type SubscriptionLivepeerAccountArgs = {
  block?: InputMaybe<Block_Height>;
  id: Scalars["ID"];
  subgraphError?: _SubgraphErrorPolicy_;
};

export type SubscriptionLivepeerAccountsArgs = {
  block?: InputMaybe<Block_Height>;
  first?: InputMaybe<Scalars["Int"]>;
  orderBy?: InputMaybe<LivepeerAccount_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars["Int"]>;
  subgraphError?: _SubgraphErrorPolicy_;
  where?: InputMaybe<LivepeerAccount_Filter>;
};

export type SubscriptionMigrateDelegatorFinalizedEventArgs = {
  block?: InputMaybe<Block_Height>;
  id: Scalars["ID"];
  subgraphError?: _SubgraphErrorPolicy_;
};

export type SubscriptionMigrateDelegatorFinalizedEventsArgs = {
  block?: InputMaybe<Block_Height>;
  first?: InputMaybe<Scalars["Int"]>;
  orderBy?: InputMaybe<MigrateDelegatorFinalizedEvent_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars["Int"]>;
  subgraphError?: _SubgraphErrorPolicy_;
  where?: InputMaybe<MigrateDelegatorFinalizedEvent_Filter>;
};

export type SubscriptionMintEventArgs = {
  block?: InputMaybe<Block_Height>;
  id: Scalars["ID"];
  subgraphError?: _SubgraphErrorPolicy_;
};

export type SubscriptionMintEventsArgs = {
  block?: InputMaybe<Block_Height>;
  first?: InputMaybe<Scalars["Int"]>;
  orderBy?: InputMaybe<MintEvent_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars["Int"]>;
  subgraphError?: _SubgraphErrorPolicy_;
  where?: InputMaybe<MintEvent_Filter>;
};

export type SubscriptionNewRoundEventArgs = {
  block?: InputMaybe<Block_Height>;
  id: Scalars["ID"];
  subgraphError?: _SubgraphErrorPolicy_;
};

export type SubscriptionNewRoundEventsArgs = {
  block?: InputMaybe<Block_Height>;
  first?: InputMaybe<Scalars["Int"]>;
  orderBy?: InputMaybe<NewRoundEvent_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars["Int"]>;
  subgraphError?: _SubgraphErrorPolicy_;
  where?: InputMaybe<NewRoundEvent_Filter>;
};

export type SubscriptionParameterUpdateEventArgs = {
  block?: InputMaybe<Block_Height>;
  id: Scalars["ID"];
  subgraphError?: _SubgraphErrorPolicy_;
};

export type SubscriptionParameterUpdateEventsArgs = {
  block?: InputMaybe<Block_Height>;
  first?: InputMaybe<Scalars["Int"]>;
  orderBy?: InputMaybe<ParameterUpdateEvent_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars["Int"]>;
  subgraphError?: _SubgraphErrorPolicy_;
  where?: InputMaybe<ParameterUpdateEvent_Filter>;
};

export type SubscriptionPauseEventArgs = {
  block?: InputMaybe<Block_Height>;
  id: Scalars["ID"];
  subgraphError?: _SubgraphErrorPolicy_;
};

export type SubscriptionPauseEventsArgs = {
  block?: InputMaybe<Block_Height>;
  first?: InputMaybe<Scalars["Int"]>;
  orderBy?: InputMaybe<PauseEvent_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars["Int"]>;
  subgraphError?: _SubgraphErrorPolicy_;
  where?: InputMaybe<PauseEvent_Filter>;
};

export type SubscriptionPollArgs = {
  block?: InputMaybe<Block_Height>;
  id: Scalars["ID"];
  subgraphError?: _SubgraphErrorPolicy_;
};

export type SubscriptionPollCreatedEventArgs = {
  block?: InputMaybe<Block_Height>;
  id: Scalars["ID"];
  subgraphError?: _SubgraphErrorPolicy_;
};

export type SubscriptionPollCreatedEventsArgs = {
  block?: InputMaybe<Block_Height>;
  first?: InputMaybe<Scalars["Int"]>;
  orderBy?: InputMaybe<PollCreatedEvent_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars["Int"]>;
  subgraphError?: _SubgraphErrorPolicy_;
  where?: InputMaybe<PollCreatedEvent_Filter>;
};

export type SubscriptionPollTalliesArgs = {
  block?: InputMaybe<Block_Height>;
  first?: InputMaybe<Scalars["Int"]>;
  orderBy?: InputMaybe<PollTally_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars["Int"]>;
  subgraphError?: _SubgraphErrorPolicy_;
  where?: InputMaybe<PollTally_Filter>;
};

export type SubscriptionPollTallyArgs = {
  block?: InputMaybe<Block_Height>;
  id: Scalars["ID"];
  subgraphError?: _SubgraphErrorPolicy_;
};

export type SubscriptionPollsArgs = {
  block?: InputMaybe<Block_Height>;
  first?: InputMaybe<Scalars["Int"]>;
  orderBy?: InputMaybe<Poll_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars["Int"]>;
  subgraphError?: _SubgraphErrorPolicy_;
  where?: InputMaybe<Poll_Filter>;
};

export type SubscriptionPoolArgs = {
  block?: InputMaybe<Block_Height>;
  id: Scalars["ID"];
  subgraphError?: _SubgraphErrorPolicy_;
};

export type SubscriptionPoolsArgs = {
  block?: InputMaybe<Block_Height>;
  first?: InputMaybe<Scalars["Int"]>;
  orderBy?: InputMaybe<Pool_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars["Int"]>;
  subgraphError?: _SubgraphErrorPolicy_;
  where?: InputMaybe<Pool_Filter>;
};

export type SubscriptionProtocolArgs = {
  block?: InputMaybe<Block_Height>;
  id: Scalars["ID"];
  subgraphError?: _SubgraphErrorPolicy_;
};

export type SubscriptionProtocolsArgs = {
  block?: InputMaybe<Block_Height>;
  first?: InputMaybe<Scalars["Int"]>;
  orderBy?: InputMaybe<Protocol_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars["Int"]>;
  subgraphError?: _SubgraphErrorPolicy_;
  where?: InputMaybe<Protocol_Filter>;
};

export type SubscriptionRebondEventArgs = {
  block?: InputMaybe<Block_Height>;
  id: Scalars["ID"];
  subgraphError?: _SubgraphErrorPolicy_;
};

export type SubscriptionRebondEventsArgs = {
  block?: InputMaybe<Block_Height>;
  first?: InputMaybe<Scalars["Int"]>;
  orderBy?: InputMaybe<RebondEvent_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars["Int"]>;
  subgraphError?: _SubgraphErrorPolicy_;
  where?: InputMaybe<RebondEvent_Filter>;
};

export type SubscriptionReserveClaimedEventArgs = {
  block?: InputMaybe<Block_Height>;
  id: Scalars["ID"];
  subgraphError?: _SubgraphErrorPolicy_;
};

export type SubscriptionReserveClaimedEventsArgs = {
  block?: InputMaybe<Block_Height>;
  first?: InputMaybe<Scalars["Int"]>;
  orderBy?: InputMaybe<ReserveClaimedEvent_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars["Int"]>;
  subgraphError?: _SubgraphErrorPolicy_;
  where?: InputMaybe<ReserveClaimedEvent_Filter>;
};

export type SubscriptionReserveFundedEventArgs = {
  block?: InputMaybe<Block_Height>;
  id: Scalars["ID"];
  subgraphError?: _SubgraphErrorPolicy_;
};

export type SubscriptionReserveFundedEventsArgs = {
  block?: InputMaybe<Block_Height>;
  first?: InputMaybe<Scalars["Int"]>;
  orderBy?: InputMaybe<ReserveFundedEvent_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars["Int"]>;
  subgraphError?: _SubgraphErrorPolicy_;
  where?: InputMaybe<ReserveFundedEvent_Filter>;
};

export type SubscriptionRewardEventArgs = {
  block?: InputMaybe<Block_Height>;
  id: Scalars["ID"];
  subgraphError?: _SubgraphErrorPolicy_;
};

export type SubscriptionRewardEventsArgs = {
  block?: InputMaybe<Block_Height>;
  first?: InputMaybe<Scalars["Int"]>;
  orderBy?: InputMaybe<RewardEvent_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars["Int"]>;
  subgraphError?: _SubgraphErrorPolicy_;
  where?: InputMaybe<RewardEvent_Filter>;
};

export type SubscriptionRoundArgs = {
  block?: InputMaybe<Block_Height>;
  id: Scalars["ID"];
  subgraphError?: _SubgraphErrorPolicy_;
};

export type SubscriptionRoundsArgs = {
  block?: InputMaybe<Block_Height>;
  first?: InputMaybe<Scalars["Int"]>;
  orderBy?: InputMaybe<Round_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars["Int"]>;
  subgraphError?: _SubgraphErrorPolicy_;
  where?: InputMaybe<Round_Filter>;
};

export type SubscriptionServiceUriUpdateEventArgs = {
  block?: InputMaybe<Block_Height>;
  id: Scalars["ID"];
  subgraphError?: _SubgraphErrorPolicy_;
};

export type SubscriptionServiceUriUpdateEventsArgs = {
  block?: InputMaybe<Block_Height>;
  first?: InputMaybe<Scalars["Int"]>;
  orderBy?: InputMaybe<ServiceUriUpdateEvent_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars["Int"]>;
  subgraphError?: _SubgraphErrorPolicy_;
  where?: InputMaybe<ServiceUriUpdateEvent_Filter>;
};

export type SubscriptionSetCurrentRewardTokensEventArgs = {
  block?: InputMaybe<Block_Height>;
  id: Scalars["ID"];
  subgraphError?: _SubgraphErrorPolicy_;
};

export type SubscriptionSetCurrentRewardTokensEventsArgs = {
  block?: InputMaybe<Block_Height>;
  first?: InputMaybe<Scalars["Int"]>;
  orderBy?: InputMaybe<SetCurrentRewardTokensEvent_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars["Int"]>;
  subgraphError?: _SubgraphErrorPolicy_;
  where?: InputMaybe<SetCurrentRewardTokensEvent_Filter>;
};

export type SubscriptionStakeClaimedEventArgs = {
  block?: InputMaybe<Block_Height>;
  id: Scalars["ID"];
  subgraphError?: _SubgraphErrorPolicy_;
};

export type SubscriptionStakeClaimedEventsArgs = {
  block?: InputMaybe<Block_Height>;
  first?: InputMaybe<Scalars["Int"]>;
  orderBy?: InputMaybe<StakeClaimedEvent_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars["Int"]>;
  subgraphError?: _SubgraphErrorPolicy_;
  where?: InputMaybe<StakeClaimedEvent_Filter>;
};

export type SubscriptionTransactionArgs = {
  block?: InputMaybe<Block_Height>;
  id: Scalars["ID"];
  subgraphError?: _SubgraphErrorPolicy_;
};

export type SubscriptionTransactionsArgs = {
  block?: InputMaybe<Block_Height>;
  first?: InputMaybe<Scalars["Int"]>;
  orderBy?: InputMaybe<Transaction_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars["Int"]>;
  subgraphError?: _SubgraphErrorPolicy_;
  where?: InputMaybe<Transaction_Filter>;
};

export type SubscriptionTranscoderArgs = {
  block?: InputMaybe<Block_Height>;
  id: Scalars["ID"];
  subgraphError?: _SubgraphErrorPolicy_;
};

export type SubscriptionTranscoderActivatedEventArgs = {
  block?: InputMaybe<Block_Height>;
  id: Scalars["ID"];
  subgraphError?: _SubgraphErrorPolicy_;
};

export type SubscriptionTranscoderActivatedEventsArgs = {
  block?: InputMaybe<Block_Height>;
  first?: InputMaybe<Scalars["Int"]>;
  orderBy?: InputMaybe<TranscoderActivatedEvent_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars["Int"]>;
  subgraphError?: _SubgraphErrorPolicy_;
  where?: InputMaybe<TranscoderActivatedEvent_Filter>;
};

export type SubscriptionTranscoderDayArgs = {
  block?: InputMaybe<Block_Height>;
  id: Scalars["ID"];
  subgraphError?: _SubgraphErrorPolicy_;
};

export type SubscriptionTranscoderDaysArgs = {
  block?: InputMaybe<Block_Height>;
  first?: InputMaybe<Scalars["Int"]>;
  orderBy?: InputMaybe<TranscoderDay_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars["Int"]>;
  subgraphError?: _SubgraphErrorPolicy_;
  where?: InputMaybe<TranscoderDay_Filter>;
};

export type SubscriptionTranscoderDeactivatedEventArgs = {
  block?: InputMaybe<Block_Height>;
  id: Scalars["ID"];
  subgraphError?: _SubgraphErrorPolicy_;
};

export type SubscriptionTranscoderDeactivatedEventsArgs = {
  block?: InputMaybe<Block_Height>;
  first?: InputMaybe<Scalars["Int"]>;
  orderBy?: InputMaybe<TranscoderDeactivatedEvent_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars["Int"]>;
  subgraphError?: _SubgraphErrorPolicy_;
  where?: InputMaybe<TranscoderDeactivatedEvent_Filter>;
};

export type SubscriptionTranscoderEvictedEventArgs = {
  block?: InputMaybe<Block_Height>;
  id: Scalars["ID"];
  subgraphError?: _SubgraphErrorPolicy_;
};

export type SubscriptionTranscoderEvictedEventsArgs = {
  block?: InputMaybe<Block_Height>;
  first?: InputMaybe<Scalars["Int"]>;
  orderBy?: InputMaybe<TranscoderEvictedEvent_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars["Int"]>;
  subgraphError?: _SubgraphErrorPolicy_;
  where?: InputMaybe<TranscoderEvictedEvent_Filter>;
};

export type SubscriptionTranscoderResignedEventArgs = {
  block?: InputMaybe<Block_Height>;
  id: Scalars["ID"];
  subgraphError?: _SubgraphErrorPolicy_;
};

export type SubscriptionTranscoderResignedEventsArgs = {
  block?: InputMaybe<Block_Height>;
  first?: InputMaybe<Scalars["Int"]>;
  orderBy?: InputMaybe<TranscoderResignedEvent_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars["Int"]>;
  subgraphError?: _SubgraphErrorPolicy_;
  where?: InputMaybe<TranscoderResignedEvent_Filter>;
};

export type SubscriptionTranscoderSlashedEventArgs = {
  block?: InputMaybe<Block_Height>;
  id: Scalars["ID"];
  subgraphError?: _SubgraphErrorPolicy_;
};

export type SubscriptionTranscoderSlashedEventsArgs = {
  block?: InputMaybe<Block_Height>;
  first?: InputMaybe<Scalars["Int"]>;
  orderBy?: InputMaybe<TranscoderSlashedEvent_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars["Int"]>;
  subgraphError?: _SubgraphErrorPolicy_;
  where?: InputMaybe<TranscoderSlashedEvent_Filter>;
};

export type SubscriptionTranscoderUpdateEventArgs = {
  block?: InputMaybe<Block_Height>;
  id: Scalars["ID"];
  subgraphError?: _SubgraphErrorPolicy_;
};

export type SubscriptionTranscoderUpdateEventsArgs = {
  block?: InputMaybe<Block_Height>;
  first?: InputMaybe<Scalars["Int"]>;
  orderBy?: InputMaybe<TranscoderUpdateEvent_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars["Int"]>;
  subgraphError?: _SubgraphErrorPolicy_;
  where?: InputMaybe<TranscoderUpdateEvent_Filter>;
};

export type SubscriptionTranscodersArgs = {
  block?: InputMaybe<Block_Height>;
  first?: InputMaybe<Scalars["Int"]>;
  orderBy?: InputMaybe<Transcoder_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars["Int"]>;
  subgraphError?: _SubgraphErrorPolicy_;
  where?: InputMaybe<Transcoder_Filter>;
};

export type SubscriptionTransferBondEventArgs = {
  block?: InputMaybe<Block_Height>;
  id: Scalars["ID"];
  subgraphError?: _SubgraphErrorPolicy_;
};

export type SubscriptionTransferBondEventsArgs = {
  block?: InputMaybe<Block_Height>;
  first?: InputMaybe<Scalars["Int"]>;
  orderBy?: InputMaybe<TransferBondEvent_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars["Int"]>;
  subgraphError?: _SubgraphErrorPolicy_;
  where?: InputMaybe<TransferBondEvent_Filter>;
};

export type SubscriptionTreasuryProposalArgs = {
  block?: InputMaybe<Block_Height>;
  id: Scalars["ID"];
  subgraphError?: _SubgraphErrorPolicy_;
};

export type SubscriptionTreasuryProposalsArgs = {
  block?: InputMaybe<Block_Height>;
  first?: InputMaybe<Scalars["Int"]>;
  orderBy?: InputMaybe<TreasuryProposal_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars["Int"]>;
  subgraphError?: _SubgraphErrorPolicy_;
  where?: InputMaybe<TreasuryProposal_Filter>;
};

export type SubscriptionUnbondEventArgs = {
  block?: InputMaybe<Block_Height>;
  id: Scalars["ID"];
  subgraphError?: _SubgraphErrorPolicy_;
};

export type SubscriptionUnbondEventsArgs = {
  block?: InputMaybe<Block_Height>;
  first?: InputMaybe<Scalars["Int"]>;
  orderBy?: InputMaybe<UnbondEvent_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars["Int"]>;
  subgraphError?: _SubgraphErrorPolicy_;
  where?: InputMaybe<UnbondEvent_Filter>;
};

export type SubscriptionUnbondingLockArgs = {
  block?: InputMaybe<Block_Height>;
  id: Scalars["ID"];
  subgraphError?: _SubgraphErrorPolicy_;
};

export type SubscriptionUnbondingLocksArgs = {
  block?: InputMaybe<Block_Height>;
  first?: InputMaybe<Scalars["Int"]>;
  orderBy?: InputMaybe<UnbondingLock_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars["Int"]>;
  subgraphError?: _SubgraphErrorPolicy_;
  where?: InputMaybe<UnbondingLock_Filter>;
};

export type SubscriptionUnpauseEventArgs = {
  block?: InputMaybe<Block_Height>;
  id: Scalars["ID"];
  subgraphError?: _SubgraphErrorPolicy_;
};

export type SubscriptionUnpauseEventsArgs = {
  block?: InputMaybe<Block_Height>;
  first?: InputMaybe<Scalars["Int"]>;
  orderBy?: InputMaybe<UnpauseEvent_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars["Int"]>;
  subgraphError?: _SubgraphErrorPolicy_;
  where?: InputMaybe<UnpauseEvent_Filter>;
};

export type SubscriptionVoteArgs = {
  block?: InputMaybe<Block_Height>;
  id: Scalars["ID"];
  subgraphError?: _SubgraphErrorPolicy_;
};

export type SubscriptionVoteEventArgs = {
  block?: InputMaybe<Block_Height>;
  id: Scalars["ID"];
  subgraphError?: _SubgraphErrorPolicy_;
};

export type SubscriptionVoteEventsArgs = {
  block?: InputMaybe<Block_Height>;
  first?: InputMaybe<Scalars["Int"]>;
  orderBy?: InputMaybe<VoteEvent_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars["Int"]>;
  subgraphError?: _SubgraphErrorPolicy_;
  where?: InputMaybe<VoteEvent_Filter>;
};

export type SubscriptionVotesArgs = {
  block?: InputMaybe<Block_Height>;
  first?: InputMaybe<Scalars["Int"]>;
  orderBy?: InputMaybe<Vote_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars["Int"]>;
  subgraphError?: _SubgraphErrorPolicy_;
  where?: InputMaybe<Vote_Filter>;
};

export type SubscriptionWinningTicketRedeemedEventArgs = {
  block?: InputMaybe<Block_Height>;
  id: Scalars["ID"];
  subgraphError?: _SubgraphErrorPolicy_;
};

export type SubscriptionWinningTicketRedeemedEventsArgs = {
  block?: InputMaybe<Block_Height>;
  first?: InputMaybe<Scalars["Int"]>;
  orderBy?: InputMaybe<WinningTicketRedeemedEvent_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars["Int"]>;
  subgraphError?: _SubgraphErrorPolicy_;
  where?: InputMaybe<WinningTicketRedeemedEvent_Filter>;
};

export type SubscriptionWithdrawFeesEventArgs = {
  block?: InputMaybe<Block_Height>;
  id: Scalars["ID"];
  subgraphError?: _SubgraphErrorPolicy_;
};

export type SubscriptionWithdrawFeesEventsArgs = {
  block?: InputMaybe<Block_Height>;
  first?: InputMaybe<Scalars["Int"]>;
  orderBy?: InputMaybe<WithdrawFeesEvent_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars["Int"]>;
  subgraphError?: _SubgraphErrorPolicy_;
  where?: InputMaybe<WithdrawFeesEvent_Filter>;
};

export type SubscriptionWithdrawStakeEventArgs = {
  block?: InputMaybe<Block_Height>;
  id: Scalars["ID"];
  subgraphError?: _SubgraphErrorPolicy_;
};

export type SubscriptionWithdrawStakeEventsArgs = {
  block?: InputMaybe<Block_Height>;
  first?: InputMaybe<Scalars["Int"]>;
  orderBy?: InputMaybe<WithdrawStakeEvent_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars["Int"]>;
  subgraphError?: _SubgraphErrorPolicy_;
  where?: InputMaybe<WithdrawStakeEvent_Filter>;
};

export type SubscriptionWithdrawalEventArgs = {
  block?: InputMaybe<Block_Height>;
  id: Scalars["ID"];
  subgraphError?: _SubgraphErrorPolicy_;
};

export type SubscriptionWithdrawalEventsArgs = {
  block?: InputMaybe<Block_Height>;
  first?: InputMaybe<Scalars["Int"]>;
  orderBy?: InputMaybe<WithdrawalEvent_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars["Int"]>;
  subgraphError?: _SubgraphErrorPolicy_;
  where?: InputMaybe<WithdrawalEvent_Filter>;
};

/**
 * Transaction entities are created for each Ethereum transaction that contains an interaction within Livepeer contracts.
 *
 */
export type Transaction = {
  __typename: "Transaction";
  /** Block transaction was mined in */
  blockNumber: Scalars["BigInt"];
  /** The events emitted within this transaction */
  events?: Maybe<Array<Event>>;
  /** The sending party of the transaction */
  from: Scalars["String"];
  /** Cost per unit of gas specified for the transaction */
  gasPrice: Scalars["BigInt"];
  /** Actually is the limit of gas in the transaction, pending update in downstream projects */
  gasUsed: Scalars["BigInt"];
  /** Ethereum transaction hash */
  id: Scalars["ID"];
  /** Timestamp for transaction */
  timestamp: Scalars["Int"];
  /** The receiving party of the transaction */
  to: Scalars["String"];
};

/**
 * Transaction entities are created for each Ethereum transaction that contains an interaction within Livepeer contracts.
 *
 */
export type TransactionEventsArgs = {
  first?: InputMaybe<Scalars["Int"]>;
  orderBy?: InputMaybe<Event_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars["Int"]>;
  where?: InputMaybe<Event_Filter>;
};

export type Transaction_Filter = {
  /** Filter for the block changed event. */
  _change_block?: InputMaybe<BlockChangedFilter>;
  and?: InputMaybe<Array<InputMaybe<Transaction_Filter>>>;
  blockNumber?: InputMaybe<Scalars["BigInt"]>;
  blockNumber_gt?: InputMaybe<Scalars["BigInt"]>;
  blockNumber_gte?: InputMaybe<Scalars["BigInt"]>;
  blockNumber_in?: InputMaybe<Array<Scalars["BigInt"]>>;
  blockNumber_lt?: InputMaybe<Scalars["BigInt"]>;
  blockNumber_lte?: InputMaybe<Scalars["BigInt"]>;
  blockNumber_not?: InputMaybe<Scalars["BigInt"]>;
  blockNumber_not_in?: InputMaybe<Array<Scalars["BigInt"]>>;
  events_?: InputMaybe<Event_Filter>;
  from?: InputMaybe<Scalars["String"]>;
  from_contains?: InputMaybe<Scalars["String"]>;
  from_contains_nocase?: InputMaybe<Scalars["String"]>;
  from_ends_with?: InputMaybe<Scalars["String"]>;
  from_ends_with_nocase?: InputMaybe<Scalars["String"]>;
  from_gt?: InputMaybe<Scalars["String"]>;
  from_gte?: InputMaybe<Scalars["String"]>;
  from_in?: InputMaybe<Array<Scalars["String"]>>;
  from_lt?: InputMaybe<Scalars["String"]>;
  from_lte?: InputMaybe<Scalars["String"]>;
  from_not?: InputMaybe<Scalars["String"]>;
  from_not_contains?: InputMaybe<Scalars["String"]>;
  from_not_contains_nocase?: InputMaybe<Scalars["String"]>;
  from_not_ends_with?: InputMaybe<Scalars["String"]>;
  from_not_ends_with_nocase?: InputMaybe<Scalars["String"]>;
  from_not_in?: InputMaybe<Array<Scalars["String"]>>;
  from_not_starts_with?: InputMaybe<Scalars["String"]>;
  from_not_starts_with_nocase?: InputMaybe<Scalars["String"]>;
  from_starts_with?: InputMaybe<Scalars["String"]>;
  from_starts_with_nocase?: InputMaybe<Scalars["String"]>;
  gasPrice?: InputMaybe<Scalars["BigInt"]>;
  gasPrice_gt?: InputMaybe<Scalars["BigInt"]>;
  gasPrice_gte?: InputMaybe<Scalars["BigInt"]>;
  gasPrice_in?: InputMaybe<Array<Scalars["BigInt"]>>;
  gasPrice_lt?: InputMaybe<Scalars["BigInt"]>;
  gasPrice_lte?: InputMaybe<Scalars["BigInt"]>;
  gasPrice_not?: InputMaybe<Scalars["BigInt"]>;
  gasPrice_not_in?: InputMaybe<Array<Scalars["BigInt"]>>;
  gasUsed?: InputMaybe<Scalars["BigInt"]>;
  gasUsed_gt?: InputMaybe<Scalars["BigInt"]>;
  gasUsed_gte?: InputMaybe<Scalars["BigInt"]>;
  gasUsed_in?: InputMaybe<Array<Scalars["BigInt"]>>;
  gasUsed_lt?: InputMaybe<Scalars["BigInt"]>;
  gasUsed_lte?: InputMaybe<Scalars["BigInt"]>;
  gasUsed_not?: InputMaybe<Scalars["BigInt"]>;
  gasUsed_not_in?: InputMaybe<Array<Scalars["BigInt"]>>;
  id?: InputMaybe<Scalars["ID"]>;
  id_gt?: InputMaybe<Scalars["ID"]>;
  id_gte?: InputMaybe<Scalars["ID"]>;
  id_in?: InputMaybe<Array<Scalars["ID"]>>;
  id_lt?: InputMaybe<Scalars["ID"]>;
  id_lte?: InputMaybe<Scalars["ID"]>;
  id_not?: InputMaybe<Scalars["ID"]>;
  id_not_in?: InputMaybe<Array<Scalars["ID"]>>;
  or?: InputMaybe<Array<InputMaybe<Transaction_Filter>>>;
  timestamp?: InputMaybe<Scalars["Int"]>;
  timestamp_gt?: InputMaybe<Scalars["Int"]>;
  timestamp_gte?: InputMaybe<Scalars["Int"]>;
  timestamp_in?: InputMaybe<Array<Scalars["Int"]>>;
  timestamp_lt?: InputMaybe<Scalars["Int"]>;
  timestamp_lte?: InputMaybe<Scalars["Int"]>;
  timestamp_not?: InputMaybe<Scalars["Int"]>;
  timestamp_not_in?: InputMaybe<Array<Scalars["Int"]>>;
  to?: InputMaybe<Scalars["String"]>;
  to_contains?: InputMaybe<Scalars["String"]>;
  to_contains_nocase?: InputMaybe<Scalars["String"]>;
  to_ends_with?: InputMaybe<Scalars["String"]>;
  to_ends_with_nocase?: InputMaybe<Scalars["String"]>;
  to_gt?: InputMaybe<Scalars["String"]>;
  to_gte?: InputMaybe<Scalars["String"]>;
  to_in?: InputMaybe<Array<Scalars["String"]>>;
  to_lt?: InputMaybe<Scalars["String"]>;
  to_lte?: InputMaybe<Scalars["String"]>;
  to_not?: InputMaybe<Scalars["String"]>;
  to_not_contains?: InputMaybe<Scalars["String"]>;
  to_not_contains_nocase?: InputMaybe<Scalars["String"]>;
  to_not_ends_with?: InputMaybe<Scalars["String"]>;
  to_not_ends_with_nocase?: InputMaybe<Scalars["String"]>;
  to_not_in?: InputMaybe<Array<Scalars["String"]>>;
  to_not_starts_with?: InputMaybe<Scalars["String"]>;
  to_not_starts_with_nocase?: InputMaybe<Scalars["String"]>;
  to_starts_with?: InputMaybe<Scalars["String"]>;
  to_starts_with_nocase?: InputMaybe<Scalars["String"]>;
};

export enum Transaction_OrderBy {
  BlockNumber = "blockNumber",
  Events = "events",
  From = "from",
  GasPrice = "gasPrice",
  GasUsed = "gasUsed",
  Id = "id",
  Timestamp = "timestamp",
  To = "to",
}

/**
 * Perform transcoding work for the network. The transcoders with the most delegated stake are elected as active transcoders that process transcode jobs for the network.
 *
 */
export type Transcoder = {
  __typename: "Transcoder";
  /** Round in which the transcoder became active - 0 if inactive */
  activationRound: Scalars["BigInt"];
  /** The activation date beginning at 12:00am UTC */
  activationTimestamp: Scalars["Int"];
  /** Whether or not the transcoder is active */
  active: Scalars["Boolean"];
  /** Round in which the transcoder will become inactive */
  deactivationRound: Scalars["BigInt"];
  /** Delegator that registered this transcoder */
  delegator?: Maybe<Delegator>;
  /** Delegators bonded to the transcoder */
  delegators?: Maybe<Array<Delegator>>;
  /** % of fees paid to delegators by transcoder */
  feeShare: Scalars["BigInt"];
  /** The last timestamped update to fee share, beginning at 12:00am UTC */
  feeShareUpdateTimestamp: Scalars["Int"];
  /** Transcoder's ETH address */
  id: Scalars["ID"];
  /** Round for which the stake was last updated while the transcoder is active */
  lastActiveStakeUpdateRound: Scalars["BigInt"];
  /** Last round that the transcoder called reward */
  lastRewardRound?: Maybe<Round>;
  /** Total fees generated by the transcoder in ETH (before distribution and in past 90 days) */
  ninetyDayVolumeETH: Scalars["BigDecimal"];
  /** Pools associated with the transcoder */
  pools?: Maybe<Array<Pool>>;
  /** % of block reward cut paid to transcoder by a delegator */
  rewardCut: Scalars["BigInt"];
  /** The last timestamped update to reward cut, beginning at 12:00am UTC */
  rewardCutUpdateTimestamp: Scalars["Int"];
  /** Service URI endpoint that can be used to send off-chain requests */
  serviceURI?: Maybe<Scalars["String"]>;
  /** Total fees generated by the transcoder in ETH (before distribution and in past 60 days) */
  sixtyDayVolumeETH: Scalars["BigDecimal"];
  /** Status of the transcoder */
  status: TranscoderStatus;
  /** Total fees generated by the transcoder in ETH (before distribution and in past 30 days) */
  thirtyDayVolumeETH: Scalars["BigDecimal"];
  /** Total tokens delegated toward a transcoder (including their own) */
  totalStake: Scalars["BigDecimal"];
  /** Total fees generated by the transcoder in ETH (before distribution to delegators) */
  totalVolumeETH: Scalars["BigDecimal"];
  /** Total fees generated by the transcoder in USD (before distribution to delegators) */
  totalVolumeUSD: Scalars["BigDecimal"];
  /** Days which the transcoder earned fees */
  transcoderDays: Array<TranscoderDay>;
};

/**
 * Perform transcoding work for the network. The transcoders with the most delegated stake are elected as active transcoders that process transcode jobs for the network.
 *
 */
export type TranscoderDelegatorsArgs = {
  first?: InputMaybe<Scalars["Int"]>;
  orderBy?: InputMaybe<Delegator_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars["Int"]>;
  where?: InputMaybe<Delegator_Filter>;
};

/**
 * Perform transcoding work for the network. The transcoders with the most delegated stake are elected as active transcoders that process transcode jobs for the network.
 *
 */
export type TranscoderPoolsArgs = {
  first?: InputMaybe<Scalars["Int"]>;
  orderBy?: InputMaybe<Pool_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars["Int"]>;
  where?: InputMaybe<Pool_Filter>;
};

/**
 * Perform transcoding work for the network. The transcoders with the most delegated stake are elected as active transcoders that process transcode jobs for the network.
 *
 */
export type TranscoderTranscoderDaysArgs = {
  first?: InputMaybe<Scalars["Int"]>;
  orderBy?: InputMaybe<TranscoderDay_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  skip?: InputMaybe<Scalars["Int"]>;
  where?: InputMaybe<TranscoderDay_Filter>;
};

/**
 * TranscoderActivatedEvent entities are created for every emitted TranscoderActivated event.
 *
 */
export type TranscoderActivatedEvent = Event & {
  __typename: "TranscoderActivatedEvent";
  /** Future round in which the delegate will become active */
  activationRound: Scalars["BigInt"];
  /** Reference to the delegate that will be active */
  delegate: Transcoder;
  /** Ethereum transaction hash + event log index */
  id: Scalars["ID"];
  /** Reference to the round the event occured in */
  round: Round;
  /** Timestamp of the transaction the event was included in */
  timestamp: Scalars["Int"];
  /** Reference to the transaction the event was included in */
  transaction: Transaction;
};

export type TranscoderActivatedEvent_Filter = {
  /** Filter for the block changed event. */
  _change_block?: InputMaybe<BlockChangedFilter>;
  activationRound?: InputMaybe<Scalars["BigInt"]>;
  activationRound_gt?: InputMaybe<Scalars["BigInt"]>;
  activationRound_gte?: InputMaybe<Scalars["BigInt"]>;
  activationRound_in?: InputMaybe<Array<Scalars["BigInt"]>>;
  activationRound_lt?: InputMaybe<Scalars["BigInt"]>;
  activationRound_lte?: InputMaybe<Scalars["BigInt"]>;
  activationRound_not?: InputMaybe<Scalars["BigInt"]>;
  activationRound_not_in?: InputMaybe<Array<Scalars["BigInt"]>>;
  and?: InputMaybe<Array<InputMaybe<TranscoderActivatedEvent_Filter>>>;
  delegate?: InputMaybe<Scalars["String"]>;
  delegate_?: InputMaybe<Transcoder_Filter>;
  delegate_contains?: InputMaybe<Scalars["String"]>;
  delegate_contains_nocase?: InputMaybe<Scalars["String"]>;
  delegate_ends_with?: InputMaybe<Scalars["String"]>;
  delegate_ends_with_nocase?: InputMaybe<Scalars["String"]>;
  delegate_gt?: InputMaybe<Scalars["String"]>;
  delegate_gte?: InputMaybe<Scalars["String"]>;
  delegate_in?: InputMaybe<Array<Scalars["String"]>>;
  delegate_lt?: InputMaybe<Scalars["String"]>;
  delegate_lte?: InputMaybe<Scalars["String"]>;
  delegate_not?: InputMaybe<Scalars["String"]>;
  delegate_not_contains?: InputMaybe<Scalars["String"]>;
  delegate_not_contains_nocase?: InputMaybe<Scalars["String"]>;
  delegate_not_ends_with?: InputMaybe<Scalars["String"]>;
  delegate_not_ends_with_nocase?: InputMaybe<Scalars["String"]>;
  delegate_not_in?: InputMaybe<Array<Scalars["String"]>>;
  delegate_not_starts_with?: InputMaybe<Scalars["String"]>;
  delegate_not_starts_with_nocase?: InputMaybe<Scalars["String"]>;
  delegate_starts_with?: InputMaybe<Scalars["String"]>;
  delegate_starts_with_nocase?: InputMaybe<Scalars["String"]>;
  id?: InputMaybe<Scalars["ID"]>;
  id_gt?: InputMaybe<Scalars["ID"]>;
  id_gte?: InputMaybe<Scalars["ID"]>;
  id_in?: InputMaybe<Array<Scalars["ID"]>>;
  id_lt?: InputMaybe<Scalars["ID"]>;
  id_lte?: InputMaybe<Scalars["ID"]>;
  id_not?: InputMaybe<Scalars["ID"]>;
  id_not_in?: InputMaybe<Array<Scalars["ID"]>>;
  or?: InputMaybe<Array<InputMaybe<TranscoderActivatedEvent_Filter>>>;
  round?: InputMaybe<Scalars["String"]>;
  round_?: InputMaybe<Round_Filter>;
  round_contains?: InputMaybe<Scalars["String"]>;
  round_contains_nocase?: InputMaybe<Scalars["String"]>;
  round_ends_with?: InputMaybe<Scalars["String"]>;
  round_ends_with_nocase?: InputMaybe<Scalars["String"]>;
  round_gt?: InputMaybe<Scalars["String"]>;
  round_gte?: InputMaybe<Scalars["String"]>;
  round_in?: InputMaybe<Array<Scalars["String"]>>;
  round_lt?: InputMaybe<Scalars["String"]>;
  round_lte?: InputMaybe<Scalars["String"]>;
  round_not?: InputMaybe<Scalars["String"]>;
  round_not_contains?: InputMaybe<Scalars["String"]>;
  round_not_contains_nocase?: InputMaybe<Scalars["String"]>;
  round_not_ends_with?: InputMaybe<Scalars["String"]>;
  round_not_ends_with_nocase?: InputMaybe<Scalars["String"]>;
  round_not_in?: InputMaybe<Array<Scalars["String"]>>;
  round_not_starts_with?: InputMaybe<Scalars["String"]>;
  round_not_starts_with_nocase?: InputMaybe<Scalars["String"]>;
  round_starts_with?: InputMaybe<Scalars["String"]>;
  round_starts_with_nocase?: InputMaybe<Scalars["String"]>;
  timestamp?: InputMaybe<Scalars["Int"]>;
  timestamp_gt?: InputMaybe<Scalars["Int"]>;
  timestamp_gte?: InputMaybe<Scalars["Int"]>;
  timestamp_in?: InputMaybe<Array<Scalars["Int"]>>;
  timestamp_lt?: InputMaybe<Scalars["Int"]>;
  timestamp_lte?: InputMaybe<Scalars["Int"]>;
  timestamp_not?: InputMaybe<Scalars["Int"]>;
  timestamp_not_in?: InputMaybe<Array<Scalars["Int"]>>;
  transaction?: InputMaybe<Scalars["String"]>;
  transaction_?: InputMaybe<Transaction_Filter>;
  transaction_contains?: InputMaybe<Scalars["String"]>;
  transaction_contains_nocase?: InputMaybe<Scalars["String"]>;
  transaction_ends_with?: InputMaybe<Scalars["String"]>;
  transaction_ends_with_nocase?: InputMaybe<Scalars["String"]>;
  transaction_gt?: InputMaybe<Scalars["String"]>;
  transaction_gte?: InputMaybe<Scalars["String"]>;
  transaction_in?: InputMaybe<Array<Scalars["String"]>>;
  transaction_lt?: InputMaybe<Scalars["String"]>;
  transaction_lte?: InputMaybe<Scalars["String"]>;
  transaction_not?: InputMaybe<Scalars["String"]>;
  transaction_not_contains?: InputMaybe<Scalars["String"]>;
  transaction_not_contains_nocase?: InputMaybe<Scalars["String"]>;
  transaction_not_ends_with?: InputMaybe<Scalars["String"]>;
  transaction_not_ends_with_nocase?: InputMaybe<Scalars["String"]>;
  transaction_not_in?: InputMaybe<Array<Scalars["String"]>>;
  transaction_not_starts_with?: InputMaybe<Scalars["String"]>;
  transaction_not_starts_with_nocase?: InputMaybe<Scalars["String"]>;
  transaction_starts_with?: InputMaybe<Scalars["String"]>;
  transaction_starts_with_nocase?: InputMaybe<Scalars["String"]>;
};

export enum TranscoderActivatedEvent_OrderBy {
  ActivationRound = "activationRound",
  Delegate = "delegate",
  DelegateActivationRound = "delegate__activationRound",
  DelegateActivationTimestamp = "delegate__activationTimestamp",
  DelegateActive = "delegate__active",
  DelegateDeactivationRound = "delegate__deactivationRound",
  DelegateFeeShare = "delegate__feeShare",
  DelegateFeeShareUpdateTimestamp = "delegate__feeShareUpdateTimestamp",
  DelegateId = "delegate__id",
  DelegateLastActiveStakeUpdateRound = "delegate__lastActiveStakeUpdateRound",
  DelegateNinetyDayVolumeEth = "delegate__ninetyDayVolumeETH",
  DelegateRewardCut = "delegate__rewardCut",
  DelegateRewardCutUpdateTimestamp = "delegate__rewardCutUpdateTimestamp",
  DelegateServiceUri = "delegate__serviceURI",
  DelegateSixtyDayVolumeEth = "delegate__sixtyDayVolumeETH",
  DelegateStatus = "delegate__status",
  DelegateThirtyDayVolumeEth = "delegate__thirtyDayVolumeETH",
  DelegateTotalStake = "delegate__totalStake",
  DelegateTotalVolumeEth = "delegate__totalVolumeETH",
  DelegateTotalVolumeUsd = "delegate__totalVolumeUSD",
  Id = "id",
  Round = "round",
  RoundActiveTranscoderCount = "round__activeTranscoderCount",
  RoundDelegatorsCount = "round__delegatorsCount",
  RoundEndBlock = "round__endBlock",
  RoundId = "round__id",
  RoundInflation = "round__inflation",
  RoundInitialized = "round__initialized",
  RoundLength = "round__length",
  RoundMintableTokens = "round__mintableTokens",
  RoundMovedStake = "round__movedStake",
  RoundNewStake = "round__newStake",
  RoundNumActiveTranscoders = "round__numActiveTranscoders",
  RoundParticipationRate = "round__participationRate",
  RoundStartBlock = "round__startBlock",
  RoundStartTimestamp = "round__startTimestamp",
  RoundTotalActiveStake = "round__totalActiveStake",
  RoundTotalSupply = "round__totalSupply",
  RoundVolumeEth = "round__volumeETH",
  RoundVolumeUsd = "round__volumeUSD",
  Timestamp = "timestamp",
  Transaction = "transaction",
  TransactionBlockNumber = "transaction__blockNumber",
  TransactionFrom = "transaction__from",
  TransactionGasPrice = "transaction__gasPrice",
  TransactionGasUsed = "transaction__gasUsed",
  TransactionId = "transaction__id",
  TransactionTimestamp = "transaction__timestamp",
  TransactionTo = "transaction__to",
}

/**
 * Transcoder data accumulated and condensed into day stats
 *
 */
export type TranscoderDay = {
  __typename: "TranscoderDay";
  /** The date beginning at 12:00am UTC */
  date: Scalars["Int"];
  /** Combination of the transcoder address and the timestamp rounded to current day by dividing by 86400 */
  id: Scalars["ID"];
  /** Transcoder associated with the day */
  transcoder: Transcoder;
  /** Fees generated this day in ETH */
  volumeETH: Scalars["BigDecimal"];
  /** Fees generated this day in USD */
  volumeUSD: Scalars["BigDecimal"];
};

export type TranscoderDay_Filter = {
  /** Filter for the block changed event. */
  _change_block?: InputMaybe<BlockChangedFilter>;
  and?: InputMaybe<Array<InputMaybe<TranscoderDay_Filter>>>;
  date?: InputMaybe<Scalars["Int"]>;
  date_gt?: InputMaybe<Scalars["Int"]>;
  date_gte?: InputMaybe<Scalars["Int"]>;
  date_in?: InputMaybe<Array<Scalars["Int"]>>;
  date_lt?: InputMaybe<Scalars["Int"]>;
  date_lte?: InputMaybe<Scalars["Int"]>;
  date_not?: InputMaybe<Scalars["Int"]>;
  date_not_in?: InputMaybe<Array<Scalars["Int"]>>;
  id?: InputMaybe<Scalars["ID"]>;
  id_gt?: InputMaybe<Scalars["ID"]>;
  id_gte?: InputMaybe<Scalars["ID"]>;
  id_in?: InputMaybe<Array<Scalars["ID"]>>;
  id_lt?: InputMaybe<Scalars["ID"]>;
  id_lte?: InputMaybe<Scalars["ID"]>;
  id_not?: InputMaybe<Scalars["ID"]>;
  id_not_in?: InputMaybe<Array<Scalars["ID"]>>;
  or?: InputMaybe<Array<InputMaybe<TranscoderDay_Filter>>>;
  transcoder?: InputMaybe<Scalars["String"]>;
  transcoder_?: InputMaybe<Transcoder_Filter>;
  transcoder_contains?: InputMaybe<Scalars["String"]>;
  transcoder_contains_nocase?: InputMaybe<Scalars["String"]>;
  transcoder_ends_with?: InputMaybe<Scalars["String"]>;
  transcoder_ends_with_nocase?: InputMaybe<Scalars["String"]>;
  transcoder_gt?: InputMaybe<Scalars["String"]>;
  transcoder_gte?: InputMaybe<Scalars["String"]>;
  transcoder_in?: InputMaybe<Array<Scalars["String"]>>;
  transcoder_lt?: InputMaybe<Scalars["String"]>;
  transcoder_lte?: InputMaybe<Scalars["String"]>;
  transcoder_not?: InputMaybe<Scalars["String"]>;
  transcoder_not_contains?: InputMaybe<Scalars["String"]>;
  transcoder_not_contains_nocase?: InputMaybe<Scalars["String"]>;
  transcoder_not_ends_with?: InputMaybe<Scalars["String"]>;
  transcoder_not_ends_with_nocase?: InputMaybe<Scalars["String"]>;
  transcoder_not_in?: InputMaybe<Array<Scalars["String"]>>;
  transcoder_not_starts_with?: InputMaybe<Scalars["String"]>;
  transcoder_not_starts_with_nocase?: InputMaybe<Scalars["String"]>;
  transcoder_starts_with?: InputMaybe<Scalars["String"]>;
  transcoder_starts_with_nocase?: InputMaybe<Scalars["String"]>;
  volumeETH?: InputMaybe<Scalars["BigDecimal"]>;
  volumeETH_gt?: InputMaybe<Scalars["BigDecimal"]>;
  volumeETH_gte?: InputMaybe<Scalars["BigDecimal"]>;
  volumeETH_in?: InputMaybe<Array<Scalars["BigDecimal"]>>;
  volumeETH_lt?: InputMaybe<Scalars["BigDecimal"]>;
  volumeETH_lte?: InputMaybe<Scalars["BigDecimal"]>;
  volumeETH_not?: InputMaybe<Scalars["BigDecimal"]>;
  volumeETH_not_in?: InputMaybe<Array<Scalars["BigDecimal"]>>;
  volumeUSD?: InputMaybe<Scalars["BigDecimal"]>;
  volumeUSD_gt?: InputMaybe<Scalars["BigDecimal"]>;
  volumeUSD_gte?: InputMaybe<Scalars["BigDecimal"]>;
  volumeUSD_in?: InputMaybe<Array<Scalars["BigDecimal"]>>;
  volumeUSD_lt?: InputMaybe<Scalars["BigDecimal"]>;
  volumeUSD_lte?: InputMaybe<Scalars["BigDecimal"]>;
  volumeUSD_not?: InputMaybe<Scalars["BigDecimal"]>;
  volumeUSD_not_in?: InputMaybe<Array<Scalars["BigDecimal"]>>;
};

export enum TranscoderDay_OrderBy {
  Date = "date",
  Id = "id",
  Transcoder = "transcoder",
  TranscoderActivationRound = "transcoder__activationRound",
  TranscoderActivationTimestamp = "transcoder__activationTimestamp",
  TranscoderActive = "transcoder__active",
  TranscoderDeactivationRound = "transcoder__deactivationRound",
  TranscoderFeeShare = "transcoder__feeShare",
  TranscoderFeeShareUpdateTimestamp = "transcoder__feeShareUpdateTimestamp",
  TranscoderId = "transcoder__id",
  TranscoderLastActiveStakeUpdateRound = "transcoder__lastActiveStakeUpdateRound",
  TranscoderNinetyDayVolumeEth = "transcoder__ninetyDayVolumeETH",
  TranscoderRewardCut = "transcoder__rewardCut",
  TranscoderRewardCutUpdateTimestamp = "transcoder__rewardCutUpdateTimestamp",
  TranscoderServiceUri = "transcoder__serviceURI",
  TranscoderSixtyDayVolumeEth = "transcoder__sixtyDayVolumeETH",
  TranscoderStatus = "transcoder__status",
  TranscoderThirtyDayVolumeEth = "transcoder__thirtyDayVolumeETH",
  TranscoderTotalStake = "transcoder__totalStake",
  TranscoderTotalVolumeEth = "transcoder__totalVolumeETH",
  TranscoderTotalVolumeUsd = "transcoder__totalVolumeUSD",
  VolumeEth = "volumeETH",
  VolumeUsd = "volumeUSD",
}

/**
 * TranscoderDeactivatedEvent entities are created for every emitted TranscoderDeactivated event.
 *
 */
export type TranscoderDeactivatedEvent = Event & {
  __typename: "TranscoderDeactivatedEvent";
  /** Future round in which the delegate will become deactive */
  deactivationRound: Scalars["BigInt"];
  /** Reference to the delegate that will become deactive */
  delegate: Transcoder;
  /** Ethereum transaction hash + event log index */
  id: Scalars["ID"];
  /** Reference to the round the event occured in */
  round: Round;
  /** Timestamp of the transaction the event was included in */
  timestamp: Scalars["Int"];
  /** Reference to the transaction the event was included in */
  transaction: Transaction;
};

export type TranscoderDeactivatedEvent_Filter = {
  /** Filter for the block changed event. */
  _change_block?: InputMaybe<BlockChangedFilter>;
  and?: InputMaybe<Array<InputMaybe<TranscoderDeactivatedEvent_Filter>>>;
  deactivationRound?: InputMaybe<Scalars["BigInt"]>;
  deactivationRound_gt?: InputMaybe<Scalars["BigInt"]>;
  deactivationRound_gte?: InputMaybe<Scalars["BigInt"]>;
  deactivationRound_in?: InputMaybe<Array<Scalars["BigInt"]>>;
  deactivationRound_lt?: InputMaybe<Scalars["BigInt"]>;
  deactivationRound_lte?: InputMaybe<Scalars["BigInt"]>;
  deactivationRound_not?: InputMaybe<Scalars["BigInt"]>;
  deactivationRound_not_in?: InputMaybe<Array<Scalars["BigInt"]>>;
  delegate?: InputMaybe<Scalars["String"]>;
  delegate_?: InputMaybe<Transcoder_Filter>;
  delegate_contains?: InputMaybe<Scalars["String"]>;
  delegate_contains_nocase?: InputMaybe<Scalars["String"]>;
  delegate_ends_with?: InputMaybe<Scalars["String"]>;
  delegate_ends_with_nocase?: InputMaybe<Scalars["String"]>;
  delegate_gt?: InputMaybe<Scalars["String"]>;
  delegate_gte?: InputMaybe<Scalars["String"]>;
  delegate_in?: InputMaybe<Array<Scalars["String"]>>;
  delegate_lt?: InputMaybe<Scalars["String"]>;
  delegate_lte?: InputMaybe<Scalars["String"]>;
  delegate_not?: InputMaybe<Scalars["String"]>;
  delegate_not_contains?: InputMaybe<Scalars["String"]>;
  delegate_not_contains_nocase?: InputMaybe<Scalars["String"]>;
  delegate_not_ends_with?: InputMaybe<Scalars["String"]>;
  delegate_not_ends_with_nocase?: InputMaybe<Scalars["String"]>;
  delegate_not_in?: InputMaybe<Array<Scalars["String"]>>;
  delegate_not_starts_with?: InputMaybe<Scalars["String"]>;
  delegate_not_starts_with_nocase?: InputMaybe<Scalars["String"]>;
  delegate_starts_with?: InputMaybe<Scalars["String"]>;
  delegate_starts_with_nocase?: InputMaybe<Scalars["String"]>;
  id?: InputMaybe<Scalars["ID"]>;
  id_gt?: InputMaybe<Scalars["ID"]>;
  id_gte?: InputMaybe<Scalars["ID"]>;
  id_in?: InputMaybe<Array<Scalars["ID"]>>;
  id_lt?: InputMaybe<Scalars["ID"]>;
  id_lte?: InputMaybe<Scalars["ID"]>;
  id_not?: InputMaybe<Scalars["ID"]>;
  id_not_in?: InputMaybe<Array<Scalars["ID"]>>;
  or?: InputMaybe<Array<InputMaybe<TranscoderDeactivatedEvent_Filter>>>;
  round?: InputMaybe<Scalars["String"]>;
  round_?: InputMaybe<Round_Filter>;
  round_contains?: InputMaybe<Scalars["String"]>;
  round_contains_nocase?: InputMaybe<Scalars["String"]>;
  round_ends_with?: InputMaybe<Scalars["String"]>;
  round_ends_with_nocase?: InputMaybe<Scalars["String"]>;
  round_gt?: InputMaybe<Scalars["String"]>;
  round_gte?: InputMaybe<Scalars["String"]>;
  round_in?: InputMaybe<Array<Scalars["String"]>>;
  round_lt?: InputMaybe<Scalars["String"]>;
  round_lte?: InputMaybe<Scalars["String"]>;
  round_not?: InputMaybe<Scalars["String"]>;
  round_not_contains?: InputMaybe<Scalars["String"]>;
  round_not_contains_nocase?: InputMaybe<Scalars["String"]>;
  round_not_ends_with?: InputMaybe<Scalars["String"]>;
  round_not_ends_with_nocase?: InputMaybe<Scalars["String"]>;
  round_not_in?: InputMaybe<Array<Scalars["String"]>>;
  round_not_starts_with?: InputMaybe<Scalars["String"]>;
  round_not_starts_with_nocase?: InputMaybe<Scalars["String"]>;
  round_starts_with?: InputMaybe<Scalars["String"]>;
  round_starts_with_nocase?: InputMaybe<Scalars["String"]>;
  timestamp?: InputMaybe<Scalars["Int"]>;
  timestamp_gt?: InputMaybe<Scalars["Int"]>;
  timestamp_gte?: InputMaybe<Scalars["Int"]>;
  timestamp_in?: InputMaybe<Array<Scalars["Int"]>>;
  timestamp_lt?: InputMaybe<Scalars["Int"]>;
  timestamp_lte?: InputMaybe<Scalars["Int"]>;
  timestamp_not?: InputMaybe<Scalars["Int"]>;
  timestamp_not_in?: InputMaybe<Array<Scalars["Int"]>>;
  transaction?: InputMaybe<Scalars["String"]>;
  transaction_?: InputMaybe<Transaction_Filter>;
  transaction_contains?: InputMaybe<Scalars["String"]>;
  transaction_contains_nocase?: InputMaybe<Scalars["String"]>;
  transaction_ends_with?: InputMaybe<Scalars["String"]>;
  transaction_ends_with_nocase?: InputMaybe<Scalars["String"]>;
  transaction_gt?: InputMaybe<Scalars["String"]>;
  transaction_gte?: InputMaybe<Scalars["String"]>;
  transaction_in?: InputMaybe<Array<Scalars["String"]>>;
  transaction_lt?: InputMaybe<Scalars["String"]>;
  transaction_lte?: InputMaybe<Scalars["String"]>;
  transaction_not?: InputMaybe<Scalars["String"]>;
  transaction_not_contains?: InputMaybe<Scalars["String"]>;
  transaction_not_contains_nocase?: InputMaybe<Scalars["String"]>;
  transaction_not_ends_with?: InputMaybe<Scalars["String"]>;
  transaction_not_ends_with_nocase?: InputMaybe<Scalars["String"]>;
  transaction_not_in?: InputMaybe<Array<Scalars["String"]>>;
  transaction_not_starts_with?: InputMaybe<Scalars["String"]>;
  transaction_not_starts_with_nocase?: InputMaybe<Scalars["String"]>;
  transaction_starts_with?: InputMaybe<Scalars["String"]>;
  transaction_starts_with_nocase?: InputMaybe<Scalars["String"]>;
};

export enum TranscoderDeactivatedEvent_OrderBy {
  DeactivationRound = "deactivationRound",
  Delegate = "delegate",
  DelegateActivationRound = "delegate__activationRound",
  DelegateActivationTimestamp = "delegate__activationTimestamp",
  DelegateActive = "delegate__active",
  DelegateDeactivationRound = "delegate__deactivationRound",
  DelegateFeeShare = "delegate__feeShare",
  DelegateFeeShareUpdateTimestamp = "delegate__feeShareUpdateTimestamp",
  DelegateId = "delegate__id",
  DelegateLastActiveStakeUpdateRound = "delegate__lastActiveStakeUpdateRound",
  DelegateNinetyDayVolumeEth = "delegate__ninetyDayVolumeETH",
  DelegateRewardCut = "delegate__rewardCut",
  DelegateRewardCutUpdateTimestamp = "delegate__rewardCutUpdateTimestamp",
  DelegateServiceUri = "delegate__serviceURI",
  DelegateSixtyDayVolumeEth = "delegate__sixtyDayVolumeETH",
  DelegateStatus = "delegate__status",
  DelegateThirtyDayVolumeEth = "delegate__thirtyDayVolumeETH",
  DelegateTotalStake = "delegate__totalStake",
  DelegateTotalVolumeEth = "delegate__totalVolumeETH",
  DelegateTotalVolumeUsd = "delegate__totalVolumeUSD",
  Id = "id",
  Round = "round",
  RoundActiveTranscoderCount = "round__activeTranscoderCount",
  RoundDelegatorsCount = "round__delegatorsCount",
  RoundEndBlock = "round__endBlock",
  RoundId = "round__id",
  RoundInflation = "round__inflation",
  RoundInitialized = "round__initialized",
  RoundLength = "round__length",
  RoundMintableTokens = "round__mintableTokens",
  RoundMovedStake = "round__movedStake",
  RoundNewStake = "round__newStake",
  RoundNumActiveTranscoders = "round__numActiveTranscoders",
  RoundParticipationRate = "round__participationRate",
  RoundStartBlock = "round__startBlock",
  RoundStartTimestamp = "round__startTimestamp",
  RoundTotalActiveStake = "round__totalActiveStake",
  RoundTotalSupply = "round__totalSupply",
  RoundVolumeEth = "round__volumeETH",
  RoundVolumeUsd = "round__volumeUSD",
  Timestamp = "timestamp",
  Transaction = "transaction",
  TransactionBlockNumber = "transaction__blockNumber",
  TransactionFrom = "transaction__from",
  TransactionGasPrice = "transaction__gasPrice",
  TransactionGasUsed = "transaction__gasUsed",
  TransactionId = "transaction__id",
  TransactionTimestamp = "transaction__timestamp",
  TransactionTo = "transaction__to",
}

/**
 * TranscoderEvictedEvent entities are created for every emitted TranscoderEvicted event.
 *
 */
export type TranscoderEvictedEvent = Event & {
  __typename: "TranscoderEvictedEvent";
  /** Reference to the delegate that was evicted */
  delegate: Transcoder;
  /** Ethereum transaction hash + event log index */
  id: Scalars["ID"];
  /** Reference to the round the event occured in */
  round: Round;
  /** Timestamp of the transaction the event was included in */
  timestamp: Scalars["Int"];
  /** Reference to the transaction the event was included in */
  transaction: Transaction;
};

export type TranscoderEvictedEvent_Filter = {
  /** Filter for the block changed event. */
  _change_block?: InputMaybe<BlockChangedFilter>;
  and?: InputMaybe<Array<InputMaybe<TranscoderEvictedEvent_Filter>>>;
  delegate?: InputMaybe<Scalars["String"]>;
  delegate_?: InputMaybe<Transcoder_Filter>;
  delegate_contains?: InputMaybe<Scalars["String"]>;
  delegate_contains_nocase?: InputMaybe<Scalars["String"]>;
  delegate_ends_with?: InputMaybe<Scalars["String"]>;
  delegate_ends_with_nocase?: InputMaybe<Scalars["String"]>;
  delegate_gt?: InputMaybe<Scalars["String"]>;
  delegate_gte?: InputMaybe<Scalars["String"]>;
  delegate_in?: InputMaybe<Array<Scalars["String"]>>;
  delegate_lt?: InputMaybe<Scalars["String"]>;
  delegate_lte?: InputMaybe<Scalars["String"]>;
  delegate_not?: InputMaybe<Scalars["String"]>;
  delegate_not_contains?: InputMaybe<Scalars["String"]>;
  delegate_not_contains_nocase?: InputMaybe<Scalars["String"]>;
  delegate_not_ends_with?: InputMaybe<Scalars["String"]>;
  delegate_not_ends_with_nocase?: InputMaybe<Scalars["String"]>;
  delegate_not_in?: InputMaybe<Array<Scalars["String"]>>;
  delegate_not_starts_with?: InputMaybe<Scalars["String"]>;
  delegate_not_starts_with_nocase?: InputMaybe<Scalars["String"]>;
  delegate_starts_with?: InputMaybe<Scalars["String"]>;
  delegate_starts_with_nocase?: InputMaybe<Scalars["String"]>;
  id?: InputMaybe<Scalars["ID"]>;
  id_gt?: InputMaybe<Scalars["ID"]>;
  id_gte?: InputMaybe<Scalars["ID"]>;
  id_in?: InputMaybe<Array<Scalars["ID"]>>;
  id_lt?: InputMaybe<Scalars["ID"]>;
  id_lte?: InputMaybe<Scalars["ID"]>;
  id_not?: InputMaybe<Scalars["ID"]>;
  id_not_in?: InputMaybe<Array<Scalars["ID"]>>;
  or?: InputMaybe<Array<InputMaybe<TranscoderEvictedEvent_Filter>>>;
  round?: InputMaybe<Scalars["String"]>;
  round_?: InputMaybe<Round_Filter>;
  round_contains?: InputMaybe<Scalars["String"]>;
  round_contains_nocase?: InputMaybe<Scalars["String"]>;
  round_ends_with?: InputMaybe<Scalars["String"]>;
  round_ends_with_nocase?: InputMaybe<Scalars["String"]>;
  round_gt?: InputMaybe<Scalars["String"]>;
  round_gte?: InputMaybe<Scalars["String"]>;
  round_in?: InputMaybe<Array<Scalars["String"]>>;
  round_lt?: InputMaybe<Scalars["String"]>;
  round_lte?: InputMaybe<Scalars["String"]>;
  round_not?: InputMaybe<Scalars["String"]>;
  round_not_contains?: InputMaybe<Scalars["String"]>;
  round_not_contains_nocase?: InputMaybe<Scalars["String"]>;
  round_not_ends_with?: InputMaybe<Scalars["String"]>;
  round_not_ends_with_nocase?: InputMaybe<Scalars["String"]>;
  round_not_in?: InputMaybe<Array<Scalars["String"]>>;
  round_not_starts_with?: InputMaybe<Scalars["String"]>;
  round_not_starts_with_nocase?: InputMaybe<Scalars["String"]>;
  round_starts_with?: InputMaybe<Scalars["String"]>;
  round_starts_with_nocase?: InputMaybe<Scalars["String"]>;
  timestamp?: InputMaybe<Scalars["Int"]>;
  timestamp_gt?: InputMaybe<Scalars["Int"]>;
  timestamp_gte?: InputMaybe<Scalars["Int"]>;
  timestamp_in?: InputMaybe<Array<Scalars["Int"]>>;
  timestamp_lt?: InputMaybe<Scalars["Int"]>;
  timestamp_lte?: InputMaybe<Scalars["Int"]>;
  timestamp_not?: InputMaybe<Scalars["Int"]>;
  timestamp_not_in?: InputMaybe<Array<Scalars["Int"]>>;
  transaction?: InputMaybe<Scalars["String"]>;
  transaction_?: InputMaybe<Transaction_Filter>;
  transaction_contains?: InputMaybe<Scalars["String"]>;
  transaction_contains_nocase?: InputMaybe<Scalars["String"]>;
  transaction_ends_with?: InputMaybe<Scalars["String"]>;
  transaction_ends_with_nocase?: InputMaybe<Scalars["String"]>;
  transaction_gt?: InputMaybe<Scalars["String"]>;
  transaction_gte?: InputMaybe<Scalars["String"]>;
  transaction_in?: InputMaybe<Array<Scalars["String"]>>;
  transaction_lt?: InputMaybe<Scalars["String"]>;
  transaction_lte?: InputMaybe<Scalars["String"]>;
  transaction_not?: InputMaybe<Scalars["String"]>;
  transaction_not_contains?: InputMaybe<Scalars["String"]>;
  transaction_not_contains_nocase?: InputMaybe<Scalars["String"]>;
  transaction_not_ends_with?: InputMaybe<Scalars["String"]>;
  transaction_not_ends_with_nocase?: InputMaybe<Scalars["String"]>;
  transaction_not_in?: InputMaybe<Array<Scalars["String"]>>;
  transaction_not_starts_with?: InputMaybe<Scalars["String"]>;
  transaction_not_starts_with_nocase?: InputMaybe<Scalars["String"]>;
  transaction_starts_with?: InputMaybe<Scalars["String"]>;
  transaction_starts_with_nocase?: InputMaybe<Scalars["String"]>;
};

export enum TranscoderEvictedEvent_OrderBy {
  Delegate = "delegate",
  DelegateActivationRound = "delegate__activationRound",
  DelegateActivationTimestamp = "delegate__activationTimestamp",
  DelegateActive = "delegate__active",
  DelegateDeactivationRound = "delegate__deactivationRound",
  DelegateFeeShare = "delegate__feeShare",
  DelegateFeeShareUpdateTimestamp = "delegate__feeShareUpdateTimestamp",
  DelegateId = "delegate__id",
  DelegateLastActiveStakeUpdateRound = "delegate__lastActiveStakeUpdateRound",
  DelegateNinetyDayVolumeEth = "delegate__ninetyDayVolumeETH",
  DelegateRewardCut = "delegate__rewardCut",
  DelegateRewardCutUpdateTimestamp = "delegate__rewardCutUpdateTimestamp",
  DelegateServiceUri = "delegate__serviceURI",
  DelegateSixtyDayVolumeEth = "delegate__sixtyDayVolumeETH",
  DelegateStatus = "delegate__status",
  DelegateThirtyDayVolumeEth = "delegate__thirtyDayVolumeETH",
  DelegateTotalStake = "delegate__totalStake",
  DelegateTotalVolumeEth = "delegate__totalVolumeETH",
  DelegateTotalVolumeUsd = "delegate__totalVolumeUSD",
  Id = "id",
  Round = "round",
  RoundActiveTranscoderCount = "round__activeTranscoderCount",
  RoundDelegatorsCount = "round__delegatorsCount",
  RoundEndBlock = "round__endBlock",
  RoundId = "round__id",
  RoundInflation = "round__inflation",
  RoundInitialized = "round__initialized",
  RoundLength = "round__length",
  RoundMintableTokens = "round__mintableTokens",
  RoundMovedStake = "round__movedStake",
  RoundNewStake = "round__newStake",
  RoundNumActiveTranscoders = "round__numActiveTranscoders",
  RoundParticipationRate = "round__participationRate",
  RoundStartBlock = "round__startBlock",
  RoundStartTimestamp = "round__startTimestamp",
  RoundTotalActiveStake = "round__totalActiveStake",
  RoundTotalSupply = "round__totalSupply",
  RoundVolumeEth = "round__volumeETH",
  RoundVolumeUsd = "round__volumeUSD",
  Timestamp = "timestamp",
  Transaction = "transaction",
  TransactionBlockNumber = "transaction__blockNumber",
  TransactionFrom = "transaction__from",
  TransactionGasPrice = "transaction__gasPrice",
  TransactionGasUsed = "transaction__gasUsed",
  TransactionId = "transaction__id",
  TransactionTimestamp = "transaction__timestamp",
  TransactionTo = "transaction__to",
}

/**
 * TranscoderResignedEvent entities are created for every emitted TranscoderResigned event.
 *
 */
export type TranscoderResignedEvent = Event & {
  __typename: "TranscoderResignedEvent";
  /** Reference to the delegate that resigned */
  delegate: Transcoder;
  /** Ethereum transaction hash + event log index */
  id: Scalars["ID"];
  /** Reference to the round the event occured in */
  round: Round;
  /** Timestamp of the transaction the event was included in */
  timestamp: Scalars["Int"];
  /** Reference to the transaction the event was included in */
  transaction: Transaction;
};

export type TranscoderResignedEvent_Filter = {
  /** Filter for the block changed event. */
  _change_block?: InputMaybe<BlockChangedFilter>;
  and?: InputMaybe<Array<InputMaybe<TranscoderResignedEvent_Filter>>>;
  delegate?: InputMaybe<Scalars["String"]>;
  delegate_?: InputMaybe<Transcoder_Filter>;
  delegate_contains?: InputMaybe<Scalars["String"]>;
  delegate_contains_nocase?: InputMaybe<Scalars["String"]>;
  delegate_ends_with?: InputMaybe<Scalars["String"]>;
  delegate_ends_with_nocase?: InputMaybe<Scalars["String"]>;
  delegate_gt?: InputMaybe<Scalars["String"]>;
  delegate_gte?: InputMaybe<Scalars["String"]>;
  delegate_in?: InputMaybe<Array<Scalars["String"]>>;
  delegate_lt?: InputMaybe<Scalars["String"]>;
  delegate_lte?: InputMaybe<Scalars["String"]>;
  delegate_not?: InputMaybe<Scalars["String"]>;
  delegate_not_contains?: InputMaybe<Scalars["String"]>;
  delegate_not_contains_nocase?: InputMaybe<Scalars["String"]>;
  delegate_not_ends_with?: InputMaybe<Scalars["String"]>;
  delegate_not_ends_with_nocase?: InputMaybe<Scalars["String"]>;
  delegate_not_in?: InputMaybe<Array<Scalars["String"]>>;
  delegate_not_starts_with?: InputMaybe<Scalars["String"]>;
  delegate_not_starts_with_nocase?: InputMaybe<Scalars["String"]>;
  delegate_starts_with?: InputMaybe<Scalars["String"]>;
  delegate_starts_with_nocase?: InputMaybe<Scalars["String"]>;
  id?: InputMaybe<Scalars["ID"]>;
  id_gt?: InputMaybe<Scalars["ID"]>;
  id_gte?: InputMaybe<Scalars["ID"]>;
  id_in?: InputMaybe<Array<Scalars["ID"]>>;
  id_lt?: InputMaybe<Scalars["ID"]>;
  id_lte?: InputMaybe<Scalars["ID"]>;
  id_not?: InputMaybe<Scalars["ID"]>;
  id_not_in?: InputMaybe<Array<Scalars["ID"]>>;
  or?: InputMaybe<Array<InputMaybe<TranscoderResignedEvent_Filter>>>;
  round?: InputMaybe<Scalars["String"]>;
  round_?: InputMaybe<Round_Filter>;
  round_contains?: InputMaybe<Scalars["String"]>;
  round_contains_nocase?: InputMaybe<Scalars["String"]>;
  round_ends_with?: InputMaybe<Scalars["String"]>;
  round_ends_with_nocase?: InputMaybe<Scalars["String"]>;
  round_gt?: InputMaybe<Scalars["String"]>;
  round_gte?: InputMaybe<Scalars["String"]>;
  round_in?: InputMaybe<Array<Scalars["String"]>>;
  round_lt?: InputMaybe<Scalars["String"]>;
  round_lte?: InputMaybe<Scalars["String"]>;
  round_not?: InputMaybe<Scalars["String"]>;
  round_not_contains?: InputMaybe<Scalars["String"]>;
  round_not_contains_nocase?: InputMaybe<Scalars["String"]>;
  round_not_ends_with?: InputMaybe<Scalars["String"]>;
  round_not_ends_with_nocase?: InputMaybe<Scalars["String"]>;
  round_not_in?: InputMaybe<Array<Scalars["String"]>>;
  round_not_starts_with?: InputMaybe<Scalars["String"]>;
  round_not_starts_with_nocase?: InputMaybe<Scalars["String"]>;
  round_starts_with?: InputMaybe<Scalars["String"]>;
  round_starts_with_nocase?: InputMaybe<Scalars["String"]>;
  timestamp?: InputMaybe<Scalars["Int"]>;
  timestamp_gt?: InputMaybe<Scalars["Int"]>;
  timestamp_gte?: InputMaybe<Scalars["Int"]>;
  timestamp_in?: InputMaybe<Array<Scalars["Int"]>>;
  timestamp_lt?: InputMaybe<Scalars["Int"]>;
  timestamp_lte?: InputMaybe<Scalars["Int"]>;
  timestamp_not?: InputMaybe<Scalars["Int"]>;
  timestamp_not_in?: InputMaybe<Array<Scalars["Int"]>>;
  transaction?: InputMaybe<Scalars["String"]>;
  transaction_?: InputMaybe<Transaction_Filter>;
  transaction_contains?: InputMaybe<Scalars["String"]>;
  transaction_contains_nocase?: InputMaybe<Scalars["String"]>;
  transaction_ends_with?: InputMaybe<Scalars["String"]>;
  transaction_ends_with_nocase?: InputMaybe<Scalars["String"]>;
  transaction_gt?: InputMaybe<Scalars["String"]>;
  transaction_gte?: InputMaybe<Scalars["String"]>;
  transaction_in?: InputMaybe<Array<Scalars["String"]>>;
  transaction_lt?: InputMaybe<Scalars["String"]>;
  transaction_lte?: InputMaybe<Scalars["String"]>;
  transaction_not?: InputMaybe<Scalars["String"]>;
  transaction_not_contains?: InputMaybe<Scalars["String"]>;
  transaction_not_contains_nocase?: InputMaybe<Scalars["String"]>;
  transaction_not_ends_with?: InputMaybe<Scalars["String"]>;
  transaction_not_ends_with_nocase?: InputMaybe<Scalars["String"]>;
  transaction_not_in?: InputMaybe<Array<Scalars["String"]>>;
  transaction_not_starts_with?: InputMaybe<Scalars["String"]>;
  transaction_not_starts_with_nocase?: InputMaybe<Scalars["String"]>;
  transaction_starts_with?: InputMaybe<Scalars["String"]>;
  transaction_starts_with_nocase?: InputMaybe<Scalars["String"]>;
};

export enum TranscoderResignedEvent_OrderBy {
  Delegate = "delegate",
  DelegateActivationRound = "delegate__activationRound",
  DelegateActivationTimestamp = "delegate__activationTimestamp",
  DelegateActive = "delegate__active",
  DelegateDeactivationRound = "delegate__deactivationRound",
  DelegateFeeShare = "delegate__feeShare",
  DelegateFeeShareUpdateTimestamp = "delegate__feeShareUpdateTimestamp",
  DelegateId = "delegate__id",
  DelegateLastActiveStakeUpdateRound = "delegate__lastActiveStakeUpdateRound",
  DelegateNinetyDayVolumeEth = "delegate__ninetyDayVolumeETH",
  DelegateRewardCut = "delegate__rewardCut",
  DelegateRewardCutUpdateTimestamp = "delegate__rewardCutUpdateTimestamp",
  DelegateServiceUri = "delegate__serviceURI",
  DelegateSixtyDayVolumeEth = "delegate__sixtyDayVolumeETH",
  DelegateStatus = "delegate__status",
  DelegateThirtyDayVolumeEth = "delegate__thirtyDayVolumeETH",
  DelegateTotalStake = "delegate__totalStake",
  DelegateTotalVolumeEth = "delegate__totalVolumeETH",
  DelegateTotalVolumeUsd = "delegate__totalVolumeUSD",
  Id = "id",
  Round = "round",
  RoundActiveTranscoderCount = "round__activeTranscoderCount",
  RoundDelegatorsCount = "round__delegatorsCount",
  RoundEndBlock = "round__endBlock",
  RoundId = "round__id",
  RoundInflation = "round__inflation",
  RoundInitialized = "round__initialized",
  RoundLength = "round__length",
  RoundMintableTokens = "round__mintableTokens",
  RoundMovedStake = "round__movedStake",
  RoundNewStake = "round__newStake",
  RoundNumActiveTranscoders = "round__numActiveTranscoders",
  RoundParticipationRate = "round__participationRate",
  RoundStartBlock = "round__startBlock",
  RoundStartTimestamp = "round__startTimestamp",
  RoundTotalActiveStake = "round__totalActiveStake",
  RoundTotalSupply = "round__totalSupply",
  RoundVolumeEth = "round__volumeETH",
  RoundVolumeUsd = "round__volumeUSD",
  Timestamp = "timestamp",
  Transaction = "transaction",
  TransactionBlockNumber = "transaction__blockNumber",
  TransactionFrom = "transaction__from",
  TransactionGasPrice = "transaction__gasPrice",
  TransactionGasUsed = "transaction__gasUsed",
  TransactionId = "transaction__id",
  TransactionTimestamp = "transaction__timestamp",
  TransactionTo = "transaction__to",
}

/**
 * TranscoderSlashedEvent entities are created for every emitted TranscoderSlashed event.
 *
 */
export type TranscoderSlashedEvent = Event & {
  __typename: "TranscoderSlashedEvent";
  /** Reference to the delegate that was slashed */
  delegate: Transcoder;
  /** Finder that proved a transcoder violated a slashing condition. Null address if there is no finder */
  finder: Scalars["Bytes"];
  /** Percentage of penalty awarded to finder. Zero if there is no finder */
  finderReward: Scalars["BigInt"];
  /** Ethereum transaction hash + event log index */
  id: Scalars["ID"];
  /** Percentage of transcoder bond to be slashed */
  penalty: Scalars["BigDecimal"];
  /** Reference to the round the event occured in */
  round: Round;
  /** Timestamp of the transaction the event was included in */
  timestamp: Scalars["Int"];
  /** Reference to the transaction the event was included in */
  transaction: Transaction;
};

export type TranscoderSlashedEvent_Filter = {
  /** Filter for the block changed event. */
  _change_block?: InputMaybe<BlockChangedFilter>;
  and?: InputMaybe<Array<InputMaybe<TranscoderSlashedEvent_Filter>>>;
  delegate?: InputMaybe<Scalars["String"]>;
  delegate_?: InputMaybe<Transcoder_Filter>;
  delegate_contains?: InputMaybe<Scalars["String"]>;
  delegate_contains_nocase?: InputMaybe<Scalars["String"]>;
  delegate_ends_with?: InputMaybe<Scalars["String"]>;
  delegate_ends_with_nocase?: InputMaybe<Scalars["String"]>;
  delegate_gt?: InputMaybe<Scalars["String"]>;
  delegate_gte?: InputMaybe<Scalars["String"]>;
  delegate_in?: InputMaybe<Array<Scalars["String"]>>;
  delegate_lt?: InputMaybe<Scalars["String"]>;
  delegate_lte?: InputMaybe<Scalars["String"]>;
  delegate_not?: InputMaybe<Scalars["String"]>;
  delegate_not_contains?: InputMaybe<Scalars["String"]>;
  delegate_not_contains_nocase?: InputMaybe<Scalars["String"]>;
  delegate_not_ends_with?: InputMaybe<Scalars["String"]>;
  delegate_not_ends_with_nocase?: InputMaybe<Scalars["String"]>;
  delegate_not_in?: InputMaybe<Array<Scalars["String"]>>;
  delegate_not_starts_with?: InputMaybe<Scalars["String"]>;
  delegate_not_starts_with_nocase?: InputMaybe<Scalars["String"]>;
  delegate_starts_with?: InputMaybe<Scalars["String"]>;
  delegate_starts_with_nocase?: InputMaybe<Scalars["String"]>;
  finder?: InputMaybe<Scalars["Bytes"]>;
  finderReward?: InputMaybe<Scalars["BigInt"]>;
  finderReward_gt?: InputMaybe<Scalars["BigInt"]>;
  finderReward_gte?: InputMaybe<Scalars["BigInt"]>;
  finderReward_in?: InputMaybe<Array<Scalars["BigInt"]>>;
  finderReward_lt?: InputMaybe<Scalars["BigInt"]>;
  finderReward_lte?: InputMaybe<Scalars["BigInt"]>;
  finderReward_not?: InputMaybe<Scalars["BigInt"]>;
  finderReward_not_in?: InputMaybe<Array<Scalars["BigInt"]>>;
  finder_contains?: InputMaybe<Scalars["Bytes"]>;
  finder_gt?: InputMaybe<Scalars["Bytes"]>;
  finder_gte?: InputMaybe<Scalars["Bytes"]>;
  finder_in?: InputMaybe<Array<Scalars["Bytes"]>>;
  finder_lt?: InputMaybe<Scalars["Bytes"]>;
  finder_lte?: InputMaybe<Scalars["Bytes"]>;
  finder_not?: InputMaybe<Scalars["Bytes"]>;
  finder_not_contains?: InputMaybe<Scalars["Bytes"]>;
  finder_not_in?: InputMaybe<Array<Scalars["Bytes"]>>;
  id?: InputMaybe<Scalars["ID"]>;
  id_gt?: InputMaybe<Scalars["ID"]>;
  id_gte?: InputMaybe<Scalars["ID"]>;
  id_in?: InputMaybe<Array<Scalars["ID"]>>;
  id_lt?: InputMaybe<Scalars["ID"]>;
  id_lte?: InputMaybe<Scalars["ID"]>;
  id_not?: InputMaybe<Scalars["ID"]>;
  id_not_in?: InputMaybe<Array<Scalars["ID"]>>;
  or?: InputMaybe<Array<InputMaybe<TranscoderSlashedEvent_Filter>>>;
  penalty?: InputMaybe<Scalars["BigDecimal"]>;
  penalty_gt?: InputMaybe<Scalars["BigDecimal"]>;
  penalty_gte?: InputMaybe<Scalars["BigDecimal"]>;
  penalty_in?: InputMaybe<Array<Scalars["BigDecimal"]>>;
  penalty_lt?: InputMaybe<Scalars["BigDecimal"]>;
  penalty_lte?: InputMaybe<Scalars["BigDecimal"]>;
  penalty_not?: InputMaybe<Scalars["BigDecimal"]>;
  penalty_not_in?: InputMaybe<Array<Scalars["BigDecimal"]>>;
  round?: InputMaybe<Scalars["String"]>;
  round_?: InputMaybe<Round_Filter>;
  round_contains?: InputMaybe<Scalars["String"]>;
  round_contains_nocase?: InputMaybe<Scalars["String"]>;
  round_ends_with?: InputMaybe<Scalars["String"]>;
  round_ends_with_nocase?: InputMaybe<Scalars["String"]>;
  round_gt?: InputMaybe<Scalars["String"]>;
  round_gte?: InputMaybe<Scalars["String"]>;
  round_in?: InputMaybe<Array<Scalars["String"]>>;
  round_lt?: InputMaybe<Scalars["String"]>;
  round_lte?: InputMaybe<Scalars["String"]>;
  round_not?: InputMaybe<Scalars["String"]>;
  round_not_contains?: InputMaybe<Scalars["String"]>;
  round_not_contains_nocase?: InputMaybe<Scalars["String"]>;
  round_not_ends_with?: InputMaybe<Scalars["String"]>;
  round_not_ends_with_nocase?: InputMaybe<Scalars["String"]>;
  round_not_in?: InputMaybe<Array<Scalars["String"]>>;
  round_not_starts_with?: InputMaybe<Scalars["String"]>;
  round_not_starts_with_nocase?: InputMaybe<Scalars["String"]>;
  round_starts_with?: InputMaybe<Scalars["String"]>;
  round_starts_with_nocase?: InputMaybe<Scalars["String"]>;
  timestamp?: InputMaybe<Scalars["Int"]>;
  timestamp_gt?: InputMaybe<Scalars["Int"]>;
  timestamp_gte?: InputMaybe<Scalars["Int"]>;
  timestamp_in?: InputMaybe<Array<Scalars["Int"]>>;
  timestamp_lt?: InputMaybe<Scalars["Int"]>;
  timestamp_lte?: InputMaybe<Scalars["Int"]>;
  timestamp_not?: InputMaybe<Scalars["Int"]>;
  timestamp_not_in?: InputMaybe<Array<Scalars["Int"]>>;
  transaction?: InputMaybe<Scalars["String"]>;
  transaction_?: InputMaybe<Transaction_Filter>;
  transaction_contains?: InputMaybe<Scalars["String"]>;
  transaction_contains_nocase?: InputMaybe<Scalars["String"]>;
  transaction_ends_with?: InputMaybe<Scalars["String"]>;
  transaction_ends_with_nocase?: InputMaybe<Scalars["String"]>;
  transaction_gt?: InputMaybe<Scalars["String"]>;
  transaction_gte?: InputMaybe<Scalars["String"]>;
  transaction_in?: InputMaybe<Array<Scalars["String"]>>;
  transaction_lt?: InputMaybe<Scalars["String"]>;
  transaction_lte?: InputMaybe<Scalars["String"]>;
  transaction_not?: InputMaybe<Scalars["String"]>;
  transaction_not_contains?: InputMaybe<Scalars["String"]>;
  transaction_not_contains_nocase?: InputMaybe<Scalars["String"]>;
  transaction_not_ends_with?: InputMaybe<Scalars["String"]>;
  transaction_not_ends_with_nocase?: InputMaybe<Scalars["String"]>;
  transaction_not_in?: InputMaybe<Array<Scalars["String"]>>;
  transaction_not_starts_with?: InputMaybe<Scalars["String"]>;
  transaction_not_starts_with_nocase?: InputMaybe<Scalars["String"]>;
  transaction_starts_with?: InputMaybe<Scalars["String"]>;
  transaction_starts_with_nocase?: InputMaybe<Scalars["String"]>;
};

export enum TranscoderSlashedEvent_OrderBy {
  Delegate = "delegate",
  DelegateActivationRound = "delegate__activationRound",
  DelegateActivationTimestamp = "delegate__activationTimestamp",
  DelegateActive = "delegate__active",
  DelegateDeactivationRound = "delegate__deactivationRound",
  DelegateFeeShare = "delegate__feeShare",
  DelegateFeeShareUpdateTimestamp = "delegate__feeShareUpdateTimestamp",
  DelegateId = "delegate__id",
  DelegateLastActiveStakeUpdateRound = "delegate__lastActiveStakeUpdateRound",
  DelegateNinetyDayVolumeEth = "delegate__ninetyDayVolumeETH",
  DelegateRewardCut = "delegate__rewardCut",
  DelegateRewardCutUpdateTimestamp = "delegate__rewardCutUpdateTimestamp",
  DelegateServiceUri = "delegate__serviceURI",
  DelegateSixtyDayVolumeEth = "delegate__sixtyDayVolumeETH",
  DelegateStatus = "delegate__status",
  DelegateThirtyDayVolumeEth = "delegate__thirtyDayVolumeETH",
  DelegateTotalStake = "delegate__totalStake",
  DelegateTotalVolumeEth = "delegate__totalVolumeETH",
  DelegateTotalVolumeUsd = "delegate__totalVolumeUSD",
  Finder = "finder",
  FinderReward = "finderReward",
  Id = "id",
  Penalty = "penalty",
  Round = "round",
  RoundActiveTranscoderCount = "round__activeTranscoderCount",
  RoundDelegatorsCount = "round__delegatorsCount",
  RoundEndBlock = "round__endBlock",
  RoundId = "round__id",
  RoundInflation = "round__inflation",
  RoundInitialized = "round__initialized",
  RoundLength = "round__length",
  RoundMintableTokens = "round__mintableTokens",
  RoundMovedStake = "round__movedStake",
  RoundNewStake = "round__newStake",
  RoundNumActiveTranscoders = "round__numActiveTranscoders",
  RoundParticipationRate = "round__participationRate",
  RoundStartBlock = "round__startBlock",
  RoundStartTimestamp = "round__startTimestamp",
  RoundTotalActiveStake = "round__totalActiveStake",
  RoundTotalSupply = "round__totalSupply",
  RoundVolumeEth = "round__volumeETH",
  RoundVolumeUsd = "round__volumeUSD",
  Timestamp = "timestamp",
  Transaction = "transaction",
  TransactionBlockNumber = "transaction__blockNumber",
  TransactionFrom = "transaction__from",
  TransactionGasPrice = "transaction__gasPrice",
  TransactionGasUsed = "transaction__gasUsed",
  TransactionId = "transaction__id",
  TransactionTimestamp = "transaction__timestamp",
  TransactionTo = "transaction__to",
}

export enum TranscoderStatus {
  NotRegistered = "NotRegistered",
  Registered = "Registered",
}

/**
 * TranscoderUpdateEvent entities are created for every emitted TranscoderUpdate event.
 *
 */
export type TranscoderUpdateEvent = Event & {
  __typename: "TranscoderUpdateEvent";
  /** Reference to the delegate that was updated */
  delegate: Transcoder;
  /** Delegate's updated fee share */
  feeShare: Scalars["BigInt"];
  /** Ethereum transaction hash + event log index */
  id: Scalars["ID"];
  /** Delegate's updated reward cut */
  rewardCut: Scalars["BigInt"];
  /** Reference to the round the event occured in */
  round: Round;
  /** Timestamp of the transaction the event was included in */
  timestamp: Scalars["Int"];
  /** Reference to the transaction the event was included in */
  transaction: Transaction;
};

export type TranscoderUpdateEvent_Filter = {
  /** Filter for the block changed event. */
  _change_block?: InputMaybe<BlockChangedFilter>;
  and?: InputMaybe<Array<InputMaybe<TranscoderUpdateEvent_Filter>>>;
  delegate?: InputMaybe<Scalars["String"]>;
  delegate_?: InputMaybe<Transcoder_Filter>;
  delegate_contains?: InputMaybe<Scalars["String"]>;
  delegate_contains_nocase?: InputMaybe<Scalars["String"]>;
  delegate_ends_with?: InputMaybe<Scalars["String"]>;
  delegate_ends_with_nocase?: InputMaybe<Scalars["String"]>;
  delegate_gt?: InputMaybe<Scalars["String"]>;
  delegate_gte?: InputMaybe<Scalars["String"]>;
  delegate_in?: InputMaybe<Array<Scalars["String"]>>;
  delegate_lt?: InputMaybe<Scalars["String"]>;
  delegate_lte?: InputMaybe<Scalars["String"]>;
  delegate_not?: InputMaybe<Scalars["String"]>;
  delegate_not_contains?: InputMaybe<Scalars["String"]>;
  delegate_not_contains_nocase?: InputMaybe<Scalars["String"]>;
  delegate_not_ends_with?: InputMaybe<Scalars["String"]>;
  delegate_not_ends_with_nocase?: InputMaybe<Scalars["String"]>;
  delegate_not_in?: InputMaybe<Array<Scalars["String"]>>;
  delegate_not_starts_with?: InputMaybe<Scalars["String"]>;
  delegate_not_starts_with_nocase?: InputMaybe<Scalars["String"]>;
  delegate_starts_with?: InputMaybe<Scalars["String"]>;
  delegate_starts_with_nocase?: InputMaybe<Scalars["String"]>;
  feeShare?: InputMaybe<Scalars["BigInt"]>;
  feeShare_gt?: InputMaybe<Scalars["BigInt"]>;
  feeShare_gte?: InputMaybe<Scalars["BigInt"]>;
  feeShare_in?: InputMaybe<Array<Scalars["BigInt"]>>;
  feeShare_lt?: InputMaybe<Scalars["BigInt"]>;
  feeShare_lte?: InputMaybe<Scalars["BigInt"]>;
  feeShare_not?: InputMaybe<Scalars["BigInt"]>;
  feeShare_not_in?: InputMaybe<Array<Scalars["BigInt"]>>;
  id?: InputMaybe<Scalars["ID"]>;
  id_gt?: InputMaybe<Scalars["ID"]>;
  id_gte?: InputMaybe<Scalars["ID"]>;
  id_in?: InputMaybe<Array<Scalars["ID"]>>;
  id_lt?: InputMaybe<Scalars["ID"]>;
  id_lte?: InputMaybe<Scalars["ID"]>;
  id_not?: InputMaybe<Scalars["ID"]>;
  id_not_in?: InputMaybe<Array<Scalars["ID"]>>;
  or?: InputMaybe<Array<InputMaybe<TranscoderUpdateEvent_Filter>>>;
  rewardCut?: InputMaybe<Scalars["BigInt"]>;
  rewardCut_gt?: InputMaybe<Scalars["BigInt"]>;
  rewardCut_gte?: InputMaybe<Scalars["BigInt"]>;
  rewardCut_in?: InputMaybe<Array<Scalars["BigInt"]>>;
  rewardCut_lt?: InputMaybe<Scalars["BigInt"]>;
  rewardCut_lte?: InputMaybe<Scalars["BigInt"]>;
  rewardCut_not?: InputMaybe<Scalars["BigInt"]>;
  rewardCut_not_in?: InputMaybe<Array<Scalars["BigInt"]>>;
  round?: InputMaybe<Scalars["String"]>;
  round_?: InputMaybe<Round_Filter>;
  round_contains?: InputMaybe<Scalars["String"]>;
  round_contains_nocase?: InputMaybe<Scalars["String"]>;
  round_ends_with?: InputMaybe<Scalars["String"]>;
  round_ends_with_nocase?: InputMaybe<Scalars["String"]>;
  round_gt?: InputMaybe<Scalars["String"]>;
  round_gte?: InputMaybe<Scalars["String"]>;
  round_in?: InputMaybe<Array<Scalars["String"]>>;
  round_lt?: InputMaybe<Scalars["String"]>;
  round_lte?: InputMaybe<Scalars["String"]>;
  round_not?: InputMaybe<Scalars["String"]>;
  round_not_contains?: InputMaybe<Scalars["String"]>;
  round_not_contains_nocase?: InputMaybe<Scalars["String"]>;
  round_not_ends_with?: InputMaybe<Scalars["String"]>;
  round_not_ends_with_nocase?: InputMaybe<Scalars["String"]>;
  round_not_in?: InputMaybe<Array<Scalars["String"]>>;
  round_not_starts_with?: InputMaybe<Scalars["String"]>;
  round_not_starts_with_nocase?: InputMaybe<Scalars["String"]>;
  round_starts_with?: InputMaybe<Scalars["String"]>;
  round_starts_with_nocase?: InputMaybe<Scalars["String"]>;
  timestamp?: InputMaybe<Scalars["Int"]>;
  timestamp_gt?: InputMaybe<Scalars["Int"]>;
  timestamp_gte?: InputMaybe<Scalars["Int"]>;
  timestamp_in?: InputMaybe<Array<Scalars["Int"]>>;
  timestamp_lt?: InputMaybe<Scalars["Int"]>;
  timestamp_lte?: InputMaybe<Scalars["Int"]>;
  timestamp_not?: InputMaybe<Scalars["Int"]>;
  timestamp_not_in?: InputMaybe<Array<Scalars["Int"]>>;
  transaction?: InputMaybe<Scalars["String"]>;
  transaction_?: InputMaybe<Transaction_Filter>;
  transaction_contains?: InputMaybe<Scalars["String"]>;
  transaction_contains_nocase?: InputMaybe<Scalars["String"]>;
  transaction_ends_with?: InputMaybe<Scalars["String"]>;
  transaction_ends_with_nocase?: InputMaybe<Scalars["String"]>;
  transaction_gt?: InputMaybe<Scalars["String"]>;
  transaction_gte?: InputMaybe<Scalars["String"]>;
  transaction_in?: InputMaybe<Array<Scalars["String"]>>;
  transaction_lt?: InputMaybe<Scalars["String"]>;
  transaction_lte?: InputMaybe<Scalars["String"]>;
  transaction_not?: InputMaybe<Scalars["String"]>;
  transaction_not_contains?: InputMaybe<Scalars["String"]>;
  transaction_not_contains_nocase?: InputMaybe<Scalars["String"]>;
  transaction_not_ends_with?: InputMaybe<Scalars["String"]>;
  transaction_not_ends_with_nocase?: InputMaybe<Scalars["String"]>;
  transaction_not_in?: InputMaybe<Array<Scalars["String"]>>;
  transaction_not_starts_with?: InputMaybe<Scalars["String"]>;
  transaction_not_starts_with_nocase?: InputMaybe<Scalars["String"]>;
  transaction_starts_with?: InputMaybe<Scalars["String"]>;
  transaction_starts_with_nocase?: InputMaybe<Scalars["String"]>;
};

export enum TranscoderUpdateEvent_OrderBy {
  Delegate = "delegate",
  DelegateActivationRound = "delegate__activationRound",
  DelegateActivationTimestamp = "delegate__activationTimestamp",
  DelegateActive = "delegate__active",
  DelegateDeactivationRound = "delegate__deactivationRound",
  DelegateFeeShare = "delegate__feeShare",
  DelegateFeeShareUpdateTimestamp = "delegate__feeShareUpdateTimestamp",
  DelegateId = "delegate__id",
  DelegateLastActiveStakeUpdateRound = "delegate__lastActiveStakeUpdateRound",
  DelegateNinetyDayVolumeEth = "delegate__ninetyDayVolumeETH",
  DelegateRewardCut = "delegate__rewardCut",
  DelegateRewardCutUpdateTimestamp = "delegate__rewardCutUpdateTimestamp",
  DelegateServiceUri = "delegate__serviceURI",
  DelegateSixtyDayVolumeEth = "delegate__sixtyDayVolumeETH",
  DelegateStatus = "delegate__status",
  DelegateThirtyDayVolumeEth = "delegate__thirtyDayVolumeETH",
  DelegateTotalStake = "delegate__totalStake",
  DelegateTotalVolumeEth = "delegate__totalVolumeETH",
  DelegateTotalVolumeUsd = "delegate__totalVolumeUSD",
  FeeShare = "feeShare",
  Id = "id",
  RewardCut = "rewardCut",
  Round = "round",
  RoundActiveTranscoderCount = "round__activeTranscoderCount",
  RoundDelegatorsCount = "round__delegatorsCount",
  RoundEndBlock = "round__endBlock",
  RoundId = "round__id",
  RoundInflation = "round__inflation",
  RoundInitialized = "round__initialized",
  RoundLength = "round__length",
  RoundMintableTokens = "round__mintableTokens",
  RoundMovedStake = "round__movedStake",
  RoundNewStake = "round__newStake",
  RoundNumActiveTranscoders = "round__numActiveTranscoders",
  RoundParticipationRate = "round__participationRate",
  RoundStartBlock = "round__startBlock",
  RoundStartTimestamp = "round__startTimestamp",
  RoundTotalActiveStake = "round__totalActiveStake",
  RoundTotalSupply = "round__totalSupply",
  RoundVolumeEth = "round__volumeETH",
  RoundVolumeUsd = "round__volumeUSD",
  Timestamp = "timestamp",
  Transaction = "transaction",
  TransactionBlockNumber = "transaction__blockNumber",
  TransactionFrom = "transaction__from",
  TransactionGasPrice = "transaction__gasPrice",
  TransactionGasUsed = "transaction__gasUsed",
  TransactionId = "transaction__id",
  TransactionTimestamp = "transaction__timestamp",
  TransactionTo = "transaction__to",
}

export type Transcoder_Filter = {
  /** Filter for the block changed event. */
  _change_block?: InputMaybe<BlockChangedFilter>;
  activationRound?: InputMaybe<Scalars["BigInt"]>;
  activationRound_gt?: InputMaybe<Scalars["BigInt"]>;
  activationRound_gte?: InputMaybe<Scalars["BigInt"]>;
  activationRound_in?: InputMaybe<Array<Scalars["BigInt"]>>;
  activationRound_lt?: InputMaybe<Scalars["BigInt"]>;
  activationRound_lte?: InputMaybe<Scalars["BigInt"]>;
  activationRound_not?: InputMaybe<Scalars["BigInt"]>;
  activationRound_not_in?: InputMaybe<Array<Scalars["BigInt"]>>;
  activationTimestamp?: InputMaybe<Scalars["Int"]>;
  activationTimestamp_gt?: InputMaybe<Scalars["Int"]>;
  activationTimestamp_gte?: InputMaybe<Scalars["Int"]>;
  activationTimestamp_in?: InputMaybe<Array<Scalars["Int"]>>;
  activationTimestamp_lt?: InputMaybe<Scalars["Int"]>;
  activationTimestamp_lte?: InputMaybe<Scalars["Int"]>;
  activationTimestamp_not?: InputMaybe<Scalars["Int"]>;
  activationTimestamp_not_in?: InputMaybe<Array<Scalars["Int"]>>;
  active?: InputMaybe<Scalars["Boolean"]>;
  active_in?: InputMaybe<Array<Scalars["Boolean"]>>;
  active_not?: InputMaybe<Scalars["Boolean"]>;
  active_not_in?: InputMaybe<Array<Scalars["Boolean"]>>;
  and?: InputMaybe<Array<InputMaybe<Transcoder_Filter>>>;
  deactivationRound?: InputMaybe<Scalars["BigInt"]>;
  deactivationRound_gt?: InputMaybe<Scalars["BigInt"]>;
  deactivationRound_gte?: InputMaybe<Scalars["BigInt"]>;
  deactivationRound_in?: InputMaybe<Array<Scalars["BigInt"]>>;
  deactivationRound_lt?: InputMaybe<Scalars["BigInt"]>;
  deactivationRound_lte?: InputMaybe<Scalars["BigInt"]>;
  deactivationRound_not?: InputMaybe<Scalars["BigInt"]>;
  deactivationRound_not_in?: InputMaybe<Array<Scalars["BigInt"]>>;
  delegator?: InputMaybe<Scalars["String"]>;
  delegator_?: InputMaybe<Delegator_Filter>;
  delegator_contains?: InputMaybe<Scalars["String"]>;
  delegator_contains_nocase?: InputMaybe<Scalars["String"]>;
  delegator_ends_with?: InputMaybe<Scalars["String"]>;
  delegator_ends_with_nocase?: InputMaybe<Scalars["String"]>;
  delegator_gt?: InputMaybe<Scalars["String"]>;
  delegator_gte?: InputMaybe<Scalars["String"]>;
  delegator_in?: InputMaybe<Array<Scalars["String"]>>;
  delegator_lt?: InputMaybe<Scalars["String"]>;
  delegator_lte?: InputMaybe<Scalars["String"]>;
  delegator_not?: InputMaybe<Scalars["String"]>;
  delegator_not_contains?: InputMaybe<Scalars["String"]>;
  delegator_not_contains_nocase?: InputMaybe<Scalars["String"]>;
  delegator_not_ends_with?: InputMaybe<Scalars["String"]>;
  delegator_not_ends_with_nocase?: InputMaybe<Scalars["String"]>;
  delegator_not_in?: InputMaybe<Array<Scalars["String"]>>;
  delegator_not_starts_with?: InputMaybe<Scalars["String"]>;
  delegator_not_starts_with_nocase?: InputMaybe<Scalars["String"]>;
  delegator_starts_with?: InputMaybe<Scalars["String"]>;
  delegator_starts_with_nocase?: InputMaybe<Scalars["String"]>;
  delegators_?: InputMaybe<Delegator_Filter>;
  feeShare?: InputMaybe<Scalars["BigInt"]>;
  feeShareUpdateTimestamp?: InputMaybe<Scalars["Int"]>;
  feeShareUpdateTimestamp_gt?: InputMaybe<Scalars["Int"]>;
  feeShareUpdateTimestamp_gte?: InputMaybe<Scalars["Int"]>;
  feeShareUpdateTimestamp_in?: InputMaybe<Array<Scalars["Int"]>>;
  feeShareUpdateTimestamp_lt?: InputMaybe<Scalars["Int"]>;
  feeShareUpdateTimestamp_lte?: InputMaybe<Scalars["Int"]>;
  feeShareUpdateTimestamp_not?: InputMaybe<Scalars["Int"]>;
  feeShareUpdateTimestamp_not_in?: InputMaybe<Array<Scalars["Int"]>>;
  feeShare_gt?: InputMaybe<Scalars["BigInt"]>;
  feeShare_gte?: InputMaybe<Scalars["BigInt"]>;
  feeShare_in?: InputMaybe<Array<Scalars["BigInt"]>>;
  feeShare_lt?: InputMaybe<Scalars["BigInt"]>;
  feeShare_lte?: InputMaybe<Scalars["BigInt"]>;
  feeShare_not?: InputMaybe<Scalars["BigInt"]>;
  feeShare_not_in?: InputMaybe<Array<Scalars["BigInt"]>>;
  id?: InputMaybe<Scalars["ID"]>;
  id_gt?: InputMaybe<Scalars["ID"]>;
  id_gte?: InputMaybe<Scalars["ID"]>;
  id_in?: InputMaybe<Array<Scalars["ID"]>>;
  id_lt?: InputMaybe<Scalars["ID"]>;
  id_lte?: InputMaybe<Scalars["ID"]>;
  id_not?: InputMaybe<Scalars["ID"]>;
  id_not_in?: InputMaybe<Array<Scalars["ID"]>>;
  lastActiveStakeUpdateRound?: InputMaybe<Scalars["BigInt"]>;
  lastActiveStakeUpdateRound_gt?: InputMaybe<Scalars["BigInt"]>;
  lastActiveStakeUpdateRound_gte?: InputMaybe<Scalars["BigInt"]>;
  lastActiveStakeUpdateRound_in?: InputMaybe<Array<Scalars["BigInt"]>>;
  lastActiveStakeUpdateRound_lt?: InputMaybe<Scalars["BigInt"]>;
  lastActiveStakeUpdateRound_lte?: InputMaybe<Scalars["BigInt"]>;
  lastActiveStakeUpdateRound_not?: InputMaybe<Scalars["BigInt"]>;
  lastActiveStakeUpdateRound_not_in?: InputMaybe<Array<Scalars["BigInt"]>>;
  lastRewardRound?: InputMaybe<Scalars["String"]>;
  lastRewardRound_?: InputMaybe<Round_Filter>;
  lastRewardRound_contains?: InputMaybe<Scalars["String"]>;
  lastRewardRound_contains_nocase?: InputMaybe<Scalars["String"]>;
  lastRewardRound_ends_with?: InputMaybe<Scalars["String"]>;
  lastRewardRound_ends_with_nocase?: InputMaybe<Scalars["String"]>;
  lastRewardRound_gt?: InputMaybe<Scalars["String"]>;
  lastRewardRound_gte?: InputMaybe<Scalars["String"]>;
  lastRewardRound_in?: InputMaybe<Array<Scalars["String"]>>;
  lastRewardRound_lt?: InputMaybe<Scalars["String"]>;
  lastRewardRound_lte?: InputMaybe<Scalars["String"]>;
  lastRewardRound_not?: InputMaybe<Scalars["String"]>;
  lastRewardRound_not_contains?: InputMaybe<Scalars["String"]>;
  lastRewardRound_not_contains_nocase?: InputMaybe<Scalars["String"]>;
  lastRewardRound_not_ends_with?: InputMaybe<Scalars["String"]>;
  lastRewardRound_not_ends_with_nocase?: InputMaybe<Scalars["String"]>;
  lastRewardRound_not_in?: InputMaybe<Array<Scalars["String"]>>;
  lastRewardRound_not_starts_with?: InputMaybe<Scalars["String"]>;
  lastRewardRound_not_starts_with_nocase?: InputMaybe<Scalars["String"]>;
  lastRewardRound_starts_with?: InputMaybe<Scalars["String"]>;
  lastRewardRound_starts_with_nocase?: InputMaybe<Scalars["String"]>;
  ninetyDayVolumeETH?: InputMaybe<Scalars["BigDecimal"]>;
  ninetyDayVolumeETH_gt?: InputMaybe<Scalars["BigDecimal"]>;
  ninetyDayVolumeETH_gte?: InputMaybe<Scalars["BigDecimal"]>;
  ninetyDayVolumeETH_in?: InputMaybe<Array<Scalars["BigDecimal"]>>;
  ninetyDayVolumeETH_lt?: InputMaybe<Scalars["BigDecimal"]>;
  ninetyDayVolumeETH_lte?: InputMaybe<Scalars["BigDecimal"]>;
  ninetyDayVolumeETH_not?: InputMaybe<Scalars["BigDecimal"]>;
  ninetyDayVolumeETH_not_in?: InputMaybe<Array<Scalars["BigDecimal"]>>;
  or?: InputMaybe<Array<InputMaybe<Transcoder_Filter>>>;
  pools_?: InputMaybe<Pool_Filter>;
  rewardCut?: InputMaybe<Scalars["BigInt"]>;
  rewardCutUpdateTimestamp?: InputMaybe<Scalars["Int"]>;
  rewardCutUpdateTimestamp_gt?: InputMaybe<Scalars["Int"]>;
  rewardCutUpdateTimestamp_gte?: InputMaybe<Scalars["Int"]>;
  rewardCutUpdateTimestamp_in?: InputMaybe<Array<Scalars["Int"]>>;
  rewardCutUpdateTimestamp_lt?: InputMaybe<Scalars["Int"]>;
  rewardCutUpdateTimestamp_lte?: InputMaybe<Scalars["Int"]>;
  rewardCutUpdateTimestamp_not?: InputMaybe<Scalars["Int"]>;
  rewardCutUpdateTimestamp_not_in?: InputMaybe<Array<Scalars["Int"]>>;
  rewardCut_gt?: InputMaybe<Scalars["BigInt"]>;
  rewardCut_gte?: InputMaybe<Scalars["BigInt"]>;
  rewardCut_in?: InputMaybe<Array<Scalars["BigInt"]>>;
  rewardCut_lt?: InputMaybe<Scalars["BigInt"]>;
  rewardCut_lte?: InputMaybe<Scalars["BigInt"]>;
  rewardCut_not?: InputMaybe<Scalars["BigInt"]>;
  rewardCut_not_in?: InputMaybe<Array<Scalars["BigInt"]>>;
  serviceURI?: InputMaybe<Scalars["String"]>;
  serviceURI_contains?: InputMaybe<Scalars["String"]>;
  serviceURI_contains_nocase?: InputMaybe<Scalars["String"]>;
  serviceURI_ends_with?: InputMaybe<Scalars["String"]>;
  serviceURI_ends_with_nocase?: InputMaybe<Scalars["String"]>;
  serviceURI_gt?: InputMaybe<Scalars["String"]>;
  serviceURI_gte?: InputMaybe<Scalars["String"]>;
  serviceURI_in?: InputMaybe<Array<Scalars["String"]>>;
  serviceURI_lt?: InputMaybe<Scalars["String"]>;
  serviceURI_lte?: InputMaybe<Scalars["String"]>;
  serviceURI_not?: InputMaybe<Scalars["String"]>;
  serviceURI_not_contains?: InputMaybe<Scalars["String"]>;
  serviceURI_not_contains_nocase?: InputMaybe<Scalars["String"]>;
  serviceURI_not_ends_with?: InputMaybe<Scalars["String"]>;
  serviceURI_not_ends_with_nocase?: InputMaybe<Scalars["String"]>;
  serviceURI_not_in?: InputMaybe<Array<Scalars["String"]>>;
  serviceURI_not_starts_with?: InputMaybe<Scalars["String"]>;
  serviceURI_not_starts_with_nocase?: InputMaybe<Scalars["String"]>;
  serviceURI_starts_with?: InputMaybe<Scalars["String"]>;
  serviceURI_starts_with_nocase?: InputMaybe<Scalars["String"]>;
  sixtyDayVolumeETH?: InputMaybe<Scalars["BigDecimal"]>;
  sixtyDayVolumeETH_gt?: InputMaybe<Scalars["BigDecimal"]>;
  sixtyDayVolumeETH_gte?: InputMaybe<Scalars["BigDecimal"]>;
  sixtyDayVolumeETH_in?: InputMaybe<Array<Scalars["BigDecimal"]>>;
  sixtyDayVolumeETH_lt?: InputMaybe<Scalars["BigDecimal"]>;
  sixtyDayVolumeETH_lte?: InputMaybe<Scalars["BigDecimal"]>;
  sixtyDayVolumeETH_not?: InputMaybe<Scalars["BigDecimal"]>;
  sixtyDayVolumeETH_not_in?: InputMaybe<Array<Scalars["BigDecimal"]>>;
  status?: InputMaybe<TranscoderStatus>;
  status_in?: InputMaybe<Array<TranscoderStatus>>;
  status_not?: InputMaybe<TranscoderStatus>;
  status_not_in?: InputMaybe<Array<TranscoderStatus>>;
  thirtyDayVolumeETH?: InputMaybe<Scalars["BigDecimal"]>;
  thirtyDayVolumeETH_gt?: InputMaybe<Scalars["BigDecimal"]>;
  thirtyDayVolumeETH_gte?: InputMaybe<Scalars["BigDecimal"]>;
  thirtyDayVolumeETH_in?: InputMaybe<Array<Scalars["BigDecimal"]>>;
  thirtyDayVolumeETH_lt?: InputMaybe<Scalars["BigDecimal"]>;
  thirtyDayVolumeETH_lte?: InputMaybe<Scalars["BigDecimal"]>;
  thirtyDayVolumeETH_not?: InputMaybe<Scalars["BigDecimal"]>;
  thirtyDayVolumeETH_not_in?: InputMaybe<Array<Scalars["BigDecimal"]>>;
  totalStake?: InputMaybe<Scalars["BigDecimal"]>;
  totalStake_gt?: InputMaybe<Scalars["BigDecimal"]>;
  totalStake_gte?: InputMaybe<Scalars["BigDecimal"]>;
  totalStake_in?: InputMaybe<Array<Scalars["BigDecimal"]>>;
  totalStake_lt?: InputMaybe<Scalars["BigDecimal"]>;
  totalStake_lte?: InputMaybe<Scalars["BigDecimal"]>;
  totalStake_not?: InputMaybe<Scalars["BigDecimal"]>;
  totalStake_not_in?: InputMaybe<Array<Scalars["BigDecimal"]>>;
  totalVolumeETH?: InputMaybe<Scalars["BigDecimal"]>;
  totalVolumeETH_gt?: InputMaybe<Scalars["BigDecimal"]>;
  totalVolumeETH_gte?: InputMaybe<Scalars["BigDecimal"]>;
  totalVolumeETH_in?: InputMaybe<Array<Scalars["BigDecimal"]>>;
  totalVolumeETH_lt?: InputMaybe<Scalars["BigDecimal"]>;
  totalVolumeETH_lte?: InputMaybe<Scalars["BigDecimal"]>;
  totalVolumeETH_not?: InputMaybe<Scalars["BigDecimal"]>;
  totalVolumeETH_not_in?: InputMaybe<Array<Scalars["BigDecimal"]>>;
  totalVolumeUSD?: InputMaybe<Scalars["BigDecimal"]>;
  totalVolumeUSD_gt?: InputMaybe<Scalars["BigDecimal"]>;
  totalVolumeUSD_gte?: InputMaybe<Scalars["BigDecimal"]>;
  totalVolumeUSD_in?: InputMaybe<Array<Scalars["BigDecimal"]>>;
  totalVolumeUSD_lt?: InputMaybe<Scalars["BigDecimal"]>;
  totalVolumeUSD_lte?: InputMaybe<Scalars["BigDecimal"]>;
  totalVolumeUSD_not?: InputMaybe<Scalars["BigDecimal"]>;
  totalVolumeUSD_not_in?: InputMaybe<Array<Scalars["BigDecimal"]>>;
  transcoderDays?: InputMaybe<Array<Scalars["String"]>>;
  transcoderDays_?: InputMaybe<TranscoderDay_Filter>;
  transcoderDays_contains?: InputMaybe<Array<Scalars["String"]>>;
  transcoderDays_contains_nocase?: InputMaybe<Array<Scalars["String"]>>;
  transcoderDays_not?: InputMaybe<Array<Scalars["String"]>>;
  transcoderDays_not_contains?: InputMaybe<Array<Scalars["String"]>>;
  transcoderDays_not_contains_nocase?: InputMaybe<Array<Scalars["String"]>>;
};

export enum Transcoder_OrderBy {
  ActivationRound = "activationRound",
  ActivationTimestamp = "activationTimestamp",
  Active = "active",
  DeactivationRound = "deactivationRound",
  Delegator = "delegator",
  DelegatorBondedAmount = "delegator__bondedAmount",
  DelegatorDelegatedAmount = "delegator__delegatedAmount",
  DelegatorFees = "delegator__fees",
  DelegatorId = "delegator__id",
  DelegatorPrincipal = "delegator__principal",
  DelegatorStartRound = "delegator__startRound",
  DelegatorUnbonded = "delegator__unbonded",
  DelegatorWithdrawnFees = "delegator__withdrawnFees",
  Delegators = "delegators",
  FeeShare = "feeShare",
  FeeShareUpdateTimestamp = "feeShareUpdateTimestamp",
  Id = "id",
  LastActiveStakeUpdateRound = "lastActiveStakeUpdateRound",
  LastRewardRound = "lastRewardRound",
  LastRewardRoundActiveTranscoderCount = "lastRewardRound__activeTranscoderCount",
  LastRewardRoundDelegatorsCount = "lastRewardRound__delegatorsCount",
  LastRewardRoundEndBlock = "lastRewardRound__endBlock",
  LastRewardRoundId = "lastRewardRound__id",
  LastRewardRoundInflation = "lastRewardRound__inflation",
  LastRewardRoundInitialized = "lastRewardRound__initialized",
  LastRewardRoundLength = "lastRewardRound__length",
  LastRewardRoundMintableTokens = "lastRewardRound__mintableTokens",
  LastRewardRoundMovedStake = "lastRewardRound__movedStake",
  LastRewardRoundNewStake = "lastRewardRound__newStake",
  LastRewardRoundNumActiveTranscoders = "lastRewardRound__numActiveTranscoders",
  LastRewardRoundParticipationRate = "lastRewardRound__participationRate",
  LastRewardRoundStartBlock = "lastRewardRound__startBlock",
  LastRewardRoundStartTimestamp = "lastRewardRound__startTimestamp",
  LastRewardRoundTotalActiveStake = "lastRewardRound__totalActiveStake",
  LastRewardRoundTotalSupply = "lastRewardRound__totalSupply",
  LastRewardRoundVolumeEth = "lastRewardRound__volumeETH",
  LastRewardRoundVolumeUsd = "lastRewardRound__volumeUSD",
  NinetyDayVolumeEth = "ninetyDayVolumeETH",
  Pools = "pools",
  RewardCut = "rewardCut",
  RewardCutUpdateTimestamp = "rewardCutUpdateTimestamp",
  ServiceUri = "serviceURI",
  SixtyDayVolumeEth = "sixtyDayVolumeETH",
  Status = "status",
  ThirtyDayVolumeEth = "thirtyDayVolumeETH",
  TotalStake = "totalStake",
  TotalVolumeEth = "totalVolumeETH",
  TotalVolumeUsd = "totalVolumeUSD",
  TranscoderDays = "transcoderDays",
}

/**
 * TransferBond entities are created for every emitted TransferBond event.
 *
 */
export type TransferBondEvent = Event & {
  __typename: "TransferBondEvent";
  amount: Scalars["BigDecimal"];
  /** Ethereum transaction hash + event log index */
  id: Scalars["ID"];
  newDelegator: Delegator;
  newUnbondingLockId: Scalars["Int"];
  oldDelegator: Delegator;
  oldUnbondingLockId: Scalars["Int"];
  /** Reference to the round the event occured in */
  round: Round;
  /** Timestamp of the transaction the event was included in */
  timestamp: Scalars["Int"];
  /** Reference to the transaction the event was included in */
  transaction: Transaction;
};

export type TransferBondEvent_Filter = {
  /** Filter for the block changed event. */
  _change_block?: InputMaybe<BlockChangedFilter>;
  amount?: InputMaybe<Scalars["BigDecimal"]>;
  amount_gt?: InputMaybe<Scalars["BigDecimal"]>;
  amount_gte?: InputMaybe<Scalars["BigDecimal"]>;
  amount_in?: InputMaybe<Array<Scalars["BigDecimal"]>>;
  amount_lt?: InputMaybe<Scalars["BigDecimal"]>;
  amount_lte?: InputMaybe<Scalars["BigDecimal"]>;
  amount_not?: InputMaybe<Scalars["BigDecimal"]>;
  amount_not_in?: InputMaybe<Array<Scalars["BigDecimal"]>>;
  and?: InputMaybe<Array<InputMaybe<TransferBondEvent_Filter>>>;
  id?: InputMaybe<Scalars["ID"]>;
  id_gt?: InputMaybe<Scalars["ID"]>;
  id_gte?: InputMaybe<Scalars["ID"]>;
  id_in?: InputMaybe<Array<Scalars["ID"]>>;
  id_lt?: InputMaybe<Scalars["ID"]>;
  id_lte?: InputMaybe<Scalars["ID"]>;
  id_not?: InputMaybe<Scalars["ID"]>;
  id_not_in?: InputMaybe<Array<Scalars["ID"]>>;
  newDelegator?: InputMaybe<Scalars["String"]>;
  newDelegator_?: InputMaybe<Delegator_Filter>;
  newDelegator_contains?: InputMaybe<Scalars["String"]>;
  newDelegator_contains_nocase?: InputMaybe<Scalars["String"]>;
  newDelegator_ends_with?: InputMaybe<Scalars["String"]>;
  newDelegator_ends_with_nocase?: InputMaybe<Scalars["String"]>;
  newDelegator_gt?: InputMaybe<Scalars["String"]>;
  newDelegator_gte?: InputMaybe<Scalars["String"]>;
  newDelegator_in?: InputMaybe<Array<Scalars["String"]>>;
  newDelegator_lt?: InputMaybe<Scalars["String"]>;
  newDelegator_lte?: InputMaybe<Scalars["String"]>;
  newDelegator_not?: InputMaybe<Scalars["String"]>;
  newDelegator_not_contains?: InputMaybe<Scalars["String"]>;
  newDelegator_not_contains_nocase?: InputMaybe<Scalars["String"]>;
  newDelegator_not_ends_with?: InputMaybe<Scalars["String"]>;
  newDelegator_not_ends_with_nocase?: InputMaybe<Scalars["String"]>;
  newDelegator_not_in?: InputMaybe<Array<Scalars["String"]>>;
  newDelegator_not_starts_with?: InputMaybe<Scalars["String"]>;
  newDelegator_not_starts_with_nocase?: InputMaybe<Scalars["String"]>;
  newDelegator_starts_with?: InputMaybe<Scalars["String"]>;
  newDelegator_starts_with_nocase?: InputMaybe<Scalars["String"]>;
  newUnbondingLockId?: InputMaybe<Scalars["Int"]>;
  newUnbondingLockId_gt?: InputMaybe<Scalars["Int"]>;
  newUnbondingLockId_gte?: InputMaybe<Scalars["Int"]>;
  newUnbondingLockId_in?: InputMaybe<Array<Scalars["Int"]>>;
  newUnbondingLockId_lt?: InputMaybe<Scalars["Int"]>;
  newUnbondingLockId_lte?: InputMaybe<Scalars["Int"]>;
  newUnbondingLockId_not?: InputMaybe<Scalars["Int"]>;
  newUnbondingLockId_not_in?: InputMaybe<Array<Scalars["Int"]>>;
  oldDelegator?: InputMaybe<Scalars["String"]>;
  oldDelegator_?: InputMaybe<Delegator_Filter>;
  oldDelegator_contains?: InputMaybe<Scalars["String"]>;
  oldDelegator_contains_nocase?: InputMaybe<Scalars["String"]>;
  oldDelegator_ends_with?: InputMaybe<Scalars["String"]>;
  oldDelegator_ends_with_nocase?: InputMaybe<Scalars["String"]>;
  oldDelegator_gt?: InputMaybe<Scalars["String"]>;
  oldDelegator_gte?: InputMaybe<Scalars["String"]>;
  oldDelegator_in?: InputMaybe<Array<Scalars["String"]>>;
  oldDelegator_lt?: InputMaybe<Scalars["String"]>;
  oldDelegator_lte?: InputMaybe<Scalars["String"]>;
  oldDelegator_not?: InputMaybe<Scalars["String"]>;
  oldDelegator_not_contains?: InputMaybe<Scalars["String"]>;
  oldDelegator_not_contains_nocase?: InputMaybe<Scalars["String"]>;
  oldDelegator_not_ends_with?: InputMaybe<Scalars["String"]>;
  oldDelegator_not_ends_with_nocase?: InputMaybe<Scalars["String"]>;
  oldDelegator_not_in?: InputMaybe<Array<Scalars["String"]>>;
  oldDelegator_not_starts_with?: InputMaybe<Scalars["String"]>;
  oldDelegator_not_starts_with_nocase?: InputMaybe<Scalars["String"]>;
  oldDelegator_starts_with?: InputMaybe<Scalars["String"]>;
  oldDelegator_starts_with_nocase?: InputMaybe<Scalars["String"]>;
  oldUnbondingLockId?: InputMaybe<Scalars["Int"]>;
  oldUnbondingLockId_gt?: InputMaybe<Scalars["Int"]>;
  oldUnbondingLockId_gte?: InputMaybe<Scalars["Int"]>;
  oldUnbondingLockId_in?: InputMaybe<Array<Scalars["Int"]>>;
  oldUnbondingLockId_lt?: InputMaybe<Scalars["Int"]>;
  oldUnbondingLockId_lte?: InputMaybe<Scalars["Int"]>;
  oldUnbondingLockId_not?: InputMaybe<Scalars["Int"]>;
  oldUnbondingLockId_not_in?: InputMaybe<Array<Scalars["Int"]>>;
  or?: InputMaybe<Array<InputMaybe<TransferBondEvent_Filter>>>;
  round?: InputMaybe<Scalars["String"]>;
  round_?: InputMaybe<Round_Filter>;
  round_contains?: InputMaybe<Scalars["String"]>;
  round_contains_nocase?: InputMaybe<Scalars["String"]>;
  round_ends_with?: InputMaybe<Scalars["String"]>;
  round_ends_with_nocase?: InputMaybe<Scalars["String"]>;
  round_gt?: InputMaybe<Scalars["String"]>;
  round_gte?: InputMaybe<Scalars["String"]>;
  round_in?: InputMaybe<Array<Scalars["String"]>>;
  round_lt?: InputMaybe<Scalars["String"]>;
  round_lte?: InputMaybe<Scalars["String"]>;
  round_not?: InputMaybe<Scalars["String"]>;
  round_not_contains?: InputMaybe<Scalars["String"]>;
  round_not_contains_nocase?: InputMaybe<Scalars["String"]>;
  round_not_ends_with?: InputMaybe<Scalars["String"]>;
  round_not_ends_with_nocase?: InputMaybe<Scalars["String"]>;
  round_not_in?: InputMaybe<Array<Scalars["String"]>>;
  round_not_starts_with?: InputMaybe<Scalars["String"]>;
  round_not_starts_with_nocase?: InputMaybe<Scalars["String"]>;
  round_starts_with?: InputMaybe<Scalars["String"]>;
  round_starts_with_nocase?: InputMaybe<Scalars["String"]>;
  timestamp?: InputMaybe<Scalars["Int"]>;
  timestamp_gt?: InputMaybe<Scalars["Int"]>;
  timestamp_gte?: InputMaybe<Scalars["Int"]>;
  timestamp_in?: InputMaybe<Array<Scalars["Int"]>>;
  timestamp_lt?: InputMaybe<Scalars["Int"]>;
  timestamp_lte?: InputMaybe<Scalars["Int"]>;
  timestamp_not?: InputMaybe<Scalars["Int"]>;
  timestamp_not_in?: InputMaybe<Array<Scalars["Int"]>>;
  transaction?: InputMaybe<Scalars["String"]>;
  transaction_?: InputMaybe<Transaction_Filter>;
  transaction_contains?: InputMaybe<Scalars["String"]>;
  transaction_contains_nocase?: InputMaybe<Scalars["String"]>;
  transaction_ends_with?: InputMaybe<Scalars["String"]>;
  transaction_ends_with_nocase?: InputMaybe<Scalars["String"]>;
  transaction_gt?: InputMaybe<Scalars["String"]>;
  transaction_gte?: InputMaybe<Scalars["String"]>;
  transaction_in?: InputMaybe<Array<Scalars["String"]>>;
  transaction_lt?: InputMaybe<Scalars["String"]>;
  transaction_lte?: InputMaybe<Scalars["String"]>;
  transaction_not?: InputMaybe<Scalars["String"]>;
  transaction_not_contains?: InputMaybe<Scalars["String"]>;
  transaction_not_contains_nocase?: InputMaybe<Scalars["String"]>;
  transaction_not_ends_with?: InputMaybe<Scalars["String"]>;
  transaction_not_ends_with_nocase?: InputMaybe<Scalars["String"]>;
  transaction_not_in?: InputMaybe<Array<Scalars["String"]>>;
  transaction_not_starts_with?: InputMaybe<Scalars["String"]>;
  transaction_not_starts_with_nocase?: InputMaybe<Scalars["String"]>;
  transaction_starts_with?: InputMaybe<Scalars["String"]>;
  transaction_starts_with_nocase?: InputMaybe<Scalars["String"]>;
};

export enum TransferBondEvent_OrderBy {
  Amount = "amount",
  Id = "id",
  NewDelegator = "newDelegator",
  NewDelegatorBondedAmount = "newDelegator__bondedAmount",
  NewDelegatorDelegatedAmount = "newDelegator__delegatedAmount",
  NewDelegatorFees = "newDelegator__fees",
  NewDelegatorId = "newDelegator__id",
  NewDelegatorPrincipal = "newDelegator__principal",
  NewDelegatorStartRound = "newDelegator__startRound",
  NewDelegatorUnbonded = "newDelegator__unbonded",
  NewDelegatorWithdrawnFees = "newDelegator__withdrawnFees",
  NewUnbondingLockId = "newUnbondingLockId",
  OldDelegator = "oldDelegator",
  OldDelegatorBondedAmount = "oldDelegator__bondedAmount",
  OldDelegatorDelegatedAmount = "oldDelegator__delegatedAmount",
  OldDelegatorFees = "oldDelegator__fees",
  OldDelegatorId = "oldDelegator__id",
  OldDelegatorPrincipal = "oldDelegator__principal",
  OldDelegatorStartRound = "oldDelegator__startRound",
  OldDelegatorUnbonded = "oldDelegator__unbonded",
  OldDelegatorWithdrawnFees = "oldDelegator__withdrawnFees",
  OldUnbondingLockId = "oldUnbondingLockId",
  Round = "round",
  RoundActiveTranscoderCount = "round__activeTranscoderCount",
  RoundDelegatorsCount = "round__delegatorsCount",
  RoundEndBlock = "round__endBlock",
  RoundId = "round__id",
  RoundInflation = "round__inflation",
  RoundInitialized = "round__initialized",
  RoundLength = "round__length",
  RoundMintableTokens = "round__mintableTokens",
  RoundMovedStake = "round__movedStake",
  RoundNewStake = "round__newStake",
  RoundNumActiveTranscoders = "round__numActiveTranscoders",
  RoundParticipationRate = "round__participationRate",
  RoundStartBlock = "round__startBlock",
  RoundStartTimestamp = "round__startTimestamp",
  RoundTotalActiveStake = "round__totalActiveStake",
  RoundTotalSupply = "round__totalSupply",
  RoundVolumeEth = "round__volumeETH",
  RoundVolumeUsd = "round__volumeUSD",
  Timestamp = "timestamp",
  Transaction = "transaction",
  TransactionBlockNumber = "transaction__blockNumber",
  TransactionFrom = "transaction__from",
  TransactionGasPrice = "transaction__gasPrice",
  TransactionGasUsed = "transaction__gasUsed",
  TransactionId = "transaction__id",
  TransactionTimestamp = "transaction__timestamp",
  TransactionTo = "transaction__to",
}

export type TreasuryProposal = {
  __typename: "TreasuryProposal";
  /** Functions to call on the targets on proposal execution */
  calldatas: Array<Scalars["Bytes"]>;
  /** Description of the proposal */
  description: Scalars["String"];
  /** Governor proposal ID formatted as a decimal number */
  id: Scalars["ID"];
  /** Account that created the proposal */
  proposer: LivepeerAccount;
  /** Targets to be called on proposal execution */
  targets: Array<Scalars["String"]>;
  /** Values to be passed to the targets on proposal execution */
  values: Array<Scalars["BigInt"]>;
  /** Round after which the proposal voting will end and, if approved, execution will be allowed */
  voteEnd: Scalars["BigInt"];
  /** Round after which the proposal voting will begin */
  voteStart: Scalars["BigInt"];
};

export type TreasuryProposal_Filter = {
  /** Filter for the block changed event. */
  _change_block?: InputMaybe<BlockChangedFilter>;
  and?: InputMaybe<Array<InputMaybe<TreasuryProposal_Filter>>>;
  calldatas?: InputMaybe<Array<Scalars["Bytes"]>>;
  calldatas_contains?: InputMaybe<Array<Scalars["Bytes"]>>;
  calldatas_contains_nocase?: InputMaybe<Array<Scalars["Bytes"]>>;
  calldatas_not?: InputMaybe<Array<Scalars["Bytes"]>>;
  calldatas_not_contains?: InputMaybe<Array<Scalars["Bytes"]>>;
  calldatas_not_contains_nocase?: InputMaybe<Array<Scalars["Bytes"]>>;
  description?: InputMaybe<Scalars["String"]>;
  description_contains?: InputMaybe<Scalars["String"]>;
  description_contains_nocase?: InputMaybe<Scalars["String"]>;
  description_ends_with?: InputMaybe<Scalars["String"]>;
  description_ends_with_nocase?: InputMaybe<Scalars["String"]>;
  description_gt?: InputMaybe<Scalars["String"]>;
  description_gte?: InputMaybe<Scalars["String"]>;
  description_in?: InputMaybe<Array<Scalars["String"]>>;
  description_lt?: InputMaybe<Scalars["String"]>;
  description_lte?: InputMaybe<Scalars["String"]>;
  description_not?: InputMaybe<Scalars["String"]>;
  description_not_contains?: InputMaybe<Scalars["String"]>;
  description_not_contains_nocase?: InputMaybe<Scalars["String"]>;
  description_not_ends_with?: InputMaybe<Scalars["String"]>;
  description_not_ends_with_nocase?: InputMaybe<Scalars["String"]>;
  description_not_in?: InputMaybe<Array<Scalars["String"]>>;
  description_not_starts_with?: InputMaybe<Scalars["String"]>;
  description_not_starts_with_nocase?: InputMaybe<Scalars["String"]>;
  description_starts_with?: InputMaybe<Scalars["String"]>;
  description_starts_with_nocase?: InputMaybe<Scalars["String"]>;
  id?: InputMaybe<Scalars["ID"]>;
  id_gt?: InputMaybe<Scalars["ID"]>;
  id_gte?: InputMaybe<Scalars["ID"]>;
  id_in?: InputMaybe<Array<Scalars["ID"]>>;
  id_lt?: InputMaybe<Scalars["ID"]>;
  id_lte?: InputMaybe<Scalars["ID"]>;
  id_not?: InputMaybe<Scalars["ID"]>;
  id_not_in?: InputMaybe<Array<Scalars["ID"]>>;
  or?: InputMaybe<Array<InputMaybe<TreasuryProposal_Filter>>>;
  proposer?: InputMaybe<Scalars["String"]>;
  proposer_?: InputMaybe<LivepeerAccount_Filter>;
  proposer_contains?: InputMaybe<Scalars["String"]>;
  proposer_contains_nocase?: InputMaybe<Scalars["String"]>;
  proposer_ends_with?: InputMaybe<Scalars["String"]>;
  proposer_ends_with_nocase?: InputMaybe<Scalars["String"]>;
  proposer_gt?: InputMaybe<Scalars["String"]>;
  proposer_gte?: InputMaybe<Scalars["String"]>;
  proposer_in?: InputMaybe<Array<Scalars["String"]>>;
  proposer_lt?: InputMaybe<Scalars["String"]>;
  proposer_lte?: InputMaybe<Scalars["String"]>;
  proposer_not?: InputMaybe<Scalars["String"]>;
  proposer_not_contains?: InputMaybe<Scalars["String"]>;
  proposer_not_contains_nocase?: InputMaybe<Scalars["String"]>;
  proposer_not_ends_with?: InputMaybe<Scalars["String"]>;
  proposer_not_ends_with_nocase?: InputMaybe<Scalars["String"]>;
  proposer_not_in?: InputMaybe<Array<Scalars["String"]>>;
  proposer_not_starts_with?: InputMaybe<Scalars["String"]>;
  proposer_not_starts_with_nocase?: InputMaybe<Scalars["String"]>;
  proposer_starts_with?: InputMaybe<Scalars["String"]>;
  proposer_starts_with_nocase?: InputMaybe<Scalars["String"]>;
  targets?: InputMaybe<Array<Scalars["String"]>>;
  targets_contains?: InputMaybe<Array<Scalars["String"]>>;
  targets_contains_nocase?: InputMaybe<Array<Scalars["String"]>>;
  targets_not?: InputMaybe<Array<Scalars["String"]>>;
  targets_not_contains?: InputMaybe<Array<Scalars["String"]>>;
  targets_not_contains_nocase?: InputMaybe<Array<Scalars["String"]>>;
  values?: InputMaybe<Array<Scalars["BigInt"]>>;
  values_contains?: InputMaybe<Array<Scalars["BigInt"]>>;
  values_contains_nocase?: InputMaybe<Array<Scalars["BigInt"]>>;
  values_not?: InputMaybe<Array<Scalars["BigInt"]>>;
  values_not_contains?: InputMaybe<Array<Scalars["BigInt"]>>;
  values_not_contains_nocase?: InputMaybe<Array<Scalars["BigInt"]>>;
  voteEnd?: InputMaybe<Scalars["BigInt"]>;
  voteEnd_gt?: InputMaybe<Scalars["BigInt"]>;
  voteEnd_gte?: InputMaybe<Scalars["BigInt"]>;
  voteEnd_in?: InputMaybe<Array<Scalars["BigInt"]>>;
  voteEnd_lt?: InputMaybe<Scalars["BigInt"]>;
  voteEnd_lte?: InputMaybe<Scalars["BigInt"]>;
  voteEnd_not?: InputMaybe<Scalars["BigInt"]>;
  voteEnd_not_in?: InputMaybe<Array<Scalars["BigInt"]>>;
  voteStart?: InputMaybe<Scalars["BigInt"]>;
  voteStart_gt?: InputMaybe<Scalars["BigInt"]>;
  voteStart_gte?: InputMaybe<Scalars["BigInt"]>;
  voteStart_in?: InputMaybe<Array<Scalars["BigInt"]>>;
  voteStart_lt?: InputMaybe<Scalars["BigInt"]>;
  voteStart_lte?: InputMaybe<Scalars["BigInt"]>;
  voteStart_not?: InputMaybe<Scalars["BigInt"]>;
  voteStart_not_in?: InputMaybe<Array<Scalars["BigInt"]>>;
};

export enum TreasuryProposal_OrderBy {
  Calldatas = "calldatas",
  Description = "description",
  Id = "id",
  Proposer = "proposer",
  ProposerId = "proposer__id",
  ProposerLastUpdatedTimestamp = "proposer__lastUpdatedTimestamp",
  Targets = "targets",
  Values = "values",
  VoteEnd = "voteEnd",
  VoteStart = "voteStart",
}

/**
 * UnbondEvent entities are created for every emitted Unbond event.
 *
 */
export type UnbondEvent = Event & {
  __typename: "UnbondEvent";
  /** Amount unbonded in the transaction */
  amount: Scalars["BigDecimal"];
  /** Reference to the delegate unbonded from */
  delegate: Transcoder;
  /** Reference to the Delegator that unbonded */
  delegator: Delegator;
  /** Ethereum transaction hash + event log index */
  id: Scalars["ID"];
  /** Reference to the round the event occured in */
  round: Round;
  /** Timestamp of the transaction the event was included in */
  timestamp: Scalars["Int"];
  /** Reference to the transaction the event was included in */
  transaction: Transaction;
  /** The unbonding lock ID associated with this transaction, used to optionally rebond the amount */
  unbondingLockId?: Maybe<Scalars["Int"]>;
  /** The future round in which the Delegator may withdraw its unbonded stake */
  withdrawRound: Scalars["BigInt"];
};

export type UnbondEvent_Filter = {
  /** Filter for the block changed event. */
  _change_block?: InputMaybe<BlockChangedFilter>;
  amount?: InputMaybe<Scalars["BigDecimal"]>;
  amount_gt?: InputMaybe<Scalars["BigDecimal"]>;
  amount_gte?: InputMaybe<Scalars["BigDecimal"]>;
  amount_in?: InputMaybe<Array<Scalars["BigDecimal"]>>;
  amount_lt?: InputMaybe<Scalars["BigDecimal"]>;
  amount_lte?: InputMaybe<Scalars["BigDecimal"]>;
  amount_not?: InputMaybe<Scalars["BigDecimal"]>;
  amount_not_in?: InputMaybe<Array<Scalars["BigDecimal"]>>;
  and?: InputMaybe<Array<InputMaybe<UnbondEvent_Filter>>>;
  delegate?: InputMaybe<Scalars["String"]>;
  delegate_?: InputMaybe<Transcoder_Filter>;
  delegate_contains?: InputMaybe<Scalars["String"]>;
  delegate_contains_nocase?: InputMaybe<Scalars["String"]>;
  delegate_ends_with?: InputMaybe<Scalars["String"]>;
  delegate_ends_with_nocase?: InputMaybe<Scalars["String"]>;
  delegate_gt?: InputMaybe<Scalars["String"]>;
  delegate_gte?: InputMaybe<Scalars["String"]>;
  delegate_in?: InputMaybe<Array<Scalars["String"]>>;
  delegate_lt?: InputMaybe<Scalars["String"]>;
  delegate_lte?: InputMaybe<Scalars["String"]>;
  delegate_not?: InputMaybe<Scalars["String"]>;
  delegate_not_contains?: InputMaybe<Scalars["String"]>;
  delegate_not_contains_nocase?: InputMaybe<Scalars["String"]>;
  delegate_not_ends_with?: InputMaybe<Scalars["String"]>;
  delegate_not_ends_with_nocase?: InputMaybe<Scalars["String"]>;
  delegate_not_in?: InputMaybe<Array<Scalars["String"]>>;
  delegate_not_starts_with?: InputMaybe<Scalars["String"]>;
  delegate_not_starts_with_nocase?: InputMaybe<Scalars["String"]>;
  delegate_starts_with?: InputMaybe<Scalars["String"]>;
  delegate_starts_with_nocase?: InputMaybe<Scalars["String"]>;
  delegator?: InputMaybe<Scalars["String"]>;
  delegator_?: InputMaybe<Delegator_Filter>;
  delegator_contains?: InputMaybe<Scalars["String"]>;
  delegator_contains_nocase?: InputMaybe<Scalars["String"]>;
  delegator_ends_with?: InputMaybe<Scalars["String"]>;
  delegator_ends_with_nocase?: InputMaybe<Scalars["String"]>;
  delegator_gt?: InputMaybe<Scalars["String"]>;
  delegator_gte?: InputMaybe<Scalars["String"]>;
  delegator_in?: InputMaybe<Array<Scalars["String"]>>;
  delegator_lt?: InputMaybe<Scalars["String"]>;
  delegator_lte?: InputMaybe<Scalars["String"]>;
  delegator_not?: InputMaybe<Scalars["String"]>;
  delegator_not_contains?: InputMaybe<Scalars["String"]>;
  delegator_not_contains_nocase?: InputMaybe<Scalars["String"]>;
  delegator_not_ends_with?: InputMaybe<Scalars["String"]>;
  delegator_not_ends_with_nocase?: InputMaybe<Scalars["String"]>;
  delegator_not_in?: InputMaybe<Array<Scalars["String"]>>;
  delegator_not_starts_with?: InputMaybe<Scalars["String"]>;
  delegator_not_starts_with_nocase?: InputMaybe<Scalars["String"]>;
  delegator_starts_with?: InputMaybe<Scalars["String"]>;
  delegator_starts_with_nocase?: InputMaybe<Scalars["String"]>;
  id?: InputMaybe<Scalars["ID"]>;
  id_gt?: InputMaybe<Scalars["ID"]>;
  id_gte?: InputMaybe<Scalars["ID"]>;
  id_in?: InputMaybe<Array<Scalars["ID"]>>;
  id_lt?: InputMaybe<Scalars["ID"]>;
  id_lte?: InputMaybe<Scalars["ID"]>;
  id_not?: InputMaybe<Scalars["ID"]>;
  id_not_in?: InputMaybe<Array<Scalars["ID"]>>;
  or?: InputMaybe<Array<InputMaybe<UnbondEvent_Filter>>>;
  round?: InputMaybe<Scalars["String"]>;
  round_?: InputMaybe<Round_Filter>;
  round_contains?: InputMaybe<Scalars["String"]>;
  round_contains_nocase?: InputMaybe<Scalars["String"]>;
  round_ends_with?: InputMaybe<Scalars["String"]>;
  round_ends_with_nocase?: InputMaybe<Scalars["String"]>;
  round_gt?: InputMaybe<Scalars["String"]>;
  round_gte?: InputMaybe<Scalars["String"]>;
  round_in?: InputMaybe<Array<Scalars["String"]>>;
  round_lt?: InputMaybe<Scalars["String"]>;
  round_lte?: InputMaybe<Scalars["String"]>;
  round_not?: InputMaybe<Scalars["String"]>;
  round_not_contains?: InputMaybe<Scalars["String"]>;
  round_not_contains_nocase?: InputMaybe<Scalars["String"]>;
  round_not_ends_with?: InputMaybe<Scalars["String"]>;
  round_not_ends_with_nocase?: InputMaybe<Scalars["String"]>;
  round_not_in?: InputMaybe<Array<Scalars["String"]>>;
  round_not_starts_with?: InputMaybe<Scalars["String"]>;
  round_not_starts_with_nocase?: InputMaybe<Scalars["String"]>;
  round_starts_with?: InputMaybe<Scalars["String"]>;
  round_starts_with_nocase?: InputMaybe<Scalars["String"]>;
  timestamp?: InputMaybe<Scalars["Int"]>;
  timestamp_gt?: InputMaybe<Scalars["Int"]>;
  timestamp_gte?: InputMaybe<Scalars["Int"]>;
  timestamp_in?: InputMaybe<Array<Scalars["Int"]>>;
  timestamp_lt?: InputMaybe<Scalars["Int"]>;
  timestamp_lte?: InputMaybe<Scalars["Int"]>;
  timestamp_not?: InputMaybe<Scalars["Int"]>;
  timestamp_not_in?: InputMaybe<Array<Scalars["Int"]>>;
  transaction?: InputMaybe<Scalars["String"]>;
  transaction_?: InputMaybe<Transaction_Filter>;
  transaction_contains?: InputMaybe<Scalars["String"]>;
  transaction_contains_nocase?: InputMaybe<Scalars["String"]>;
  transaction_ends_with?: InputMaybe<Scalars["String"]>;
  transaction_ends_with_nocase?: InputMaybe<Scalars["String"]>;
  transaction_gt?: InputMaybe<Scalars["String"]>;
  transaction_gte?: InputMaybe<Scalars["String"]>;
  transaction_in?: InputMaybe<Array<Scalars["String"]>>;
  transaction_lt?: InputMaybe<Scalars["String"]>;
  transaction_lte?: InputMaybe<Scalars["String"]>;
  transaction_not?: InputMaybe<Scalars["String"]>;
  transaction_not_contains?: InputMaybe<Scalars["String"]>;
  transaction_not_contains_nocase?: InputMaybe<Scalars["String"]>;
  transaction_not_ends_with?: InputMaybe<Scalars["String"]>;
  transaction_not_ends_with_nocase?: InputMaybe<Scalars["String"]>;
  transaction_not_in?: InputMaybe<Array<Scalars["String"]>>;
  transaction_not_starts_with?: InputMaybe<Scalars["String"]>;
  transaction_not_starts_with_nocase?: InputMaybe<Scalars["String"]>;
  transaction_starts_with?: InputMaybe<Scalars["String"]>;
  transaction_starts_with_nocase?: InputMaybe<Scalars["String"]>;
  unbondingLockId?: InputMaybe<Scalars["Int"]>;
  unbondingLockId_gt?: InputMaybe<Scalars["Int"]>;
  unbondingLockId_gte?: InputMaybe<Scalars["Int"]>;
  unbondingLockId_in?: InputMaybe<Array<Scalars["Int"]>>;
  unbondingLockId_lt?: InputMaybe<Scalars["Int"]>;
  unbondingLockId_lte?: InputMaybe<Scalars["Int"]>;
  unbondingLockId_not?: InputMaybe<Scalars["Int"]>;
  unbondingLockId_not_in?: InputMaybe<Array<Scalars["Int"]>>;
  withdrawRound?: InputMaybe<Scalars["BigInt"]>;
  withdrawRound_gt?: InputMaybe<Scalars["BigInt"]>;
  withdrawRound_gte?: InputMaybe<Scalars["BigInt"]>;
  withdrawRound_in?: InputMaybe<Array<Scalars["BigInt"]>>;
  withdrawRound_lt?: InputMaybe<Scalars["BigInt"]>;
  withdrawRound_lte?: InputMaybe<Scalars["BigInt"]>;
  withdrawRound_not?: InputMaybe<Scalars["BigInt"]>;
  withdrawRound_not_in?: InputMaybe<Array<Scalars["BigInt"]>>;
};

export enum UnbondEvent_OrderBy {
  Amount = "amount",
  Delegate = "delegate",
  DelegateActivationRound = "delegate__activationRound",
  DelegateActivationTimestamp = "delegate__activationTimestamp",
  DelegateActive = "delegate__active",
  DelegateDeactivationRound = "delegate__deactivationRound",
  DelegateFeeShare = "delegate__feeShare",
  DelegateFeeShareUpdateTimestamp = "delegate__feeShareUpdateTimestamp",
  DelegateId = "delegate__id",
  DelegateLastActiveStakeUpdateRound = "delegate__lastActiveStakeUpdateRound",
  DelegateNinetyDayVolumeEth = "delegate__ninetyDayVolumeETH",
  DelegateRewardCut = "delegate__rewardCut",
  DelegateRewardCutUpdateTimestamp = "delegate__rewardCutUpdateTimestamp",
  DelegateServiceUri = "delegate__serviceURI",
  DelegateSixtyDayVolumeEth = "delegate__sixtyDayVolumeETH",
  DelegateStatus = "delegate__status",
  DelegateThirtyDayVolumeEth = "delegate__thirtyDayVolumeETH",
  DelegateTotalStake = "delegate__totalStake",
  DelegateTotalVolumeEth = "delegate__totalVolumeETH",
  DelegateTotalVolumeUsd = "delegate__totalVolumeUSD",
  Delegator = "delegator",
  DelegatorBondedAmount = "delegator__bondedAmount",
  DelegatorDelegatedAmount = "delegator__delegatedAmount",
  DelegatorFees = "delegator__fees",
  DelegatorId = "delegator__id",
  DelegatorPrincipal = "delegator__principal",
  DelegatorStartRound = "delegator__startRound",
  DelegatorUnbonded = "delegator__unbonded",
  DelegatorWithdrawnFees = "delegator__withdrawnFees",
  Id = "id",
  Round = "round",
  RoundActiveTranscoderCount = "round__activeTranscoderCount",
  RoundDelegatorsCount = "round__delegatorsCount",
  RoundEndBlock = "round__endBlock",
  RoundId = "round__id",
  RoundInflation = "round__inflation",
  RoundInitialized = "round__initialized",
  RoundLength = "round__length",
  RoundMintableTokens = "round__mintableTokens",
  RoundMovedStake = "round__movedStake",
  RoundNewStake = "round__newStake",
  RoundNumActiveTranscoders = "round__numActiveTranscoders",
  RoundParticipationRate = "round__participationRate",
  RoundStartBlock = "round__startBlock",
  RoundStartTimestamp = "round__startTimestamp",
  RoundTotalActiveStake = "round__totalActiveStake",
  RoundTotalSupply = "round__totalSupply",
  RoundVolumeEth = "round__volumeETH",
  RoundVolumeUsd = "round__volumeUSD",
  Timestamp = "timestamp",
  Transaction = "transaction",
  TransactionBlockNumber = "transaction__blockNumber",
  TransactionFrom = "transaction__from",
  TransactionGasPrice = "transaction__gasPrice",
  TransactionGasUsed = "transaction__gasUsed",
  TransactionId = "transaction__id",
  TransactionTimestamp = "transaction__timestamp",
  TransactionTo = "transaction__to",
  UnbondingLockId = "unbondingLockId",
  WithdrawRound = "withdrawRound",
}

/**
 * Get an unbonding lock for a delegator
 *
 */
export type UnbondingLock = {
  __typename: "UnbondingLock";
  /** Amount being unbonded */
  amount: Scalars["BigDecimal"];
  /** Address of delegate unbonding from */
  delegate: Transcoder;
  /** Delegator address this lock belongs to */
  delegator: Delegator;
  /** Unique unlock identifer */
  id: Scalars["ID"];
  /** Account that initiates the transaction that creates the unbonding lock */
  sender: Scalars["String"];
  /** unbonding lock id */
  unbondingLockId: Scalars["Int"];
  /** Round number when the unbonding amount will be available for withdrawal */
  withdrawRound: Scalars["BigInt"];
};

export type UnbondingLock_Filter = {
  /** Filter for the block changed event. */
  _change_block?: InputMaybe<BlockChangedFilter>;
  amount?: InputMaybe<Scalars["BigDecimal"]>;
  amount_gt?: InputMaybe<Scalars["BigDecimal"]>;
  amount_gte?: InputMaybe<Scalars["BigDecimal"]>;
  amount_in?: InputMaybe<Array<Scalars["BigDecimal"]>>;
  amount_lt?: InputMaybe<Scalars["BigDecimal"]>;
  amount_lte?: InputMaybe<Scalars["BigDecimal"]>;
  amount_not?: InputMaybe<Scalars["BigDecimal"]>;
  amount_not_in?: InputMaybe<Array<Scalars["BigDecimal"]>>;
  and?: InputMaybe<Array<InputMaybe<UnbondingLock_Filter>>>;
  delegate?: InputMaybe<Scalars["String"]>;
  delegate_?: InputMaybe<Transcoder_Filter>;
  delegate_contains?: InputMaybe<Scalars["String"]>;
  delegate_contains_nocase?: InputMaybe<Scalars["String"]>;
  delegate_ends_with?: InputMaybe<Scalars["String"]>;
  delegate_ends_with_nocase?: InputMaybe<Scalars["String"]>;
  delegate_gt?: InputMaybe<Scalars["String"]>;
  delegate_gte?: InputMaybe<Scalars["String"]>;
  delegate_in?: InputMaybe<Array<Scalars["String"]>>;
  delegate_lt?: InputMaybe<Scalars["String"]>;
  delegate_lte?: InputMaybe<Scalars["String"]>;
  delegate_not?: InputMaybe<Scalars["String"]>;
  delegate_not_contains?: InputMaybe<Scalars["String"]>;
  delegate_not_contains_nocase?: InputMaybe<Scalars["String"]>;
  delegate_not_ends_with?: InputMaybe<Scalars["String"]>;
  delegate_not_ends_with_nocase?: InputMaybe<Scalars["String"]>;
  delegate_not_in?: InputMaybe<Array<Scalars["String"]>>;
  delegate_not_starts_with?: InputMaybe<Scalars["String"]>;
  delegate_not_starts_with_nocase?: InputMaybe<Scalars["String"]>;
  delegate_starts_with?: InputMaybe<Scalars["String"]>;
  delegate_starts_with_nocase?: InputMaybe<Scalars["String"]>;
  delegator?: InputMaybe<Scalars["String"]>;
  delegator_?: InputMaybe<Delegator_Filter>;
  delegator_contains?: InputMaybe<Scalars["String"]>;
  delegator_contains_nocase?: InputMaybe<Scalars["String"]>;
  delegator_ends_with?: InputMaybe<Scalars["String"]>;
  delegator_ends_with_nocase?: InputMaybe<Scalars["String"]>;
  delegator_gt?: InputMaybe<Scalars["String"]>;
  delegator_gte?: InputMaybe<Scalars["String"]>;
  delegator_in?: InputMaybe<Array<Scalars["String"]>>;
  delegator_lt?: InputMaybe<Scalars["String"]>;
  delegator_lte?: InputMaybe<Scalars["String"]>;
  delegator_not?: InputMaybe<Scalars["String"]>;
  delegator_not_contains?: InputMaybe<Scalars["String"]>;
  delegator_not_contains_nocase?: InputMaybe<Scalars["String"]>;
  delegator_not_ends_with?: InputMaybe<Scalars["String"]>;
  delegator_not_ends_with_nocase?: InputMaybe<Scalars["String"]>;
  delegator_not_in?: InputMaybe<Array<Scalars["String"]>>;
  delegator_not_starts_with?: InputMaybe<Scalars["String"]>;
  delegator_not_starts_with_nocase?: InputMaybe<Scalars["String"]>;
  delegator_starts_with?: InputMaybe<Scalars["String"]>;
  delegator_starts_with_nocase?: InputMaybe<Scalars["String"]>;
  id?: InputMaybe<Scalars["ID"]>;
  id_gt?: InputMaybe<Scalars["ID"]>;
  id_gte?: InputMaybe<Scalars["ID"]>;
  id_in?: InputMaybe<Array<Scalars["ID"]>>;
  id_lt?: InputMaybe<Scalars["ID"]>;
  id_lte?: InputMaybe<Scalars["ID"]>;
  id_not?: InputMaybe<Scalars["ID"]>;
  id_not_in?: InputMaybe<Array<Scalars["ID"]>>;
  or?: InputMaybe<Array<InputMaybe<UnbondingLock_Filter>>>;
  sender?: InputMaybe<Scalars["String"]>;
  sender_contains?: InputMaybe<Scalars["String"]>;
  sender_contains_nocase?: InputMaybe<Scalars["String"]>;
  sender_ends_with?: InputMaybe<Scalars["String"]>;
  sender_ends_with_nocase?: InputMaybe<Scalars["String"]>;
  sender_gt?: InputMaybe<Scalars["String"]>;
  sender_gte?: InputMaybe<Scalars["String"]>;
  sender_in?: InputMaybe<Array<Scalars["String"]>>;
  sender_lt?: InputMaybe<Scalars["String"]>;
  sender_lte?: InputMaybe<Scalars["String"]>;
  sender_not?: InputMaybe<Scalars["String"]>;
  sender_not_contains?: InputMaybe<Scalars["String"]>;
  sender_not_contains_nocase?: InputMaybe<Scalars["String"]>;
  sender_not_ends_with?: InputMaybe<Scalars["String"]>;
  sender_not_ends_with_nocase?: InputMaybe<Scalars["String"]>;
  sender_not_in?: InputMaybe<Array<Scalars["String"]>>;
  sender_not_starts_with?: InputMaybe<Scalars["String"]>;
  sender_not_starts_with_nocase?: InputMaybe<Scalars["String"]>;
  sender_starts_with?: InputMaybe<Scalars["String"]>;
  sender_starts_with_nocase?: InputMaybe<Scalars["String"]>;
  unbondingLockId?: InputMaybe<Scalars["Int"]>;
  unbondingLockId_gt?: InputMaybe<Scalars["Int"]>;
  unbondingLockId_gte?: InputMaybe<Scalars["Int"]>;
  unbondingLockId_in?: InputMaybe<Array<Scalars["Int"]>>;
  unbondingLockId_lt?: InputMaybe<Scalars["Int"]>;
  unbondingLockId_lte?: InputMaybe<Scalars["Int"]>;
  unbondingLockId_not?: InputMaybe<Scalars["Int"]>;
  unbondingLockId_not_in?: InputMaybe<Array<Scalars["Int"]>>;
  withdrawRound?: InputMaybe<Scalars["BigInt"]>;
  withdrawRound_gt?: InputMaybe<Scalars["BigInt"]>;
  withdrawRound_gte?: InputMaybe<Scalars["BigInt"]>;
  withdrawRound_in?: InputMaybe<Array<Scalars["BigInt"]>>;
  withdrawRound_lt?: InputMaybe<Scalars["BigInt"]>;
  withdrawRound_lte?: InputMaybe<Scalars["BigInt"]>;
  withdrawRound_not?: InputMaybe<Scalars["BigInt"]>;
  withdrawRound_not_in?: InputMaybe<Array<Scalars["BigInt"]>>;
};

export enum UnbondingLock_OrderBy {
  Amount = "amount",
  Delegate = "delegate",
  DelegateActivationRound = "delegate__activationRound",
  DelegateActivationTimestamp = "delegate__activationTimestamp",
  DelegateActive = "delegate__active",
  DelegateDeactivationRound = "delegate__deactivationRound",
  DelegateFeeShare = "delegate__feeShare",
  DelegateFeeShareUpdateTimestamp = "delegate__feeShareUpdateTimestamp",
  DelegateId = "delegate__id",
  DelegateLastActiveStakeUpdateRound = "delegate__lastActiveStakeUpdateRound",
  DelegateNinetyDayVolumeEth = "delegate__ninetyDayVolumeETH",
  DelegateRewardCut = "delegate__rewardCut",
  DelegateRewardCutUpdateTimestamp = "delegate__rewardCutUpdateTimestamp",
  DelegateServiceUri = "delegate__serviceURI",
  DelegateSixtyDayVolumeEth = "delegate__sixtyDayVolumeETH",
  DelegateStatus = "delegate__status",
  DelegateThirtyDayVolumeEth = "delegate__thirtyDayVolumeETH",
  DelegateTotalStake = "delegate__totalStake",
  DelegateTotalVolumeEth = "delegate__totalVolumeETH",
  DelegateTotalVolumeUsd = "delegate__totalVolumeUSD",
  Delegator = "delegator",
  DelegatorBondedAmount = "delegator__bondedAmount",
  DelegatorDelegatedAmount = "delegator__delegatedAmount",
  DelegatorFees = "delegator__fees",
  DelegatorId = "delegator__id",
  DelegatorPrincipal = "delegator__principal",
  DelegatorStartRound = "delegator__startRound",
  DelegatorUnbonded = "delegator__unbonded",
  DelegatorWithdrawnFees = "delegator__withdrawnFees",
  Id = "id",
  Sender = "sender",
  UnbondingLockId = "unbondingLockId",
  WithdrawRound = "withdrawRound",
}

/**
 * UnpauseEvent entities are created for every emitted Unpause event.
 *
 */
export type UnpauseEvent = Event & {
  __typename: "UnpauseEvent";
  /** Ethereum transaction hash + event log index */
  id: Scalars["ID"];
  /** Reference to the round the event occured in */
  round: Round;
  /** Timestamp of the transaction the event was included in */
  timestamp: Scalars["Int"];
  /** Reference to the transaction the event was included in */
  transaction: Transaction;
};

export type UnpauseEvent_Filter = {
  /** Filter for the block changed event. */
  _change_block?: InputMaybe<BlockChangedFilter>;
  and?: InputMaybe<Array<InputMaybe<UnpauseEvent_Filter>>>;
  id?: InputMaybe<Scalars["ID"]>;
  id_gt?: InputMaybe<Scalars["ID"]>;
  id_gte?: InputMaybe<Scalars["ID"]>;
  id_in?: InputMaybe<Array<Scalars["ID"]>>;
  id_lt?: InputMaybe<Scalars["ID"]>;
  id_lte?: InputMaybe<Scalars["ID"]>;
  id_not?: InputMaybe<Scalars["ID"]>;
  id_not_in?: InputMaybe<Array<Scalars["ID"]>>;
  or?: InputMaybe<Array<InputMaybe<UnpauseEvent_Filter>>>;
  round?: InputMaybe<Scalars["String"]>;
  round_?: InputMaybe<Round_Filter>;
  round_contains?: InputMaybe<Scalars["String"]>;
  round_contains_nocase?: InputMaybe<Scalars["String"]>;
  round_ends_with?: InputMaybe<Scalars["String"]>;
  round_ends_with_nocase?: InputMaybe<Scalars["String"]>;
  round_gt?: InputMaybe<Scalars["String"]>;
  round_gte?: InputMaybe<Scalars["String"]>;
  round_in?: InputMaybe<Array<Scalars["String"]>>;
  round_lt?: InputMaybe<Scalars["String"]>;
  round_lte?: InputMaybe<Scalars["String"]>;
  round_not?: InputMaybe<Scalars["String"]>;
  round_not_contains?: InputMaybe<Scalars["String"]>;
  round_not_contains_nocase?: InputMaybe<Scalars["String"]>;
  round_not_ends_with?: InputMaybe<Scalars["String"]>;
  round_not_ends_with_nocase?: InputMaybe<Scalars["String"]>;
  round_not_in?: InputMaybe<Array<Scalars["String"]>>;
  round_not_starts_with?: InputMaybe<Scalars["String"]>;
  round_not_starts_with_nocase?: InputMaybe<Scalars["String"]>;
  round_starts_with?: InputMaybe<Scalars["String"]>;
  round_starts_with_nocase?: InputMaybe<Scalars["String"]>;
  timestamp?: InputMaybe<Scalars["Int"]>;
  timestamp_gt?: InputMaybe<Scalars["Int"]>;
  timestamp_gte?: InputMaybe<Scalars["Int"]>;
  timestamp_in?: InputMaybe<Array<Scalars["Int"]>>;
  timestamp_lt?: InputMaybe<Scalars["Int"]>;
  timestamp_lte?: InputMaybe<Scalars["Int"]>;
  timestamp_not?: InputMaybe<Scalars["Int"]>;
  timestamp_not_in?: InputMaybe<Array<Scalars["Int"]>>;
  transaction?: InputMaybe<Scalars["String"]>;
  transaction_?: InputMaybe<Transaction_Filter>;
  transaction_contains?: InputMaybe<Scalars["String"]>;
  transaction_contains_nocase?: InputMaybe<Scalars["String"]>;
  transaction_ends_with?: InputMaybe<Scalars["String"]>;
  transaction_ends_with_nocase?: InputMaybe<Scalars["String"]>;
  transaction_gt?: InputMaybe<Scalars["String"]>;
  transaction_gte?: InputMaybe<Scalars["String"]>;
  transaction_in?: InputMaybe<Array<Scalars["String"]>>;
  transaction_lt?: InputMaybe<Scalars["String"]>;
  transaction_lte?: InputMaybe<Scalars["String"]>;
  transaction_not?: InputMaybe<Scalars["String"]>;
  transaction_not_contains?: InputMaybe<Scalars["String"]>;
  transaction_not_contains_nocase?: InputMaybe<Scalars["String"]>;
  transaction_not_ends_with?: InputMaybe<Scalars["String"]>;
  transaction_not_ends_with_nocase?: InputMaybe<Scalars["String"]>;
  transaction_not_in?: InputMaybe<Array<Scalars["String"]>>;
  transaction_not_starts_with?: InputMaybe<Scalars["String"]>;
  transaction_not_starts_with_nocase?: InputMaybe<Scalars["String"]>;
  transaction_starts_with?: InputMaybe<Scalars["String"]>;
  transaction_starts_with_nocase?: InputMaybe<Scalars["String"]>;
};

export enum UnpauseEvent_OrderBy {
  Id = "id",
  Round = "round",
  RoundActiveTranscoderCount = "round__activeTranscoderCount",
  RoundDelegatorsCount = "round__delegatorsCount",
  RoundEndBlock = "round__endBlock",
  RoundId = "round__id",
  RoundInflation = "round__inflation",
  RoundInitialized = "round__initialized",
  RoundLength = "round__length",
  RoundMintableTokens = "round__mintableTokens",
  RoundMovedStake = "round__movedStake",
  RoundNewStake = "round__newStake",
  RoundNumActiveTranscoders = "round__numActiveTranscoders",
  RoundParticipationRate = "round__participationRate",
  RoundStartBlock = "round__startBlock",
  RoundStartTimestamp = "round__startTimestamp",
  RoundTotalActiveStake = "round__totalActiveStake",
  RoundTotalSupply = "round__totalSupply",
  RoundVolumeEth = "round__volumeETH",
  RoundVolumeUsd = "round__volumeUSD",
  Timestamp = "timestamp",
  Transaction = "transaction",
  TransactionBlockNumber = "transaction__blockNumber",
  TransactionFrom = "transaction__from",
  TransactionGasPrice = "transaction__gasPrice",
  TransactionGasUsed = "transaction__gasUsed",
  TransactionId = "transaction__id",
  TransactionTimestamp = "transaction__timestamp",
  TransactionTo = "transaction__to",
}

/**
 * Vote data
 *
 */
export type Vote = {
  __typename: "Vote";
  /** Vote choice */
  choiceID?: Maybe<PollChoice>;
  /** Voter address + poll address */
  id: Scalars["ID"];
  /** This will be non-zero if voter is an transcoder and any of the its delegators voted */
  nonVoteStake: Scalars["BigDecimal"];
  /** Poll associated with this vote */
  poll?: Maybe<Poll>;
  /** True if the voter was a registered transcoder during the poll period */
  registeredTranscoder?: Maybe<Scalars["Boolean"]>;
  /** Stake weighted vote */
  voteStake: Scalars["BigDecimal"];
  /** Vote caster */
  voter: Scalars["String"];
};

/**
 * VoteEvent entities are created for every emitted Vote event.
 *
 */
export type VoteEvent = Event & {
  __typename: "VoteEvent";
  /** Voter choice. Zero means yes and one means no */
  choiceID: Scalars["BigInt"];
  /** Ethereum transaction hash + event log index */
  id: Scalars["ID"];
  /** Reference to the poll this vote was casted in */
  poll: Poll;
  /** Reference to the round the event occured in */
  round: Round;
  /** Timestamp of the transaction the event was included in */
  timestamp: Scalars["Int"];
  /** Reference to the transaction the event was included in */
  transaction: Transaction;
  /** Address belonging to the voter */
  voter: Scalars["String"];
};

export type VoteEvent_Filter = {
  /** Filter for the block changed event. */
  _change_block?: InputMaybe<BlockChangedFilter>;
  and?: InputMaybe<Array<InputMaybe<VoteEvent_Filter>>>;
  choiceID?: InputMaybe<Scalars["BigInt"]>;
  choiceID_gt?: InputMaybe<Scalars["BigInt"]>;
  choiceID_gte?: InputMaybe<Scalars["BigInt"]>;
  choiceID_in?: InputMaybe<Array<Scalars["BigInt"]>>;
  choiceID_lt?: InputMaybe<Scalars["BigInt"]>;
  choiceID_lte?: InputMaybe<Scalars["BigInt"]>;
  choiceID_not?: InputMaybe<Scalars["BigInt"]>;
  choiceID_not_in?: InputMaybe<Array<Scalars["BigInt"]>>;
  id?: InputMaybe<Scalars["ID"]>;
  id_gt?: InputMaybe<Scalars["ID"]>;
  id_gte?: InputMaybe<Scalars["ID"]>;
  id_in?: InputMaybe<Array<Scalars["ID"]>>;
  id_lt?: InputMaybe<Scalars["ID"]>;
  id_lte?: InputMaybe<Scalars["ID"]>;
  id_not?: InputMaybe<Scalars["ID"]>;
  id_not_in?: InputMaybe<Array<Scalars["ID"]>>;
  or?: InputMaybe<Array<InputMaybe<VoteEvent_Filter>>>;
  poll?: InputMaybe<Scalars["String"]>;
  poll_?: InputMaybe<Poll_Filter>;
  poll_contains?: InputMaybe<Scalars["String"]>;
  poll_contains_nocase?: InputMaybe<Scalars["String"]>;
  poll_ends_with?: InputMaybe<Scalars["String"]>;
  poll_ends_with_nocase?: InputMaybe<Scalars["String"]>;
  poll_gt?: InputMaybe<Scalars["String"]>;
  poll_gte?: InputMaybe<Scalars["String"]>;
  poll_in?: InputMaybe<Array<Scalars["String"]>>;
  poll_lt?: InputMaybe<Scalars["String"]>;
  poll_lte?: InputMaybe<Scalars["String"]>;
  poll_not?: InputMaybe<Scalars["String"]>;
  poll_not_contains?: InputMaybe<Scalars["String"]>;
  poll_not_contains_nocase?: InputMaybe<Scalars["String"]>;
  poll_not_ends_with?: InputMaybe<Scalars["String"]>;
  poll_not_ends_with_nocase?: InputMaybe<Scalars["String"]>;
  poll_not_in?: InputMaybe<Array<Scalars["String"]>>;
  poll_not_starts_with?: InputMaybe<Scalars["String"]>;
  poll_not_starts_with_nocase?: InputMaybe<Scalars["String"]>;
  poll_starts_with?: InputMaybe<Scalars["String"]>;
  poll_starts_with_nocase?: InputMaybe<Scalars["String"]>;
  round?: InputMaybe<Scalars["String"]>;
  round_?: InputMaybe<Round_Filter>;
  round_contains?: InputMaybe<Scalars["String"]>;
  round_contains_nocase?: InputMaybe<Scalars["String"]>;
  round_ends_with?: InputMaybe<Scalars["String"]>;
  round_ends_with_nocase?: InputMaybe<Scalars["String"]>;
  round_gt?: InputMaybe<Scalars["String"]>;
  round_gte?: InputMaybe<Scalars["String"]>;
  round_in?: InputMaybe<Array<Scalars["String"]>>;
  round_lt?: InputMaybe<Scalars["String"]>;
  round_lte?: InputMaybe<Scalars["String"]>;
  round_not?: InputMaybe<Scalars["String"]>;
  round_not_contains?: InputMaybe<Scalars["String"]>;
  round_not_contains_nocase?: InputMaybe<Scalars["String"]>;
  round_not_ends_with?: InputMaybe<Scalars["String"]>;
  round_not_ends_with_nocase?: InputMaybe<Scalars["String"]>;
  round_not_in?: InputMaybe<Array<Scalars["String"]>>;
  round_not_starts_with?: InputMaybe<Scalars["String"]>;
  round_not_starts_with_nocase?: InputMaybe<Scalars["String"]>;
  round_starts_with?: InputMaybe<Scalars["String"]>;
  round_starts_with_nocase?: InputMaybe<Scalars["String"]>;
  timestamp?: InputMaybe<Scalars["Int"]>;
  timestamp_gt?: InputMaybe<Scalars["Int"]>;
  timestamp_gte?: InputMaybe<Scalars["Int"]>;
  timestamp_in?: InputMaybe<Array<Scalars["Int"]>>;
  timestamp_lt?: InputMaybe<Scalars["Int"]>;
  timestamp_lte?: InputMaybe<Scalars["Int"]>;
  timestamp_not?: InputMaybe<Scalars["Int"]>;
  timestamp_not_in?: InputMaybe<Array<Scalars["Int"]>>;
  transaction?: InputMaybe<Scalars["String"]>;
  transaction_?: InputMaybe<Transaction_Filter>;
  transaction_contains?: InputMaybe<Scalars["String"]>;
  transaction_contains_nocase?: InputMaybe<Scalars["String"]>;
  transaction_ends_with?: InputMaybe<Scalars["String"]>;
  transaction_ends_with_nocase?: InputMaybe<Scalars["String"]>;
  transaction_gt?: InputMaybe<Scalars["String"]>;
  transaction_gte?: InputMaybe<Scalars["String"]>;
  transaction_in?: InputMaybe<Array<Scalars["String"]>>;
  transaction_lt?: InputMaybe<Scalars["String"]>;
  transaction_lte?: InputMaybe<Scalars["String"]>;
  transaction_not?: InputMaybe<Scalars["String"]>;
  transaction_not_contains?: InputMaybe<Scalars["String"]>;
  transaction_not_contains_nocase?: InputMaybe<Scalars["String"]>;
  transaction_not_ends_with?: InputMaybe<Scalars["String"]>;
  transaction_not_ends_with_nocase?: InputMaybe<Scalars["String"]>;
  transaction_not_in?: InputMaybe<Array<Scalars["String"]>>;
  transaction_not_starts_with?: InputMaybe<Scalars["String"]>;
  transaction_not_starts_with_nocase?: InputMaybe<Scalars["String"]>;
  transaction_starts_with?: InputMaybe<Scalars["String"]>;
  transaction_starts_with_nocase?: InputMaybe<Scalars["String"]>;
  voter?: InputMaybe<Scalars["String"]>;
  voter_contains?: InputMaybe<Scalars["String"]>;
  voter_contains_nocase?: InputMaybe<Scalars["String"]>;
  voter_ends_with?: InputMaybe<Scalars["String"]>;
  voter_ends_with_nocase?: InputMaybe<Scalars["String"]>;
  voter_gt?: InputMaybe<Scalars["String"]>;
  voter_gte?: InputMaybe<Scalars["String"]>;
  voter_in?: InputMaybe<Array<Scalars["String"]>>;
  voter_lt?: InputMaybe<Scalars["String"]>;
  voter_lte?: InputMaybe<Scalars["String"]>;
  voter_not?: InputMaybe<Scalars["String"]>;
  voter_not_contains?: InputMaybe<Scalars["String"]>;
  voter_not_contains_nocase?: InputMaybe<Scalars["String"]>;
  voter_not_ends_with?: InputMaybe<Scalars["String"]>;
  voter_not_ends_with_nocase?: InputMaybe<Scalars["String"]>;
  voter_not_in?: InputMaybe<Array<Scalars["String"]>>;
  voter_not_starts_with?: InputMaybe<Scalars["String"]>;
  voter_not_starts_with_nocase?: InputMaybe<Scalars["String"]>;
  voter_starts_with?: InputMaybe<Scalars["String"]>;
  voter_starts_with_nocase?: InputMaybe<Scalars["String"]>;
};

export enum VoteEvent_OrderBy {
  ChoiceId = "choiceID",
  Id = "id",
  Poll = "poll",
  PollEndBlock = "poll__endBlock",
  PollId = "poll__id",
  PollProposal = "poll__proposal",
  PollQuorum = "poll__quorum",
  PollQuota = "poll__quota",
  Round = "round",
  RoundActiveTranscoderCount = "round__activeTranscoderCount",
  RoundDelegatorsCount = "round__delegatorsCount",
  RoundEndBlock = "round__endBlock",
  RoundId = "round__id",
  RoundInflation = "round__inflation",
  RoundInitialized = "round__initialized",
  RoundLength = "round__length",
  RoundMintableTokens = "round__mintableTokens",
  RoundMovedStake = "round__movedStake",
  RoundNewStake = "round__newStake",
  RoundNumActiveTranscoders = "round__numActiveTranscoders",
  RoundParticipationRate = "round__participationRate",
  RoundStartBlock = "round__startBlock",
  RoundStartTimestamp = "round__startTimestamp",
  RoundTotalActiveStake = "round__totalActiveStake",
  RoundTotalSupply = "round__totalSupply",
  RoundVolumeEth = "round__volumeETH",
  RoundVolumeUsd = "round__volumeUSD",
  Timestamp = "timestamp",
  Transaction = "transaction",
  TransactionBlockNumber = "transaction__blockNumber",
  TransactionFrom = "transaction__from",
  TransactionGasPrice = "transaction__gasPrice",
  TransactionGasUsed = "transaction__gasUsed",
  TransactionId = "transaction__id",
  TransactionTimestamp = "transaction__timestamp",
  TransactionTo = "transaction__to",
  Voter = "voter",
}

export type Vote_Filter = {
  /** Filter for the block changed event. */
  _change_block?: InputMaybe<BlockChangedFilter>;
  and?: InputMaybe<Array<InputMaybe<Vote_Filter>>>;
  choiceID?: InputMaybe<PollChoice>;
  choiceID_in?: InputMaybe<Array<PollChoice>>;
  choiceID_not?: InputMaybe<PollChoice>;
  choiceID_not_in?: InputMaybe<Array<PollChoice>>;
  id?: InputMaybe<Scalars["ID"]>;
  id_gt?: InputMaybe<Scalars["ID"]>;
  id_gte?: InputMaybe<Scalars["ID"]>;
  id_in?: InputMaybe<Array<Scalars["ID"]>>;
  id_lt?: InputMaybe<Scalars["ID"]>;
  id_lte?: InputMaybe<Scalars["ID"]>;
  id_not?: InputMaybe<Scalars["ID"]>;
  id_not_in?: InputMaybe<Array<Scalars["ID"]>>;
  nonVoteStake?: InputMaybe<Scalars["BigDecimal"]>;
  nonVoteStake_gt?: InputMaybe<Scalars["BigDecimal"]>;
  nonVoteStake_gte?: InputMaybe<Scalars["BigDecimal"]>;
  nonVoteStake_in?: InputMaybe<Array<Scalars["BigDecimal"]>>;
  nonVoteStake_lt?: InputMaybe<Scalars["BigDecimal"]>;
  nonVoteStake_lte?: InputMaybe<Scalars["BigDecimal"]>;
  nonVoteStake_not?: InputMaybe<Scalars["BigDecimal"]>;
  nonVoteStake_not_in?: InputMaybe<Array<Scalars["BigDecimal"]>>;
  or?: InputMaybe<Array<InputMaybe<Vote_Filter>>>;
  poll?: InputMaybe<Scalars["String"]>;
  poll_?: InputMaybe<Poll_Filter>;
  poll_contains?: InputMaybe<Scalars["String"]>;
  poll_contains_nocase?: InputMaybe<Scalars["String"]>;
  poll_ends_with?: InputMaybe<Scalars["String"]>;
  poll_ends_with_nocase?: InputMaybe<Scalars["String"]>;
  poll_gt?: InputMaybe<Scalars["String"]>;
  poll_gte?: InputMaybe<Scalars["String"]>;
  poll_in?: InputMaybe<Array<Scalars["String"]>>;
  poll_lt?: InputMaybe<Scalars["String"]>;
  poll_lte?: InputMaybe<Scalars["String"]>;
  poll_not?: InputMaybe<Scalars["String"]>;
  poll_not_contains?: InputMaybe<Scalars["String"]>;
  poll_not_contains_nocase?: InputMaybe<Scalars["String"]>;
  poll_not_ends_with?: InputMaybe<Scalars["String"]>;
  poll_not_ends_with_nocase?: InputMaybe<Scalars["String"]>;
  poll_not_in?: InputMaybe<Array<Scalars["String"]>>;
  poll_not_starts_with?: InputMaybe<Scalars["String"]>;
  poll_not_starts_with_nocase?: InputMaybe<Scalars["String"]>;
  poll_starts_with?: InputMaybe<Scalars["String"]>;
  poll_starts_with_nocase?: InputMaybe<Scalars["String"]>;
  registeredTranscoder?: InputMaybe<Scalars["Boolean"]>;
  registeredTranscoder_in?: InputMaybe<Array<Scalars["Boolean"]>>;
  registeredTranscoder_not?: InputMaybe<Scalars["Boolean"]>;
  registeredTranscoder_not_in?: InputMaybe<Array<Scalars["Boolean"]>>;
  voteStake?: InputMaybe<Scalars["BigDecimal"]>;
  voteStake_gt?: InputMaybe<Scalars["BigDecimal"]>;
  voteStake_gte?: InputMaybe<Scalars["BigDecimal"]>;
  voteStake_in?: InputMaybe<Array<Scalars["BigDecimal"]>>;
  voteStake_lt?: InputMaybe<Scalars["BigDecimal"]>;
  voteStake_lte?: InputMaybe<Scalars["BigDecimal"]>;
  voteStake_not?: InputMaybe<Scalars["BigDecimal"]>;
  voteStake_not_in?: InputMaybe<Array<Scalars["BigDecimal"]>>;
  voter?: InputMaybe<Scalars["String"]>;
  voter_contains?: InputMaybe<Scalars["String"]>;
  voter_contains_nocase?: InputMaybe<Scalars["String"]>;
  voter_ends_with?: InputMaybe<Scalars["String"]>;
  voter_ends_with_nocase?: InputMaybe<Scalars["String"]>;
  voter_gt?: InputMaybe<Scalars["String"]>;
  voter_gte?: InputMaybe<Scalars["String"]>;
  voter_in?: InputMaybe<Array<Scalars["String"]>>;
  voter_lt?: InputMaybe<Scalars["String"]>;
  voter_lte?: InputMaybe<Scalars["String"]>;
  voter_not?: InputMaybe<Scalars["String"]>;
  voter_not_contains?: InputMaybe<Scalars["String"]>;
  voter_not_contains_nocase?: InputMaybe<Scalars["String"]>;
  voter_not_ends_with?: InputMaybe<Scalars["String"]>;
  voter_not_ends_with_nocase?: InputMaybe<Scalars["String"]>;
  voter_not_in?: InputMaybe<Array<Scalars["String"]>>;
  voter_not_starts_with?: InputMaybe<Scalars["String"]>;
  voter_not_starts_with_nocase?: InputMaybe<Scalars["String"]>;
  voter_starts_with?: InputMaybe<Scalars["String"]>;
  voter_starts_with_nocase?: InputMaybe<Scalars["String"]>;
};

export enum Vote_OrderBy {
  ChoiceId = "choiceID",
  Id = "id",
  NonVoteStake = "nonVoteStake",
  Poll = "poll",
  PollEndBlock = "poll__endBlock",
  PollId = "poll__id",
  PollProposal = "poll__proposal",
  PollQuorum = "poll__quorum",
  PollQuota = "poll__quota",
  RegisteredTranscoder = "registeredTranscoder",
  VoteStake = "voteStake",
  Voter = "voter",
}

/**
 * WinningTicketRedeemedEvent entities are created for every emitted WinningTicketRedeemed event.
 *
 */
export type WinningTicketRedeemedEvent = Event & {
  __typename: "WinningTicketRedeemedEvent";
  /** Auxilary data included in ticket used for additional validation */
  auxData: Scalars["Bytes"];
  /** Face value of ticket paid to recipient */
  faceValue: Scalars["BigDecimal"];
  /** Amount of fees the winning ticket was redeemed for in in USD */
  faceValueUSD: Scalars["BigDecimal"];
  /** Ethereum transaction hash + event log index */
  id: Scalars["ID"];
  /** Reference to the recipient of the broadcaster fees */
  recipient: Transcoder;
  /** keccak256 hash commitment to recipient's random value */
  recipientRand: Scalars["BigInt"];
  /** Reference to the round the event occured in */
  round: Round;
  /** Reference to the broadcaster who sent the fees */
  sender: Broadcaster;
  /** Sender's monotonically increasing counter for each ticket */
  senderNonce: Scalars["BigInt"];
  /** Timestamp of the transaction the event was included in */
  timestamp: Scalars["Int"];
  /** Reference to the transaction the event was included in */
  transaction: Transaction;
  /** The winning probability of the ticket */
  winProb: Scalars["BigInt"];
};

export type WinningTicketRedeemedEvent_Filter = {
  /** Filter for the block changed event. */
  _change_block?: InputMaybe<BlockChangedFilter>;
  and?: InputMaybe<Array<InputMaybe<WinningTicketRedeemedEvent_Filter>>>;
  auxData?: InputMaybe<Scalars["Bytes"]>;
  auxData_contains?: InputMaybe<Scalars["Bytes"]>;
  auxData_gt?: InputMaybe<Scalars["Bytes"]>;
  auxData_gte?: InputMaybe<Scalars["Bytes"]>;
  auxData_in?: InputMaybe<Array<Scalars["Bytes"]>>;
  auxData_lt?: InputMaybe<Scalars["Bytes"]>;
  auxData_lte?: InputMaybe<Scalars["Bytes"]>;
  auxData_not?: InputMaybe<Scalars["Bytes"]>;
  auxData_not_contains?: InputMaybe<Scalars["Bytes"]>;
  auxData_not_in?: InputMaybe<Array<Scalars["Bytes"]>>;
  faceValue?: InputMaybe<Scalars["BigDecimal"]>;
  faceValueUSD?: InputMaybe<Scalars["BigDecimal"]>;
  faceValueUSD_gt?: InputMaybe<Scalars["BigDecimal"]>;
  faceValueUSD_gte?: InputMaybe<Scalars["BigDecimal"]>;
  faceValueUSD_in?: InputMaybe<Array<Scalars["BigDecimal"]>>;
  faceValueUSD_lt?: InputMaybe<Scalars["BigDecimal"]>;
  faceValueUSD_lte?: InputMaybe<Scalars["BigDecimal"]>;
  faceValueUSD_not?: InputMaybe<Scalars["BigDecimal"]>;
  faceValueUSD_not_in?: InputMaybe<Array<Scalars["BigDecimal"]>>;
  faceValue_gt?: InputMaybe<Scalars["BigDecimal"]>;
  faceValue_gte?: InputMaybe<Scalars["BigDecimal"]>;
  faceValue_in?: InputMaybe<Array<Scalars["BigDecimal"]>>;
  faceValue_lt?: InputMaybe<Scalars["BigDecimal"]>;
  faceValue_lte?: InputMaybe<Scalars["BigDecimal"]>;
  faceValue_not?: InputMaybe<Scalars["BigDecimal"]>;
  faceValue_not_in?: InputMaybe<Array<Scalars["BigDecimal"]>>;
  id?: InputMaybe<Scalars["ID"]>;
  id_gt?: InputMaybe<Scalars["ID"]>;
  id_gte?: InputMaybe<Scalars["ID"]>;
  id_in?: InputMaybe<Array<Scalars["ID"]>>;
  id_lt?: InputMaybe<Scalars["ID"]>;
  id_lte?: InputMaybe<Scalars["ID"]>;
  id_not?: InputMaybe<Scalars["ID"]>;
  id_not_in?: InputMaybe<Array<Scalars["ID"]>>;
  or?: InputMaybe<Array<InputMaybe<WinningTicketRedeemedEvent_Filter>>>;
  recipient?: InputMaybe<Scalars["String"]>;
  recipientRand?: InputMaybe<Scalars["BigInt"]>;
  recipientRand_gt?: InputMaybe<Scalars["BigInt"]>;
  recipientRand_gte?: InputMaybe<Scalars["BigInt"]>;
  recipientRand_in?: InputMaybe<Array<Scalars["BigInt"]>>;
  recipientRand_lt?: InputMaybe<Scalars["BigInt"]>;
  recipientRand_lte?: InputMaybe<Scalars["BigInt"]>;
  recipientRand_not?: InputMaybe<Scalars["BigInt"]>;
  recipientRand_not_in?: InputMaybe<Array<Scalars["BigInt"]>>;
  recipient_?: InputMaybe<Transcoder_Filter>;
  recipient_contains?: InputMaybe<Scalars["String"]>;
  recipient_contains_nocase?: InputMaybe<Scalars["String"]>;
  recipient_ends_with?: InputMaybe<Scalars["String"]>;
  recipient_ends_with_nocase?: InputMaybe<Scalars["String"]>;
  recipient_gt?: InputMaybe<Scalars["String"]>;
  recipient_gte?: InputMaybe<Scalars["String"]>;
  recipient_in?: InputMaybe<Array<Scalars["String"]>>;
  recipient_lt?: InputMaybe<Scalars["String"]>;
  recipient_lte?: InputMaybe<Scalars["String"]>;
  recipient_not?: InputMaybe<Scalars["String"]>;
  recipient_not_contains?: InputMaybe<Scalars["String"]>;
  recipient_not_contains_nocase?: InputMaybe<Scalars["String"]>;
  recipient_not_ends_with?: InputMaybe<Scalars["String"]>;
  recipient_not_ends_with_nocase?: InputMaybe<Scalars["String"]>;
  recipient_not_in?: InputMaybe<Array<Scalars["String"]>>;
  recipient_not_starts_with?: InputMaybe<Scalars["String"]>;
  recipient_not_starts_with_nocase?: InputMaybe<Scalars["String"]>;
  recipient_starts_with?: InputMaybe<Scalars["String"]>;
  recipient_starts_with_nocase?: InputMaybe<Scalars["String"]>;
  round?: InputMaybe<Scalars["String"]>;
  round_?: InputMaybe<Round_Filter>;
  round_contains?: InputMaybe<Scalars["String"]>;
  round_contains_nocase?: InputMaybe<Scalars["String"]>;
  round_ends_with?: InputMaybe<Scalars["String"]>;
  round_ends_with_nocase?: InputMaybe<Scalars["String"]>;
  round_gt?: InputMaybe<Scalars["String"]>;
  round_gte?: InputMaybe<Scalars["String"]>;
  round_in?: InputMaybe<Array<Scalars["String"]>>;
  round_lt?: InputMaybe<Scalars["String"]>;
  round_lte?: InputMaybe<Scalars["String"]>;
  round_not?: InputMaybe<Scalars["String"]>;
  round_not_contains?: InputMaybe<Scalars["String"]>;
  round_not_contains_nocase?: InputMaybe<Scalars["String"]>;
  round_not_ends_with?: InputMaybe<Scalars["String"]>;
  round_not_ends_with_nocase?: InputMaybe<Scalars["String"]>;
  round_not_in?: InputMaybe<Array<Scalars["String"]>>;
  round_not_starts_with?: InputMaybe<Scalars["String"]>;
  round_not_starts_with_nocase?: InputMaybe<Scalars["String"]>;
  round_starts_with?: InputMaybe<Scalars["String"]>;
  round_starts_with_nocase?: InputMaybe<Scalars["String"]>;
  sender?: InputMaybe<Scalars["String"]>;
  senderNonce?: InputMaybe<Scalars["BigInt"]>;
  senderNonce_gt?: InputMaybe<Scalars["BigInt"]>;
  senderNonce_gte?: InputMaybe<Scalars["BigInt"]>;
  senderNonce_in?: InputMaybe<Array<Scalars["BigInt"]>>;
  senderNonce_lt?: InputMaybe<Scalars["BigInt"]>;
  senderNonce_lte?: InputMaybe<Scalars["BigInt"]>;
  senderNonce_not?: InputMaybe<Scalars["BigInt"]>;
  senderNonce_not_in?: InputMaybe<Array<Scalars["BigInt"]>>;
  sender_?: InputMaybe<Broadcaster_Filter>;
  sender_contains?: InputMaybe<Scalars["String"]>;
  sender_contains_nocase?: InputMaybe<Scalars["String"]>;
  sender_ends_with?: InputMaybe<Scalars["String"]>;
  sender_ends_with_nocase?: InputMaybe<Scalars["String"]>;
  sender_gt?: InputMaybe<Scalars["String"]>;
  sender_gte?: InputMaybe<Scalars["String"]>;
  sender_in?: InputMaybe<Array<Scalars["String"]>>;
  sender_lt?: InputMaybe<Scalars["String"]>;
  sender_lte?: InputMaybe<Scalars["String"]>;
  sender_not?: InputMaybe<Scalars["String"]>;
  sender_not_contains?: InputMaybe<Scalars["String"]>;
  sender_not_contains_nocase?: InputMaybe<Scalars["String"]>;
  sender_not_ends_with?: InputMaybe<Scalars["String"]>;
  sender_not_ends_with_nocase?: InputMaybe<Scalars["String"]>;
  sender_not_in?: InputMaybe<Array<Scalars["String"]>>;
  sender_not_starts_with?: InputMaybe<Scalars["String"]>;
  sender_not_starts_with_nocase?: InputMaybe<Scalars["String"]>;
  sender_starts_with?: InputMaybe<Scalars["String"]>;
  sender_starts_with_nocase?: InputMaybe<Scalars["String"]>;
  timestamp?: InputMaybe<Scalars["Int"]>;
  timestamp_gt?: InputMaybe<Scalars["Int"]>;
  timestamp_gte?: InputMaybe<Scalars["Int"]>;
  timestamp_in?: InputMaybe<Array<Scalars["Int"]>>;
  timestamp_lt?: InputMaybe<Scalars["Int"]>;
  timestamp_lte?: InputMaybe<Scalars["Int"]>;
  timestamp_not?: InputMaybe<Scalars["Int"]>;
  timestamp_not_in?: InputMaybe<Array<Scalars["Int"]>>;
  transaction?: InputMaybe<Scalars["String"]>;
  transaction_?: InputMaybe<Transaction_Filter>;
  transaction_contains?: InputMaybe<Scalars["String"]>;
  transaction_contains_nocase?: InputMaybe<Scalars["String"]>;
  transaction_ends_with?: InputMaybe<Scalars["String"]>;
  transaction_ends_with_nocase?: InputMaybe<Scalars["String"]>;
  transaction_gt?: InputMaybe<Scalars["String"]>;
  transaction_gte?: InputMaybe<Scalars["String"]>;
  transaction_in?: InputMaybe<Array<Scalars["String"]>>;
  transaction_lt?: InputMaybe<Scalars["String"]>;
  transaction_lte?: InputMaybe<Scalars["String"]>;
  transaction_not?: InputMaybe<Scalars["String"]>;
  transaction_not_contains?: InputMaybe<Scalars["String"]>;
  transaction_not_contains_nocase?: InputMaybe<Scalars["String"]>;
  transaction_not_ends_with?: InputMaybe<Scalars["String"]>;
  transaction_not_ends_with_nocase?: InputMaybe<Scalars["String"]>;
  transaction_not_in?: InputMaybe<Array<Scalars["String"]>>;
  transaction_not_starts_with?: InputMaybe<Scalars["String"]>;
  transaction_not_starts_with_nocase?: InputMaybe<Scalars["String"]>;
  transaction_starts_with?: InputMaybe<Scalars["String"]>;
  transaction_starts_with_nocase?: InputMaybe<Scalars["String"]>;
  winProb?: InputMaybe<Scalars["BigInt"]>;
  winProb_gt?: InputMaybe<Scalars["BigInt"]>;
  winProb_gte?: InputMaybe<Scalars["BigInt"]>;
  winProb_in?: InputMaybe<Array<Scalars["BigInt"]>>;
  winProb_lt?: InputMaybe<Scalars["BigInt"]>;
  winProb_lte?: InputMaybe<Scalars["BigInt"]>;
  winProb_not?: InputMaybe<Scalars["BigInt"]>;
  winProb_not_in?: InputMaybe<Array<Scalars["BigInt"]>>;
};

export enum WinningTicketRedeemedEvent_OrderBy {
  AuxData = "auxData",
  FaceValue = "faceValue",
  FaceValueUsd = "faceValueUSD",
  Id = "id",
  Recipient = "recipient",
  RecipientRand = "recipientRand",
  RecipientActivationRound = "recipient__activationRound",
  RecipientActivationTimestamp = "recipient__activationTimestamp",
  RecipientActive = "recipient__active",
  RecipientDeactivationRound = "recipient__deactivationRound",
  RecipientFeeShare = "recipient__feeShare",
  RecipientFeeShareUpdateTimestamp = "recipient__feeShareUpdateTimestamp",
  RecipientId = "recipient__id",
  RecipientLastActiveStakeUpdateRound = "recipient__lastActiveStakeUpdateRound",
  RecipientNinetyDayVolumeEth = "recipient__ninetyDayVolumeETH",
  RecipientRewardCut = "recipient__rewardCut",
  RecipientRewardCutUpdateTimestamp = "recipient__rewardCutUpdateTimestamp",
  RecipientServiceUri = "recipient__serviceURI",
  RecipientSixtyDayVolumeEth = "recipient__sixtyDayVolumeETH",
  RecipientStatus = "recipient__status",
  RecipientThirtyDayVolumeEth = "recipient__thirtyDayVolumeETH",
  RecipientTotalStake = "recipient__totalStake",
  RecipientTotalVolumeEth = "recipient__totalVolumeETH",
  RecipientTotalVolumeUsd = "recipient__totalVolumeUSD",
  Round = "round",
  RoundActiveTranscoderCount = "round__activeTranscoderCount",
  RoundDelegatorsCount = "round__delegatorsCount",
  RoundEndBlock = "round__endBlock",
  RoundId = "round__id",
  RoundInflation = "round__inflation",
  RoundInitialized = "round__initialized",
  RoundLength = "round__length",
  RoundMintableTokens = "round__mintableTokens",
  RoundMovedStake = "round__movedStake",
  RoundNewStake = "round__newStake",
  RoundNumActiveTranscoders = "round__numActiveTranscoders",
  RoundParticipationRate = "round__participationRate",
  RoundStartBlock = "round__startBlock",
  RoundStartTimestamp = "round__startTimestamp",
  RoundTotalActiveStake = "round__totalActiveStake",
  RoundTotalSupply = "round__totalSupply",
  RoundVolumeEth = "round__volumeETH",
  RoundVolumeUsd = "round__volumeUSD",
  Sender = "sender",
  SenderNonce = "senderNonce",
  SenderDeposit = "sender__deposit",
  SenderId = "sender__id",
  SenderReserve = "sender__reserve",
  Timestamp = "timestamp",
  Transaction = "transaction",
  TransactionBlockNumber = "transaction__blockNumber",
  TransactionFrom = "transaction__from",
  TransactionGasPrice = "transaction__gasPrice",
  TransactionGasUsed = "transaction__gasUsed",
  TransactionId = "transaction__id",
  TransactionTimestamp = "transaction__timestamp",
  TransactionTo = "transaction__to",
  WinProb = "winProb",
}

/**
 * WithdrawFeesEvent entities are created for every emitted WithdrawFees event.
 *
 */
export type WithdrawFeesEvent = Event & {
  __typename: "WithdrawFeesEvent";
  /** Amount of fees withdrawn */
  amount: Scalars["BigDecimal"];
  /** Reference to the delegator that withdraw its fees */
  delegator: Delegator;
  /** Ethereum transaction hash + event log index */
  id: Scalars["ID"];
  /** Address belonging to the receiver of fees */
  recipient: Scalars["String"];
  /** Reference to the round the event occured in */
  round: Round;
  /** Timestamp of the transaction the event was included in */
  timestamp: Scalars["Int"];
  /** Reference to the transaction the event was included in */
  transaction: Transaction;
};

export type WithdrawFeesEvent_Filter = {
  /** Filter for the block changed event. */
  _change_block?: InputMaybe<BlockChangedFilter>;
  amount?: InputMaybe<Scalars["BigDecimal"]>;
  amount_gt?: InputMaybe<Scalars["BigDecimal"]>;
  amount_gte?: InputMaybe<Scalars["BigDecimal"]>;
  amount_in?: InputMaybe<Array<Scalars["BigDecimal"]>>;
  amount_lt?: InputMaybe<Scalars["BigDecimal"]>;
  amount_lte?: InputMaybe<Scalars["BigDecimal"]>;
  amount_not?: InputMaybe<Scalars["BigDecimal"]>;
  amount_not_in?: InputMaybe<Array<Scalars["BigDecimal"]>>;
  and?: InputMaybe<Array<InputMaybe<WithdrawFeesEvent_Filter>>>;
  delegator?: InputMaybe<Scalars["String"]>;
  delegator_?: InputMaybe<Delegator_Filter>;
  delegator_contains?: InputMaybe<Scalars["String"]>;
  delegator_contains_nocase?: InputMaybe<Scalars["String"]>;
  delegator_ends_with?: InputMaybe<Scalars["String"]>;
  delegator_ends_with_nocase?: InputMaybe<Scalars["String"]>;
  delegator_gt?: InputMaybe<Scalars["String"]>;
  delegator_gte?: InputMaybe<Scalars["String"]>;
  delegator_in?: InputMaybe<Array<Scalars["String"]>>;
  delegator_lt?: InputMaybe<Scalars["String"]>;
  delegator_lte?: InputMaybe<Scalars["String"]>;
  delegator_not?: InputMaybe<Scalars["String"]>;
  delegator_not_contains?: InputMaybe<Scalars["String"]>;
  delegator_not_contains_nocase?: InputMaybe<Scalars["String"]>;
  delegator_not_ends_with?: InputMaybe<Scalars["String"]>;
  delegator_not_ends_with_nocase?: InputMaybe<Scalars["String"]>;
  delegator_not_in?: InputMaybe<Array<Scalars["String"]>>;
  delegator_not_starts_with?: InputMaybe<Scalars["String"]>;
  delegator_not_starts_with_nocase?: InputMaybe<Scalars["String"]>;
  delegator_starts_with?: InputMaybe<Scalars["String"]>;
  delegator_starts_with_nocase?: InputMaybe<Scalars["String"]>;
  id?: InputMaybe<Scalars["ID"]>;
  id_gt?: InputMaybe<Scalars["ID"]>;
  id_gte?: InputMaybe<Scalars["ID"]>;
  id_in?: InputMaybe<Array<Scalars["ID"]>>;
  id_lt?: InputMaybe<Scalars["ID"]>;
  id_lte?: InputMaybe<Scalars["ID"]>;
  id_not?: InputMaybe<Scalars["ID"]>;
  id_not_in?: InputMaybe<Array<Scalars["ID"]>>;
  or?: InputMaybe<Array<InputMaybe<WithdrawFeesEvent_Filter>>>;
  recipient?: InputMaybe<Scalars["String"]>;
  recipient_contains?: InputMaybe<Scalars["String"]>;
  recipient_contains_nocase?: InputMaybe<Scalars["String"]>;
  recipient_ends_with?: InputMaybe<Scalars["String"]>;
  recipient_ends_with_nocase?: InputMaybe<Scalars["String"]>;
  recipient_gt?: InputMaybe<Scalars["String"]>;
  recipient_gte?: InputMaybe<Scalars["String"]>;
  recipient_in?: InputMaybe<Array<Scalars["String"]>>;
  recipient_lt?: InputMaybe<Scalars["String"]>;
  recipient_lte?: InputMaybe<Scalars["String"]>;
  recipient_not?: InputMaybe<Scalars["String"]>;
  recipient_not_contains?: InputMaybe<Scalars["String"]>;
  recipient_not_contains_nocase?: InputMaybe<Scalars["String"]>;
  recipient_not_ends_with?: InputMaybe<Scalars["String"]>;
  recipient_not_ends_with_nocase?: InputMaybe<Scalars["String"]>;
  recipient_not_in?: InputMaybe<Array<Scalars["String"]>>;
  recipient_not_starts_with?: InputMaybe<Scalars["String"]>;
  recipient_not_starts_with_nocase?: InputMaybe<Scalars["String"]>;
  recipient_starts_with?: InputMaybe<Scalars["String"]>;
  recipient_starts_with_nocase?: InputMaybe<Scalars["String"]>;
  round?: InputMaybe<Scalars["String"]>;
  round_?: InputMaybe<Round_Filter>;
  round_contains?: InputMaybe<Scalars["String"]>;
  round_contains_nocase?: InputMaybe<Scalars["String"]>;
  round_ends_with?: InputMaybe<Scalars["String"]>;
  round_ends_with_nocase?: InputMaybe<Scalars["String"]>;
  round_gt?: InputMaybe<Scalars["String"]>;
  round_gte?: InputMaybe<Scalars["String"]>;
  round_in?: InputMaybe<Array<Scalars["String"]>>;
  round_lt?: InputMaybe<Scalars["String"]>;
  round_lte?: InputMaybe<Scalars["String"]>;
  round_not?: InputMaybe<Scalars["String"]>;
  round_not_contains?: InputMaybe<Scalars["String"]>;
  round_not_contains_nocase?: InputMaybe<Scalars["String"]>;
  round_not_ends_with?: InputMaybe<Scalars["String"]>;
  round_not_ends_with_nocase?: InputMaybe<Scalars["String"]>;
  round_not_in?: InputMaybe<Array<Scalars["String"]>>;
  round_not_starts_with?: InputMaybe<Scalars["String"]>;
  round_not_starts_with_nocase?: InputMaybe<Scalars["String"]>;
  round_starts_with?: InputMaybe<Scalars["String"]>;
  round_starts_with_nocase?: InputMaybe<Scalars["String"]>;
  timestamp?: InputMaybe<Scalars["Int"]>;
  timestamp_gt?: InputMaybe<Scalars["Int"]>;
  timestamp_gte?: InputMaybe<Scalars["Int"]>;
  timestamp_in?: InputMaybe<Array<Scalars["Int"]>>;
  timestamp_lt?: InputMaybe<Scalars["Int"]>;
  timestamp_lte?: InputMaybe<Scalars["Int"]>;
  timestamp_not?: InputMaybe<Scalars["Int"]>;
  timestamp_not_in?: InputMaybe<Array<Scalars["Int"]>>;
  transaction?: InputMaybe<Scalars["String"]>;
  transaction_?: InputMaybe<Transaction_Filter>;
  transaction_contains?: InputMaybe<Scalars["String"]>;
  transaction_contains_nocase?: InputMaybe<Scalars["String"]>;
  transaction_ends_with?: InputMaybe<Scalars["String"]>;
  transaction_ends_with_nocase?: InputMaybe<Scalars["String"]>;
  transaction_gt?: InputMaybe<Scalars["String"]>;
  transaction_gte?: InputMaybe<Scalars["String"]>;
  transaction_in?: InputMaybe<Array<Scalars["String"]>>;
  transaction_lt?: InputMaybe<Scalars["String"]>;
  transaction_lte?: InputMaybe<Scalars["String"]>;
  transaction_not?: InputMaybe<Scalars["String"]>;
  transaction_not_contains?: InputMaybe<Scalars["String"]>;
  transaction_not_contains_nocase?: InputMaybe<Scalars["String"]>;
  transaction_not_ends_with?: InputMaybe<Scalars["String"]>;
  transaction_not_ends_with_nocase?: InputMaybe<Scalars["String"]>;
  transaction_not_in?: InputMaybe<Array<Scalars["String"]>>;
  transaction_not_starts_with?: InputMaybe<Scalars["String"]>;
  transaction_not_starts_with_nocase?: InputMaybe<Scalars["String"]>;
  transaction_starts_with?: InputMaybe<Scalars["String"]>;
  transaction_starts_with_nocase?: InputMaybe<Scalars["String"]>;
};

export enum WithdrawFeesEvent_OrderBy {
  Amount = "amount",
  Delegator = "delegator",
  DelegatorBondedAmount = "delegator__bondedAmount",
  DelegatorDelegatedAmount = "delegator__delegatedAmount",
  DelegatorFees = "delegator__fees",
  DelegatorId = "delegator__id",
  DelegatorPrincipal = "delegator__principal",
  DelegatorStartRound = "delegator__startRound",
  DelegatorUnbonded = "delegator__unbonded",
  DelegatorWithdrawnFees = "delegator__withdrawnFees",
  Id = "id",
  Recipient = "recipient",
  Round = "round",
  RoundActiveTranscoderCount = "round__activeTranscoderCount",
  RoundDelegatorsCount = "round__delegatorsCount",
  RoundEndBlock = "round__endBlock",
  RoundId = "round__id",
  RoundInflation = "round__inflation",
  RoundInitialized = "round__initialized",
  RoundLength = "round__length",
  RoundMintableTokens = "round__mintableTokens",
  RoundMovedStake = "round__movedStake",
  RoundNewStake = "round__newStake",
  RoundNumActiveTranscoders = "round__numActiveTranscoders",
  RoundParticipationRate = "round__participationRate",
  RoundStartBlock = "round__startBlock",
  RoundStartTimestamp = "round__startTimestamp",
  RoundTotalActiveStake = "round__totalActiveStake",
  RoundTotalSupply = "round__totalSupply",
  RoundVolumeEth = "round__volumeETH",
  RoundVolumeUsd = "round__volumeUSD",
  Timestamp = "timestamp",
  Transaction = "transaction",
  TransactionBlockNumber = "transaction__blockNumber",
  TransactionFrom = "transaction__from",
  TransactionGasPrice = "transaction__gasPrice",
  TransactionGasUsed = "transaction__gasUsed",
  TransactionId = "transaction__id",
  TransactionTimestamp = "transaction__timestamp",
  TransactionTo = "transaction__to",
}

/**
 * WithdrawStakeEvent entities are created for every emitted WithdrawStake event.
 *
 */
export type WithdrawStakeEvent = Event & {
  __typename: "WithdrawStakeEvent";
  /** Amount of stake withdrawn */
  amount: Scalars["BigDecimal"];
  /** Reference to the delegator that withdraw its stake */
  delegator: Delegator;
  /** Ethereum transaction hash + event log index */
  id: Scalars["ID"];
  /** Reference to the round the event occured in */
  round: Round;
  /** Timestamp of the transaction the event was included in */
  timestamp: Scalars["Int"];
  /** Reference to the transaction the event was included in */
  transaction: Transaction;
  /** Unbonding lock ID that was deleted upon withdrawal */
  unbondingLockId?: Maybe<Scalars["Int"]>;
};

export type WithdrawStakeEvent_Filter = {
  /** Filter for the block changed event. */
  _change_block?: InputMaybe<BlockChangedFilter>;
  amount?: InputMaybe<Scalars["BigDecimal"]>;
  amount_gt?: InputMaybe<Scalars["BigDecimal"]>;
  amount_gte?: InputMaybe<Scalars["BigDecimal"]>;
  amount_in?: InputMaybe<Array<Scalars["BigDecimal"]>>;
  amount_lt?: InputMaybe<Scalars["BigDecimal"]>;
  amount_lte?: InputMaybe<Scalars["BigDecimal"]>;
  amount_not?: InputMaybe<Scalars["BigDecimal"]>;
  amount_not_in?: InputMaybe<Array<Scalars["BigDecimal"]>>;
  and?: InputMaybe<Array<InputMaybe<WithdrawStakeEvent_Filter>>>;
  delegator?: InputMaybe<Scalars["String"]>;
  delegator_?: InputMaybe<Delegator_Filter>;
  delegator_contains?: InputMaybe<Scalars["String"]>;
  delegator_contains_nocase?: InputMaybe<Scalars["String"]>;
  delegator_ends_with?: InputMaybe<Scalars["String"]>;
  delegator_ends_with_nocase?: InputMaybe<Scalars["String"]>;
  delegator_gt?: InputMaybe<Scalars["String"]>;
  delegator_gte?: InputMaybe<Scalars["String"]>;
  delegator_in?: InputMaybe<Array<Scalars["String"]>>;
  delegator_lt?: InputMaybe<Scalars["String"]>;
  delegator_lte?: InputMaybe<Scalars["String"]>;
  delegator_not?: InputMaybe<Scalars["String"]>;
  delegator_not_contains?: InputMaybe<Scalars["String"]>;
  delegator_not_contains_nocase?: InputMaybe<Scalars["String"]>;
  delegator_not_ends_with?: InputMaybe<Scalars["String"]>;
  delegator_not_ends_with_nocase?: InputMaybe<Scalars["String"]>;
  delegator_not_in?: InputMaybe<Array<Scalars["String"]>>;
  delegator_not_starts_with?: InputMaybe<Scalars["String"]>;
  delegator_not_starts_with_nocase?: InputMaybe<Scalars["String"]>;
  delegator_starts_with?: InputMaybe<Scalars["String"]>;
  delegator_starts_with_nocase?: InputMaybe<Scalars["String"]>;
  id?: InputMaybe<Scalars["ID"]>;
  id_gt?: InputMaybe<Scalars["ID"]>;
  id_gte?: InputMaybe<Scalars["ID"]>;
  id_in?: InputMaybe<Array<Scalars["ID"]>>;
  id_lt?: InputMaybe<Scalars["ID"]>;
  id_lte?: InputMaybe<Scalars["ID"]>;
  id_not?: InputMaybe<Scalars["ID"]>;
  id_not_in?: InputMaybe<Array<Scalars["ID"]>>;
  or?: InputMaybe<Array<InputMaybe<WithdrawStakeEvent_Filter>>>;
  round?: InputMaybe<Scalars["String"]>;
  round_?: InputMaybe<Round_Filter>;
  round_contains?: InputMaybe<Scalars["String"]>;
  round_contains_nocase?: InputMaybe<Scalars["String"]>;
  round_ends_with?: InputMaybe<Scalars["String"]>;
  round_ends_with_nocase?: InputMaybe<Scalars["String"]>;
  round_gt?: InputMaybe<Scalars["String"]>;
  round_gte?: InputMaybe<Scalars["String"]>;
  round_in?: InputMaybe<Array<Scalars["String"]>>;
  round_lt?: InputMaybe<Scalars["String"]>;
  round_lte?: InputMaybe<Scalars["String"]>;
  round_not?: InputMaybe<Scalars["String"]>;
  round_not_contains?: InputMaybe<Scalars["String"]>;
  round_not_contains_nocase?: InputMaybe<Scalars["String"]>;
  round_not_ends_with?: InputMaybe<Scalars["String"]>;
  round_not_ends_with_nocase?: InputMaybe<Scalars["String"]>;
  round_not_in?: InputMaybe<Array<Scalars["String"]>>;
  round_not_starts_with?: InputMaybe<Scalars["String"]>;
  round_not_starts_with_nocase?: InputMaybe<Scalars["String"]>;
  round_starts_with?: InputMaybe<Scalars["String"]>;
  round_starts_with_nocase?: InputMaybe<Scalars["String"]>;
  timestamp?: InputMaybe<Scalars["Int"]>;
  timestamp_gt?: InputMaybe<Scalars["Int"]>;
  timestamp_gte?: InputMaybe<Scalars["Int"]>;
  timestamp_in?: InputMaybe<Array<Scalars["Int"]>>;
  timestamp_lt?: InputMaybe<Scalars["Int"]>;
  timestamp_lte?: InputMaybe<Scalars["Int"]>;
  timestamp_not?: InputMaybe<Scalars["Int"]>;
  timestamp_not_in?: InputMaybe<Array<Scalars["Int"]>>;
  transaction?: InputMaybe<Scalars["String"]>;
  transaction_?: InputMaybe<Transaction_Filter>;
  transaction_contains?: InputMaybe<Scalars["String"]>;
  transaction_contains_nocase?: InputMaybe<Scalars["String"]>;
  transaction_ends_with?: InputMaybe<Scalars["String"]>;
  transaction_ends_with_nocase?: InputMaybe<Scalars["String"]>;
  transaction_gt?: InputMaybe<Scalars["String"]>;
  transaction_gte?: InputMaybe<Scalars["String"]>;
  transaction_in?: InputMaybe<Array<Scalars["String"]>>;
  transaction_lt?: InputMaybe<Scalars["String"]>;
  transaction_lte?: InputMaybe<Scalars["String"]>;
  transaction_not?: InputMaybe<Scalars["String"]>;
  transaction_not_contains?: InputMaybe<Scalars["String"]>;
  transaction_not_contains_nocase?: InputMaybe<Scalars["String"]>;
  transaction_not_ends_with?: InputMaybe<Scalars["String"]>;
  transaction_not_ends_with_nocase?: InputMaybe<Scalars["String"]>;
  transaction_not_in?: InputMaybe<Array<Scalars["String"]>>;
  transaction_not_starts_with?: InputMaybe<Scalars["String"]>;
  transaction_not_starts_with_nocase?: InputMaybe<Scalars["String"]>;
  transaction_starts_with?: InputMaybe<Scalars["String"]>;
  transaction_starts_with_nocase?: InputMaybe<Scalars["String"]>;
  unbondingLockId?: InputMaybe<Scalars["Int"]>;
  unbondingLockId_gt?: InputMaybe<Scalars["Int"]>;
  unbondingLockId_gte?: InputMaybe<Scalars["Int"]>;
  unbondingLockId_in?: InputMaybe<Array<Scalars["Int"]>>;
  unbondingLockId_lt?: InputMaybe<Scalars["Int"]>;
  unbondingLockId_lte?: InputMaybe<Scalars["Int"]>;
  unbondingLockId_not?: InputMaybe<Scalars["Int"]>;
  unbondingLockId_not_in?: InputMaybe<Array<Scalars["Int"]>>;
};

export enum WithdrawStakeEvent_OrderBy {
  Amount = "amount",
  Delegator = "delegator",
  DelegatorBondedAmount = "delegator__bondedAmount",
  DelegatorDelegatedAmount = "delegator__delegatedAmount",
  DelegatorFees = "delegator__fees",
  DelegatorId = "delegator__id",
  DelegatorPrincipal = "delegator__principal",
  DelegatorStartRound = "delegator__startRound",
  DelegatorUnbonded = "delegator__unbonded",
  DelegatorWithdrawnFees = "delegator__withdrawnFees",
  Id = "id",
  Round = "round",
  RoundActiveTranscoderCount = "round__activeTranscoderCount",
  RoundDelegatorsCount = "round__delegatorsCount",
  RoundEndBlock = "round__endBlock",
  RoundId = "round__id",
  RoundInflation = "round__inflation",
  RoundInitialized = "round__initialized",
  RoundLength = "round__length",
  RoundMintableTokens = "round__mintableTokens",
  RoundMovedStake = "round__movedStake",
  RoundNewStake = "round__newStake",
  RoundNumActiveTranscoders = "round__numActiveTranscoders",
  RoundParticipationRate = "round__participationRate",
  RoundStartBlock = "round__startBlock",
  RoundStartTimestamp = "round__startTimestamp",
  RoundTotalActiveStake = "round__totalActiveStake",
  RoundTotalSupply = "round__totalSupply",
  RoundVolumeEth = "round__volumeETH",
  RoundVolumeUsd = "round__volumeUSD",
  Timestamp = "timestamp",
  Transaction = "transaction",
  TransactionBlockNumber = "transaction__blockNumber",
  TransactionFrom = "transaction__from",
  TransactionGasPrice = "transaction__gasPrice",
  TransactionGasUsed = "transaction__gasUsed",
  TransactionId = "transaction__id",
  TransactionTimestamp = "transaction__timestamp",
  TransactionTo = "transaction__to",
  UnbondingLockId = "unbondingLockId",
}

/**
 * WithdrawalEvent entities are created for every emitted Withdrawal event.
 *
 */
export type WithdrawalEvent = Event & {
  __typename: "WithdrawalEvent";
  /** Deposit amount withdrawn */
  deposit: Scalars["BigDecimal"];
  /** Ethereum transaction hash + event log index */
  id: Scalars["ID"];
  /** Reserve amount withdrawn */
  reserve: Scalars["BigDecimal"];
  /** Reference to the round the event occured in */
  round: Round;
  /** Reference to the broadcaster withdrawing its deposit and reserve */
  sender: Broadcaster;
  /** Timestamp of the transaction the event was included in */
  timestamp: Scalars["Int"];
  /** Reference to the transaction the event was included in */
  transaction: Transaction;
};

export type WithdrawalEvent_Filter = {
  /** Filter for the block changed event. */
  _change_block?: InputMaybe<BlockChangedFilter>;
  and?: InputMaybe<Array<InputMaybe<WithdrawalEvent_Filter>>>;
  deposit?: InputMaybe<Scalars["BigDecimal"]>;
  deposit_gt?: InputMaybe<Scalars["BigDecimal"]>;
  deposit_gte?: InputMaybe<Scalars["BigDecimal"]>;
  deposit_in?: InputMaybe<Array<Scalars["BigDecimal"]>>;
  deposit_lt?: InputMaybe<Scalars["BigDecimal"]>;
  deposit_lte?: InputMaybe<Scalars["BigDecimal"]>;
  deposit_not?: InputMaybe<Scalars["BigDecimal"]>;
  deposit_not_in?: InputMaybe<Array<Scalars["BigDecimal"]>>;
  id?: InputMaybe<Scalars["ID"]>;
  id_gt?: InputMaybe<Scalars["ID"]>;
  id_gte?: InputMaybe<Scalars["ID"]>;
  id_in?: InputMaybe<Array<Scalars["ID"]>>;
  id_lt?: InputMaybe<Scalars["ID"]>;
  id_lte?: InputMaybe<Scalars["ID"]>;
  id_not?: InputMaybe<Scalars["ID"]>;
  id_not_in?: InputMaybe<Array<Scalars["ID"]>>;
  or?: InputMaybe<Array<InputMaybe<WithdrawalEvent_Filter>>>;
  reserve?: InputMaybe<Scalars["BigDecimal"]>;
  reserve_gt?: InputMaybe<Scalars["BigDecimal"]>;
  reserve_gte?: InputMaybe<Scalars["BigDecimal"]>;
  reserve_in?: InputMaybe<Array<Scalars["BigDecimal"]>>;
  reserve_lt?: InputMaybe<Scalars["BigDecimal"]>;
  reserve_lte?: InputMaybe<Scalars["BigDecimal"]>;
  reserve_not?: InputMaybe<Scalars["BigDecimal"]>;
  reserve_not_in?: InputMaybe<Array<Scalars["BigDecimal"]>>;
  round?: InputMaybe<Scalars["String"]>;
  round_?: InputMaybe<Round_Filter>;
  round_contains?: InputMaybe<Scalars["String"]>;
  round_contains_nocase?: InputMaybe<Scalars["String"]>;
  round_ends_with?: InputMaybe<Scalars["String"]>;
  round_ends_with_nocase?: InputMaybe<Scalars["String"]>;
  round_gt?: InputMaybe<Scalars["String"]>;
  round_gte?: InputMaybe<Scalars["String"]>;
  round_in?: InputMaybe<Array<Scalars["String"]>>;
  round_lt?: InputMaybe<Scalars["String"]>;
  round_lte?: InputMaybe<Scalars["String"]>;
  round_not?: InputMaybe<Scalars["String"]>;
  round_not_contains?: InputMaybe<Scalars["String"]>;
  round_not_contains_nocase?: InputMaybe<Scalars["String"]>;
  round_not_ends_with?: InputMaybe<Scalars["String"]>;
  round_not_ends_with_nocase?: InputMaybe<Scalars["String"]>;
  round_not_in?: InputMaybe<Array<Scalars["String"]>>;
  round_not_starts_with?: InputMaybe<Scalars["String"]>;
  round_not_starts_with_nocase?: InputMaybe<Scalars["String"]>;
  round_starts_with?: InputMaybe<Scalars["String"]>;
  round_starts_with_nocase?: InputMaybe<Scalars["String"]>;
  sender?: InputMaybe<Scalars["String"]>;
  sender_?: InputMaybe<Broadcaster_Filter>;
  sender_contains?: InputMaybe<Scalars["String"]>;
  sender_contains_nocase?: InputMaybe<Scalars["String"]>;
  sender_ends_with?: InputMaybe<Scalars["String"]>;
  sender_ends_with_nocase?: InputMaybe<Scalars["String"]>;
  sender_gt?: InputMaybe<Scalars["String"]>;
  sender_gte?: InputMaybe<Scalars["String"]>;
  sender_in?: InputMaybe<Array<Scalars["String"]>>;
  sender_lt?: InputMaybe<Scalars["String"]>;
  sender_lte?: InputMaybe<Scalars["String"]>;
  sender_not?: InputMaybe<Scalars["String"]>;
  sender_not_contains?: InputMaybe<Scalars["String"]>;
  sender_not_contains_nocase?: InputMaybe<Scalars["String"]>;
  sender_not_ends_with?: InputMaybe<Scalars["String"]>;
  sender_not_ends_with_nocase?: InputMaybe<Scalars["String"]>;
  sender_not_in?: InputMaybe<Array<Scalars["String"]>>;
  sender_not_starts_with?: InputMaybe<Scalars["String"]>;
  sender_not_starts_with_nocase?: InputMaybe<Scalars["String"]>;
  sender_starts_with?: InputMaybe<Scalars["String"]>;
  sender_starts_with_nocase?: InputMaybe<Scalars["String"]>;
  timestamp?: InputMaybe<Scalars["Int"]>;
  timestamp_gt?: InputMaybe<Scalars["Int"]>;
  timestamp_gte?: InputMaybe<Scalars["Int"]>;
  timestamp_in?: InputMaybe<Array<Scalars["Int"]>>;
  timestamp_lt?: InputMaybe<Scalars["Int"]>;
  timestamp_lte?: InputMaybe<Scalars["Int"]>;
  timestamp_not?: InputMaybe<Scalars["Int"]>;
  timestamp_not_in?: InputMaybe<Array<Scalars["Int"]>>;
  transaction?: InputMaybe<Scalars["String"]>;
  transaction_?: InputMaybe<Transaction_Filter>;
  transaction_contains?: InputMaybe<Scalars["String"]>;
  transaction_contains_nocase?: InputMaybe<Scalars["String"]>;
  transaction_ends_with?: InputMaybe<Scalars["String"]>;
  transaction_ends_with_nocase?: InputMaybe<Scalars["String"]>;
  transaction_gt?: InputMaybe<Scalars["String"]>;
  transaction_gte?: InputMaybe<Scalars["String"]>;
  transaction_in?: InputMaybe<Array<Scalars["String"]>>;
  transaction_lt?: InputMaybe<Scalars["String"]>;
  transaction_lte?: InputMaybe<Scalars["String"]>;
  transaction_not?: InputMaybe<Scalars["String"]>;
  transaction_not_contains?: InputMaybe<Scalars["String"]>;
  transaction_not_contains_nocase?: InputMaybe<Scalars["String"]>;
  transaction_not_ends_with?: InputMaybe<Scalars["String"]>;
  transaction_not_ends_with_nocase?: InputMaybe<Scalars["String"]>;
  transaction_not_in?: InputMaybe<Array<Scalars["String"]>>;
  transaction_not_starts_with?: InputMaybe<Scalars["String"]>;
  transaction_not_starts_with_nocase?: InputMaybe<Scalars["String"]>;
  transaction_starts_with?: InputMaybe<Scalars["String"]>;
  transaction_starts_with_nocase?: InputMaybe<Scalars["String"]>;
};

export enum WithdrawalEvent_OrderBy {
  Deposit = "deposit",
  Id = "id",
  Reserve = "reserve",
  Round = "round",
  RoundActiveTranscoderCount = "round__activeTranscoderCount",
  RoundDelegatorsCount = "round__delegatorsCount",
  RoundEndBlock = "round__endBlock",
  RoundId = "round__id",
  RoundInflation = "round__inflation",
  RoundInitialized = "round__initialized",
  RoundLength = "round__length",
  RoundMintableTokens = "round__mintableTokens",
  RoundMovedStake = "round__movedStake",
  RoundNewStake = "round__newStake",
  RoundNumActiveTranscoders = "round__numActiveTranscoders",
  RoundParticipationRate = "round__participationRate",
  RoundStartBlock = "round__startBlock",
  RoundStartTimestamp = "round__startTimestamp",
  RoundTotalActiveStake = "round__totalActiveStake",
  RoundTotalSupply = "round__totalSupply",
  RoundVolumeEth = "round__volumeETH",
  RoundVolumeUsd = "round__volumeUSD",
  Sender = "sender",
  SenderDeposit = "sender__deposit",
  SenderId = "sender__id",
  SenderReserve = "sender__reserve",
  Timestamp = "timestamp",
  Transaction = "transaction",
  TransactionBlockNumber = "transaction__blockNumber",
  TransactionFrom = "transaction__from",
  TransactionGasPrice = "transaction__gasPrice",
  TransactionGasUsed = "transaction__gasUsed",
  TransactionId = "transaction__id",
  TransactionTimestamp = "transaction__timestamp",
  TransactionTo = "transaction__to",
}

export type _Block_ = {
  __typename: "_Block_";
  /** The hash of the block */
  hash?: Maybe<Scalars["Bytes"]>;
  /** The block number */
  number: Scalars["Int"];
  /** The hash of the parent block */
  parentHash?: Maybe<Scalars["Bytes"]>;
  /** Integer representation of the timestamp stored in blocks for the chain */
  timestamp?: Maybe<Scalars["Int"]>;
};

/** The type for the top-level _meta field */
export type _Meta_ = {
  __typename: "_Meta_";
  /**
   * Information about a specific subgraph block. The hash of the block
   * will be null if the _meta field has a block constraint that asks for
   * a block number. It will be filled if the _meta field has no block constraint
   * and therefore asks for the latest  block
   *
   */
  block: _Block_;
  /** The deployment ID */
  deployment: Scalars["String"];
  /** If `true`, the subgraph encountered indexing errors at some past block */
  hasIndexingErrors: Scalars["Boolean"];
};

export enum _SubgraphErrorPolicy_ {
  /** Data will be returned even if the subgraph has indexing errors */
  Allow = "allow",
  /** If the subgraph has indexing errors, data will be omitted. The default. */
  Deny = "deny",
}

export type AccountQueryVariables = Exact<{
  account: Scalars["ID"];
}>;

export type AccountQuery = {
  __typename: "Query";
  delegator?: {
    __typename: "Delegator";
    id: string;
    bondedAmount: string;
    principal: string;
    unbonded: string;
    withdrawnFees: string;
    startRound: string;
    lastClaimRound?: { __typename: "Round"; id: string } | null;
    unbondingLocks?: Array<{
      __typename: "UnbondingLock";
      id: string;
      amount: string;
      unbondingLockId: number;
      withdrawRound: string;
      delegate: { __typename: "Transcoder"; id: string };
    }> | null;
    delegate?: {
      __typename: "Transcoder";
      id: string;
      active: boolean;
      status: TranscoderStatus;
      totalStake: string;
    } | null;
  } | null;
  transcoder?: {
    __typename: "Transcoder";
    id: string;
    active: boolean;
    feeShare: string;
    rewardCut: string;
    status: TranscoderStatus;
    totalStake: string;
    totalVolumeETH: string;
    activationTimestamp: number;
    activationRound: string;
    deactivationRound: string;
    thirtyDayVolumeETH: string;
    ninetyDayVolumeETH: string;
    lastRewardRound?: { __typename: "Round"; id: string } | null;
    pools?: Array<{ __typename: "Pool"; rewardTokens?: string | null }> | null;
    delegators?: Array<{ __typename: "Delegator"; id: string }> | null;
  } | null;
  protocol?: {
    __typename: "Protocol";
    id: string;
    totalSupply: string;
    totalActiveStake: string;
    participationRate: string;
    inflation: string;
    inflationChange: string;
    lptPriceEth: string;
    roundLength: string;
    currentRound: { __typename: "Round"; id: string };
  } | null;
};

export type AccountInactiveQueryVariables = Exact<{
  id: Scalars["ID"];
}>;

export type AccountInactiveQuery = {
  __typename: "Query";
  delegator?: {
    __typename: "Delegator";
    id: string;
    delegate?: { __typename: "Transcoder"; id: string; active: boolean } | null;
  } | null;
  protocol?: {
    __typename: "Protocol";
    id: string;
    pendingActivation: Array<{ __typename: "Transcoder"; id: string }>;
  } | null;
};

export type CurrentRoundQueryVariables = Exact<{ [key: string]: never }>;

export type CurrentRoundQuery = {
  __typename: "Query";
  protocol?: {
    __typename: "Protocol";
    id: string;
    currentRound: { __typename: "Round"; id: string };
  } | null;
};

export type DaysQueryVariables = Exact<{
  first?: InputMaybe<Scalars["Int"]>;
  orderBy?: InputMaybe<Day_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
}>;

export type DaysQuery = {
  __typename: "Query";
  days: Array<{
    __typename: "Day";
    date: number;
    volumeUSD: string;
    volumeETH: string;
    participationRate: string;
    inflation: string;
    activeTranscoderCount: string;
    delegatorsCount: string;
  }>;
};

export type EventsQueryVariables = Exact<{
  first?: InputMaybe<Scalars["Int"]>;
}>;

export type EventsQuery = {
  __typename: "Query";
  transactions: Array<{
    __typename: "Transaction";
    events?: Array<
      | {
          __typename: "BondEvent";
          additionalAmount: string;
          delegator: { __typename: "Delegator"; id: string };
          newDelegate: { __typename: "Transcoder"; id: string };
          oldDelegate?: { __typename: "Transcoder"; id: string } | null;
          round: { __typename: "Round"; id: string };
          transaction: {
            __typename: "Transaction";
            id: string;
            timestamp: number;
            from: string;
          };
        }
      | {
          __typename: "BurnEvent";
          round: { __typename: "Round"; id: string };
          transaction: {
            __typename: "Transaction";
            id: string;
            timestamp: number;
            from: string;
          };
        }
      | {
          __typename: "DepositFundedEvent";
          amount: string;
          sender: { __typename: "Broadcaster"; id: string };
          round: { __typename: "Round"; id: string };
          transaction: {
            __typename: "Transaction";
            id: string;
            timestamp: number;
            from: string;
          };
        }
      | {
          __typename: "EarningsClaimedEvent";
          round: { __typename: "Round"; id: string };
          transaction: {
            __typename: "Transaction";
            id: string;
            timestamp: number;
            from: string;
          };
        }
      | {
          __typename: "MigrateDelegatorFinalizedEvent";
          l1Addr: string;
          l2Addr: string;
          stake: string;
          delegatedStake: string;
          fees: string;
          round: { __typename: "Round"; id: string };
          transaction: {
            __typename: "Transaction";
            id: string;
            timestamp: number;
            from: string;
          };
        }
      | {
          __typename: "MintEvent";
          round: { __typename: "Round"; id: string };
          transaction: {
            __typename: "Transaction";
            id: string;
            timestamp: number;
            from: string;
          };
        }
      | {
          __typename: "NewRoundEvent";
          transaction: {
            __typename: "Transaction";
            from: string;
            id: string;
            timestamp: number;
          };
          round: { __typename: "Round"; id: string };
        }
      | {
          __typename: "ParameterUpdateEvent";
          param: string;
          round: { __typename: "Round"; id: string };
          transaction: {
            __typename: "Transaction";
            id: string;
            timestamp: number;
            from: string;
          };
        }
      | {
          __typename: "PauseEvent";
          round: { __typename: "Round"; id: string };
          transaction: {
            __typename: "Transaction";
            id: string;
            timestamp: number;
            from: string;
          };
        }
      | {
          __typename: "PollCreatedEvent";
          endBlock: string;
          poll: { __typename: "Poll"; id: string };
          round: { __typename: "Round"; id: string };
          transaction: {
            __typename: "Transaction";
            id: string;
            timestamp: number;
            from: string;
          };
        }
      | {
          __typename: "RebondEvent";
          amount: string;
          delegate: { __typename: "Transcoder"; id: string };
          delegator: { __typename: "Delegator"; id: string };
          round: { __typename: "Round"; id: string };
          transaction: {
            __typename: "Transaction";
            id: string;
            timestamp: number;
            from: string;
          };
        }
      | {
          __typename: "ReserveClaimedEvent";
          round: { __typename: "Round"; id: string };
          transaction: {
            __typename: "Transaction";
            id: string;
            timestamp: number;
            from: string;
          };
        }
      | {
          __typename: "ReserveFundedEvent";
          amount: string;
          reserveHolder: { __typename: "Broadcaster"; id: string };
          round: { __typename: "Round"; id: string };
          transaction: {
            __typename: "Transaction";
            id: string;
            timestamp: number;
            from: string;
          };
        }
      | {
          __typename: "RewardEvent";
          rewardTokens: string;
          delegate: { __typename: "Transcoder"; id: string };
          round: { __typename: "Round"; id: string };
          transaction: {
            __typename: "Transaction";
            id: string;
            timestamp: number;
            from: string;
          };
        }
      | {
          __typename: "ServiceURIUpdateEvent";
          addr: string;
          serviceURI: string;
          round: { __typename: "Round"; id: string };
          transaction: {
            __typename: "Transaction";
            id: string;
            timestamp: number;
            from: string;
          };
        }
      | {
          __typename: "SetCurrentRewardTokensEvent";
          currentInflation: string;
          currentMintableTokens: string;
          round: { __typename: "Round"; id: string };
          transaction: {
            __typename: "Transaction";
            id: string;
            timestamp: number;
            from: string;
          };
        }
      | {
          __typename: "StakeClaimedEvent";
          stake: string;
          fees: string;
          round: { __typename: "Round"; id: string };
          transaction: {
            __typename: "Transaction";
            id: string;
            timestamp: number;
            from: string;
          };
        }
      | {
          __typename: "TranscoderActivatedEvent";
          activationRound: string;
          delegate: { __typename: "Transcoder"; id: string };
          round: { __typename: "Round"; id: string };
          transaction: {
            __typename: "Transaction";
            id: string;
            timestamp: number;
            from: string;
          };
        }
      | {
          __typename: "TranscoderDeactivatedEvent";
          deactivationRound: string;
          delegate: { __typename: "Transcoder"; id: string };
          round: { __typename: "Round"; id: string };
          transaction: {
            __typename: "Transaction";
            id: string;
            timestamp: number;
            from: string;
          };
        }
      | {
          __typename: "TranscoderEvictedEvent";
          delegate: { __typename: "Transcoder"; id: string };
          round: { __typename: "Round"; id: string };
          transaction: {
            __typename: "Transaction";
            id: string;
            timestamp: number;
            from: string;
          };
        }
      | {
          __typename: "TranscoderResignedEvent";
          delegate: { __typename: "Transcoder"; id: string };
          round: { __typename: "Round"; id: string };
          transaction: {
            __typename: "Transaction";
            id: string;
            timestamp: number;
            from: string;
          };
        }
      | {
          __typename: "TranscoderSlashedEvent";
          round: { __typename: "Round"; id: string };
          transaction: {
            __typename: "Transaction";
            id: string;
            timestamp: number;
            from: string;
          };
        }
      | {
          __typename: "TranscoderUpdateEvent";
          rewardCut: string;
          feeShare: string;
          delegate: { __typename: "Transcoder"; id: string };
          round: { __typename: "Round"; id: string };
          transaction: {
            __typename: "Transaction";
            id: string;
            timestamp: number;
            from: string;
          };
        }
      | {
          __typename: "TransferBondEvent";
          amount: string;
          newDelegator: { __typename: "Delegator"; id: string };
          oldDelegator: { __typename: "Delegator"; id: string };
          round: { __typename: "Round"; id: string };
          transaction: {
            __typename: "Transaction";
            id: string;
            timestamp: number;
            from: string;
          };
        }
      | {
          __typename: "UnbondEvent";
          amount: string;
          delegate: { __typename: "Transcoder"; id: string };
          delegator: { __typename: "Delegator"; id: string };
          round: { __typename: "Round"; id: string };
          transaction: {
            __typename: "Transaction";
            id: string;
            timestamp: number;
            from: string;
          };
        }
      | {
          __typename: "UnpauseEvent";
          round: { __typename: "Round"; id: string };
          transaction: {
            __typename: "Transaction";
            id: string;
            timestamp: number;
            from: string;
          };
        }
      | {
          __typename: "VoteEvent";
          voter: string;
          choiceID: string;
          poll: { __typename: "Poll"; id: string };
          round: { __typename: "Round"; id: string };
          transaction: {
            __typename: "Transaction";
            id: string;
            timestamp: number;
            from: string;
          };
        }
      | {
          __typename: "WinningTicketRedeemedEvent";
          faceValue: string;
          recipient: { __typename: "Transcoder"; id: string };
          round: { __typename: "Round"; id: string };
          transaction: {
            __typename: "Transaction";
            id: string;
            timestamp: number;
            from: string;
          };
        }
      | {
          __typename: "WithdrawFeesEvent";
          amount: string;
          delegator: { __typename: "Delegator"; id: string };
          round: { __typename: "Round"; id: string };
          transaction: {
            __typename: "Transaction";
            id: string;
            timestamp: number;
            from: string;
          };
        }
      | {
          __typename: "WithdrawStakeEvent";
          amount: string;
          delegator: { __typename: "Delegator"; id: string };
          round: { __typename: "Round"; id: string };
          transaction: {
            __typename: "Transaction";
            id: string;
            timestamp: number;
            from: string;
          };
        }
      | {
          __typename: "WithdrawalEvent";
          deposit: string;
          reserve: string;
          sender: { __typename: "Broadcaster"; id: string };
          round: { __typename: "Round"; id: string };
          transaction: {
            __typename: "Transaction";
            id: string;
            timestamp: number;
            from: string;
          };
        }
    > | null;
  }>;
  transcoders: Array<{ __typename: "Transcoder"; id: string }>;
};

export type OrchestratorsQueryVariables = Exact<{
  currentRound?: InputMaybe<Scalars["BigInt"]>;
  currentRoundString?: InputMaybe<Scalars["String"]>;
  where?: InputMaybe<Transcoder_Filter>;
  first?: InputMaybe<Scalars["Int"]>;
  skip?: InputMaybe<Scalars["Int"]>;
  orderBy?: InputMaybe<Transcoder_OrderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
}>;

export type OrchestratorsQuery = {
  __typename: "Query";
  transcoders: Array<{
    __typename: "Transcoder";
    id: string;
    totalVolumeETH: string;
    feeShare: string;
    feeShareUpdateTimestamp: number;
    activationTimestamp: number;
    activationRound: string;
    deactivationRound: string;
    rewardCut: string;
    rewardCutUpdateTimestamp: number;
    totalStake: string;
    thirtyDayVolumeETH: string;
    sixtyDayVolumeETH: string;
    ninetyDayVolumeETH: string;
    delegator?: {
      __typename: "Delegator";
      startRound: string;
      bondedAmount: string;
      unbondingLocks?: Array<{
        __typename: "UnbondingLock";
        withdrawRound: string;
      }> | null;
    } | null;
    delegators?: Array<{ __typename: "Delegator"; id: string }> | null;
    pools?: Array<{ __typename: "Pool"; rewardTokens?: string | null }> | null;
  }>;
};

export type OrchestratorsSortedQueryVariables = Exact<{ [key: string]: never }>;

export type OrchestratorsSortedQuery = {
  __typename: "Query";
  transcoders: Array<{
    __typename: "Transcoder";
    id: string;
    totalStake: string;
  }>;
};

export type PollQueryVariables = Exact<{
  id: Scalars["ID"];
}>;

export type PollQuery = {
  __typename: "Query";
  poll?: {
    __typename: "Poll";
    id: string;
    proposal: string;
    endBlock: string;
    quorum: string;
    quota: string;
    tally?: { __typename: "PollTally"; yes: string; no: string } | null;
    votes: Array<{ __typename: "Vote"; id: string }>;
  } | null;
};

export type PollsQueryVariables = Exact<{ [key: string]: never }>;

export type PollsQuery = {
  __typename: "Query";
  polls: Array<{
    __typename: "Poll";
    id: string;
    proposal: string;
    endBlock: string;
    quorum: string;
    quota: string;
    tally?: { __typename: "PollTally"; yes: string; no: string } | null;
    votes: Array<{ __typename: "Vote"; id: string }>;
  }>;
};

export type ProtocolQueryVariables = Exact<{ [key: string]: never }>;

export type ProtocolQuery = {
  __typename: "Query";
  protocol?: {
    __typename: "Protocol";
    id: string;
    totalVolumeUSD: string;
    totalVolumeETH: string;
    participationRate: string;
    inflation: string;
    activeTranscoderCount: string;
    delegatorsCount: string;
    lockPeriod: string;
    totalSupply: string;
    totalActiveStake: string;
    inflationChange: string;
    roundLength: string;
    lptPriceEth: string;
    paused: boolean;
    currentRound: {
      __typename: "Round";
      id: string;
      mintableTokens: string;
      volumeETH: string;
      volumeUSD: string;
      pools?: Array<{
        __typename: "Pool";
        rewardTokens?: string | null;
      }> | null;
    };
  } | null;
};

export type ProtocolByBlockQueryVariables = Exact<{
  block?: InputMaybe<Block_Height>;
}>;

export type ProtocolByBlockQuery = {
  __typename: "Query";
  protocol?: {
    __typename: "Protocol";
    id: string;
    totalVolumeUSD: string;
    totalVolumeETH: string;
    participationRate: string;
    inflation: string;
    activeTranscoderCount: string;
    delegatorsCount: string;
    lockPeriod: string;
    totalActiveStake: string;
  } | null;
};

export type TransactionsQueryVariables = Exact<{
  account: Scalars["String"];
  first: Scalars["Int"];
  skip: Scalars["Int"];
}>;

export type TransactionsQuery = {
  __typename: "Query";
  transactions: Array<{
    __typename: "Transaction";
    events?: Array<
      | {
          __typename: "BondEvent";
          additionalAmount: string;
          delegator: { __typename: "Delegator"; id: string };
          newDelegate: { __typename: "Transcoder"; id: string };
          oldDelegate?: { __typename: "Transcoder"; id: string } | null;
          round: { __typename: "Round"; id: string };
          transaction: {
            __typename: "Transaction";
            id: string;
            timestamp: number;
          };
        }
      | {
          __typename: "BurnEvent";
          round: { __typename: "Round"; id: string };
          transaction: {
            __typename: "Transaction";
            id: string;
            timestamp: number;
          };
        }
      | {
          __typename: "DepositFundedEvent";
          amount: string;
          sender: { __typename: "Broadcaster"; id: string };
          round: { __typename: "Round"; id: string };
          transaction: {
            __typename: "Transaction";
            id: string;
            timestamp: number;
          };
        }
      | {
          __typename: "EarningsClaimedEvent";
          round: { __typename: "Round"; id: string };
          transaction: {
            __typename: "Transaction";
            id: string;
            timestamp: number;
          };
        }
      | {
          __typename: "MigrateDelegatorFinalizedEvent";
          round: { __typename: "Round"; id: string };
          transaction: {
            __typename: "Transaction";
            id: string;
            timestamp: number;
          };
        }
      | {
          __typename: "MintEvent";
          round: { __typename: "Round"; id: string };
          transaction: {
            __typename: "Transaction";
            id: string;
            timestamp: number;
          };
        }
      | {
          __typename: "NewRoundEvent";
          round: { __typename: "Round"; id: string };
          transaction: {
            __typename: "Transaction";
            id: string;
            timestamp: number;
          };
        }
      | {
          __typename: "ParameterUpdateEvent";
          round: { __typename: "Round"; id: string };
          transaction: {
            __typename: "Transaction";
            id: string;
            timestamp: number;
          };
        }
      | {
          __typename: "PauseEvent";
          round: { __typename: "Round"; id: string };
          transaction: {
            __typename: "Transaction";
            id: string;
            timestamp: number;
          };
        }
      | {
          __typename: "PollCreatedEvent";
          round: { __typename: "Round"; id: string };
          transaction: {
            __typename: "Transaction";
            id: string;
            timestamp: number;
          };
        }
      | {
          __typename: "RebondEvent";
          amount: string;
          delegate: { __typename: "Transcoder"; id: string };
          round: { __typename: "Round"; id: string };
          transaction: {
            __typename: "Transaction";
            id: string;
            timestamp: number;
          };
        }
      | {
          __typename: "ReserveClaimedEvent";
          round: { __typename: "Round"; id: string };
          transaction: {
            __typename: "Transaction";
            id: string;
            timestamp: number;
          };
        }
      | {
          __typename: "ReserveFundedEvent";
          amount: string;
          reserveHolder: { __typename: "Broadcaster"; id: string };
          round: { __typename: "Round"; id: string };
          transaction: {
            __typename: "Transaction";
            id: string;
            timestamp: number;
          };
        }
      | {
          __typename: "RewardEvent";
          rewardTokens: string;
          round: { __typename: "Round"; id: string };
          transaction: {
            __typename: "Transaction";
            id: string;
            timestamp: number;
          };
        }
      | {
          __typename: "ServiceURIUpdateEvent";
          round: { __typename: "Round"; id: string };
          transaction: {
            __typename: "Transaction";
            id: string;
            timestamp: number;
          };
        }
      | {
          __typename: "SetCurrentRewardTokensEvent";
          round: { __typename: "Round"; id: string };
          transaction: {
            __typename: "Transaction";
            id: string;
            timestamp: number;
          };
        }
      | {
          __typename: "StakeClaimedEvent";
          round: { __typename: "Round"; id: string };
          transaction: {
            __typename: "Transaction";
            id: string;
            timestamp: number;
          };
        }
      | {
          __typename: "TranscoderActivatedEvent";
          round: { __typename: "Round"; id: string };
          transaction: {
            __typename: "Transaction";
            id: string;
            timestamp: number;
          };
        }
      | {
          __typename: "TranscoderDeactivatedEvent";
          round: { __typename: "Round"; id: string };
          transaction: {
            __typename: "Transaction";
            id: string;
            timestamp: number;
          };
        }
      | {
          __typename: "TranscoderEvictedEvent";
          round: { __typename: "Round"; id: string };
          transaction: {
            __typename: "Transaction";
            id: string;
            timestamp: number;
          };
        }
      | {
          __typename: "TranscoderResignedEvent";
          round: { __typename: "Round"; id: string };
          transaction: {
            __typename: "Transaction";
            id: string;
            timestamp: number;
          };
        }
      | {
          __typename: "TranscoderSlashedEvent";
          round: { __typename: "Round"; id: string };
          transaction: {
            __typename: "Transaction";
            id: string;
            timestamp: number;
          };
        }
      | {
          __typename: "TranscoderUpdateEvent";
          rewardCut: string;
          feeShare: string;
          round: { __typename: "Round"; id: string };
          transaction: {
            __typename: "Transaction";
            id: string;
            timestamp: number;
          };
        }
      | {
          __typename: "TransferBondEvent";
          round: { __typename: "Round"; id: string };
          transaction: {
            __typename: "Transaction";
            id: string;
            timestamp: number;
          };
        }
      | {
          __typename: "UnbondEvent";
          amount: string;
          delegate: { __typename: "Transcoder"; id: string };
          round: { __typename: "Round"; id: string };
          transaction: {
            __typename: "Transaction";
            id: string;
            timestamp: number;
          };
        }
      | {
          __typename: "UnpauseEvent";
          round: { __typename: "Round"; id: string };
          transaction: {
            __typename: "Transaction";
            id: string;
            timestamp: number;
          };
        }
      | {
          __typename: "VoteEvent";
          round: { __typename: "Round"; id: string };
          transaction: {
            __typename: "Transaction";
            id: string;
            timestamp: number;
          };
        }
      | {
          __typename: "WinningTicketRedeemedEvent";
          faceValue: string;
          round: { __typename: "Round"; id: string };
          transaction: {
            __typename: "Transaction";
            id: string;
            timestamp: number;
          };
        }
      | {
          __typename: "WithdrawFeesEvent";
          amount: string;
          round: { __typename: "Round"; id: string };
          transaction: {
            __typename: "Transaction";
            id: string;
            timestamp: number;
          };
        }
      | {
          __typename: "WithdrawStakeEvent";
          amount: string;
          round: { __typename: "Round"; id: string };
          transaction: {
            __typename: "Transaction";
            id: string;
            timestamp: number;
          };
        }
      | {
          __typename: "WithdrawalEvent";
          round: { __typename: "Round"; id: string };
          transaction: {
            __typename: "Transaction";
            id: string;
            timestamp: number;
          };
        }
    > | null;
  }>;
  winningTicketRedeemedEvents: Array<{
    __typename: "WinningTicketRedeemedEvent";
    id: string;
    faceValue: string;
    round: { __typename: "Round"; id: string };
    transaction: { __typename: "Transaction"; id: string; timestamp: number };
  }>;
};

export type TreasuryProposalQueryVariables = Exact<{
  id: Scalars["ID"];
}>;

export type TreasuryProposalQuery = {
  __typename: "Query";
  treasuryProposal?: {
    __typename: "TreasuryProposal";
    id: string;
    description: string;
    calldatas: Array<any>;
    targets: Array<string>;
    values: Array<string>;
    voteEnd: string;
    voteStart: string;
    proposer: { __typename: "LivepeerAccount"; id: string };
  } | null;
};

export type TreasuryProposalsQueryVariables = Exact<{ [key: string]: never }>;

export type TreasuryProposalsQuery = {
  __typename: "Query";
  treasuryProposals: Array<{
    __typename: "TreasuryProposal";
    id: string;
    description: string;
    calldatas: Array<any>;
    targets: Array<string>;
    values: Array<string>;
    voteEnd: string;
    voteStart: string;
    proposer: { __typename: "LivepeerAccount"; id: string };
  }>;
};

export type VoteQueryVariables = Exact<{
  id: Scalars["ID"];
}>;

export type VoteQuery = {
  __typename: "Query";
  vote?: {
    __typename: "Vote";
    choiceID?: PollChoice | null;
    voteStake: string;
    nonVoteStake: string;
  } | null;
};

export const AccountDocument = gql`
  query account($account: ID!) {
    delegator(id: $account) {
      id
      bondedAmount
      principal
      unbonded
      withdrawnFees
      startRound
      lastClaimRound {
        id
      }
      unbondingLocks {
        id
        amount
        unbondingLockId
        withdrawRound
        delegate {
          id
        }
      }
      delegate {
        id
        active
        status
        totalStake
      }
    }
    transcoder(id: $account) {
      id
      active
      feeShare
      rewardCut
      status
      active
      totalStake
      totalVolumeETH
      activationTimestamp
      activationRound
      deactivationRound
      thirtyDayVolumeETH
      ninetyDayVolumeETH
      lastRewardRound {
        id
      }
      pools(first: 30, skip: 1, orderBy: id, orderDirection: desc) {
        rewardTokens
      }
      delegators(first: 1000) {
        id
      }
    }
    protocol(id: "0") {
      id
      totalSupply
      totalActiveStake
      participationRate
      inflation
      inflationChange
      lptPriceEth
      roundLength
      currentRound {
        id
      }
    }
  }
`;

/**
 * __useAccountQuery__
 *
 * To run a query within a React component, call `useAccountQuery` and pass it any options that fit your needs.
 * When your component renders, `useAccountQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useAccountQuery({
 *   variables: {
 *      account: // value for 'account'
 *   },
 * });
 */
export function useAccountQuery(
  baseOptions: Apollo.QueryHookOptions<AccountQuery, AccountQueryVariables>
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useQuery<AccountQuery, AccountQueryVariables>(
    AccountDocument,
    options
  );
}
export function useAccountLazyQuery(
  baseOptions?: Apollo.LazyQueryHookOptions<AccountQuery, AccountQueryVariables>
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useLazyQuery<AccountQuery, AccountQueryVariables>(
    AccountDocument,
    options
  );
}
export type AccountQueryHookResult = ReturnType<typeof useAccountQuery>;
export type AccountLazyQueryHookResult = ReturnType<typeof useAccountLazyQuery>;
export type AccountQueryResult = Apollo.QueryResult<
  AccountQuery,
  AccountQueryVariables
>;
export const AccountInactiveDocument = gql`
  query accountInactive($id: ID!) {
    delegator(id: $id) {
      id
      delegate {
        id
        active
      }
    }
    protocol(id: "0") {
      id
      pendingActivation {
        id
      }
    }
  }
`;

/**
 * __useAccountInactiveQuery__
 *
 * To run a query within a React component, call `useAccountInactiveQuery` and pass it any options that fit your needs.
 * When your component renders, `useAccountInactiveQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useAccountInactiveQuery({
 *   variables: {
 *      id: // value for 'id'
 *   },
 * });
 */
export function useAccountInactiveQuery(
  baseOptions: Apollo.QueryHookOptions<
    AccountInactiveQuery,
    AccountInactiveQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useQuery<AccountInactiveQuery, AccountInactiveQueryVariables>(
    AccountInactiveDocument,
    options
  );
}
export function useAccountInactiveLazyQuery(
  baseOptions?: Apollo.LazyQueryHookOptions<
    AccountInactiveQuery,
    AccountInactiveQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useLazyQuery<
    AccountInactiveQuery,
    AccountInactiveQueryVariables
  >(AccountInactiveDocument, options);
}
export type AccountInactiveQueryHookResult = ReturnType<
  typeof useAccountInactiveQuery
>;
export type AccountInactiveLazyQueryHookResult = ReturnType<
  typeof useAccountInactiveLazyQuery
>;
export type AccountInactiveQueryResult = Apollo.QueryResult<
  AccountInactiveQuery,
  AccountInactiveQueryVariables
>;
export const CurrentRoundDocument = gql`
  query currentRound {
    protocol(id: 0) {
      id
      currentRound {
        id
      }
    }
  }
`;

/**
 * __useCurrentRoundQuery__
 *
 * To run a query within a React component, call `useCurrentRoundQuery` and pass it any options that fit your needs.
 * When your component renders, `useCurrentRoundQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useCurrentRoundQuery({
 *   variables: {
 *   },
 * });
 */
export function useCurrentRoundQuery(
  baseOptions?: Apollo.QueryHookOptions<
    CurrentRoundQuery,
    CurrentRoundQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useQuery<CurrentRoundQuery, CurrentRoundQueryVariables>(
    CurrentRoundDocument,
    options
  );
}
export function useCurrentRoundLazyQuery(
  baseOptions?: Apollo.LazyQueryHookOptions<
    CurrentRoundQuery,
    CurrentRoundQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useLazyQuery<CurrentRoundQuery, CurrentRoundQueryVariables>(
    CurrentRoundDocument,
    options
  );
}
export type CurrentRoundQueryHookResult = ReturnType<
  typeof useCurrentRoundQuery
>;
export type CurrentRoundLazyQueryHookResult = ReturnType<
  typeof useCurrentRoundLazyQuery
>;
export type CurrentRoundQueryResult = Apollo.QueryResult<
  CurrentRoundQuery,
  CurrentRoundQueryVariables
>;
export const DaysDocument = gql`
  query days(
    $first: Int
    $orderBy: Day_orderBy
    $orderDirection: OrderDirection
  ) {
    days(first: $first, orderBy: $orderBy, orderDirection: $orderDirection) {
      date
      volumeUSD
      volumeETH
      participationRate
      inflation
      activeTranscoderCount
      delegatorsCount
    }
  }
`;

/**
 * __useDaysQuery__
 *
 * To run a query within a React component, call `useDaysQuery` and pass it any options that fit your needs.
 * When your component renders, `useDaysQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useDaysQuery({
 *   variables: {
 *      first: // value for 'first'
 *      orderBy: // value for 'orderBy'
 *      orderDirection: // value for 'orderDirection'
 *   },
 * });
 */
export function useDaysQuery(
  baseOptions?: Apollo.QueryHookOptions<DaysQuery, DaysQueryVariables>
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useQuery<DaysQuery, DaysQueryVariables>(DaysDocument, options);
}
export function useDaysLazyQuery(
  baseOptions?: Apollo.LazyQueryHookOptions<DaysQuery, DaysQueryVariables>
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useLazyQuery<DaysQuery, DaysQueryVariables>(
    DaysDocument,
    options
  );
}
export type DaysQueryHookResult = ReturnType<typeof useDaysQuery>;
export type DaysLazyQueryHookResult = ReturnType<typeof useDaysLazyQuery>;
export type DaysQueryResult = Apollo.QueryResult<DaysQuery, DaysQueryVariables>;
export const EventsDocument = gql`
  query events($first: Int) {
    transactions(first: $first, orderBy: timestamp, orderDirection: desc) {
      events {
        __typename
        round {
          id
        }
        transaction {
          id
          timestamp
          from
        }
        ... on BondEvent {
          delegator {
            id
          }
          newDelegate {
            id
          }
          oldDelegate {
            id
          }
          additionalAmount
        }
        ... on UnbondEvent {
          delegate {
            id
          }
          delegator {
            id
          }
          amount
        }
        ... on RebondEvent {
          delegate {
            id
          }
          delegator {
            id
          }
          amount
        }
        ... on TranscoderUpdateEvent {
          delegate {
            id
          }
          rewardCut
          feeShare
        }
        ... on RewardEvent {
          delegate {
            id
          }
          rewardTokens
        }
        ... on WithdrawStakeEvent {
          delegator {
            id
          }
          amount
        }
        ... on WithdrawFeesEvent {
          delegator {
            id
          }
          amount
        }
        ... on WinningTicketRedeemedEvent {
          recipient {
            id
          }
          faceValue
        }
        ... on DepositFundedEvent {
          sender {
            id
          }
          amount
        }
        ... on ReserveFundedEvent {
          reserveHolder {
            id
          }
          amount
        }
        ... on TransferBondEvent {
          amount
          newDelegator {
            id
          }
          oldDelegator {
            id
          }
        }
        ... on TranscoderActivatedEvent {
          activationRound
          delegate {
            id
          }
        }
        ... on TranscoderDeactivatedEvent {
          deactivationRound
          delegate {
            id
          }
        }
        ... on TranscoderResignedEvent {
          delegate {
            id
          }
        }
        ... on TranscoderEvictedEvent {
          delegate {
            id
          }
        }
        ... on NewRoundEvent {
          transaction {
            from
          }
        }
        ... on WithdrawalEvent {
          sender {
            id
          }
          deposit
          reserve
        }
        ... on SetCurrentRewardTokensEvent {
          currentInflation
          currentMintableTokens
        }
        ... on ParameterUpdateEvent {
          param
        }
        ... on VoteEvent {
          voter
          choiceID
          poll {
            id
          }
        }
        ... on PollCreatedEvent {
          poll {
            id
          }
          endBlock
        }
        ... on ServiceURIUpdateEvent {
          addr
          serviceURI
        }
        ... on MigrateDelegatorFinalizedEvent {
          l1Addr
          l2Addr
          stake
          delegatedStake
          fees
        }
        ... on StakeClaimedEvent {
          stake
          fees
        }
      }
    }
    transcoders(where: { active: true }) {
      id
    }
  }
`;

/**
 * __useEventsQuery__
 *
 * To run a query within a React component, call `useEventsQuery` and pass it any options that fit your needs.
 * When your component renders, `useEventsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useEventsQuery({
 *   variables: {
 *      first: // value for 'first'
 *   },
 * });
 */
export function useEventsQuery(
  baseOptions?: Apollo.QueryHookOptions<EventsQuery, EventsQueryVariables>
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useQuery<EventsQuery, EventsQueryVariables>(
    EventsDocument,
    options
  );
}
export function useEventsLazyQuery(
  baseOptions?: Apollo.LazyQueryHookOptions<EventsQuery, EventsQueryVariables>
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useLazyQuery<EventsQuery, EventsQueryVariables>(
    EventsDocument,
    options
  );
}
export type EventsQueryHookResult = ReturnType<typeof useEventsQuery>;
export type EventsLazyQueryHookResult = ReturnType<typeof useEventsLazyQuery>;
export type EventsQueryResult = Apollo.QueryResult<
  EventsQuery,
  EventsQueryVariables
>;
export const OrchestratorsDocument = gql`
  query orchestrators(
    $currentRound: BigInt
    $currentRoundString: String
    $where: Transcoder_filter
    $first: Int
    $skip: Int
    $orderBy: Transcoder_orderBy
    $orderDirection: OrderDirection
  ) {
    transcoders(
      where: {
        activationRound_lte: $currentRound
        deactivationRound_gt: $currentRound
      }
      first: $first
      skip: $skip
      orderBy: thirtyDayVolumeETH
      orderDirection: desc
    ) {
      id
      totalVolumeETH
      feeShare
      feeShareUpdateTimestamp
      activationTimestamp
      activationRound
      deactivationRound
      rewardCut
      rewardCutUpdateTimestamp
      totalStake
      delegator {
        startRound
        bondedAmount
        unbondingLocks {
          withdrawRound
        }
      }
      delegators(first: 1000) {
        id
      }
      pools(
        first: 90
        orderBy: id
        orderDirection: desc
        where: { round_not: $currentRoundString }
      ) {
        rewardTokens
      }
      thirtyDayVolumeETH
      sixtyDayVolumeETH
      ninetyDayVolumeETH
    }
  }
`;

/**
 * __useOrchestratorsQuery__
 *
 * To run a query within a React component, call `useOrchestratorsQuery` and pass it any options that fit your needs.
 * When your component renders, `useOrchestratorsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useOrchestratorsQuery({
 *   variables: {
 *      currentRound: // value for 'currentRound'
 *      currentRoundString: // value for 'currentRoundString'
 *      where: // value for 'where'
 *      first: // value for 'first'
 *      skip: // value for 'skip'
 *      orderBy: // value for 'orderBy'
 *      orderDirection: // value for 'orderDirection'
 *   },
 * });
 */
export function useOrchestratorsQuery(
  baseOptions?: Apollo.QueryHookOptions<
    OrchestratorsQuery,
    OrchestratorsQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useQuery<OrchestratorsQuery, OrchestratorsQueryVariables>(
    OrchestratorsDocument,
    options
  );
}
export function useOrchestratorsLazyQuery(
  baseOptions?: Apollo.LazyQueryHookOptions<
    OrchestratorsQuery,
    OrchestratorsQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useLazyQuery<OrchestratorsQuery, OrchestratorsQueryVariables>(
    OrchestratorsDocument,
    options
  );
}
export type OrchestratorsQueryHookResult = ReturnType<
  typeof useOrchestratorsQuery
>;
export type OrchestratorsLazyQueryHookResult = ReturnType<
  typeof useOrchestratorsLazyQuery
>;
export type OrchestratorsQueryResult = Apollo.QueryResult<
  OrchestratorsQuery,
  OrchestratorsQueryVariables
>;
export const OrchestratorsSortedDocument = gql`
  query orchestratorsSorted {
    transcoders(
      orderDirection: desc
      orderBy: totalStake
      where: { active: true }
    ) {
      id
      totalStake
    }
  }
`;

/**
 * __useOrchestratorsSortedQuery__
 *
 * To run a query within a React component, call `useOrchestratorsSortedQuery` and pass it any options that fit your needs.
 * When your component renders, `useOrchestratorsSortedQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useOrchestratorsSortedQuery({
 *   variables: {
 *   },
 * });
 */
export function useOrchestratorsSortedQuery(
  baseOptions?: Apollo.QueryHookOptions<
    OrchestratorsSortedQuery,
    OrchestratorsSortedQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useQuery<
    OrchestratorsSortedQuery,
    OrchestratorsSortedQueryVariables
  >(OrchestratorsSortedDocument, options);
}
export function useOrchestratorsSortedLazyQuery(
  baseOptions?: Apollo.LazyQueryHookOptions<
    OrchestratorsSortedQuery,
    OrchestratorsSortedQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useLazyQuery<
    OrchestratorsSortedQuery,
    OrchestratorsSortedQueryVariables
  >(OrchestratorsSortedDocument, options);
}
export type OrchestratorsSortedQueryHookResult = ReturnType<
  typeof useOrchestratorsSortedQuery
>;
export type OrchestratorsSortedLazyQueryHookResult = ReturnType<
  typeof useOrchestratorsSortedLazyQuery
>;
export type OrchestratorsSortedQueryResult = Apollo.QueryResult<
  OrchestratorsSortedQuery,
  OrchestratorsSortedQueryVariables
>;
export const PollDocument = gql`
  query poll($id: ID!) {
    poll(id: $id) {
      id
      proposal
      endBlock
      quorum
      quota
      tally {
        yes
        no
      }
      votes {
        id
      }
    }
  }
`;

/**
 * __usePollQuery__
 *
 * To run a query within a React component, call `usePollQuery` and pass it any options that fit your needs.
 * When your component renders, `usePollQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = usePollQuery({
 *   variables: {
 *      id: // value for 'id'
 *   },
 * });
 */
export function usePollQuery(
  baseOptions: Apollo.QueryHookOptions<PollQuery, PollQueryVariables>
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useQuery<PollQuery, PollQueryVariables>(PollDocument, options);
}
export function usePollLazyQuery(
  baseOptions?: Apollo.LazyQueryHookOptions<PollQuery, PollQueryVariables>
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useLazyQuery<PollQuery, PollQueryVariables>(
    PollDocument,
    options
  );
}
export type PollQueryHookResult = ReturnType<typeof usePollQuery>;
export type PollLazyQueryHookResult = ReturnType<typeof usePollLazyQuery>;
export type PollQueryResult = Apollo.QueryResult<PollQuery, PollQueryVariables>;
export const PollsDocument = gql`
  query polls {
    polls {
      id
      proposal
      endBlock
      quorum
      quota
      tally {
        yes
        no
      }
      votes {
        id
      }
    }
  }
`;

/**
 * __usePollsQuery__
 *
 * To run a query within a React component, call `usePollsQuery` and pass it any options that fit your needs.
 * When your component renders, `usePollsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = usePollsQuery({
 *   variables: {
 *   },
 * });
 */
export function usePollsQuery(
  baseOptions?: Apollo.QueryHookOptions<PollsQuery, PollsQueryVariables>
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useQuery<PollsQuery, PollsQueryVariables>(
    PollsDocument,
    options
  );
}
export function usePollsLazyQuery(
  baseOptions?: Apollo.LazyQueryHookOptions<PollsQuery, PollsQueryVariables>
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useLazyQuery<PollsQuery, PollsQueryVariables>(
    PollsDocument,
    options
  );
}
export type PollsQueryHookResult = ReturnType<typeof usePollsQuery>;
export type PollsLazyQueryHookResult = ReturnType<typeof usePollsLazyQuery>;
export type PollsQueryResult = Apollo.QueryResult<
  PollsQuery,
  PollsQueryVariables
>;
export const ProtocolDocument = gql`
  query protocol {
    protocol(id: "0") {
      id
      totalVolumeUSD
      totalVolumeETH
      participationRate
      inflation
      activeTranscoderCount
      delegatorsCount
      lockPeriod
      totalSupply
      totalActiveStake
      inflationChange
      roundLength
      lptPriceEth
      paused
      currentRound {
        id
        mintableTokens
        volumeETH
        volumeUSD
        pools {
          rewardTokens
        }
      }
    }
  }
`;

/**
 * __useProtocolQuery__
 *
 * To run a query within a React component, call `useProtocolQuery` and pass it any options that fit your needs.
 * When your component renders, `useProtocolQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useProtocolQuery({
 *   variables: {
 *   },
 * });
 */
export function useProtocolQuery(
  baseOptions?: Apollo.QueryHookOptions<ProtocolQuery, ProtocolQueryVariables>
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useQuery<ProtocolQuery, ProtocolQueryVariables>(
    ProtocolDocument,
    options
  );
}
export function useProtocolLazyQuery(
  baseOptions?: Apollo.LazyQueryHookOptions<
    ProtocolQuery,
    ProtocolQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useLazyQuery<ProtocolQuery, ProtocolQueryVariables>(
    ProtocolDocument,
    options
  );
}
export type ProtocolQueryHookResult = ReturnType<typeof useProtocolQuery>;
export type ProtocolLazyQueryHookResult = ReturnType<
  typeof useProtocolLazyQuery
>;
export type ProtocolQueryResult = Apollo.QueryResult<
  ProtocolQuery,
  ProtocolQueryVariables
>;
export const ProtocolByBlockDocument = gql`
  query protocolByBlock($block: Block_height) {
    protocol(id: 0, block: $block) {
      id
      totalVolumeUSD
      totalVolumeETH
      participationRate
      inflation
      activeTranscoderCount
      delegatorsCount
      lockPeriod
      totalActiveStake
    }
  }
`;

/**
 * __useProtocolByBlockQuery__
 *
 * To run a query within a React component, call `useProtocolByBlockQuery` and pass it any options that fit your needs.
 * When your component renders, `useProtocolByBlockQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useProtocolByBlockQuery({
 *   variables: {
 *      block: // value for 'block'
 *   },
 * });
 */
export function useProtocolByBlockQuery(
  baseOptions?: Apollo.QueryHookOptions<
    ProtocolByBlockQuery,
    ProtocolByBlockQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useQuery<ProtocolByBlockQuery, ProtocolByBlockQueryVariables>(
    ProtocolByBlockDocument,
    options
  );
}
export function useProtocolByBlockLazyQuery(
  baseOptions?: Apollo.LazyQueryHookOptions<
    ProtocolByBlockQuery,
    ProtocolByBlockQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useLazyQuery<
    ProtocolByBlockQuery,
    ProtocolByBlockQueryVariables
  >(ProtocolByBlockDocument, options);
}
export type ProtocolByBlockQueryHookResult = ReturnType<
  typeof useProtocolByBlockQuery
>;
export type ProtocolByBlockLazyQueryHookResult = ReturnType<
  typeof useProtocolByBlockLazyQuery
>;
export type ProtocolByBlockQueryResult = Apollo.QueryResult<
  ProtocolByBlockQuery,
  ProtocolByBlockQueryVariables
>;
export const TransactionsDocument = gql`
  query transactions($account: String!, $first: Int!, $skip: Int!) {
    transactions(
      orderBy: timestamp
      orderDirection: desc
      where: { from: $account }
      first: $first
      skip: $skip
    ) {
      events {
        __typename
        round {
          id
        }
        transaction {
          id
          timestamp
        }
        ... on BondEvent {
          delegator {
            id
          }
          newDelegate {
            id
          }
          oldDelegate {
            id
          }
          additionalAmount
        }
        ... on UnbondEvent {
          delegate {
            id
          }
          amount
        }
        ... on RebondEvent {
          delegate {
            id
          }
          amount
        }
        ... on TranscoderUpdateEvent {
          rewardCut
          feeShare
        }
        ... on RewardEvent {
          rewardTokens
        }
        ... on WithdrawStakeEvent {
          amount
        }
        ... on WithdrawFeesEvent {
          amount
        }
        ... on WinningTicketRedeemedEvent {
          faceValue
        }
        ... on DepositFundedEvent {
          sender {
            id
          }
          amount
        }
        ... on ReserveFundedEvent {
          reserveHolder {
            id
          }
          amount
        }
      }
    }
    winningTicketRedeemedEvents(
      orderBy: timestamp
      orderDirection: desc
      where: { recipient: $account }
    ) {
      __typename
      id
      round {
        id
      }
      transaction {
        id
        timestamp
      }
      faceValue
    }
  }
`;

/**
 * __useTransactionsQuery__
 *
 * To run a query within a React component, call `useTransactionsQuery` and pass it any options that fit your needs.
 * When your component renders, `useTransactionsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useTransactionsQuery({
 *   variables: {
 *      account: // value for 'account'
 *      first: // value for 'first'
 *      skip: // value for 'skip'
 *   },
 * });
 */
export function useTransactionsQuery(
  baseOptions: Apollo.QueryHookOptions<
    TransactionsQuery,
    TransactionsQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useQuery<TransactionsQuery, TransactionsQueryVariables>(
    TransactionsDocument,
    options
  );
}
export function useTransactionsLazyQuery(
  baseOptions?: Apollo.LazyQueryHookOptions<
    TransactionsQuery,
    TransactionsQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useLazyQuery<TransactionsQuery, TransactionsQueryVariables>(
    TransactionsDocument,
    options
  );
}
export type TransactionsQueryHookResult = ReturnType<
  typeof useTransactionsQuery
>;
export type TransactionsLazyQueryHookResult = ReturnType<
  typeof useTransactionsLazyQuery
>;
export type TransactionsQueryResult = Apollo.QueryResult<
  TransactionsQuery,
  TransactionsQueryVariables
>;
export const TreasuryProposalDocument = gql`
  query treasuryProposal($id: ID!) {
    treasuryProposal(id: $id) {
      id
      description
      calldatas
      targets
      values
      voteEnd
      voteStart
      proposer {
        id
      }
    }
  }
`;

/**
 * __useTreasuryProposalQuery__
 *
 * To run a query within a React component, call `useTreasuryProposalQuery` and pass it any options that fit your needs.
 * When your component renders, `useTreasuryProposalQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useTreasuryProposalQuery({
 *   variables: {
 *      id: // value for 'id'
 *   },
 * });
 */
export function useTreasuryProposalQuery(
  baseOptions: Apollo.QueryHookOptions<
    TreasuryProposalQuery,
    TreasuryProposalQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useQuery<TreasuryProposalQuery, TreasuryProposalQueryVariables>(
    TreasuryProposalDocument,
    options
  );
}
export function useTreasuryProposalLazyQuery(
  baseOptions?: Apollo.LazyQueryHookOptions<
    TreasuryProposalQuery,
    TreasuryProposalQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useLazyQuery<
    TreasuryProposalQuery,
    TreasuryProposalQueryVariables
  >(TreasuryProposalDocument, options);
}
export type TreasuryProposalQueryHookResult = ReturnType<
  typeof useTreasuryProposalQuery
>;
export type TreasuryProposalLazyQueryHookResult = ReturnType<
  typeof useTreasuryProposalLazyQuery
>;
export type TreasuryProposalQueryResult = Apollo.QueryResult<
  TreasuryProposalQuery,
  TreasuryProposalQueryVariables
>;
export const TreasuryProposalsDocument = gql`
  query treasuryProposals {
    treasuryProposals(orderBy: voteStart, orderDirection: desc) {
      id
      description
      calldatas
      targets
      values
      voteEnd
      voteStart
      proposer {
        id
      }
    }
  }
`;

/**
 * __useTreasuryProposalsQuery__
 *
 * To run a query within a React component, call `useTreasuryProposalsQuery` and pass it any options that fit your needs.
 * When your component renders, `useTreasuryProposalsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useTreasuryProposalsQuery({
 *   variables: {
 *   },
 * });
 */
export function useTreasuryProposalsQuery(
  baseOptions?: Apollo.QueryHookOptions<
    TreasuryProposalsQuery,
    TreasuryProposalsQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useQuery<
    TreasuryProposalsQuery,
    TreasuryProposalsQueryVariables
  >(TreasuryProposalsDocument, options);
}
export function useTreasuryProposalsLazyQuery(
  baseOptions?: Apollo.LazyQueryHookOptions<
    TreasuryProposalsQuery,
    TreasuryProposalsQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useLazyQuery<
    TreasuryProposalsQuery,
    TreasuryProposalsQueryVariables
  >(TreasuryProposalsDocument, options);
}
export type TreasuryProposalsQueryHookResult = ReturnType<
  typeof useTreasuryProposalsQuery
>;
export type TreasuryProposalsLazyQueryHookResult = ReturnType<
  typeof useTreasuryProposalsLazyQuery
>;
export type TreasuryProposalsQueryResult = Apollo.QueryResult<
  TreasuryProposalsQuery,
  TreasuryProposalsQueryVariables
>;
export const VoteDocument = gql`
  query vote($id: ID!) {
    vote(id: $id) {
      choiceID
      voteStake
      nonVoteStake
    }
  }
`;

/**
 * __useVoteQuery__
 *
 * To run a query within a React component, call `useVoteQuery` and pass it any options that fit your needs.
 * When your component renders, `useVoteQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useVoteQuery({
 *   variables: {
 *      id: // value for 'id'
 *   },
 * });
 */
export function useVoteQuery(
  baseOptions: Apollo.QueryHookOptions<VoteQuery, VoteQueryVariables>
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useQuery<VoteQuery, VoteQueryVariables>(VoteDocument, options);
}
export function useVoteLazyQuery(
  baseOptions?: Apollo.LazyQueryHookOptions<VoteQuery, VoteQueryVariables>
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useLazyQuery<VoteQuery, VoteQueryVariables>(
    VoteDocument,
    options
  );
}
export type VoteQueryHookResult = ReturnType<typeof useVoteQuery>;
export type VoteLazyQueryHookResult = ReturnType<typeof useVoteLazyQuery>;
export type VoteQueryResult = Apollo.QueryResult<VoteQuery, VoteQueryVariables>;
