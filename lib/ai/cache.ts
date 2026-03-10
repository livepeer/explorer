import { Index } from "@upstash/vector";

let vectorIndex: Index | null = null;

function getVectorIndex(): Index | null {
  if (vectorIndex) return vectorIndex;

  const url = process.env.UPSTASH_VECTOR_REST_URL;
  const token = process.env.UPSTASH_VECTOR_REST_TOKEN;

  if (!url || !token) return null;

  vectorIndex = new Index({ url, token });
  return vectorIndex;
}

const CACHE_TTL_SECONDS = 300; // 5 minutes
const SIMILARITY_THRESHOLD = 0.95;

export async function getCachedResponse(
  question: string
): Promise<string | null> {
  const index = getVectorIndex();
  if (!index) return null;

  try {
    const results = await index.query({
      data: question,
      topK: 1,
      includeMetadata: true,
    });

    if (
      results.length > 0 &&
      results[0].score >= SIMILARITY_THRESHOLD &&
      results[0].metadata
    ) {
      const cached = results[0].metadata as { response: string; ts: number };
      const age = (Date.now() - cached.ts) / 1000;
      if (age < CACHE_TTL_SECONDS) {
        return cached.response;
      }
    }

    return null;
  } catch {
    return null;
  }
}

export async function setCachedResponse(
  question: string,
  response: string
): Promise<void> {
  const index = getVectorIndex();
  if (!index) return;

  try {
    await index.upsert({
      id: `chat-${Date.now()}`,
      data: question,
      metadata: { response, ts: Date.now() },
    });
  } catch {
    // Caching is best-effort
  }
}
