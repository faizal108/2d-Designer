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
 * Workspace.jsx (updated)
 * - Proper fitToPoints implementation
 * - workspace.cmd event handler: { type: 'fit'|'zoomBy'|'reset'|'zoomTo', data: {...} }
 * - configurable min/max zoom (increased)
 * - zoomBy preserves world point under cursor if center provided
 */

export default function Workspace() {
  const canvasRef = useRef(null);
  const rafRef = useRef(null);

  const { points, setAllPoints } = useContext(SceneContext);
  const { showGrid, showPoints, algorithm, curveLevel } = useContext(ViewContext);

  // camera stored in state so UI can react if needed; but we batch changes to avoid floods
  const [camera, setCamera] = useState({ x: 0, y: 0, zoom: 1 });

  // zoom limits
  const minZoom = 0.002;
  const maxZoom = 100;

  // helpers: convert screen <-> world, using latest camera
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

  // fit scene to canvas: center and choose zoom so bounding box fits with margin
  const fitToPoints = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    if (!points || points.length === 0) {
      // nothing to fit; reset view
      animateCamera({ x: centerX, y: centerY, zoom: newZoom });
      return;
    }

    // compute bounding box in world coords (points are in mm)
    let minX = Infinity,
      minY = Infinity,
      maxX = -Infinity,
      maxY = -Infinity;
    for (const p of points) {
      if (p.x < minX) minX = p.x;
      if (p.x > maxX) maxX = p.x;
      if (p.y < minY) minY = p.y;
      if (p.y > maxY) maxY = p.y;
    }
    // guard
    if (!isFinite(minX) || !isFinite(minY)) return;

    // canvas size in CSS px
    const canvasPxW = canvas.width / devicePixelRatio;
    const canvasPxH = canvas.height / devicePixelRatio;

    // add margin as percentage of available area (0.88 -> use 88% of canvas)
    const margin = 0.88;

    // compute required pixels-per-world-unit (here world unit = mm)
    const bboxW = Math.max(1e-6, maxX - minX);
    const bboxH = Math.max(1e-6, maxY - minY);

    const ppw = (canvasPxW * margin) / bboxW; // pixels per mm horizontally
    const pph = (canvasPxH * margin) / bboxH; // pixels per mm vertically

    // choose smaller so both dimensions fit
    let desiredPixelsPerUnit = Math.min(ppw, pph);

    // desired zoom factor relative to world unit scale: we treat 1 world unit → base pixels = 1
    // Here camera.zoom is directly the pixels-per-unit (no separate basePPMM). So set zoom = desiredPixelsPerUnit
    // But to keep behavior consistent with previous code where zoom was multiplicative, we assume that
    // camera.zoom is pixels-per-mm overall. If you previously used a different base, adjust accordingly.
    const newZoom = Math.max(minZoom, Math.min(maxZoom, desiredPixelsPerUnit));

    // center of bbox
    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;

    // set camera so that world center maps to canvas center
    setCamera({ x: centerX, y: centerY, zoom: newZoom });
  }, [points]);

  // zoomBy helper: if centerScreen provided, preserve world position under cursor
  const zoomBy = useCallback(
    (factor, centerScreen = null) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      setCamera((prev) => {
        const oldZoom = prev.zoom;
        let newZoom = oldZoom * factor;
        newZoom = Math.max(minZoom, Math.min(maxZoom, newZoom));

        // if centerScreen provided (CSS px coords relative to canvas), compute adjustment
        if (centerScreen) {
          const before = toWorld(centerScreen.x, centerScreen.y, canvas); // world before zoom
          const newCam = { ...prev, zoom: newZoom };
          // compute how to shift camera.x/y so that the same world point stays under the same screen pixel
          const afterScreen = {
            // worldToScreen using new zoom and unchanged camera.x/y
            x:
              (before.x - prev.x) * newZoom +
              canvas.width / devicePixelRatio / 2,
            y:
              (before.y - prev.y) * newZoom +
              canvas.height / devicePixelRatio / 2,
          };
          // desired screen is centerScreen, so compute delta in world coords to shift camera
          const dxScreen = centerScreen.x - afterScreen.x;
          const dyScreen = centerScreen.y - afterScreen.y;
          // convert screen delta to world delta
          const dxWorld = dxScreen / newZoom;
          const dyWorld = dyScreen / newZoom;
          return { x: prev.x - dxWorld, y: prev.y - dyWorld, zoom: newZoom };
        }

        return { ...prev, zoom: newZoom };
      });
    },
    [toWorld]
  );

  // reset view
  const resetView = useCallback(() => {
    setCamera({ x: 0, y: 0, zoom: 1 });
  }, []);

  // rendering loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: false });

    function resize() {
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
      // clear and set DPR transform
      ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
      // clear
      ctx.fillStyle = "#0b1220";
      ctx.fillRect(
        0,
        0,
        canvas.width / devicePixelRatio,
        canvas.height / devicePixelRatio
      );

      // draw using renderScene (delegated algorithm)
      renderScene(
        ctx,
        points || [],
        (wx, wy) => {
          const screen = toScreen(wx, wy, canvas);
          return { x: screen.x, y: screen.y };
        },
        {
          showGrid,
          showPoints,
          algorithm,
          gridFn: () => {
            // draw grid in world-space: rely on toScreen and toWorld
            const w = canvas.width / devicePixelRatio;
            const h = canvas.height / devicePixelRatio;
            const gridStep = 10; // mm per major grid line (you can adapt)
            ctx.save();
            ctx.strokeStyle = "rgba(255,255,255,0.06)";
            ctx.lineWidth = 1;

            const topLeft = toWorld(0, 0, canvas);
            const bottomRight = toWorld(w, h, canvas);

            const startX = Math.floor(topLeft.x / gridStep) * gridStep;
            const endX = Math.ceil(bottomRight.x / gridStep) * gridStep;
            const startY = Math.floor(topLeft.y / gridStep) * gridStep;
            const endY = Math.ceil(bottomRight.y / gridStep) * gridStep;

            for (let x = startX; x <= endX; x += gridStep) {
              const sx = toScreen(x, 0, canvas).x;
              ctx.beginPath();
              ctx.moveTo(Math.round(sx) + 0.5, 0);
              ctx.lineTo(Math.round(sx) + 0.5, h);
              ctx.stroke();
            }
            for (let y = startY; y <= endY; y += gridStep) {
              const sy = toScreen(0, y, canvas).y;
              ctx.beginPath();
              ctx.moveTo(0, Math.round(sy) + 0.5);
              ctx.lineTo(w, Math.round(sy) + 0.5);
              ctx.stroke();
            }
            ctx.restore();
          },
          curveLevel 
        }
      );

      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);

    // keep canvas size in sync
    const onResize = () => resize();
    window.addEventListener("resize", onResize);

    return () => {
      window.removeEventListener("resize", onResize);
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
  }, [
    points,
    showGrid,
    showPoints,
    algorithm,
    camera.zoom,
    camera.x,
    camera.y,
    toScreen,
    toWorld,
  ]);

  // wheel zoom & pan
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const onWheel = (ev) => {
      ev.preventDefault();
      const rect = canvas.getBoundingClientRect();
      const screen = { x: ev.clientX - rect.left, y: ev.clientY - rect.top };
      if (ev.ctrlKey || ev.metaKey) {
        // stronger multiplier for quicker zooming
        const delta = ev.deltaY < 0 ? 1.12 : 1 / 1.12;
        zoomBy(delta, screen);
      } else {
        // normal scroll pans the view
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

  // mouse drag panning
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let dragging = false;
    let last = { x: 0, y: 0 };

    const onDown = (ev) => {
      dragging = true;
      last = { x: ev.clientX, y: ev.clientY };
      canvas.style.cursor = "grabbing";
    };
    const onMove = (ev) => {
      if (!dragging) return;
      const dx = ev.clientX - last.x;
      const dy = ev.clientY - last.y;
      last = { x: ev.clientX, y: ev.clientY };
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

    canvas.addEventListener("mousedown", onDown);
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);

    return () => {
      canvas.removeEventListener("mousedown", onDown);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, []);

  // double-click recentre to clicked world point
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const onDbl = (ev) => {
      const rect = canvas.getBoundingClientRect();
      const sx = ev.clientX - rect.left;
      const sy = ev.clientY - rect.top;
      const world = toWorld(sx, sy, canvas);
      setCamera((prev) => ({ ...prev, x: world.x, y: world.y }));
    };
    canvas.addEventListener("dblclick", onDbl);
    return () => canvas.removeEventListener("dblclick", onDbl);
  }, [toWorld]);

  // custom event handler so FloatingMenu (or others) can send commands
  useEffect(() => {
    const handler = (ev) => {
      const detail = ev.detail || {};
      const type = detail.type;
      const data = detail.data || {};
      if (type === "fit") {
        fitToPoints();
      } else if (type === "zoomBy") {
        // data: { factor, center? }
        const factor = data.factor || data;
        const center = data.center || null;
        zoomBy(factor, center);
      } else if (type === "reset") {
        resetView();
      } else if (type === "zoomTo") {
        // data: { zoom, center? } - set absolute zoom
        const z = Math.max(minZoom, Math.min(maxZoom, data.zoom));
        setCamera((prev) => ({ ...prev, zoom: z }));
      }
    };
    window.addEventListener("workspace.cmd", handler);
    return () => window.removeEventListener("workspace.cmd", handler);
  }, [fitToPoints, zoomBy, resetView]);

  // Smooth transition helper
  function animateCamera(targetCam, duration = 200) {
    const startCam = { ...camera };
    const start = performance.now();

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

  return (
    <div className="w-full h-full relative">
      <canvas ref={canvasRef} className="w-full h-full block" />

      {/* Zoom indicator */}
      <div className="absolute bottom-3 right-4 px-3 py-1 text-xs bg-gray-900/80 text-white border border-gray-700 rounded shadow">
        Zoom: {camera.zoom.toFixed(3)}x
      </div>

      <FloatingMenu />
    </div>
  );
}
