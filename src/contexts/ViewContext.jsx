// src/contexts/ViewContext.jsx
import React, { createContext, useState, useEffect } from "react";
import { getLocal, setLocal } from "../utils/storage";

export const ViewContext = createContext();

export function ViewProvider({ children }) {
  const [showGrid, setShowGrid] = useState(() => getLocal("showGrid", true));
  const [showPoints, setShowPoints] = useState(() =>
    getLocal("showPoints", true)
  );
  const [algorithm, setAlgorithm] = useState(() =>
    getLocal("drawAlgo", "linear")
  );
  const [curveLevel, setCurveLevel] = useState(() => getLocal("curveLevel", 1));

  const [showMeasureOnHover, setShowMeasureOnHover] = useState(() =>
    getLocal("showMeasureOnHover", true)
  );

  // new flags
  const [crosshair, setCrosshair] = useState(() =>
    getLocal("crosshair", false)
  );
  const [axes, setAxes] = useState(() => getLocal("axes", true));
  const [showControls, setShowControls] = useState(() =>
    getLocal("showControls", true)
  );

  useEffect(() => setLocal("showGrid", showGrid), [showGrid]);
  useEffect(() => setLocal("showPoints", showPoints), [showPoints]);
  useEffect(() => setLocal("drawAlgo", algorithm), [algorithm]);
  useEffect(() => setLocal("curveLevel", curveLevel), [curveLevel]);
  useEffect(() => setLocal("crosshair", crosshair), [crosshair]);
  useEffect(() => setLocal("axes", axes), [axes]);
  useEffect(() => setLocal("showControls", showControls), [showControls]);

  return (
    <ViewContext.Provider
      value={{
        showGrid,
        setShowGrid,
        showPoints,
        setShowPoints,
        algorithm,
        setAlgorithm,
        curveLevel,
        setCurveLevel,
        crosshair,
        setCrosshair,
        axes,
        setAxes,
        showControls,
        setShowControls,
        showMeasureOnHover,
        setShowMeasureOnHover,
      }}
    >
      {children}
    </ViewContext.Provider>
  );
}
