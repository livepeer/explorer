import pino, { transport } from "pino";

const isProd = process.env.NODE_ENV === "production";

if (isProd && !process.env.LOGTAIL_SOURCE_TOKEN) {
  throw new Error(
    "LOGTAIL_SOURCE_TOKEN is required in production for Logtail transport"
  );
}

if (isProd && !process.env.LOGTAIL_INGESTION_SOURCE) {
  throw new Error(
    "LOGTAIL_INGESTION_SOURCE is required in production for Logtail transport"
  );
}

export const logger = isProd
  ? pino(
      transport({
        target: "@logtail/pino",
        options: {
          sourceToken: process.env.LOGTAIL_SOURCE_TOKEN,
          options: {
            endpoint: `https://${process.env.LOGTAIL_INGESTION_SOURCE}`,
          },
        },
      })
    )
  : pino({
      transport: {
        target: "pino-pretty",
        options: {
          colorize: true,
          translateTime: "yyyy-mm-dd HH:MM:ss.l",
          ignore: "pid,hostname",
        },
      },
    });
