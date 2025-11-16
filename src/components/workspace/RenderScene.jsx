// src/components/workspace/RenderScene.jsx
import { drawLinear } from "../../algorithms/drawLinear";
import { drawCurved } from "../../algorithms/drawCurved";
import { detectCurves } from "../../algorithms/curveDetection";

/**
 * renderScene
 * ctx            - CanvasRenderingContext2D
 * points         - array of {x,y,...}
 * worldToCanvas  - function(wx,wy) => { x, y }  (returns screen coords)
 * options        - { showGrid, showPoints, algorithm, gridFn, curveLevel }
 */
export function renderScene(ctx, points, worldToCanvas, options = {}) {
  const {
    showGrid = true,
    showPoints = true,
    algorithm = "linear",
    gridFn = () => {},
    curveLevel = 1,
  } = options;

  // draw grid if requested (gridFn should use worldToCanvas internally)
  if (showGrid && typeof gridFn === "function") {
    gridFn();
  }

  if (!points || points.length === 0) return;

  // choose algorithm and draw
  if (algorithm === "linear") {
    // linear = blue
    ctx.save();
    ctx.globalAlpha = 1.0;
    ctx.strokeStyle = "#4ea5ff";
    drawLinear(ctx, points, worldToCanvas);
    ctx.restore();
  } else if (algorithm === "curved") {
    // curved = green (uses smoothing level)
    ctx.save();
    ctx.globalAlpha = 1.0;
    ctx.strokeStyle = "#10b981";
    drawCurved(ctx, points, worldToCanvas, curveLevel);
    ctx.restore();
  } else if (algorithm === "compare") {
    // compare mode: show linear and curved overlays with different colors/alphas
    // Linear (blue, semi)
    ctx.save();
    ctx.globalAlpha = 0.55;
    ctx.strokeStyle = "#4ea5ff";
    drawLinear(ctx, points, worldToCanvas);
    ctx.restore();

    // Curved (green, stronger)
    ctx.save();
    ctx.globalAlpha = 0.9;
    ctx.strokeStyle = "#10b981";
    drawCurved(ctx, points, worldToCanvas, curveLevel);
    ctx.restore();
  } else {
    // fallback: draw linear
    ctx.save();
    ctx.globalAlpha = 1.0;
    ctx.strokeStyle = "#4ea5ff";
    drawLinear(ctx, points, worldToCanvas);
    ctx.restore();
  }

  // draw points overlay if requested
  if (showPoints) {
    ctx.save();
    ctx.fillStyle = "#f97316"; // orange-ish
    for (const p of points) {
      const c = worldToCanvas(p.x, p.y);
      ctx.beginPath();
      ctx.arc(c.x, c.y, 4, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
}
