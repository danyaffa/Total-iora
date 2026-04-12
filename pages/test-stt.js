// FILE: /pages/test-stt.js
// Standalone STT diagnostic page. Records audio from the mic, sends it
// directly to /api/stt with debug: true, and displays the full raw JSON
// response — no OracleVoice, no persona logic, no path resolution, no
// voice synthesis. Just: did the recording get captured, what was sent
// to the server, and what did the server return.
//
// Visit: /test-stt
// Requires: browser with MediaRecorder + microphone permission.
// Deployable: normal Next.js page, no admin gate.
import { useState, useRef } from "react";
import Head from "next/head";

export default function TestStt() {
  const [recording, setRecording] = useState(false);
  const [status, setStatus] = useState("Click Start to begin recording.");
  const [response, setResponse] = useState(null);
  const [clientInfo, setClientInfo] = useState(null);
  const recRef = useRef(null);
  const streamRef = useRef(null);
  const chunksRef = useRef([]);
  const mimeRef = useRef("");

  function bestMime() {
    const M = window.MediaRecorder;
    if (M.isTypeSupported?.("audio/mp4;codecs=aac")) return "audio/mp4;codecs=aac";
    if (M.isTypeSupported?.("audio/webm;codecs=opus")) return "audio/webm;codecs=opus";
    if (M.isTypeSupported?.("audio/webm")) return "audio/webm";
    if (M.isTypeSupported?.("audio/ogg;codecs=opus")) return "audio/ogg;codecs=opus";
    return "audio/webm";
  }

  async function onStart() {
    setResponse(null);
    setClientInfo(null);
    setStatus("Requesting microphone permission…");
    try {
      if (typeof window === "undefined" || typeof window.MediaRecorder !== "function") {
        setStatus("ERROR: MediaRecorder not supported in this browser.");
        return;
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { channelCount: 1, noiseSuppression: true, echoCancellation: true },
      });
      streamRef.current = stream;

      const mime = bestMime();
      mimeRef.current = mime;
      const rec = new MediaRecorder(stream, { mimeType: mime });
      chunksRef.current = [];
      rec.ondataavailable = (e) => {
        if (e.data?.size) chunksRef.current.push(e.data);
      };
      rec.onerror = (e) => {
        setStatus(`Recorder error: ${String(e?.error?.message || e?.error || e)}`);
      };
      rec.start();
      recRef.current = rec;
      setRecording(true);
      setStatus(`Recording… (mime: ${mime}). Speak a short sentence, then click Stop.`);
    } catch (err) {
      setStatus(`Mic error: ${String(err?.message || err)}`);
    }
  }

  async function onStop() {
    const rec = recRef.current;
    const stream = streamRef.current;
    if (!rec) return;
    setStatus("Stopping recorder…");

    await new Promise((resolve) => {
      rec.onstop = resolve;
      try {
        rec.stop();
      } catch {
        resolve();
      }
    });
    try {
      stream?.getTracks?.().forEach((t) => t.stop());
    } catch {}
    setRecording(false);

    const chunks = chunksRef.current;
    const mime = mimeRef.current;
    if (!chunks.length) {
      setStatus("No audio chunks were captured. Check mic permission.");
      return;
    }

    setStatus("Encoding audio…");
    const blob = new Blob(chunks, { type: mime });
    const blobSize = blob.size;
    const buf = await blob.arrayBuffer();
    const bytes = new Uint8Array(buf);
    let bin = "";
    for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
    const b64 = btoa(bin);

    const clientSummary = {
      chunkCount: chunks.length,
      blobSize,
      base64Size: b64.length,
      mime,
      firstChunkBytes: chunks[0]?.size || 0,
    };
    setClientInfo(clientSummary);

    setStatus("Posting to /api/stt with debug: true …");
    const started = Date.now();
    try {
      const r = await fetch("/api/stt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ b64, mime, lang: "auto", debug: true }),
      });
      const ms = Date.now() - started;
      const data = await r.json().catch(() => ({ parseError: "response was not JSON" }));
      setResponse({
        httpStatus: r.status,
        httpOk: r.ok,
        roundTripMs: ms,
        body: data,
      });
      setStatus(`Done. HTTP ${r.status} in ${ms}ms.`);
    } catch (err) {
      setResponse({ networkError: String(err?.message || err) });
      setStatus(`Network error: ${String(err?.message || err)}`);
    }
  }

  return (
    <div className="wrap">
      <Head>
        <title>STT Diagnostic — Total-iora</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <main>
        <h1>STT Diagnostic</h1>
        <p className="lead">
          Records audio from your mic and POSTs it directly to <code>/api/stt</code>
          {" "}with <code>debug: true</code>. Shows exactly what was sent and what
          the server returned — no OracleVoice, no heritage logic, no styling in the
          way.
        </p>

        <div className="controls">
          {!recording ? (
            <button className="btn start" onClick={onStart}>
              🎙️ Start recording
            </button>
          ) : (
            <button className="btn stop" onClick={onStop}>
              ⏹ Stop &amp; send to /api/stt
            </button>
          )}
        </div>

        <div className="status">{status}</div>

        {clientInfo && (
          <section>
            <h2>What the client sent</h2>
            <pre>{JSON.stringify(clientInfo, null, 2)}</pre>
          </section>
        )}

        {response && (
          <section>
            <h2>What the server returned</h2>
            <pre>{JSON.stringify(response, null, 2)}</pre>
          </section>
        )}

        <section className="help">
          <h2>How to read the result</h2>
          <ul>
            <li>
              <strong><code>body.text</code></strong> — the transcription. If this is
              non-empty, STT works. Congrats, you can stop reading.
            </li>
            <li>
              <strong><code>body.provider</code></strong> — which AI answered:{" "}
              <code>"openai"</code>, <code>"gemini"</code>, or <code>null</code>.
            </li>
            <li>
              <strong><code>body.reason</code></strong> — if the server returned
              without calling a provider. Only value is{" "}
              <code>"audio_too_small"</code> which means the recorded blob was
              under 256 bytes (mic didn't actually open).
            </li>
            <li>
              <strong><code>body.diagnostics.openaiError</code></strong> — the
              verbatim error from OpenAI, if it was tried and failed. Look for{" "}
              <code>invalid_api_key</code>, <code>insufficient_quota</code>,{" "}
              <code>model_not_found</code>.
            </li>
            <li>
              <strong><code>body.diagnostics.geminiError</code></strong> — same
              for Gemini.
            </li>
            <li>
              <strong><code>httpStatus</code></strong> — 200 = success or
              intentional empty; 503 = both providers failed (see{" "}
              <code>body.debug_hint</code>); anything else = unexpected.
            </li>
          </ul>
        </section>
      </main>

      <style jsx>{`
        .wrap {
          min-height: 100vh;
          background: #f8fafc;
          padding: 32px 16px;
          font-family: ui-sans-serif, system-ui, -apple-system, sans-serif;
        }
        main {
          max-width: 820px;
          margin: 0 auto;
          background: #fff;
          border: 1px solid #e2e8f0;
          border-radius: 16px;
          padding: 24px;
          box-shadow: 0 10px 30px rgba(2, 6, 23, 0.06);
        }
        h1 {
          margin: 0 0 8px;
          color: #0f172a;
          font-size: 1.7rem;
        }
        h2 {
          margin: 20px 0 8px;
          color: #0f172a;
          font-size: 1.1rem;
        }
        .lead {
          color: #475569;
          margin: 0 0 16px;
        }
        .controls {
          display: flex;
          gap: 12px;
          margin: 16px 0;
        }
        .btn {
          padding: 14px 22px;
          border-radius: 12px;
          font-weight: 700;
          font-size: 1rem;
          cursor: pointer;
          border: none;
          color: #fff;
        }
        .btn.start {
          background: linear-gradient(135deg, #7c3aed, #14b8a6);
        }
        .btn.stop {
          background: #111827;
        }
        .status {
          padding: 12px 14px;
          background: #f1f5f9;
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          color: #334155;
          font-weight: 600;
          margin-top: 8px;
        }
        pre {
          background: #0f172a;
          color: #e2e8f0;
          padding: 14px;
          border-radius: 10px;
          overflow-x: auto;
          font-size: 0.85rem;
          line-height: 1.5;
        }
        code {
          background: #f1f5f9;
          padding: 1px 6px;
          border-radius: 4px;
          font-size: 0.88rem;
          color: #0f172a;
        }
        .help {
          margin-top: 24px;
          padding: 16px;
          background: #fef9c3;
          border: 1px solid #fde68a;
          border-radius: 10px;
        }
        .help ul {
          margin: 8px 0 0;
          padding-left: 20px;
          color: #334155;
          line-height: 1.7;
        }
      `}</style>
    </div>
  );
}
