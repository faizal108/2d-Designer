import { createContext, useState, useEffect } from "react";
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
  // Smoothness level for curved lines
  const [curveLevel, setCurveLevel] = useState(() => getLocal("curveLevel", 1));

  // linear | curved | compare
  useEffect(() => setLocal("showGrid", showGrid), [showGrid]);
  useEffect(() => setLocal("showPoints", showPoints), [showPoints]);
  useEffect(() => setLocal("drawAlgo", algorithm), [algorithm]);

  // Smoothness level for curved lines
  useEffect(() => setLocal("curveLevel", curveLevel), [curveLevel]);

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
        setCurveLevel
      }}
    >
      {children}
    </ViewContext.Provider>
  );
}
