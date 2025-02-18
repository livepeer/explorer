import { AccountQueryResult, OrchestratorsSortedQueryResult, UnbondingLock } from "apollo";
import { ethers } from "ethers";
import { DEFAULT_CHAIN_ID, INFURA_NETWORK_URLS } from "lib/chains";
import Numeral from "numeral";
import { StakingAction } from './types';

const rpcUrl = INFURA_NETWORK_URLS[DEFAULT_CHAIN_ID];
if (!rpcUrl) {
  throw new Error(`No RPC URL found for chain ID ${DEFAULT_CHAIN_ID}`);
}

// Update provider configuration for ethers v6
export const provider = new ethers.JsonRpcProvider(rpcUrl, undefined, {
  staticNetwork: true,
  polling: true,
  batchMaxCount: 1, // Prevent array batch requests that might cause 521 errors,
  cacheTimeout: -1, // Disable cache to prevent stale data
});

export function avg(obj: any, key: string) {
  const arr = Object.values(obj);
  const sum = (prev: any, cur: any) => ({ [key]: prev[key] + cur[key] });
  return (arr.reduce(sum)?.[key] ?? 0) / arr.length;
}

export const EMPTY_ADDRESS = ethers.ZeroAddress;

export const abbreviateNumber = (value: number, precision = 3) => {
  let newValue = value;
  const suffixes = ["", "K", "M", "B", "T"];
  let suffixNum = 0;
  while (newValue >= 1000) {
    newValue /= 1000;
    suffixNum++;
  }

  const formattedValue = Number.parseFloat(newValue.toString()).toPrecision(precision);
  return formattedValue + suffixes[suffixNum];
};

export const numberWithCommas = (x: number | string) => {
  return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};

export const getDelegationStatusColor = (status: string) => {
  if (status === "Bonded") {
    return "$primary";
  } else if (status === "Unbonding") {
    return "yellow";
  } else if (status === "Pending") {
    return "blue";
  } else {
    return "$muted";
  }
};

export const getDelegatorStatus = (
  delegator: NonNullable<AccountQueryResult["data"]>["delegator"],
  currentRound:
    | NonNullable<
        NonNullable<AccountQueryResult["data"]>["protocol"]
      >["currentRound"]
    | undefined
): string => {
  if (!+(delegator?.bondedAmount ?? 0)) {
    return "Unbonded";
  } else if (
    (delegator?.unbondingLocks?.filter(
      (lock) =>
        lock?.withdrawRound &&
        +(lock.withdrawRound ?? 0) > +(currentRound?.id ?? 0)
    )?.length ?? 0) > 0
  ) {
    return "Unbonding";
  } else if (+(delegator?.startRound ?? 0) > +(currentRound?.id ?? 0)) {
    return "Pending";
  } else if (
    +(delegator?.startRound ?? 0) > 0 &&
    +(delegator?.startRound ?? 0) <= +(currentRound?.id ?? 0)
  ) {
    return "Bonded";
  } else {
    return "Unbonded";
  }
};

export const MAXIMUM_VALUE_UINT256 =
  "115792089237316195423570985008687907853269984665640564039457584007913129639935";

export const textTruncate = (str: string, length: number, ending: string) => {
  if (length === null) {
    length = 100;
  }
  if (ending === null) {
    ending = "...";
  }
  if (str.length > length) {
    return str.substring(0, length - ending.length) + ending;
  } else {
    return str;
  }
};

export const checkAddressEquality = (address1: string, address2: string) => {
  if (!isAddress(address1) || !isAddress(address2)) {
    return false;
  }
  return address1.toLowerCase() === address2.toLowerCase();
};

export const txMessages = {
  approve: {
    pending: "Approving LPT",
    confirmed: "LPT Approved",
  },
  bond: {
    pending: "Delegating LPT",
    confirmed: "LPT Delegated",
  },
  checkpoint: {
    pending: "Checkpointing",
    confirmed: "Stake Checkpointed",
  },
  unbond: {
    pending: "Undelegating LPT",
    confirmed: "LPT Undelegated",
  },
  rebond: {
    pending: "Redelegating LPT",
    confirmed: "LPT Redelegated",
  },
  rebondFromUnbonded: {
    pending: "Redelegating LPT",
    confirmed: "LPT Redelegated",
  },
  createPoll: {
    pending: "Creating Poll",
    confirmed: "Poll Created",
  },
  vote: {
    pending: "Casting Vote",
    confirmed: "Vote Casted",
  },
  propose: {
    pending: "Creating Proposal",
    confirmed: "Proposal Created",
  },
  queue: {
    pending: "Enqueueing Proposal",
    confirmed: "Proposal Enqueued",
  },
  execute: {
    pending: "Executing Proposal",
    confirmed: "Proposal Executed",
  },
  withdrawFees: {
    pending: "Withdrawing Fees",
    confirmed: "Fees Withdrawn",
  },
  withdrawStake: {
    pending: "Withdrawing Stake",
    confirmed: "Stake Withdrawn",
  },
  batchClaimEarnings: {
    pending: "Claiming Earnings",
    confirmed: "Earnings Claimed",
  },
  claimStake: {
    pending: "Claiming",
    confirmed: "Claimed",
  },
} as const;

export const getBlockByNumber = async (number: number) => {
  const blockDataResponse = await fetch(
    `${INFURA_NETWORK_URLS[DEFAULT_CHAIN_ID]}?module=block&action=getblockreward&blockno=${number}&apikey=${process.env.NEXT_PUBLIC_ETHERSCAN_API_KEY}`
  );
  const { result } = await blockDataResponse.json();
  return result;
};

export const getHint = (id: string, transcoders: any[]) => {
  const hint = {
    newPosPrev: EMPTY_ADDRESS,
    newPosNext: EMPTY_ADDRESS,
  };

  if (!transcoders.length || !id) {
    return hint;
  }

  const index = transcoders.findIndex(
    (t) => t.id.toLowerCase() === id.toLowerCase()
  );

  // if transcoder is not in active set return
  if (index < 0 || transcoders.length < 2) {
    return hint;
  } else if (index === 0) {
    // if transcoder is the first in the active set, only set posNex
    hint.newPosNext = transcoders[index + 1].id;
  } else if (index === transcoders.length - 1) {
    // if transcoder is the last in the active set, only set posPrev
    hint.newPosPrev = transcoders[index - 1].id;
  } else {
    hint.newPosNext = transcoders[index + 1].id;
    hint.newPosPrev = transcoders[index - 1].id;
  }
  return hint;
};

export const simulateNewActiveSetOrder = ({
  action,
  transcoders,
  amount,
  newDelegate,
  oldDelegate = EMPTY_ADDRESS,
}: {
  action: StakingAction;
  transcoders: NonNullable<
    OrchestratorsSortedQueryResult["data"]
  >["transcoders"];
  amount: string;
  newDelegate: string;
  oldDelegate?: string;
}) => {
  const index = transcoders.findIndex(
    (t) => t.id.toLowerCase() === newDelegate.toLowerCase()
  );

  if (index < 0) {
    return transcoders;
  }

  if (action === "delegate") {
    transcoders[index].totalStake = (
      +transcoders[index].totalStake + +amount
    ).toString();

    // if delegator is moving stake, subtract amount from old delegate
    if (
      oldDelegate &&
      oldDelegate.toLowerCase() !== newDelegate.toLowerCase() &&
      oldDelegate.toLowerCase() !== EMPTY_ADDRESS
    ) {
      const oldDelegateIndex = transcoders.findIndex(
        (t) => t.id.toLowerCase() === oldDelegate.toLowerCase()
      );
      if (oldDelegateIndex !== -1) {
        transcoders[oldDelegateIndex].totalStake = (
          +transcoders[oldDelegateIndex].totalStake - +amount
        ).toString();
      }
    }
  } else {
    transcoders[index].totalStake = (
      +transcoders[index].totalStake - +amount
    ).toString();
  }

  // reorder transcoders array
  return transcoders.sort((a, b) => +a.totalStake - +b.totalStake);
};

export const isAddress = (address: string): boolean => {
  try {
    return ethers.isAddress(address);
  } catch {
    return false;
  }
};

export const priceFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
});

export const toK = (num: number) => {
  return Numeral(num).format("0.[00]a");
};

/**
 * gets the amount difference plus the % change in change itself (second order change)
 * @param {*} valueNow
 * @param {*} valueAsOfPeriodOne
 * @param {*} valueAsOfPeriodTwo
 */
export const getTwoPeriodPercentChange = (
  valueNow: number,
  valueAsOfPeriodOne: number,
  valueAsOfPeriodTwo: number
) => {
  // get volume info for both 24 hour periods
  const currentChange = valueNow - valueAsOfPeriodOne;
  const previousChange = valueAsOfPeriodOne - valueAsOfPeriodTwo;

  const adjustedPercentChange =
    ((currentChange - previousChange) / previousChange) * 100;

  if (isNaN(adjustedPercentChange) || !isFinite(adjustedPercentChange)) {
    return [currentChange, 0];
  }
  return [currentChange, adjustedPercentChange];
};

/**
 * @notice Fetches block objects for an array of timestamps.
 * @dev blocks are returned in chronological order (ASC) regardless of input.
 * @dev blocks are returned at string representations of Int
 * @dev timestamps are returns as they were provided; not the block time.
 * @param {Array} timestamps
 */
export const getBlocksFromTimestamps = async (timestamps: number[], retry = 0) => {
  if (!timestamps?.length) {
    return [];
  }
  try {
    const blocks: number[] = [];
    for (const timestamp of timestamps) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      const blockDataResponse = await fetch(
        `${INFURA_NETWORK_URLS[DEFAULT_CHAIN_ID]}?module=block&action=getblocknobytime&timestamp=${timestamp}&closest=before&apikey=${process.env.NEXT_PUBLIC_ETHERSCAN_API_KEY}`
      );
      const { result } = await blockDataResponse.json();
      blocks.push(+(result ?? 0));
    }

    return blocks;
  } catch (e) {
    if (retry < 10) {
      await new Promise((resolve) => setTimeout(resolve, 800));
      return getBlocksFromTimestamps(timestamps, retry + 1);
    }
    throw e;
  }
};

/**
 * get standard percent change between two values
 * @param {*} valueNow
 * @param {*} value24HoursAgo
 */
export const getPercentChange = (valueNow: number, value24HoursAgo: number) => {
  if (value24HoursAgo === 0) return 0;
  
  const adjustedPercentChange =
    ((valueNow - value24HoursAgo) / value24HoursAgo) * 100;

  if (isNaN(adjustedPercentChange) || !isFinite(adjustedPercentChange)) {
    return 0;
  }
  return adjustedPercentChange;
};

type LivepeerComUsageParams = {
  fromTime: number;
  toTime: number;
};

export const getLivepeerComUsageData = async (
  params?: LivepeerComUsageParams
) => {
  try {
    const endpoint = `https://livepeer.com/api/usage${
      params ? `?fromTime=${params.fromTime}&toTime=${params.toTime}` : ""
    }`;
    const livepeerComUsageDataReponse = await fetch(endpoint, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${process.env.LIVEPEER_COM_API_ADMIN_TOKEN}`,
      },
    });
    const livepeerComUsageData = await livepeerComUsageDataReponse.json();

    // convert date format from milliseconds to seconds before merging
    const arr =
      livepeerComUsageData?.map((day) => ({
        ...day,
        date: day.date / 1000,
      })) ?? [];
    return arr as any;
  } catch (e) {
    console.log(e);
  }
};

export const getTotalFeeDerivedMinutes = ({
  totalVolumeETH,
  totalVolumeUSD,
  pricePerPixel,
  pixelsPerMinute,
}): number => {
  const ethDaiRate = totalVolumeETH / totalVolumeUSD;
  const usdAveragePricePerPixel = pricePerPixel / ethDaiRate;
  const feeDerivedMinutes =
    totalVolumeUSD / usdAveragePricePerPixel / pixelsPerMinute || 0;
  return feeDerivedMinutes;
};

export const scientificToDecimal = (x: number) => {
  const str = x.toString();
  if (Math.abs(x) < 1.0) {
    const e = parseInt(str.split("e-")[1]);
    if (e) {
      const result = x * Math.pow(10, e - 1);
      return result.toString().replace(".", "");
    }
  } else {
    const e = parseInt(str.split("+")[1]);
    if (e > 20) {
      const result = x / Math.pow(10, e);
      return result.toString().replace(".", "") + "0".repeat(e);
    }
  }
  return str;
};

export function roundToTwo(num: number) {
  return Math.round(num * 100 + Number.EPSILON) / 100;
}

export function toTitleCase(str: string) {
  return str.replace(/\w\S*/g, function (txt) {
    return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
  });
};

export const fromWei = (wei: string | bigint): string => {
  return ethers.formatEther(wei);
};

export const toWei = (ether: string | number): bigint => {
  return ethers.parseEther(ether.toString());
};

export const toNumber = (value: string | number | null | undefined): number => {
  if (!value) return 0;
  const num = Number(value);
  return isNaN(num) ? 0 : num;
};
