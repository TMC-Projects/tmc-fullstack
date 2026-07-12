import imageCompression from 'browser-image-compression';

/**
 * Compresses an image to a maximum of 500KB and converts it to WebP format.
 * @param file The original image file
 * @returns A Promise that resolves to the compressed WebP file
 */
export const compressImageToWebp = async (file: File): Promise<File> => {
  const options = {
    maxSizeMB: 0.5, // 500KB
    maxWidthOrHeight: 1920, // Optional: Resize to max 1920px
    useWebWorker: true,
    fileType: 'image/webp' as string, // Force WebP format
  };

  try {
    const compressedBlob = await imageCompression(file, options);
    // Convert Blob to File to maintain compatibility with existing upload logic
    const compressedFile = new File(
      [compressedBlob],
      file.name.replace(/\.[^/.]+$/, "") + ".webp",
      { type: 'image/webp' }
    );
    return compressedFile;
  } catch (error) {
    console.error('Error compressing image:', error);
    throw error;
  }
};
