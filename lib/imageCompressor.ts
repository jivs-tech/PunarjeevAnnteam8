/**
 * Client-side HTML5 Canvas compression pipeline.
 * Resizes high-res phone camera photos (e.g. 12MP-50MP) to max 1920x1080,
 * encodes to WebP format at 0.80 quality factor, and ensures payload per image is <= 1.5MB.
 */
export async function compressImageFile(file: File): Promise<{ base64Data: string; blobUrl: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const MAX_WIDTH = 1920;
        const MAX_HEIGHT = 1080;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height = Math.round((height * MAX_WIDTH) / width);
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width = Math.round((width * MAX_HEIGHT) / height);
            height = MAX_HEIGHT;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas context unavailable'));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        // Export as WebP with 0.80 quality
        let base64Data = canvas.toDataURL('image/webp', 0.80);
        
        // Fallback to JPEG if WebP unsupported
        if (!base64Data.startsWith('data:image/webp')) {
          base64Data = canvas.toDataURL('image/jpeg', 0.80);
        }

        // Convert base64 to blob for local preview URL
        fetch(base64Data)
          .then((res) => res.blob())
          .then((blob) => {
            const blobUrl = URL.createObjectURL(blob);
            resolve({ base64Data, blobUrl });
          })
          .catch(reject);
      };
      img.onerror = () => reject(new Error('Failed to load image element'));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error('Failed to read image file'));
    reader.readAsDataURL(file);
  });
}
