import React, { useEffect, useRef, useState, useContext } from "react";
import Modal from "../../ui/Modal";
import { SceneContext } from "../../../contexts/SceneContext";
import { parsePoints } from "../../../utils/parsePoints";

/**
 * StreamImportModal
 * - Requests a serial port (navigator.serial.requestPort)
 * - Lets user set baud rate
 * - Start/Stop stream: when recording we send "record" command to device, on stop we send "stop"
 * - Reads incoming text stream, parses lines incrementally, batches points to SceneContext.addPoints(batch)
 * - Non-blocking: batches of ~200 points by default
 */

export default function StreamImportModal({ isOpen, onClose }) {
  const { addPoints } = useContext(SceneContext);
  const [port, setPort] = useState(null);
  const [baud, setBaud] = useState(115200);
  const [isRecording, setIsRecording] = useState(false);
  const [status, setStatus] = useState("idle");
  const readerRef = useRef(null);
  const keepReadingRef = useRef(false);
  const textBufferRef = useRef(""); // leftover text between chunks
  const batchBufferRef = useRef([]);
  const BATCH_SIZE = 200; // tune this for performance

  useEffect(() => {
    return () => {
      // cleanup on unmount
      stopReading();
      if (port && port.close) {
        try {
          port.close();
        } catch (e) {}
      }
    };
    // eslint-disable-next-line
  }, []);

  if (!isOpen) return null;

  const supported = !!(navigator && navigator.serial);

  const onRequestPort = async () => {
    try {
      const p = await navigator.serial.requestPort(); // user picks device
      setPort(p);
      setStatus("port-selected");
    } catch (err) {
      console.error(err);
      setStatus("port-failed");
    }
  };

  async function startReading() {
    if (!port) {
      setStatus("no-port");
      return;
    }
    try {
      await port.open({ baudRate: Number(baud) });
    } catch (err) {
      console.error("Failed to open port", err);
      setStatus("open-failed");
      return;
    }

    setIsRecording(true);
    setStatus("recording");
    keepReadingRef.current = true;

    // writer to send commands
    const textEncoder = new TextEncoderStream();
    const writableStreamClosed = textEncoder.readable.pipeTo(port.writable);
    const writer = textEncoder.writable.getWriter();

    // send "record" command to device if it expects it
    try {
      writer.write("record\n");
    } catch (e) {
      console.warn(e);
    }

    // reading via TextDecoderStream
    const decoder = new TextDecoderStream();
    const inputDone = port.readable.pipeTo(decoder.writable);
    const inputStream = decoder.readable;
    const reader = inputStream.getReader();
    readerRef.current = reader;

    // incremental read loop (non-blocking)
    (async () => {
      try {
        while (keepReadingRef.current) {
          const { value, done } = await reader.read();
          if (done) break;
          if (value) {
            // append chunk
            processChunk(value);
          }
          // let the event loop breathe
          await new Promise((r) => setTimeout(r, 0));
        }
      } catch (err) {
        console.error("Read loop error", err);
        setStatus("read-error");
      } finally {
        try {
          reader.releaseLock();
        } catch (e) {}
      }
    })();
  }

  function stopReading() {
    keepReadingRef.current = false;
    setIsRecording(false);
    setStatus("stopped");

    // attempt to send "stop" command
    (async () => {
      try {
        if (port && port.writable) {
          const encoder = new TextEncoder();
          const writer = port.writable.getWriter();
          await writer.write(encoder.encode("stop\n"));
          writer.releaseLock();
        }
      } catch (err) {
        console.warn("stop command failed", err);
      }
    })();

    // flush remaining buffer
    flushBatch();
    // close reader
    try {
      if (readerRef.current) {
        readerRef.current.cancel();
        readerRef.current = null;
      }
    } catch (e) {}
  }

  // process incoming text chunk - split into lines and parse lines that contain coords,
  // store partial line in textBufferRef
  function processChunk(chunk) {
    // common chunk: may contain many lines
    let s = textBufferRef.current + chunk;
    const lines = s.split(/\r?\n/);
    // last item may be incomplete; keep in buffer
    textBufferRef.current = lines.pop() || "";

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      // parse single-line using parsePoints by feeding a single-line string
      try {
        const parsed = parsePoints(trimmed);
        if (parsed && parsed.length) {
          // add to batch buffer
          for (const p of parsed) {
            batchBufferRef.current.push(p);
            if (batchBufferRef.current.length >= BATCH_SIZE) {
              // push to scene and clear
              const toPush = batchBufferRef.current.splice(
                0,
                batchBufferRef.current.length
              );
              addPoints(toPush);
            }
          }
        }
      } catch (err) {
        // ignore parse errors for single lines or log them
        console.warn("parse error for line", trimmed, err);
      }
    }
  }

  // flush any remaining batched points
  function flushBatch() {
    if (batchBufferRef.current.length > 0) {
      const leftover = batchBufferRef.current.splice(
        0,
        batchBufferRef.current.length
      );
      addPoints(leftover);
    }
  }

  const onSendStatus = async () => {
    if (!port || !port.writable) {
      setStatus("no-port-writer");
      return;
    }
    try {
      const encoder = new TextEncoder();
      const writer = port.writable.getWriter();
      await writer.write(encoder.encode("status\n"));
      writer.releaseLock();
      setStatus("status-sent");
    } catch (err) {
      console.warn(err);
      setStatus("status-failed");
    }
  };

  return (
    <Modal
      title="Import Stream (Serial)"
      onClose={() => {
        stopReading();
        onClose();
      }}
    >
      {!supported && (
        <div className="text-sm text-red-400 mb-3">
          Web Serial API not available in this browser. Use Chrome/Edge on
          secure origin.
        </div>
      )}

      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <button
            className="px-3 py-1 rounded bg-primary text-white"
            onClick={onRequestPort}
          >
            Select Port
          </button>
          <div className="text-sm text-muted">
            Selected: {port ? "Yes" : "No"}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-sm">Baud</label>
          <select
            value={baud}
            onChange={(e) => setBaud(Number(e.target.value))}
            className="bg-surface rounded px-2 py-1"
          >
            <option value={9600}>9600</option>
            <option value={19200}>19200</option>
            <option value={38400}>38400</option>
            <option value={57600}>57600</option>
            <option value={115200}>115200</option>
            <option value={230400}>230400</option>
          </select>

          <button
            className="px-3 py-1 rounded bg-green-600 text-white"
            onClick={startReading}
            disabled={!port || isRecording}
          >
            Record
          </button>
          <button
            className="px-3 py-1 rounded bg-red-600 text-white"
            onClick={stopReading}
            disabled={!isRecording}
          >
            Stop
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            className="px-3 py-1 rounded bg-gray-700 text-white"
            onClick={onSendStatus}
            disabled={!port}
          >
            Send Status
          </button>
          <div className="text-sm text-muted ml-2">
            Status: <span className="font-mono">{status}</span>
          </div>
        </div>

        <div className="text-xs text-gray-400">
          Notes: incoming data is parsed line-by-line and appended in batches
          (batch size {BATCH_SIZE}) to the scene so the page won't hang. If your
          device expects different commands replace "record" / "stop" strings
          accordingly.
        </div>
      </div>
    </Modal>
  );
}
