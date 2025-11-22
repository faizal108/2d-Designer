// src/utils/exportImage.js

/**
 * exportCanvasAsPNG(sourceCanvas, opts)
 * - sourceCanvas: HTMLCanvasElement
 * - opts: { background: "#ffffff", scale: 1.0 }
 * returns: Promise<Blob>
 */
export async function exportCanvasAsPNG(sourceCanvas, opts = {}) {
  const { background = "#ffffff", scale = 1 } = opts;
  const w = Math.round(sourceCanvas.width * scale);
  const h = Math.round(sourceCanvas.height * scale);

  // create an offscreen canvas
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const ctx = c.getContext("2d");

  // fill with background color
  ctx.fillStyle = background;
  ctx.fillRect(0, 0, w, h);

  // draw source onto it (drawImage will respect devicePixelRatio if the source is high-dpi)
  ctx.drawImage(sourceCanvas, 0, 0, w, h);

  return new Promise((resolve, reject) => {
    c.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("Failed to produce PNG blob"));
    }, "image/png");
  });
}
