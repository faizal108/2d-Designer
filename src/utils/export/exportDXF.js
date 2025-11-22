// src/utils/exportDXF.js

/**
 * generateDXF(points, opts)
 * - points: [{x, y, z?}, ...] in drawing units (we assume mm)
 * - opts: { version: "AC1021", unitName: "MM" }
 *
 * Produces a string with a minimal DXF file containing LWPOLYLINE
 * Good for importing into CAD apps that accept LWPOLYLINE (most do).
 */
export function generateDXF(points, opts = {}) {
  const { version = "AC1021", unitName = "MM" } = opts;

  // DXF header (minimal)
  const lines = [];

  // header section
  lines.push("  0");
  lines.push("SECTION");
  lines.push("  2");
  lines.push("HEADER");
  // ACAD version code
  lines.push("  9");
  lines.push("$ACADVER");
  lines.push("  1");
  lines.push(version);

  // units (we'll write as a comment variable; real DXF units require $INSUNITS)
  lines.push("  9");
  lines.push("$INSUNITS");
  // common unit codes: 4 = mm (but some DXF readers use different mapping); we write 4 for mm
  const insUnits = unitName === "MM" ? 4 : 1;
  lines.push(" 70");
  lines.push(String(insUnits));

  lines.push("  0");
  lines.push("ENDSEC");

  // tables (empty)
  lines.push("  0");
  lines.push("SECTION");
  lines.push("  2");
  lines.push("TABLES");
  lines.push("  0");
  lines.push("ENDSEC");

  // entities
  lines.push("  0");
  lines.push("SECTION");
  lines.push("  2");
  lines.push("ENTITIES");

  // Create a lightweight polyline (LWPOLYLINE)
  // Group codes: 90 = vertex count (not widely used), 70 = polyline flag (closed), 10/20 = vertex x/y
  // We'll write it as LWPOLYLINE with vertices following.
  const closed = false; // change to true if you want closing behavior
  // LWPOLYLINE header
  lines.push("  0");
  lines.push("LWPOLYLINE");
  lines.push(" 90"); // number of vertices (optional; we'll include)
  lines.push(String(points.length));
  lines.push(" 70"); // polyline flag: 1 = closed
  lines.push(closed ? "1" : "0");
  lines.push(" 43"); // constant width (optional)
  lines.push("0.0");

  // write vertices as X,Y pairs (group codes 10 and 20) — LWPOLYLINE also supports 10/20 groups per vertex
  for (let i = 0; i < points.length; i++) {
    const p = points[i];
    // ensure numeric formatting with dot as decimal separator
    const x = Number(p.x || 0);
    const y = Number(p.y || 0);
    lines.push(" 10");
    lines.push(String(x));
    lines.push(" 20");
    lines.push(String(y));
    if (p.z !== undefined) {
      lines.push(" 30");
      lines.push(String(Number(p.z)));
    }
  }

  // end entities
  lines.push("  0");
  lines.push("ENDSEC");

  // EOF
  lines.push("  0");
  lines.push("EOF");

  return lines.join("\r\n");
}
