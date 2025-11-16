export function drawCurved(ctx, points, worldToCanvas) {
  if (points.length < 3) return;

  ctx.lineWidth = 2;
  ctx.strokeStyle = "#10b981";
  ctx.beginPath();

  const toCanvas = (i) => {
    const p = points[i];
    return worldToCanvas(p.x, p.y);
  };

  // Start
  let p0 = toCanvas(0);
  ctx.moveTo(p0.x, p0.y);

  for (let i = 1; i < points.length - 2; i++) {
    let p1 = toCanvas(i);
    let p2 = toCanvas(i + 1);

    const cx = (p1.x + p2.x) / 2;
    const cy = (p1.y + p2.y) / 2;

    ctx.quadraticCurveTo(p1.x, p1.y, cx, cy);
  }

  // Last segment
  let p_last_1 = toCanvas(points.length - 2);
  let p_last = toCanvas(points.length - 1);
  ctx.quadraticCurveTo(p_last_1.x, p_last_1.y, p_last.x, p_last.y);

  ctx.stroke();
}
