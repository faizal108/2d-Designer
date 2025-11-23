// src/utils/export/exportDXF.js
//
// Robust DXF generator supporting two output modes:
// - "lwp"    => LWPOLYLINE (modern, compact)
// - "legacy" => POLYLINE + VERTEX + SEQEND (older AutoCAD/CAM compatibility)
//
// Usage:
//  generateDXF(points, { compat: "legacy", closed: false, unitName: "MM" })
//  generateDXF(points, { compat: "lwp", versionLabel: "AutoCAD 2013", unitName: "MM" })

function safeNum(n) {
  const x = Number(n || 0);
  if (!isFinite(x)) return 0;
  return x;
}

function headerSection(lines, versionLabel = "AC1021", unitName = "MM") {
  // minimal, safe header. Many readers ignore $ACADVER; some depend on it — we add label for clarity.
  lines.push("  0");
  lines.push("SECTION");
  lines.push("  2");
  lines.push("HEADER");

  lines.push("  9");
  lines.push("$ACADVER");
  lines.push("  1");
  lines.push(String(versionLabel));

  // optional: set insertion units (4 = millimeters). Some CAD readers respect this.
  lines.push("  9");
  lines.push("$INSUNITS");
  lines.push(" 70");
  lines.push(unitName === "MM" ? "4" : "1");

  lines.push("  0");
  lines.push("ENDSEC");
}

function tablesSection(lines) {
  lines.push("  0");
  lines.push("SECTION");
  lines.push("  2");
  lines.push("TABLES");
  // minimal tables (empty) — many readers don't require full tables for simple entities
  lines.push("  0");
  lines.push("ENDSEC");
}

function entitiesSectionStart(lines) {
  lines.push("  0");
  lines.push("SECTION");
  lines.push("  2");
  lines.push("ENTITIES");
}

function entitiesSectionEnd(lines) {
  lines.push("  0");
  lines.push("ENDSEC");
}

function eof(lines) {
  lines.push("  0");
  lines.push("EOF");
}

/**
 * Emit LWPOLYLINE (lightweight polyline).
 * This is compact and modern; however, older CADs or some CAM tools may prefer legacy polyline.
 */
function emitLwpolyline(lines, points, closed = false) {
  lines.push("  0");
  lines.push("LWPOLYLINE");
  // vertex count (group 90) is optional, but we include it
  lines.push(" 90");
  lines.push(String(points.length));
  // polyline flag: 1 = closed
  lines.push(" 70");
  lines.push(closed ? "1" : "0");
  // default constant width
  lines.push(" 43");
  lines.push("0.0");

  // each vertex: 10 = x, 20 = y, 30 = z optional
  for (let i = 0; i < points.length; i++) {
    const p = points[i];
    lines.push(" 10");
    lines.push(String(safeNum(p.x)));
    lines.push(" 20");
    lines.push(String(safeNum(p.y)));
    if (p.z !== undefined) {
      lines.push(" 30");
      lines.push(String(safeNum(p.z)));
    }
  }
}

/**
 * Emit legacy POLYLINE + VERTEX + SEQEND block.
 * This is older-style DXF entities and is more compatible with older CAD/CAM tools.
 */
function emitLegacyPolyline(lines, points, closed = false) {
  // POLYLINE header
  lines.push("  0");
  lines.push("POLYLINE");
  // Group 66 indicates entity has vertices
  lines.push(" 66");
  lines.push("1");
  // 70 flags: bit-coded (1 = closed polyline)
  lines.push(" 70");
  lines.push(closed ? "1" : "0");
  // optional elevation (z for polyline)
  lines.push(" 38");
  lines.push("0.0");
  lines.push(" 39");
  lines.push("0.0");

  // now write individual VERTEX entities
  for (let i = 0; i < points.length; i++) {
    const p = points[i];
    lines.push("  0");
    lines.push("VERTEX");
    // vertex type
    lines.push(" 10");
    lines.push(String(safeNum(p.x)));
    lines.push(" 20");
    lines.push(String(safeNum(p.y)));
    if (p.z !== undefined) {
      lines.push(" 30");
      lines.push(String(safeNum(p.z)));
    }
    // optional vertex flags (70) 0 common
    lines.push(" 70");
    lines.push("0");
  }

  // SEQEND to end the vertex list
  lines.push("  0");
  lines.push("SEQEND");
  // optionally include an entity terminator entry
}

/**
 * generateDXF(points, opts)
 * - points: [{x,y[,z]}...]
 * - opts:
 *    compat: "lwp" (default) | "legacy"
 *    closed: boolean (false)
 *    versionLabel: string shown in $ACADVER (default AC1021)
 *    unitName: "MM" | "IN"
 */
export function generateDXF(points, opts = {}) {
  const {
    compat = "lwp",
    closed = false,
    versionLabel = "AC1021",
    unitName = "MM",
  } = opts;
  const lines = [];

  headerSection(lines, versionLabel, unitName);
  tablesSection(lines);
  entitiesSectionStart(lines);

  if (compat === "lwp") {
    emitLwpolyline(lines, points, closed);
  } else {
    // legacy POLYLINE + VERTEX form is more compatible with older DXF readers (AutoCAD 2004/2000 etc.)
    emitLegacyPolyline(lines, points, closed);
  }

  entitiesSectionEnd(lines);
  eof(lines);

  // join with CRLF to be safe across CAD apps
  return lines.join("\r\n");
}
