import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

let ratelimit: Ratelimit | null = null;

function getRatelimit(): Ratelimit | null {
  if (ratelimit) return ratelimit;

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) return null;

  ratelimit = new Ratelimit({
    redis: new Redis({ url, token }),
    limiter: Ratelimit.slidingWindow(20, "1 m"),
    analytics: false,
  });

  return ratelimit;
}

export async function checkRateLimit(
  ip: string
): Promise<{ allowed: boolean; remaining: number }> {
  const limiter = getRatelimit();
  if (!limiter) return { allowed: true, remaining: 20 };

  const { success, remaining } = await limiter.limit(ip);
  return { allowed: success, remaining };
}
