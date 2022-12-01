import {
  AccountQueryResult,
  OrchestratorsSortedQueryResult,
  UnbondingLock,
} from "apollo";
import { BigNumber, BigNumberish, ethers } from "ethers";
import { formatEther } from "ethers/lib/utils";
import { StakingAction } from "hooks";
import { CHAIN_INFO, DEFAULT_CHAIN_ID, INFURA_NETWORK_URLS } from "lib/chains";
import Numeral from "numeral";

export const provider = new ethers.providers.JsonRpcProvider(
  INFURA_NETWORK_URLS[DEFAULT_CHAIN_ID]
);

export function avg(obj, key) {
  const arr = Object.values(obj);
  const sum = (prev, cur) => ({ [key]: prev[key] + cur[key] });
  return arr.reduce(sum)[key] / arr.length;
}

export const EMPTY_ADDRESS = ethers.constants.AddressZero;

export const abbreviateNumber = (value, precision = 3) => {
  let newValue = value;
  const suffixes = ["", "K", "M", "B", "T"];
  let suffixNum = 0;
  while (newValue >= 1000) {
    newValue /= 1000;
    suffixNum++;
  }

  newValue = parseFloat(Number.parseFloat(newValue).toPrecision(precision));

  newValue += suffixes[suffixNum];
  return newValue;
};

export const numberWithCommas = (x) => {
  return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};

export const getDelegationStatusColor = (status) => {
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
  delegator: AccountQueryResult["data"]["delegator"],
  currentRound: AccountQueryResult["data"]["protocol"]["currentRound"]
): string => {
  if (!+delegator?.bondedAmount) {
    return "Unbonded";
  } else if (
    delegator.unbondingLocks.filter(
      (lock: UnbondingLock) =>
        lock.withdrawRound && +lock.withdrawRound > +currentRound.id
    ).length > 0
  ) {
    return "Unbonding";
  } else if (+delegator.startRound > +currentRound.id) {
    return "Pending";
  } else if (
    +delegator.startRound > 0 &&
    +delegator.startRound <= +currentRound.id
  ) {
    return "Bonded";
  } else {
    return "Unbonded";
  }
};

export const MAXIMUM_VALUE_UINT256 =
  "115792089237316195423570985008687907853269984665640564039457584007913129639935";

export const textTruncate = (str, length, ending) => {
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

export const getBlockByNumber = async (number) => {
  const blockDataResponse = await fetch(
    `${CHAIN_INFO[DEFAULT_CHAIN_ID].explorerAPI}?module=block&action=getblockreward&blockno=${number}&apikey=${process.env.NEXT_PUBLIC_ETHERSCAN_API_KEY}`
  );
  const { result } = await blockDataResponse.json();
  return result;
};

export const getHint = (id, transcoders) => {
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
  transcoders: OrchestratorsSortedQueryResult["data"]["transcoders"];
  amount: BigNumber;
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

export const isAddress = (address: string) => {
  try {
    ethers.utils.getAddress(address);
  } catch (e) {
    return false;
  }
  return true;
};

export const priceFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
});

export const toK = (num) => {
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
export const getBlocksFromTimestamps = async (timestamps) => {
  if (!timestamps?.length) {
    return [];
  }
  const blocks = [];
  for (const timestamp of timestamps) {
    const blockDataResponse = await fetch(
      `${CHAIN_INFO[DEFAULT_CHAIN_ID].explorerAPI}?module=block&action=getblocknobytime&timestamp=${timestamp}&closest=before&apikey=${process.env.NEXT_PUBLIC_ETHERSCAN_API_KEY}`
    );
    const { result } = await blockDataResponse.json();
    blocks.push(+result);
  }

  return blocks;
};

/**
 * get standard percent change between two values
 * @param {*} valueNow
 * @param {*} value24HoursAgo
 */
export const getPercentChange = (valueNow, value24HoursAgo) => {
  const adjustedPercentChange =
    ((parseFloat(valueNow) - parseFloat(value24HoursAgo)) /
      parseFloat(value24HoursAgo)) *
    100;
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
    return arr;
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

export const scientificToDecimal = (x) => {
  if (Math.abs(x) < 1.0) {
    const e = parseInt(x.toString().split("e-")[1]);
    if (e) {
      x *= Math.pow(10, e - 1);
      x = "0." + new Array(e).join("0") + x.toString().substring(2);
    }
  } else {
    let e = parseInt(x.toString().split("+")[1]);
    if (e > 20) {
      e -= 20;
      x /= Math.pow(10, e);
      x += new Array(e + 1).join("0");
    }
  }
  return x;
};

export function roundToTwo(num) {
  return Math.round(num * 100 + Number.EPSILON) / 100;
}

export function toTitleCase(str) {
  return str.replace(/\w\S*/g, function (txt) {
    return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
  });
}

export const fromWei = (wei: BigNumberish) => formatEther(wei);
