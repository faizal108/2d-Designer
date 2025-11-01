import React, { useRef, useEffect, useContext, useState } from "react";
import { SceneContext } from "../../contexts/SceneContext";

export default function Workspace() {
  const canvasRef = useRef(null);
  const { points } = useContext(SceneContext);
  const [camera, setCamera] = useState({ x: 0, y: 0, zoom: 1 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let raf = null;

    function resize() {
      canvas.width = canvas.clientWidth * devicePixelRatio;
      canvas.height = canvas.clientHeight * devicePixelRatio;
      ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
      draw();
    }
    window.addEventListener("resize", resize);
    resize();

    function toScreen(wx, wy) {
      const w = canvas.width / devicePixelRatio;
      const h = canvas.height / devicePixelRatio;
      return [
        (wx - camera.x) * camera.zoom + w / 2,
        (wy - camera.y) * camera.zoom + h / 2,
      ];
    }

    function draw() {
      const w = canvas.width / devicePixelRatio;
      const h = canvas.height / devicePixelRatio;
      ctx.clearRect(0, 0, w, h);

      // background
      ctx.fillStyle = "#0b1220";
      ctx.fillRect(0, 0, w, h);

      if (!points || points.length === 0) {
        ctx.fillStyle = "rgba(255,255,255,0.06)";
        ctx.font = "14px Inter, sans-serif";
        ctx.fillText("Canvas: import points to draw a polyline", 20, 30);
        return;
      }

      // draw polyline
      ctx.strokeStyle = "#10b981";
      ctx.lineWidth = 2;
      ctx.beginPath();
      points.forEach((p, i) => {
        const [sx, sy] = toScreen(p.x, p.y);
        if (i === 0) ctx.moveTo(sx, sy);
        else ctx.lineTo(sx, sy);
      });
      ctx.stroke();

      // draw points
      points.forEach((p) => {
        const [sx, sy] = toScreen(p.x, p.y);
        ctx.fillStyle = "#f59e0b";
        ctx.beginPath();
        ctx.arc(sx, sy, 4, 0, Math.PI * 2);
        ctx.fill();
      });
    }

    function loop() {
      draw();
      raf = requestAnimationFrame(loop);
    }
    loop();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, [points, camera]);

  // Basic zoom with ctrl+wheel
  useEffect(() => {
    const canvas = canvasRef.current;
    function onWheel(e) {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        setCamera((c) => {
          const delta = e.deltaY > 0 ? 0.9 : 1.1;
          return { ...c, zoom: Math.max(0.1, Math.min(10, c.zoom * delta)) };
        });
      }
    }
    canvas.addEventListener("wheel", onWheel, { passive: false });
    return () => canvas.removeEventListener("wheel", onWheel);
  }, []);

  // Listen for scene.clear event dispatched in FileMenu "New"
  useEffect(() => {
    function onClear() {
      window.dispatchEvent(new CustomEvent("scene.clear.localstore")); // for any other listeners
      // Using SceneContext would be cleaner, but we listened for this externally
      // If you prefer direct approach, set SceneContext.clear(...)
    }
    window.addEventListener("scene.clear", onClear);
    return () => window.removeEventListener("scene.clear", onClear);
  }, []);

  return (
    <div className="w-full h-full relative">
      <canvas ref={canvasRef} className="w-full h-full block" />
    </div>
  );
}
