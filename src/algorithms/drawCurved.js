// src/algorithms/drawCurved.js
// level: 0 = none (fallback to linear), 1 = light Chaikin, 2 = stronger Chaikin,
// 3 = Catmull-Rom interpolation, 4 = heavy smoothing (multiple Chaikin passes)

function clonePoint(p) {
  return {
    x: Number(p.x),
    y: Number(p.y),
    ...(p.z !== undefined ? { z: p.z } : {}),
  };
}

/* Chaikin subdivision: simple corner-cutting smoothing.
   iterations: integer >=1  */
export function chaikin(points, iterations = 1) {
  if (!points || points.length < 2) return points.slice();
  let pts = points.map(clonePoint);
  for (let iter = 0; iter < iterations; iter++) {
    const next = [];
    next.push(pts[0]); // keep endpoints to preserve shape (optional)
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i];
      const p1 = pts[i + 1];
      const q = { x: 0.75 * p0.x + 0.25 * p1.x, y: 0.75 * p0.y + 0.25 * p1.y };
      const r = { x: 0.25 * p0.x + 0.75 * p1.x, y: 0.25 * p0.y + 0.75 * p1.y };
      next.push(q);
      next.push(r);
    }
    next.push(pts[pts.length - 1]);
    pts = next;
  }
  return pts;
}

/* Catmull-Rom spline interpolation.
   segmentsPerCurve: how many interpolated points between input points (>=1)
   Returns array of points (interpolated). Keeps endpoints.
*/
export function catmullRom(points, segmentsPerCurve = 8) {
  if (!points || points.length < 2) return points.map(clonePoint);
  // pad endpoints for proper tangents
  const pts = points.map(clonePoint);
  const out = [];
  for (let i = 0; i < pts.length - 1; i++) {
    // For endpoints use duplicated neighbors
    const p0 = i === 0 ? pts[i] : pts[i - 1];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = i + 2 < pts.length ? pts[i + 2] : pts[i + 1];

    // Add first point of segment
    if (i === 0) out.push({ x: p1.x, y: p1.y });

    for (let s = 1; s <= segmentsPerCurve; s++) {
      const t = s / (segmentsPerCurve + 1);
      // Catmull-Rom basis
      const t2 = t * t;
      const t3 = t2 * t;

      const a0 = -0.5 * t3 + t2 - 0.5 * t;
      const a1 = 1.5 * t3 - 2.5 * t2 + 1.0;
      const a2 = -1.5 * t3 + 2.0 * t2 + 0.5 * t;
      const a3 = 0.5 * t3 - 0.5 * t2;

      const x = a0 * p0.x + a1 * p1.x + a2 * p2.x + a3 * p3.x;
      const y = a0 * p0.y + a1 * p1.y + a2 * p2.y + a3 * p3.y;
      out.push({ x, y });
    }
    // push p2 (the segment end) on next iteration start. We'll push last endpoint at end.
    out.push({ x: p2.x, y: p2.y });
  }
  return out;
}

/* Simple bezierFit: here we approximate by performing several Chaikin passes,
   which gives a Bezier-like smooth curve. For a more rigorous bezier fitting
   you'd use an optimization library; this is fast and visually good. */
export function bezierApprox(points, passes = 3) {
  if (!points || points.length < 2) return points.map(clonePoint);
  let out = points.map(clonePoint);
  for (let i = 0; i < passes; i++) out = chaikin(out, 1);
  return out;
}

/* drawCurved: picks smoothing technique based on level */
export function drawCurved(ctx, points, worldToCanvas, level = 1) {
  if (!points || points.length < 2) return;

  // Choose smoothing based on level
  let smooth = points.map(clonePoint);

  if (level <= 0) {
    // fallback to linear
    smooth = points.map(clonePoint);
  } else if (level === 1) {
    smooth = chaikin(points, 1);
  } else if (level === 2) {
    smooth = chaikin(points, 2);
  } else if (level === 3) {
    smooth = catmullRom(points, 10); // more segments => smoother
  } else {
    // level >=4
    smooth = bezierApprox(points, 3); // heavy smoothing
  }

  // draw the smooth polyline
  ctx.beginPath();
  for (let i = 0; i < smooth.length; i++) {
    const p = smooth[i];
    const c = worldToCanvas(p.x, p.y);
    if (i === 0) ctx.moveTo(c.x, c.y);
    else ctx.lineTo(c.x, c.y);
  }
  ctx.stroke();
}
