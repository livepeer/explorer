import dayjs from "dayjs";
import weekOfYear from "dayjs/plugin/weekOfYear";
import utc from "dayjs/plugin/utc";
import {
  getTwoPeriodPercentChange,
  getBlocksFromTimestamps,
  getLivepeerComUsageData,
  getPercentChange,
  getTotalFeeDerivedMinutes,
} from "@lib/utils";
import { dayDataQuery } from "../../queries/dayDataQuery";
import { protocolDataByBlockQuery } from "../..//queries/protocolDataByBlockQuery";
import { protocolDataQuery } from "../..//queries/protocolDataQuery";
import { client } from "..";
import {
  CHAIN_INFO,
  INFURA_NETWORK_URLS,
  IS_TESTNET,
  l1Provider,
  L1_CHAIN_ID,
  DEFAULT_CHAIN_ID,
} from "lib/chains";
import LivepeerSDK from "@livepeer/sdk";

// format dayjs with the libraries that we need
dayjs.extend(utc);
dayjs.extend(weekOfYear);

export async function account(_obj, _args, _ctx, _info) {
  return {
    id: _args.id,
    tokenBalance: async () => {
      return await _ctx.livepeer.rpc.getTokenBalance(_args.id.toLowerCase());
    },
    ethBalance: async () => {
      return await _ctx.livepeer.rpc.getEthBalance(_args.id.toLowerCase());
    },
    allowance: async () => {
      return await _ctx.livepeer.rpc.getBondingManagerAllowance(
        _args.id.toLowerCase()
      );
    },
    pollCreatorAllowance: async () => {
      return await _ctx.livepeer.rpc.getPollCreatorAllowance(
        _args.id.toLowerCase()
      );
    },
  };
}

export async function getTxReceiptStatus(_obj, _args, _ctx, _info) {
  const Utils = require("web3-utils");
  const txReceipt = await _ctx.livepeer.utils.getTxReceipt(
    _args.txHash,
    _ctx.livepeer.config.eth
  );
  return {
    status: Utils.hexToNumber(txReceipt.status),
  };
}

export async function transaction(_obj, _args, _ctx, _info) {
  return await _ctx.library.getTransaction(_args.txHash);
}

export async function txPrediction(_obj, _args, _ctx, _info) {
  const response = await fetch(
    `${CHAIN_INFO[DEFAULT_CHAIN_ID].explorerAPI}?module=gastracker&action=gasestimate&gasprice=${_args.gasPrice}&apikey=${process.env.NEXT_PUBLIC_ETHERSCAN_API_KEY}`
  );
  return await response.json();
}

export async function identity(_obj, _args, _ctx, _info) {
  const name = await l1Provider.lookupAddress(_args.id);

  if (name) {
    const resolver = await l1Provider.getResolver(name);
    const description = await resolver.getText("description");
    const url = await resolver.getText("url");
    const twitter = await resolver.getText("com.twitter");
    const avatar = await resolver.getAvatar();

    return {
      id: _args.id,
      name,
      website: url,
      twitter,
      description,
      image: avatar
        ? `https://metadata.ens.domains/mainnet/avatar/${name}`
        : null,
    };
  }

  const id = _args.id.toLowerCase();

  return {
    id,
    name: null,
    website: null,
    description: null,
    image: null,
  };
}

export async function block(_obj, _args, _ctx, _info) {
  const { number: blockNumber } = await _ctx.livepeer.rpc.getBlock("latest");
  return {
    number: blockNumber,
  };
}

export async function currentRoundInfo(_obj, _args, _ctx, _info) {
  const id = await _ctx.livepeer.rpc.getCurrentRound();
  const startBlock = await _ctx.livepeer.rpc.getCurrentRoundStartBlock();
  const initialized = await _ctx.livepeer.rpc.getCurrentRoundIsInitialized();
  return { id, startBlock, initialized };
}

export async function l1Block(_obj, _args, _ctx, _info) {
  const sdk = await LivepeerSDK({
    controllerAddress: CHAIN_INFO[L1_CHAIN_ID].contracts.controller,
    provider: INFURA_NETWORK_URLS[L1_CHAIN_ID],
  });
  const { number: blockNumber } = await sdk.rpc.getBlock("latest");
  return {
    number: blockNumber,
  };
}

export async function chartData(_obj?, _args?, _ctx?, _info?) {
  const data = {
    dayData: [],
    weeklyData: [],
    totalVolumeUSD: 0,
    totalVolumeETH: 0,
    totalUsage: 0,
    participationRate: 0,
    inflation: 0,
    activeTranscoderCount: 0,
    delegatorsCount: 0,
    oneDayVolumeUSD: 0,
    oneDayVolumeETH: 0,
    oneWeekVolumeUSD: 0,
    oneWeekVolumeETH: 0,
    oneWeekUsage: 0,
    oneDayUsage: 0,
    dailyUsageChange: 0,
    weeklyVolumeChangeUSD: 0,
    weeklyVolumeChangeETH: 0,
    weeklyUsageChange: 0,
    volumeChangeUSD: 0,
    volumeChangeETH: 0,
    participationRateChange: 0,
    inflationChange: 0,
    activeTranscoderCountChange: 0,
    delegatorsCountChange: 0,
  };

  let dayData = [];
  const weeklyData = [];
  let oneDayData = {
    totalVolumeUSD: 0,
    totalVolumeETH: 0,
    participationRate: 0,
    inflation: 0,
    activeTranscoderCount: 0,
    delegatorsCount: 0,
  };
  let twoDayData = {
    totalVolumeUSD: 0,
    totalVolumeETH: 0,
    participationRate: 0,
    inflation: 0,
    activeTranscoderCount: 0,
    delegatorsCount: 0,
  };

  // Date to price mapping used to calculate estimated usage
  // based on the Livepeer.com broadcaster's max price
  const pricePerPixel = [
    {
      startDate: 1577836800,
      endDate: 1616457600,
      price: 0.000000000000006, // (6000 wei)
    },
    {
      startDate: 1616457600,
      endDate: 1620201600,
      price: 0.000000000000003, // (3000 wei)
    },
    {
      startDate: 1620201600,
      endDate: 1621465200,
      price: 0.0000000000000006,
    }, // (600 wei),
    { startDate: 1621465200, endDate: Infinity, price: 0.0000000000000012 }, // (1200 wei)
  ];

  // the # of pixels in a minute of 240p30fps, 360p30fps, 480p30fps, 720p30fps transcoded renditions.
  // (width * height * framerate * seconds in a minute)
  const pixelsPerMinute = 2995488000;

  try {
    // get timestamps for the days
    const utcCurrentTime = dayjs();
    const utcOneDayBack = utcCurrentTime.subtract(1, "day").unix();
    const utcTwoDaysBack = utcCurrentTime.subtract(2, "day").unix();
    const utcOneWeekBack = utcCurrentTime.subtract(1, "week").unix();
    const utcTwoWeeksBack = utcCurrentTime.subtract(2, "week").unix();

    // get the blocks needed for time travel queries
    const [oneDayBlock, twoDayBlock, oneWeekBlock, twoWeekBlock] =
      await getBlocksFromTimestamps([
        utcOneDayBack,
        utcTwoDaysBack,
        utcOneWeekBack,
        utcTwoWeeksBack,
      ]);

    const getDayData = async () => {
      const result = await client.query({
        query: dayDataQuery,
        fetchPolicy: "network-only",
        variables: {
          first: 1000,
          orderBy: "date",
          orderDirection: "desc",
        },
      });
      return result;
    };

    const getProtocolData = async () => {
      const result = await client.query({
        query: protocolDataQuery,
        fetchPolicy: "network-only",
      });
      return result;
    };

    const getProtocolDataByBlock = async (_block) => {
      const result = await client.query({
        query: protocolDataByBlockQuery,
        fetchPolicy: "network-only",
        variables: {
          block: { number: _block },
        },
      });
      return result;
    };

    const dayDataResult = await getDayData();
    dayData = dayDataResult.data.days;

    let livepeerComDayData = [];
    let livepeerComOneDayData = [];
    let livepeerComTwoDaysData = [];
    let livepeerComOneWeekData = [];
    let livepeerComTwoWeekData = [];

    // No need to fetch usage data on testnets
    if (!IS_TESTNET) {
      const fromTime =
        process.env.NEXT_PUBLIC_NETWORK === "ARBITRUM_ONE"
          ? +new Date("February 16, 2022 00:00:00")
          : +new Date("2020, 0");
      livepeerComDayData = await getLivepeerComUsageData({
        fromTime,
        toTime: +new Date(),
      });
      livepeerComOneWeekData = await getLivepeerComUsageData({
        fromTime,
        toTime: utcOneWeekBack * 1000, // api uses milliseconds
      });
      livepeerComTwoWeekData = await getLivepeerComUsageData({
        fromTime,
        toTime: utcTwoWeeksBack * 1000, // api uses milliseconds
      });
      livepeerComOneDayData = await getLivepeerComUsageData({
        fromTime,
        toTime: utcOneDayBack * 1000, // api uses milliseconds
      });
      livepeerComTwoDaysData = await getLivepeerComUsageData({
        fromTime,
        toTime: utcTwoDaysBack * 1000, // api uses milliseconds
      });
    }

    let totalFeeDerivedMinutes = 0;
    let totalFeeDerivedMinutesOneDayAgo = 0;
    let totalFeeDerivedMinutesTwoDaysAgo = 0;
    let totalFeeDerivedMinutesOneWeekAgo = 0;
    let totalFeeDerivedMinutesTwoWeeksAgo = 0;
    let pricePerPixelIndex = pricePerPixel.length - 1;

    // merge in Livepeer.com usage data
    dayData = dayData.map((item) => {
      const found = livepeerComDayData.find(
        (element) => item.date === element.date
      );

      // if Livepeer.com's broadcaster changed max price, use updated price
      if (
        pricePerPixelIndex &&
        item.date < pricePerPixel[pricePerPixelIndex].startDate
      ) {
        pricePerPixelIndex--;
      }

      const feeDerivedMinutes = getTotalFeeDerivedMinutes({
        pricePerPixel: pricePerPixel[pricePerPixelIndex].price,
        totalVolumeETH: +item.volumeETH,
        totalVolumeUSD: +item.volumeUSD,
        pixelsPerMinute,
      });

      totalFeeDerivedMinutes += feeDerivedMinutes;

      if (item.date < utcOneDayBack) {
        totalFeeDerivedMinutesOneDayAgo += feeDerivedMinutes;
      }
      if (item.date < utcTwoDaysBack) {
        totalFeeDerivedMinutesTwoDaysAgo += feeDerivedMinutes;
      }

      if (item.date < utcOneWeekBack) {
        totalFeeDerivedMinutesOneWeekAgo += feeDerivedMinutes;
      }
      if (item.date < utcTwoWeeksBack) {
        totalFeeDerivedMinutesTwoWeeksAgo += feeDerivedMinutes;
      }

      // combine Livepeer.com minutes with minutes calculated via fee volume
      const minutes =
        (found?.sourceSegmentsDuration ?? 0) / 60 + feeDerivedMinutes;
      return { ...item, ...found, minutes };
    });

    // get total Livepeer.com aggregate usage
    const totalLivepeerComUsage = livepeerComDayData.reduce((x, y) => {
      return x + y.sourceSegmentsDuration / 60;
    }, 0);

    const totalLivepeerComUsageOneWeekAgo = livepeerComOneWeekData.reduce(
      (x, y) => {
        return x + y.sourceSegmentsDuration / 60;
      },
      0
    );

    const totalLivepeerComUsageTwoWeeksAgo = livepeerComTwoWeekData.reduce(
      (x, y) => {
        return x + y.sourceSegmentsDuration / 60;
      },
      0
    );

    const totalLivepeerComUsageOneDayAgo = livepeerComOneDayData.reduce(
      (x, y) => {
        return x + y.sourceSegmentsDuration / 60;
      },
      0
    );

    const totalLivepeerComUsageTwoDaysAgo = livepeerComTwoDaysData.reduce(
      (x, y) => {
        return x + y.sourceSegmentsDuration / 60;
      },
      0
    );

    // fetch the historical data
    const protocolDataResult = await getProtocolData();
    data.totalVolumeUSD = +protocolDataResult.data.protocol.totalVolumeUSD;
    data.totalVolumeETH = +protocolDataResult.data.protocol.totalVolumeETH;
    data.participationRate =
      +protocolDataResult.data.protocol.participationRate;
    data.inflation = +protocolDataResult.data.protocol.inflation;
    data.activeTranscoderCount =
      +protocolDataResult.data.protocol.activeTranscoderCount;
    data.delegatorsCount = +protocolDataResult.data.protocol.delegatorsCount;

    const oneDayResult = await getProtocolDataByBlock(oneDayBlock);
    oneDayData = oneDayResult.data.protocol;

    const twoDayResult = await getProtocolDataByBlock(twoDayBlock);
    twoDayData = twoDayResult.data.protocol;

    const oneWeekResult = await getProtocolDataByBlock(oneWeekBlock);
    const oneWeekData = oneWeekResult.data.protocol;

    const twoWeekResult = await getProtocolDataByBlock(twoWeekBlock);
    const twoWeekData = twoWeekResult.data.protocol;

    const [oneDayVolumeUSD, volumeChangeUSD] = getTwoPeriodPercentChange(
      +data.totalVolumeUSD,
      +oneDayData?.totalVolumeUSD,
      +twoDayData?.totalVolumeUSD
    );

    const [oneDayVolumeETH, volumeChangeETH] = getTwoPeriodPercentChange(
      +data?.totalVolumeETH,
      +oneDayData?.totalVolumeETH,
      +twoDayData?.totalVolumeETH
    );

    const [oneWeekVolumeUSD, weeklyVolumeChangeUSD] = getTwoPeriodPercentChange(
      +data?.totalVolumeUSD,
      oneWeekData?.totalVolumeUSD ? +oneWeekData?.totalVolumeUSD : 0,
      twoWeekData?.totalVolumeUSD ? +twoWeekData?.totalVolumeUSD : 0
    );

    const [oneWeekVolumeETH, weeklyVolumeChangeETH] = getTwoPeriodPercentChange(
      +data?.totalVolumeETH,
      oneWeekData?.totalVolumeETH ? +oneWeekData?.totalVolumeETH : 0,
      twoWeekData?.totalVolumeETH ? +twoWeekData?.totalVolumeETH : 0
    );

    const [oneWeekUsage, weeklyUsageChange] = getTwoPeriodPercentChange(
      totalLivepeerComUsage + totalFeeDerivedMinutes,
      totalLivepeerComUsageOneWeekAgo + totalFeeDerivedMinutesOneWeekAgo,
      totalLivepeerComUsageTwoWeeksAgo + totalFeeDerivedMinutesTwoWeeksAgo
    );

    const [oneDayUsage, dailyUsageChange] = getTwoPeriodPercentChange(
      totalLivepeerComUsage + totalFeeDerivedMinutes,
      totalLivepeerComUsageOneDayAgo + totalFeeDerivedMinutesOneDayAgo,
      totalLivepeerComUsageTwoDaysAgo + totalFeeDerivedMinutesTwoDaysAgo
    );

    // format the total participation change
    const participationRateChange = getPercentChange(
      data?.participationRate,
      oneDayData?.participationRate
    );
    const inflationChange = getPercentChange(
      data?.inflation,
      oneDayData?.inflation
    );
    const activeTranscoderCountChange = getPercentChange(
      data?.activeTranscoderCount,
      oneDayData?.activeTranscoderCount
    );
    const delegatorsCountChange = getPercentChange(
      data?.delegatorsCount,
      oneDayData?.delegatorsCount
    );

    // format weekly data for weekly sized chunks
    const weeklySizedChunks = [...dayData].sort((a, b) =>
      parseInt(a.date) > parseInt(b.date) ? 1 : -1
    );
    let startIndexWeekly = -1;
    let currentWeek = -1;

    for (const weeklySizedChunk of weeklySizedChunks) {
      const week = dayjs.utc(dayjs.unix(weeklySizedChunk.date)).week();
      if (week !== currentWeek) {
        currentWeek = week;
        startIndexWeekly++;
      }
      weeklyData[startIndexWeekly] = weeklyData[startIndexWeekly] || {};
      weeklyData[startIndexWeekly].date = weeklySizedChunk.date;
      weeklyData[startIndexWeekly].weeklyVolumeUSD =
        (weeklyData[startIndexWeekly].weeklyVolumeUSD ?? 0) +
        +weeklySizedChunk.volumeUSD;
      weeklyData[startIndexWeekly].weeklyUsageMinutes =
        (weeklyData[startIndexWeekly].weeklyUsageMinutes ?? 0) +
        weeklySizedChunk.minutes;
    }

    // add relevant fields with the calculated amounts
    data.dayData = [...dayData].reverse();
    data.weeklyData = weeklyData;
    data.oneDayVolumeUSD = oneDayVolumeUSD;
    data.oneDayVolumeETH = oneDayVolumeETH;
    data.oneWeekVolumeUSD = oneWeekVolumeUSD;
    data.oneWeekVolumeETH = oneWeekVolumeETH;
    data.totalUsage = totalFeeDerivedMinutes + totalLivepeerComUsage;
    data.oneDayUsage = totalFeeDerivedMinutes ? oneDayUsage : 0;
    data.oneWeekUsage = totalFeeDerivedMinutes ? oneWeekUsage : 0;
    data.dailyUsageChange = totalFeeDerivedMinutes ? dailyUsageChange : 0;
    data.weeklyUsageChange = totalFeeDerivedMinutes ? weeklyUsageChange : 0;
    data.weeklyVolumeChangeUSD = weeklyVolumeChangeUSD;
    data.weeklyVolumeChangeETH = weeklyVolumeChangeETH;
    data.volumeChangeUSD = volumeChangeUSD;
    data.volumeChangeETH = volumeChangeETH;
    data.participationRateChange = participationRateChange;
    data.inflationChange = inflationChange;
    data.delegatorsCountChange = delegatorsCountChange;
    data.activeTranscoderCountChange = activeTranscoderCountChange;

    if (
      Number(
        data?.dayData?.[(data?.dayData?.length ?? 1) - 1]?.activeTranscoderCount
      ) <= 0
    ) {
      data.dayData = data.dayData.slice(0, -1);
    }
  } catch (e) {
    console.log(e);
  }
  return data;
}
