// FILE: /components/VolumeControl.js
import { useEffect, useRef, useState } from 'react';

/**
 * VolumeControl (with boost up to 400%)
 * - targetElementId: id of <audio> or <video> element to control
 * - persists last gain in localStorage ("adl_gain")
 *
 * Usage:
 *   <audio id="global-media" src="/sample.mp3" controls />
 *   <VolumeControl targetElementId="global-media" />
 */
export default function VolumeControl({ targetElementId }) {
  const ctxRef = useRef(null);
  const sourceRef = useRef(null);
  const gainRef = useRef(null);
  const [available, setAvailable] = useState(false);
  const [gainPct, setGainPct] = useState(() => {
    if (typeof window === 'undefined') return 100;
    const saved = parseInt(localStorage.getItem('adl_gain') || '100', 10);
    return Number.isFinite(saved) ? Math.min(Math.max(saved, 0), 400) : 100;
  });

  useEffect(() => {
    const el = document.getElementById(targetElementId);
    if (!el) return;

    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const source = ctx.createMediaElementSource(el);
      const gain = ctx.createGain();

      // Map percent 0–400 to gain 0.0–4.0
      gain.gain.value = gainPct / 100;

      source.connect(gain).connect(ctx.destination);

      ctxRef.current = ctx;
      sourceRef.current = source;
      gainRef.current = gain;
      setAvailable(true);

      // Resume context on user gesture (mobile autoplay policies)
      const resume = () => {
        if (ctx.state === 'suspended') ctx.resume();
      };
      el.addEventListener('play', resume, { once: true });

      return () => {
        try {
          el.removeEventListener('play', resume);
          if (source) source.disconnect();
          if (gain) gain.disconnect();
          if (ctx && ctx.state !== 'closed') ctx.close();
        } catch {}
      };
    } catch {
      setAvailable(false);
    }
  }, [targetElementId]);

  useEffect(() => {
    if (gainRef.current) {
      gainRef.current.gain.value = gainPct / 100;
      if (typeof window !== 'undefined') {
        localStorage.setItem('adl_gain', String(gainPct));
      }
    }
  }, [gainPct]);

  if (!available) {
    return (
      <div className="mt-3 text-sm text-gray-500">
        Volume boost unavailable on this device/browser.
      </div>
    );
  }

  return (
    <div className="mt-4 p-3 rounded-xl border border-gray-200 bg-white max-w-md">
      <label htmlFor="adl-gain" className="block text-sm font-medium mb-2">
        Volume Booster (0–400%)
      </label>
      <input
        id="adl-gain"
        type="range"
        min={0}
        max={400}
        step={5}
        value={gainPct}
        onChange={(e) => setGainPct(parseInt(e.target.value, 10))}
        className="w-full"
      />
      <div className="mt-2 text-sm text-gray-700">
        Current: <span className="font-semibold">{gainPct}%</span>
      </div>
      <p className="mt-1 text-xs text-gray-500">
        Boosts audio above 100% using Web Audio (GainNode). May cause distortion at very high levels.
      </p>
    </div>
  );
}
