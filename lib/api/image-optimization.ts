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
  const { width = 96, height = 96, quality = 75, effort = 6 } = options;

  const originalSize = imageBuffer.byteLength;
  const originalBuffer = Buffer.from(imageBuffer);

  // Get original image metadata
  let originalMetadata;
  try {
    originalMetadata = await sharp(originalBuffer).metadata();
  } catch {
    // Metadata extraction failed, but we can still proceed with optimization
    originalMetadata = undefined;
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
  } catch {
    // Fallback to original image if optimization fails
    // This is expected for some edge cases (unsupported formats, corrupted images, etc.
    // Return original image as fallback
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
