/**
 * Accept multiple formats:
 * 1) JSON array:
 * [
 *  { x:10, y:20, z: 5 },
 *  { x:20, y:30 }
 * ]
 *
 * 2) Lines:
 * x:20,y:20
 * x:30,y:30
 *
 * 3) Also allow: x,20 y,30  or x: 20, y: 30 with spaces
 *
 * Returns array of objects [{x: Number, y: Number, ...}] or throws Error.
 */
export function parsePoints(input) {
  if (!input || !input.trim()) return [];

  // Try JSON first
  try {
    const maybe = JSON.parse(input);
    if (Array.isArray(maybe)) {
      // map to objects with x,y
      return maybe.map((o) => {
        if (typeof o === "object" && o !== null && ("x" in o || "y" in o)) {
          return o;
        }
        throw new Error("JSON array items must be objects with x and y");
      });
    }
    // if parsed as object, maybe contains points property
    if (maybe && typeof maybe === "object" && Array.isArray(maybe.points)) {
      return maybe.points;
    }
  } catch (e) {
    // not JSON — fall through to line parser
  }

  // Line-based parser
  const lines = input
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  const out = lines.map((line) => {
    // Accept either comma-separated or space-separated key:value pairs
    // Examples:
    // x:20,y:20
    // x: 20, y: 20
    // x:20 y:20
    // 20,20  (if only numbers present)
    // x,20,y,30  (unlikely) -> fallback

    // If line is just two numbers: "20,30" or "20 30"
    const numericOnly = line.match(
      /^\s*-?\d+(\.\d+)?\s*[, ]\s*-?\d+(\.\d+)?\s*$/
    );
    if (numericOnly) {
      const parts = line
        .split(/[, ]+/)
        .map((s) => s.trim())
        .filter(Boolean);
      return { x: Number(parts[0]), y: Number(parts[1]) };
    }

    // Otherwise parse key:value or key, value pairs
    const tokens = line
      .split(/[,;]\s*|\s+/)
      .map((t) => t.trim())
      .filter(Boolean);
    const obj = {};
    tokens.forEach((tok) => {
      const kvMatch = tok.match(/^([a-zA-Z_]+)\s*[:=]\s*(-?\d+(\.\d+)?)$/);
      if (kvMatch) {
        obj[kvMatch[1]] = Number(kvMatch[2]);
        return;
      }
      // maybe "x:20,y:30" produced token "x:20,y:30" in some edge cases -> try to split further
      const inner = tok.split(/[:=]/);
      if (inner.length === 2 && !Number.isNaN(Number(inner[1]))) {
        obj[inner[0]] = Number(inner[1]);
      }
    });

    // If we couldn't parse keys but token like "x:20,y:20" remains, try regex global match
    if (!("x" in obj) || !("y" in obj)) {
      const allMatches = [
        ...line.matchAll(/([a-zA-Z_]+)\s*[:=]\s*(-?\d+(\.\d+)?)/g),
      ];
      allMatches.forEach((m) => {
        obj[m[1]] = Number(m[2]);
      });
    }

    if (!("x" in obj) || !("y" in obj)) {
      throw new Error(`Unable to parse line: "${line}". Expected x and y.`);
    }
    return obj;
  });

  return out;
}
