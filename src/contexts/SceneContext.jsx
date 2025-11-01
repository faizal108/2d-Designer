import React, { createContext, useEffect, useState } from "react";
import { getLocal, setLocal } from "../utils/storage";

export const SceneContext = createContext();

export function SceneProvider({ children }) {
  const [points, setPoints] = useState(() => getLocal("scene.points", []));

  useEffect(() => {
    setLocal("scene.points", points);
  }, [points]);

  const addPoints = (arr) => {
    // Normalize to numeric x/y and allow additional fields
    const normalized = arr
      .map((p) => ({
        x: Number(p.x),
        y: Number(p.y),
        ...(p.z !== undefined ? { z: p.z } : {}),
        ...(p.t !== undefined ? { t: p.t } : {}),
      }))
      .filter((p) => !Number.isNaN(p.x) && !Number.isNaN(p.y));
    setPoints((prev) => [...prev, ...normalized]);
  };

  const setAllPoints = (arr) => {
    setPoints(
      arr.map((p) => ({
        x: Number(p.x),
        y: Number(p.y),
        ...(p.z !== undefined ? { z: p.z } : {}),
        ...(p.t !== undefined ? { t: p.t } : {}),
      }))
    );
  };

  const clear = () => setPoints([]);

  return (
    <SceneContext.Provider value={{ points, addPoints, setAllPoints, clear }}>
      {children}
    </SceneContext.Provider>
  );
}
