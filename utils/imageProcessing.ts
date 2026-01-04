import { BoundingBox } from "../types";

/**
 * Applies a tactical pixelation effect to sensitive regions.
 * Replaces Gaussian blur with clear, distinct pixel blocks.
 * @param intensity Value from 0 to 100
 */
export const blurImageRegions = (
  imageUrl: string,
  boxes: BoundingBox[],
  intensity: number = 100
): Promise<string> => {
  return new Promise((resolve) => {
    if (intensity <= 0) return resolve(imageUrl);

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return resolve(imageUrl);

      canvas.width = img.width;
      canvas.height = img.height;

      // Draw original image
      ctx.drawImage(img, 0, 0);

      const normalizedIntensity = intensity / 100;

      boxes.forEach(box => {
        const x = (box.xmin / 1000) * img.width;
        const y = (box.ymin / 1000) * img.height;
        const width = ((box.xmax - box.xmin) / 1000) * img.width;
        const height = ((box.ymax - box.ymin) / 1000) * img.height;

        if (width <= 5 || height <= 5) return;

        ctx.save();
        
        // Pixelation logic:
        // We scale down the region and then scale it back up with smoothing disabled.
        // A scale of 0.05 means 20x20 pixel blocks approximately.
        const pixelScale = 0.05 + (1 - normalizedIntensity) * 0.5; 
        
        const smallCanvas = document.createElement('canvas');
        smallCanvas.width = Math.max(1, width * pixelScale);
        smallCanvas.height = Math.max(1, height * pixelScale);
        const smallCtx = smallCanvas.getContext('2d');
        
        if (smallCtx) {
          smallCtx.drawImage(img, x, y, width, height, 0, 0, smallCanvas.width, smallCanvas.height);

          ctx.beginPath();
          ctx.rect(x, y, width, height);
          ctx.clip();

          ctx.imageSmoothingEnabled = false;
          ctx.drawImage(smallCanvas, 0, 0, smallCanvas.width, smallCanvas.height, x, y, width, height);
          
          // Subtle tactical overlay instead of dark wash
          ctx.fillStyle = `rgba(234, 179, 8, 0.1)`; // Hint of yellow
          ctx.fillRect(x, y, width, height);
          
          // Tactical scanlines over pixelated area
          ctx.strokeStyle = `rgba(234, 179, 8, 0.2)`;
          ctx.lineWidth = 1;
          for (let lineY = y; lineY < y + height; lineY += 4) {
            ctx.beginPath();
            ctx.moveTo(x, lineY);
            ctx.lineTo(x + width, lineY);
            ctx.stroke();
          }

          // Security Label
          if (width > 40 && height > 20) {
            ctx.fillStyle = `rgba(234, 179, 8, 0.8)`;
            ctx.font = `bold ${Math.min(width * 0.15, 12)}px Inter`;
            ctx.textAlign = 'center';
            ctx.fillText('CENSORED', x + width / 2, y + height - 5);
          }
        }
        
        ctx.restore();
      });

      resolve(canvas.toDataURL('image/jpeg', 0.8));
    };
    img.onerror = () => resolve(imageUrl);
    img.src = imageUrl;
  });
};