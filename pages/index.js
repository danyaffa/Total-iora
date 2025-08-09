// FILE: /pages/index.js
import Link from "next/link";
import Footer from "../components/Footer";
import { Crescent, Cross, StarOfDavid, Om, Candle } from "../components/Icons";
import { useMemo, useState, useEffect, useRef } from "react";

/* ------------ Voice: continuous, manual stop + visualizers ------------ */
function ChatVoicePro({ path }) {
  const [listening, setListening] = useState(false);
  const [liveText, setLiveText] = useState("");
  const [reply, setReply] = useState("");
  const [replying, setReplying] = useState(false);
  const [speaking, setSpeaking] = useState(false);

  const recRef = useRef(null);
  const audioRef = useRef({ ctx: null, analyser: null, src: null, animId: null, stream: null });
  const canvasRef = useRef(null);

  // Setup / teardown audio analyser for the listening orb
  const startMicViz = async () => {
    if (typeof window === "undefined" || !navigator.mediaDevices) return;
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 512;
    const src = ctx.createMediaStreamSource(stream);
    src.connect(analyser);

    const data = new Uint8Array(analyser.frequencyBinCount);
    const canvas = canvasRef.current;
    const c = canvas.getContext("2d");

    const draw = () => {
      analyser.getByteFrequencyData(data);
      const avg = data.reduce((a, b) => a + b, 0) / data.length; // 0..255
      const radius = 28 + (avg / 255) * 36; // pulsing

      const w = canvas.width;
      const h = canvas.height;
      c.clearRect(0, 0, w, h);

      // Glow
      const g = c.createRadialGradient(w / 2, h / 2, radius * 0.2, w / 2, h / 2, radius);
      g.addColorStop(0, "rgba(99,102,241,.95)");
      g.addColorStop(1, "rgba(99,102,241,0)");
      c.fillStyle = g;
      c.beginPath();
      c.arc(w / 2, h / 2, radius, 0, Math.PI * 2);
      c.fill();

      audioRef.current.animId = requestAnimationFrame(draw);
    };
    draw();

    audioRef.current = { ctx, analyser, src, animId: audioRef.current.animId, stream };
  };

  const stopMicViz = () => {
    cancelAnimationFrame(audioRef.current.animId || 0);
    try { audioRef.current.ctx && audioRef.current.ctx.close(); } catch {}
    try {
      if (audioRef.current.stream) {
        audioRef.current.stream.getTracks().forEach(t => t.stop());
      }
    } catch {}
    audioRef.current = { ctx: null, analyser: null, src: null, animId: null, stream: null };
    const c = canvasRef.current?.getContext?.("2d");
    if (c) c.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
  };

  // Initialize SpeechRecognition on demand
  const ensureRecognizer = () => {
    if (recRef.current) return recRef.current;
    const SR =
      typeof window !== "undefined" &&
      (window.SpeechRecognition || window.webkitSpeechRecognition);
    if (!SR) {
      alert("Voice recognition is not supported on this browser.");
      return null;
    }
    const rec = new SR();
    rec.lang = "en-US";
    rec.interimResults = true;       // show partials while you talk
    rec.continuous = true;           // don't stop on pauses
    rec.maxAlternatives = 1;

    // Build up the live transcript; we send it when YOU press Stop
    rec.onresult = (e) => {
      let text = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        text += e.results[i][0].transcript + (e.results[i].isFinal ? " " : "");
      }
      setLiveText((prev) => (text ? (prev + " " + text).trim() : prev));
    };

    // Chromium sometimes ends automatically; if you're still in listening mode, restart
    rec.onend = () => {
      if (listening) {
        try { rec.start(); } catch {}
      }
    };

    recRef.current = rec;
    return rec;
  };

  const onStart = async () => {
    setReply(""); // clear old reply
    setLiveText("");
    const rec = ensureRecognizer();
    if (!rec) return;
    try {
      await startMicViz();
      setListening(true);
      rec.start();
    } catch {
      setListening(false);
      stopMicViz();
      alert("Microphone permission denied or unavailable.");
    }
  };

  const onStop = async () => {
    setListening(false);
    try { recRef.current && recRef.current.stop(); } catch {}
    stopMicViz();

    const text = liveText.trim();
    if (!text) return;

    setReplying(true);
    try {
      const r = await fetch("/api/auracode-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, path }),
      });
      const data = await r.json();
      const msg = data?.reply || "I’m here with you.";
      setReply(msg);

      if ("speechSynthesis" in window) {
        const u = new SpeechSynthesisUtterance(msg);
        u.onstart = () => setSpeaking(true);
        u.onend = () => setSpeaking(false);
        window.speechSynthesis.cancel();
        window.speechSynthesis.speak(u);
      }
    } catch {
      setReply("Connection issue. Please try again.");
    } finally {
      setReplying(false);
    }
  };

  return (
    <div className="voice">
      <div className="controls">
        <button onClick={listening ? onStop : onStart} className="
