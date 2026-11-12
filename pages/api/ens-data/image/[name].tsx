import { getCacheControlHeader } from "@lib/api/api";
import {
  internalError,
  methodNotAllowed,
  notFound,
  validateInput,
} from "@lib/api/errors";
import { EnsNameSchema } from "@lib/api/schemas";
import { NextApiRequest, NextApiResponse } from "next";
import sharp from "sharp";

const MAX_AVATAR_BYTES = 5 * 1024 * 1024;
const AVATAR_TIMEOUT_MS = 10_000;
// Avatars render at 70px at most, so 160px stays sharp on high-density screens.
const AVATAR_SIZE_PX = 160;
// Bounds the work a small but highly compressible image can cause. The pixel
// limit applies per frame, so the timeout also covers long animations.
const MAX_AVATAR_INPUT_PIXELS = 4096 * 4096;
const RESIZE_TIMEOUT_SECONDS = 5;

/**
 * Shrinks a raster avatar to AVATAR_SIZE_PX square WebP, keeping animation.
 * Returns null when the original should be served as is: SVGs (vector, and
 * would rasterise at their intrinsic size), images Sharp cannot decode or that
 * exceed the pixel or time limits, and images that would not get smaller.
 */
const resizeAvatar = async (
  image: Buffer,
  contentType: string
): Promise<Buffer | null> => {
  if (contentType === "image/svg+xml") return null;

  try {
    const resized = await sharp(image, {
      animated: true,
      limitInputPixels: MAX_AVATAR_INPUT_PIXELS,
    })
      // Re-encoding drops EXIF, so apply its orientation to the pixels first.
      .autoOrient()
      .timeout({ seconds: RESIZE_TIMEOUT_SECONDS })
      .resize(AVATAR_SIZE_PX, AVATAR_SIZE_PX, {
        fit: "cover",
        withoutEnlargement: true,
      })
      .webp({ quality: 80 })
      .toBuffer();
    return resized.length < image.length ? resized : null;
  } catch {
    return null;
  }
};

const handler = async (
  req: NextApiRequest,
  res: NextApiResponse<ArrayBuffer | null>
) => {
  try {
    const method = req.method;

    if (method === "GET") {
      const { name } = req.query;

      const nameResult = EnsNameSchema.safeParse(name);
      if (nameResult.success) {
        try {
          const normalizedName = nameResult.data;
          // getEnsAvatar fetches owner-set URLs before returning them.
          const avatarUrl = new URL(
            `/mainnet/avatar/${encodeURIComponent(normalizedName)}`,
            "https://metadata.ens.domains"
          );
          const response = await fetch(avatarUrl, {
            redirect: "error",
            signal: AbortSignal.timeout(AVATAR_TIMEOUT_MS),
          });

          const contentType = response.headers
            .get("content-type")
            ?.split(";")[0]
            .trim()
            .toLowerCase();
          const contentLength = Number(response.headers.get("content-length"));
          if (
            !response.ok ||
            !contentType?.startsWith("image/") ||
            contentLength > MAX_AVATAR_BYTES ||
            !response.body
          ) {
            return notFound(res, "ENS avatar not found");
          }

          const reader = response.body.getReader();
          const chunks: Buffer[] = [];
          let totalBytes = 0;
          try {
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;

              totalBytes += value.byteLength;
              if (totalBytes > MAX_AVATAR_BYTES) {
                await reader.cancel();
                return notFound(res, "ENS avatar not found");
              }
              chunks.push(Buffer.from(value));
            }
          } finally {
            reader.releaseLock();
          }

          const original = Buffer.concat(chunks, totalBytes);
          const resized = await resizeAvatar(original, contentType);

          res.setHeader("Content-Type", resized ? "image/webp" : contentType);
          res.setHeader("X-Content-Type-Options", "nosniff");
          res.setHeader(
            "Content-Security-Policy",
            "default-src 'none'; sandbox"
          );
          res.setHeader("Cache-Control", getCacheControlHeader("week"));

          return res.end(resized ?? original);
        } catch (e) {
          console.error(e);
          return notFound(res, "ENS avatar not found");
        }
      } else {
        return validateInput(nameResult, res, "Invalid ENS name");
      }
    }

    return methodNotAllowed(res, method ?? "unknown", ["GET"]);
  } catch (err) {
    return internalError(res, err);
  }
};

export default handler;
