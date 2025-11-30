// src/components/workspace/SerialStreamPanel.jsx

import React, { useContext, useEffect, useRef, useState } from "react";
import { SceneContext } from "../../contexts/SceneContext";

export default function SerialStreamPanel({ onClose }) {
  const { addPoints } = useContext(SceneContext);

  const [hasSerial] = useState(
    () => typeof navigator !== "undefined" && "serial" in navigator
  );
  const [port, setPort] = useState(null);
  const [baud, setBaud] = useState(115200);
  const [connected, setConnected] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [statusText, setStatusText] = useState("Idle");
  const [lastPosition, setLastPosition] = useState(null); // {x,y} mm

  const readerRef = useRef(null);
  const keepReadingRef = useRef(false);
  const textBufferRef = useRef("");
  const batchRef = useRef([]);
  const BATCH_SIZE = 100;

  // For "Take point": use status → Position(mm) as single-shot
  const singleShotPendingRef = useRef(false);

  // IMPORTANT: keep a ref of isRecording so the serial loop sees latest value
  const isRecordingRef = useRef(false);
  useEffect(() => {
    isRecordingRef.current = isRecording;
  }, [isRecording]);

  // ---- port selection / connect / disconnect ----

  async function selectPort() {
    try {
      const p = await navigator.serial.requestPort();
      setPort(p);
      setStatusText("Port selected. Click Connect.");
    } catch (err) {
      console.error(err);
      setStatusText("Port selection cancelled.");
    }
  }

  async function connectPort() {
    if (!port) {
      setStatusText("No port selected.");
      return;
    }
    try {
      await port.open({ baudRate: Number(baud) });
      setConnected(true);
      setStatusText(`Connected @${baud}`);
      startReading();
    } catch (err) {
      console.error("Failed to open port", err);
      setStatusText("Failed to open port.");
    }
  }

  async function stopReading() {
    keepReadingRef.current = false;
    if (readerRef.current) {
      try {
        await readerRef.current.cancel();
      } catch (_) {
        // ignore
      }
      try {
        readerRef.current.releaseLock();
      } catch (_) {
        // ignore
      }
      readerRef.current = null;
    }
  }

  async function disconnectPort() {
    await stopReading();
    if (port) {
      try {
        await port.close();
      } catch (e) {
        console.warn("Port close error", e);
      }
    }
    setConnected(false);
    setIsRecording(false);
    setStatusText("Disconnected.");
  }

  async function writeCommand(cmd) {
    if (!port || !port.writable) {
      setStatusText("Port not connected.");
      return;
    }
    const encoder = new TextEncoder();
    const writer = port.writable.getWriter();
    try {
      await writer.write(encoder.encode(cmd + "\n"));
    } catch (e) {
      console.warn("write error", e);
      setStatusText("Write failed.");
    } finally {
      writer.releaseLock();
    }
  }

  // ---- reading & parsing ----

  function handleSerialLine(line) {
    const trimmed = line.trim();
    if (!trimmed) return;

    // 1) Stream points: "x,y" in cm → convert to mm and draw when recording
    if (/^-?\d+(\.\d+)?\s*,\s*-?\d+(\.\d+)?$/.test(trimmed)) {
      const [xs, ys] = trimmed.split(",");
      const x_cm = parseFloat(xs);
      const y_cm = parseFloat(ys);
      if (!isFinite(x_cm) || !isFinite(y_cm)) return;

      // cm → mm: 10cm => 100mm
      const p = { x: x_cm * 10, y: y_cm * 10 };

      // use ref so the async reader sees latest recording state
      if (isRecordingRef.current) {
        batchRef.current.push(p);
        if (batchRef.current.length >= BATCH_SIZE) {
          const batch = batchRef.current.splice(0, batchRef.current.length);
          addPoints(batch);
        }
      }

      // always keep last position up to date
      setLastPosition({ x: p.x, y: p.y });
      return;
    }

    // 2) Status line: "Status: Recording=NO"
    if (trimmed.startsWith("Status:")) {
      setStatusText(trimmed);
      const match = trimmed.match(/Recording\s*=\s*(YES|NO)/i);
      if (match) setIsRecording(match[1].toUpperCase() === "YES");
      return;
    }

    // 3) Position (mm): X=.. Y=..  (already in mm)
    if (trimmed.startsWith("Position (mm):")) {
      const mx = trimmed.match(/X\s*=\s*([-0-9.]+)/i);
      const my = trimmed.match(/Y\s*=\s*([-0-9.]+)/i);
      if (mx && my) {
        const x = parseFloat(mx[1]);
        const y = parseFloat(my[1]);
        if (isFinite(x) && isFinite(y)) {
          setLastPosition({ x, y });

          if (singleShotPendingRef.current) {
            // Take point: single-shot from status
            addPoints([{ x, y }]);
            singleShotPendingRef.current = false;
            setStatusText(
              `Single point: x=${x.toFixed(2)}mm, y=${y.toFixed(2)}mm`
            );
          } else {
            setStatusText(`Position mm: x=${x.toFixed(2)}, y=${y.toFixed(2)}`);
          }
        }
      }
      return;
    }

    // 4) Recording markers
    if (/Recording started/i.test(trimmed)) {
      setIsRecording(true);
      setStatusText("Recording started.");
      return;
    }
    if (/Recording stopped/i.test(trimmed)) {
      setIsRecording(false);
      setStatusText("Recording stopped.");
      // flush any remaining batch
      if (batchRef.current.length) {
        addPoints(batchRef.current);
        batchRef.current = [];
      }
      return;
    }

    // Raw / Queue / command echoes — ignore
  }

  function processChunkString(chunkStr) {
    let s = textBufferRef.current + chunkStr;
    const lines = s.split(/\r?\n/);
    textBufferRef.current = lines.pop() || "";
    for (const line of lines) {
      try {
        handleSerialLine(line);
      } catch (e) {
        console.warn("parse error", e);
      }
    }
  }

  async function startReading() {
    if (!port || !port.readable) return;
    keepReadingRef.current = true;
    const reader = port.readable.getReader();
    readerRef.current = reader;
    const decoder = new TextDecoder();

    (async () => {
      try {
        while (keepReadingRef.current) {
          const { value, done } = await reader.read();
          if (done) break;
          if (value) {
            const text = decoder.decode(value, { stream: true });
            processChunkString(text);
          }
        }
      } catch (e) {
        console.error("read loop error", e);
        setStatusText("Serial read error.");
      } finally {
        try {
          reader.releaseLock();
        } catch (_) {}
        readerRef.current = null;
      }
    })();
  }

  // cleanup on unmount
  useEffect(() => {
    return () => {
      stopReading();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---- UI button handlers ----

  const onRecord = async () => {
    if (!connected) {
      setStatusText("Not connected.");
      return;
    }
    setIsRecording(true); // this also updates isRecordingRef via useEffect
    batchRef.current = [];
    await writeCommand("record");
    setStatusText("Recording...");
  };

  const onStop = async () => {
    if (!connected) {
      setStatusText("Not connected.");
      return;
    }
    setIsRecording(false); // also updates isRecordingRef
    await writeCommand("stop");
    if (batchRef.current.length) {
      addPoints(batchRef.current);
      batchRef.current = [];
    }
    setStatusText("Recording stopped.");
  };

  const onTakePoint = async () => {
    if (!connected) {
      setStatusText("Not connected.");
      return;
    }
    // Use "status" + Position(mm) as single snapshot from controller
    singleShotPendingRef.current = true;
    await writeCommand("status");
    setStatusText("Requesting single point...");
  };

  const onStatus = async () => {
    if (!connected) {
      setStatusText("Not connected.");
      return;
    }
    await writeCommand("status");
    setStatusText("Status requested...");
  };

  const handleClose = async () => {
    if (isRecordingRef.current) {
      await onStop();
    }
    onClose();
  };

  return (
    <div className="absolute top-4 right-4 w-80 bg-surface border border-gray-700 rounded-xl shadow-xl p-4 text-xs flex flex-col gap-3 z-40">
      <div className="flex items-center justify-between mb-1">
        <div className="text-sm font-semibold">Input Stream (Serial)</div>
        <button
          className="text-xs px-2 py-1 rounded bg-gray-800 hover:bg-gray-700"
          onClick={handleClose}
        >
          ✕
        </button>
      </div>

      {!hasSerial && (
        <div className="text-red-400 text-xs">
          Web Serial not supported. Use Chrome/Edge over HTTPS.
        </div>
      )}

      {hasSerial && (
        <>
          {/* Port & baud */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <button
                className="px-2 py-1 rounded bg-primary text-white text-[11px]"
                onClick={selectPort}
              >
                Select Port
              </button>
              <span className="text-[11px]">
                Port: {port ? "selected" : "none"}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-[11px]">Baud</label>
              <select
                value={baud}
                onChange={(e) => setBaud(Number(e.target.value))}
                className="bg-gray-900 border border-gray-700 rounded px-2 py-1 text-[11px]"
              >
                <option value={9600}>9600</option>
                <option value={19200}>19200</option>
                <option value={38400}>38400</option>
                <option value={57600}>57600</option>
                <option value={115200}>115200</option>
                <option value={230400}>230400</option>
              </select>

              <button
                className="px-2 py-1 rounded bg-emerald-600 text-white text-[11px]"
                onClick={connected ? disconnectPort : connectPort}
                disabled={!port}
              >
                {connected ? "Disconnect" : "Connect"}
              </button>
            </div>
            <div className="text-[11px]">
              Status:{" "}
              <span className={connected ? "text-emerald-400" : "text-red-400"}>
                {connected ? "Connected" : "Not Connected"}
              </span>
              {" • "}
              Recording:{" "}
              <span
                className={isRecording ? "text-amber-400" : "text-gray-300"}
              >
                {isRecording ? "ON" : "OFF"}
              </span>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex flex-wrap gap-2 mt-1">
            <button
              className="px-3 py-1 rounded bg-emerald-600 text-white text-[11px]"
              onClick={onRecord}
              disabled={!connected}
            >
              Record
            </button>
            <button
              className="px-3 py-1 rounded bg-red-600 text-white text-[11px]"
              onClick={onStop}
              disabled={!connected}
            >
              Stop
            </button>
            <button
              className="px-3 py-1 rounded bg-blue-600 text-white text-[11px]"
              onClick={onTakePoint}
              disabled={!connected}
            >
              Take point
            </button>
            <button
              className="px-3 py-1 rounded bg-gray-700 text-white text-[11px]"
              onClick={onStatus}
              disabled={!connected}
            >
              Status
            </button>
          </div>

          {/* Info */}
          <div className="mt-2 space-y-1">
            <div className="text-[11px] text-gray-300">
              Last position (mm):{" "}
              {lastPosition
                ? `x=${lastPosition.x.toFixed(2)}, y=${lastPosition.y.toFixed(
                    2
                  )}`
                : "—"}
            </div>
            <div className="text-[11px] text-gray-400">{statusText}</div>
          </div>
        </>
      )}
    </div>
  );
}
