const cacheControlValues = {
  revalidate: {
    maxAge: 0,
    swr: 10,
  },
  second: {
    maxAge: 10,
    swr: 60,
  },
  minute: {
    maxAge: 60,
    swr: 60,
  },
  hour: {
    maxAge: 3600,
    swr: 3600 * 2,
  },
  day: {
    maxAge: 86400,
    swr: 86400 * 7,
  },
  week: {
    maxAge: 86400 * 7,
    swr: 86400 * 14,
  },
} as const;

export const getCacheControlHeader = (
  type: keyof typeof cacheControlValues
) => {
  const randomJitterValue = Number(
    (Math.random() * (type === "day" ? 3600 : 600)).toFixed(0)
  );

  return `public, s-maxage=${
    cacheControlValues[type].maxAge +
    (type === "day" || type === "hour" ? randomJitterValue : 0)
  }, stale-while-revalidate=${cacheControlValues[type].swr}`;
};
