// src/components/workspace/Workspace.jsx
// Sample asset (local): /mnt/data/253b8f35-5323-4bfd-8414-b68db9b512a0.png

import React, {
  useRef,
  useEffect,
  useContext,
  useState,
  useCallback,
} from "react";
import { SceneContext } from "../../contexts/SceneContext";
import { ViewContext } from "../../contexts/ViewContext";
import { renderScene } from "./RenderScene";
import FloatingMenu from "./FloatingControls";

/**
 * Workspace
 * - Canvas-driven renderer with camera (x,y,zoom)
 * - Grid / axes / crosshair / hover point measure
 * - Fit / zoom / reset / center controls via events or FloatingMenu
 *
 * Expects ViewContext to expose:
 *  showGrid, showPoints, algorithm, curveLevel,
 *  crosshair, axes, showControls, showMeasureOnHover
 *
 * Expects SceneContext to expose:
 *  points (array of {x,y[,z]})
 */

export default function Workspace() {
  const canvasRef = useRef(null);
  const rafRef = useRef(null);

  const { points } = useContext(SceneContext);
  const {
    showGrid,
    showPoints,
    algorithm,
    curveLevel,
    crosshair,
    axes,
    showControls,
    showMeasureOnHover,
  } = useContext(ViewContext);

  const [camera, setCamera] = useState({ x: 0, y: 0, zoom: 1 });
  const [hoverWorld, setHoverWorld] = useState(null);
  const [hoveredPoint, setHoveredPoint] = useState(null); // non-null only when pointer near a point
  const [pointerScreen, setPointerScreen] = useState(null); // pointer screen pos for tooltip placement

  const minZoom = 0.002,
    maxZoom = 100;

  const HIT_RADIUS_PX = 8; // detection radius in CSS px

  const toScreen = useCallback(
    (wx, wy, canvas) => {
      const w = canvas.width / devicePixelRatio;
      const h = canvas.height / devicePixelRatio;
      return {
        x: (wx - camera.x) * camera.zoom + w / 2,
        y: (wy - camera.y) * camera.zoom + h / 2,
      };
    },
    [camera]
  );

  const toWorld = useCallback(
    (sx, sy, canvas) => {
      const w = canvas.width / devicePixelRatio;
      const h = canvas.height / devicePixelRatio;
      return {
        x: (sx - w / 2) / camera.zoom + camera.x,
        y: (sy - h / 2) / camera.zoom + camera.y,
      };
    },
    [camera]
  );

  // fitToPoints (keeps simple)
  const fitToPoints = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    if (!points || points.length === 0) {
      setCamera({ x: 0, y: 0, zoom: 1 });
      return;
    }
    let minX = Infinity,
      minY = Infinity,
      maxX = -Infinity,
      maxY = -Infinity;
    points.forEach((p) => {
      if (p.x < minX) minX = p.x;
      if (p.x > maxX) maxX = p.x;
      if (p.y < minY) minY = p.y;
      if (p.y > maxY) maxY = p.y;
    });
    const canvasPxW = canvas.width / devicePixelRatio;
    const canvasPxH = canvas.height / devicePixelRatio;
    const margin = 0.88;
    const bboxW = Math.max(1e-6, maxX - minX);
    const bboxH = Math.max(1e-6, maxY - minY);
    const ppw = (canvasPxW * margin) / bboxW;
    const pph = (canvasPxH * margin) / bboxH;
    const newZoom = Math.max(minZoom, Math.min(maxZoom, Math.min(ppw, pph)));
    const cx = (minX + maxX) / 2,
      cy = (minY + maxY) / 2;
    animateCamera({ x: cx, y: cy, zoom: newZoom });
    // also update hoverWorld to avoid stale coords after fit
    setHoverWorld({ x: cx, y: cy });
  }, [points]);

  // zoomBy with optional center
  const zoomBy = useCallback(
    (factor, centerScreen = null) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      setCamera((prev) => {
        const newZoom = Math.max(
          minZoom,
          Math.min(maxZoom, prev.zoom * factor)
        );
        if (centerScreen) {
          const before = toWorld(centerScreen.x, centerScreen.y, canvas);
          const afterScreen = {
            x:
              (before.x - prev.x) * newZoom +
              canvas.width / devicePixelRatio / 2,
            y:
              (before.y - prev.y) * newZoom +
              canvas.height / devicePixelRatio / 2,
          };
          const dxScreen = centerScreen.x - afterScreen.x;
          const dyScreen = centerScreen.y - afterScreen.y;
          const dxWorld = dxScreen / newZoom;
          const dyWorld = dyScreen / newZoom;
          return { x: prev.x - dxWorld, y: prev.y - dyWorld, zoom: newZoom };
        }
        return { ...prev, zoom: newZoom };
      });
    },
    [toWorld]
  );

  const resetCamera = useCallback(() => {
    animateCamera({ x: 0, y: 0, zoom: 1 });
  }, []);

  const centerView = useCallback(() => {
    // center to world origin (0,0)
    animateCamera({ x: 0, y: 0, zoom: camera.zoom });
  }, [camera.zoom]);

  function animateCamera(targetCam, duration = 220) {
    const start = performance.now();
    const startCam = { ...camera };
    function step(now) {
      const t = Math.min(1, (now - start) / duration);
      const lerp = (a, b) => a + (b - a) * t;
      setCamera({
        x: lerp(startCam.x, targetCam.x),
        y: lerp(startCam.y, targetCam.y),
        zoom: lerp(startCam.zoom, targetCam.zoom),
      });
      if (t < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  // render loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: false });

    function resize() {
      // use parentElement client dims; make sure parent has min-h-0
      const rect = canvas.parentElement.getBoundingClientRect();
      canvas.width = Math.round(rect.width * devicePixelRatio);
      canvas.height = Math.round(rect.height * devicePixelRatio);
      canvas.style.width = rect.width + "px";
      canvas.style.height = rect.height + "px";
      ctx.setTransform(1, 0, 0, 1, 0, 0);
    }
    resize();

    let running = true;
    const loop = () => {
      if (!running) return;
      ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
      const w = canvas.width / devicePixelRatio;
      const h = canvas.height / devicePixelRatio;
      ctx.fillStyle = "#0b1220";
      ctx.fillRect(0, 0, w, h);

      // GRID (draw here so toggling showGrid works reliably)
      if (showGrid) {
        ctx.save();
        ctx.strokeStyle = "rgba(255,255,255,0.06)";
        ctx.lineWidth = 1;
        const gridStep = 10; // mm per grid line (tweakable)
        const topLeft = toWorld(0, 0, canvas);
        const bottomRight = toWorld(w, h, canvas);
        const startX = Math.floor(topLeft.x / gridStep) * gridStep;
        const endX = Math.ceil(bottomRight.x / gridStep) * gridStep;
        const startY = Math.floor(topLeft.y / gridStep) * gridStep;
        const endY = Math.ceil(bottomRight.y / gridStep) * gridStep;

        for (let x = startX; x <= endX; x += gridStep) {
          const sx = Math.round(toScreen(x, 0, canvas).x) + 0.5;
          ctx.beginPath();
          ctx.moveTo(sx, 0);
          ctx.lineTo(sx, h);
          ctx.stroke();
        }
        for (let y = startY; y <= endY; y += gridStep) {
          const sy = Math.round(toScreen(0, y, canvas).y) + 0.5;
          ctx.beginPath();
          ctx.moveTo(0, sy);
          ctx.lineTo(w, sy);
          ctx.stroke();
        }
        ctx.restore();
      }

      // draw axes at origin if enabled
      if (axes) {
        ctx.save();
        // world -> screen for origin
        const origin = toScreen(0, 0, canvas);
        // long axis lines
        ctx.strokeStyle = "rgba(255,255,255,0.08)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, origin.y);
        ctx.lineTo(w, origin.y);
        ctx.moveTo(origin.x, 0);
        ctx.lineTo(origin.x, h);
        ctx.stroke();

        // small axis arrows and labels at center origin
        ctx.fillStyle = "rgba(255,255,255,0.9)";
        ctx.font = "12px Inter, sans-serif";
        ctx.fillText("X", origin.x + 6, origin.y - 6);
        ctx.fillText("Y", origin.x + 6, origin.y + 14);
        ctx.restore();
      }

      // render main scene (lines, points, curves)
      renderScene(
        ctx,
        points || [],
        (wx, wy) => {
          const s = toScreen(wx, wy, canvas);
          return { x: s.x, y: s.y };
        },
        {
          showGrid: false, // already handled here
          showPoints,
          algorithm,
          gridFn: null,
          curveLevel,
        }
      );

      // crosshair drawing at pointer if enabled
      if (crosshair && hoverWorld) {
        ctx.save();
        const p = toScreen(hoverWorld.x, hoverWorld.y, canvas);
        ctx.strokeStyle = "rgba(255,255,255,0.12)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(p.x, 0);
        ctx.lineTo(p.x, h);
        ctx.moveTo(0, p.y);
        ctx.lineTo(w, p.y);
        ctx.stroke();
        ctx.restore();
      }

      // draw point-hover tooltip if hovering a point (and feature enabled)
      if (hoveredPoint && showMeasureOnHover && pointerScreen) {
        ctx.save();
        const pScreen = pointerScreen; // {x,y} in CSS px
        const txt = `x:${hoveredPoint.x.toFixed(2)} y:${hoveredPoint.y.toFixed(
          2
        )}`;
        ctx.font = "12px Inter, sans-serif";
        const padding = 6;
        const measure = ctx.measureText(txt);
        const boxW = measure.width + padding * 2;
        const boxH = 20;
        // box near pointer (prefer bottom-right)
        let bx = pScreen.x + 12;
        let by = pScreen.y + 12;
        if (bx + boxW > w) bx = pScreen.x - boxW - 12;
        if (by + boxH > h) by = pScreen.y - boxH - 12;
        ctx.fillStyle = "rgba(0,0,0,0.7)";
        ctx.fillRect(bx, by, boxW, boxH);
        ctx.fillStyle = "#fff";
        ctx.fillText(txt, bx + padding, by + 14);
        ctx.restore();
      }

      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);
    const onResize = () => resize();
    window.addEventListener("resize", onResize);
    return () => {
      running = false;
      window.removeEventListener("resize", onResize);
      cancelAnimationFrame(rafRef.current);
    };
  }, [
    points,
    showGrid,
    showPoints,
    algorithm,
    curveLevel,
    axes,
    crosshair,
    hoverWorld,
    hoveredPoint,
    pointerScreen,
    toScreen,
    toWorld,
    showMeasureOnHover,
  ]);

  // wheel zoom + pan
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const onWheel = (ev) => {
      ev.preventDefault();
      const rect = canvas.getBoundingClientRect();
      const screen = { x: ev.clientX - rect.left, y: ev.clientY - rect.top };
      if (ev.ctrlKey || ev.metaKey) {
        const factor = ev.deltaY < 0 ? 1.12 : 1 / 1.12;
        zoomBy(factor, screen);
      } else {
        setCamera((prev) => ({
          ...prev,
          x: prev.x - ev.deltaX / prev.zoom,
          y: prev.y - ev.deltaY / prev.zoom,
        }));
      }
    };
    canvas.addEventListener("wheel", onWheel, { passive: false });
    return () => canvas.removeEventListener("wheel", onWheel);
  }, [zoomBy]);

  // pan by dragging & track mouse for hoverWorld and point hover detection
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let dragging = false;
    let last = { x: 0, y: 0 };

    function getNearestPointAtScreen(sx, sy) {
      // returns point if within HIT_RADIUS_PX else null
      if (!points || points.length === 0) return null;
      let nearest = null;
      let bestDist2 = HIT_RADIUS_PX * HIT_RADIUS_PX; // CSS px squared
      for (const p of points) {
        const s = toScreen(p.x, p.y, canvas);
        const dx = s.x - sx;
        const dy = s.y - sy;
        const d2 = dx * dx + dy * dy;
        if (d2 <= bestDist2) {
          bestDist2 = d2;
          nearest = p;
        }
      }
      return nearest;
    }

    const onDown = (e) => {
      dragging = true;
      last = { x: e.clientX, y: e.clientY };
      canvas.style.cursor = "grabbing";
    };
    const onMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      const sx = e.clientX - rect.left,
        sy = e.clientY - rect.top;
      // update hover world coords
      const wcoord = toWorld(sx, sy, canvas);
      setHoverWorld(wcoord);
      setPointerScreen({ x: sx, y: sy });

      // detect nearest point on pointer move
      const near = getNearestPointAtScreen(sx, sy);
      setHoveredPoint(near); // either point object or null

      if (!dragging) return;
      const dx = e.clientX - last.x,
        dy = e.clientY - last.y;
      last = { x: e.clientX, y: e.clientY };
      setCamera((prev) => ({
        ...prev,
        x: prev.x - dx / prev.zoom,
        y: prev.y - dy / prev.zoom,
      }));
    };
    const onUp = () => {
      dragging = false;
      canvas.style.cursor = "default";
    };
    const onLeave = () => {
      setHoverWorld(null);
      setHoveredPoint(null);
      setPointerScreen(null);
    };

    canvas.addEventListener("mousedown", onDown);
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    canvas.addEventListener("mouseleave", onLeave);

    return () => {
      canvas.removeEventListener("mousedown", onDown);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      canvas.removeEventListener("mouseleave", onLeave);
    };
  }, [points, toScreen, toWorld]);

  // view event handlers (fit/zoom/reset/center) — listen for ViewMenu events
  useEffect(() => {
    const zoomIn = () => zoomBy(1.2);
    const zoomOut = () => zoomBy(1 / 1.2);
    const fit = () => fitToPoints();
    const center = () => centerView();
    const reset = () => resetCamera();

    function centerView() {
      animateCamera({ x: 0, y: 0, zoom: camera.zoom });
    }
    function resetCamera() {
      animateCamera({ x: 0, y: 0, zoom: 1 });
    }

    window.addEventListener("view.zoom.in", zoomIn);
    window.addEventListener("view.zoom.out", zoomOut);
    window.addEventListener("view.fit", fit);
    window.addEventListener("view.center", centerView);
    window.addEventListener("view.reset", resetCamera);

    return () => {
      window.removeEventListener("view.zoom.in", zoomIn);
      window.removeEventListener("view.zoom.out", zoomOut);
      window.removeEventListener("view.fit", fit);
      window.removeEventListener("view.center", centerView);
      window.removeEventListener("view.reset", resetCamera);
    };
  }, [zoomBy, fitToPoints, camera.zoom]);

  // workspace commands (floating menu uses workspace.cmd earlier)
  useEffect(() => {
    const handler = (ev) => {
      const detail = ev.detail || {};
      const type = detail.type;
      const data = detail.data || {};
      if (type === "fit") fitToPoints();
      else if (type === "zoomBy") zoomBy(data.factor || data);
      else if (type === "reset") resetCamera();
      else if (type === "zoomTo")
        setCamera((prev) => ({
          ...prev,
          zoom: Math.max(minZoom, Math.min(maxZoom, data.zoom)),
        }));
    };
    window.addEventListener("workspace.cmd", handler);
    return () => window.removeEventListener("workspace.cmd", handler);
  }, [fitToPoints, zoomBy]);

  return (
    <div className="w-full h-full relative">
      <canvas ref={canvasRef} className="w-full h-full block" />

      {/* bottom-left coordinate panel */}
      <div className="absolute bottom-3 left-4 px-3 py-1 text-xs bg-gray-900/80 text-white border border-gray-700 rounded shadow">
        {hoverWorld
          ? `x: ${Number(hoverWorld.x).toFixed(2)}  y: ${Number(
              hoverWorld.y
            ).toFixed(2)}`
          : "—"}
      </div>

      {/* zoom indicator */}
      <div className="absolute bottom-3 right-4 px-3 py-1 text-xs bg-gray-900/80 text-white border border-gray-700 rounded shadow">
        Zoom: {camera.zoom.toFixed(3)}x
      </div>

      {/* floating controls (hide if showControls false) */}
      {showControls && <FloatingMenu />}
    </div>
  );
}
