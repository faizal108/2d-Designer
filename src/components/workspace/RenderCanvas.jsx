import { drawLinear } from "../../algorithms/drawLinear";
import { drawCurved } from "../../algorithms/drawCurved";
import { detectCurves } from "../../algorithms/curveDetection";

export function renderScene(ctx, points, worldToCanvas, options) {
  const { showGrid, gridFn, showPoints, algorithm } = options;

  if (showGrid) gridFn();

  if (!points.length) return;

  // Choose algorithm
  if (algorithm === "linear") {
    drawLinear(ctx, points, worldToCanvas);
  } else if (algorithm === "curved") {
    const smooth = detectCurves(points);
    drawCurved(ctx, smooth, worldToCanvas);
  } else if (algorithm === "compare") {
    // Linear BLUE
    ctx.globalAlpha = 0.6;
    ctx.strokeStyle = "#4ea5ff";
    drawLinear(ctx, points, worldToCanvas);

    // Curved GREEN
    ctx.globalAlpha = 0.9;
    ctx.strokeStyle = "#10b981";
    const smooth = detectCurves(points);
    drawCurved(ctx, smooth, worldToCanvas);

    ctx.globalAlpha = 1;
  }

  // Points
  if (showPoints) {
    ctx.fillStyle = "#e74c3c";
    points.forEach((p) => {
      const c = worldToCanvas(p.x, p.y);
      ctx.beginPath();
      ctx.arc(c.x, c.y, 4, 0, Math.PI * 2);
      ctx.fill();
    });
  }
}
