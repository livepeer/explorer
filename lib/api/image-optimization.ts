import sharp from "sharp";

export interface OptimizeImageResult {
  buffer: Buffer;
  contentType: string;
  originalSize: number;
  optimizedSize: number;
  originalDimensions?: { width: number; height: number };
  optimizedDimensions?: { width: number; height: number };
  format?: string;
}

export interface OptimizeImageOptions {
  width?: number;
  height?: number;
  quality?: number;
  effort?: number;
  logName?: string;
}

/**
 * Optimizes an image by resizing and converting to WebP format
 * @param imageBuffer - The original image buffer
 * @param options - Optimization options
 * @returns Optimized image buffer and metadata, or original buffer if optimization fails
 */
export async function optimizeImage(
  imageBuffer: ArrayBuffer,
  options: OptimizeImageOptions = {}
): Promise<OptimizeImageResult> {
  const {
    width = 96,
    height = 96,
    quality = 75,
    effort = 6,
    logName = "image",
  } = options;

  const originalSize = imageBuffer.byteLength;
  const originalBuffer = Buffer.from(imageBuffer);

  // Get original image metadata
  let originalMetadata;
  try {
    originalMetadata = await sharp(originalBuffer).metadata();
    console.log(`[Image Opt] Processing ${logName}`);
    console.log(
      `[Image Opt] Original: ${originalMetadata.width}x${originalMetadata.height}px, ${(originalSize / 1024).toFixed(1)}KB, format: ${originalMetadata.format}`
    );
  } catch {
    console.log(
      `[Image Opt] Processing ${logName}, original size: ${(originalSize / 1024).toFixed(1)}KB (metadata unavailable)`
    );
  }

  // Optimize image: resize and convert to WebP
  try {
    const optimizedBuffer = await sharp(originalBuffer)
      .resize(width, height, {
        fit: "cover",
        withoutEnlargement: true, // Don't upscale small images
      })
      .webp({ quality, effort })
      .toBuffer();

    const optimizedMetadata = await sharp(optimizedBuffer).metadata();
    const reduction = (
      (1 - optimizedBuffer.length / originalSize) *
      100
    ).toFixed(1);

    console.log(`[Image Opt] ✅ Success! ${logName}`);
    console.log(
      `[Image Opt] Optimized: ${optimizedMetadata.width}x${optimizedMetadata.height}px, ${(optimizedBuffer.length / 1024).toFixed(1)}KB, format: ${optimizedMetadata.format}`
    );
    console.log(
      `[Image Opt] Size reduction: ${(originalSize / 1024).toFixed(1)}KB → ${(optimizedBuffer.length / 1024).toFixed(1)}KB (${reduction}% smaller)`
    );

    return {
      buffer: optimizedBuffer,
      contentType: "image/webp",
      originalSize,
      optimizedSize: optimizedBuffer.length,
      originalDimensions: originalMetadata
        ? {
            width: originalMetadata.width || 0,
            height: originalMetadata.height || 0,
          }
        : undefined,
      optimizedDimensions: optimizedMetadata
        ? {
            width: optimizedMetadata.width || 0,
            height: optimizedMetadata.height || 0,
          }
        : undefined,
      format: optimizedMetadata?.format,
    };
  } catch (error) {
    // Fallback to original image if optimization fails
    console.error(`[Image Opt] ❌ Failed for ${logName}:`, error);
    if (error instanceof Error) {
      console.error(`[Image Opt] Error message: ${error.message}`);
      console.error(`[Image Opt] Error stack: ${error.stack}`);
    }

    return {
      buffer: originalBuffer,
      contentType: "image/jpeg", // Default fallback
      originalSize,
      optimizedSize: originalSize,
      originalDimensions: originalMetadata
        ? {
            width: originalMetadata.width || 0,
            height: originalMetadata.height || 0,
          }
        : undefined,
    };
  }
}

