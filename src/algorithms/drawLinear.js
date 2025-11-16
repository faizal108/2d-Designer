export function drawLinear(ctx, points, worldToCanvas) {
  if (!points.length) return;

  ctx.lineWidth = 2;
  ctx.strokeStyle = "#2980b9";
  ctx.beginPath();

  points.forEach((p, i) => {
    const c = worldToCanvas(p.x, p.y);
    if (i === 0) ctx.moveTo(c.x, c.y);
    else ctx.lineTo(c.x, c.y);
  });

  ctx.stroke();
}
