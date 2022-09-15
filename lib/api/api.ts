const cacheControlValues = {
  revalidate: {
    maxAge: 0,
    swr: 10,
  },
  second: {
    maxAge: 10,
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
} as const;

export const getCacheControlHeader = (
  type: keyof typeof cacheControlValues
) => {
  return `public, s-maxage=${cacheControlValues[type].maxAge}, stale-while-revalidate=${cacheControlValues[type].swr}`;
};

export const isValidAddress = (
  address: string | string[] | null | undefined
): address is string => typeof address === "string" && address.length === 42;
