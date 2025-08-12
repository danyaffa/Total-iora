// FILE: /pages/homepage.js
import { useEffect, useRef, useState, useCallback } from "react";

/* ---------- optional quick source templates ---------- */
const SRC_LINK = {
  sefaria: (ref) => `https://www.sefaria.org/${encodeURIComponent(ref)}?lang=bi`,
  quran: (surah, ayah) => `https://quran.com/${surah}/${ayah}`,
  gutenberg: (bookId) => `https://www.gutenberg.org/ebooks/${bookId}`,
};

export default function HomePage() {
  /* ---- UI state ---- */
  const [language, setLanguage] = useState("auto");
  const [subject, setSubject] = useState("General");
  const [fixGrammar, setFixGrammar] = useState(false);

  const [youText, setYouText] = useState("");
  const [guideText, setGuideText] = useState("");
  const [listening, setListening] = useState(false);
  const [volume, setVolume] = useState(0.9);

  /* ---- Sources state ---- */
  const [sources, setSources] = useState([]); // [{label, url}]
  const [showSourceForm, setShowSourceForm] = useState(false);
  const [srcType, setSrcType] = useState("custom");
  const [srcA, setSrcA] = useState("");   // e.g., "Berakhot 2a" or surah
  const [srcB, setSrcB] = useState("");   // e.g., ayah or Gutenberg id
  const [srcLabel, setSrcLabel] = useState("");
  const [srcUrl, setSrcUrl] = useState("");

  /* ---- Speech Recognition (mobile-safe) ---- */
  const recRef = useRef(null);
  const finalRef = useRef("");       // accumulated final transcript
  const interimRef = useRef("");     // current interim segment
  const [speechAvailable, setSpeechAvailable] = useState(true);

  useEffect(() => {
    const SR = typeof window !== "undefined" &&
      (window.SpeechRecognition || window.webkitSpeechRecognition);
    if (!SR) setSpeechAvailable(false);
  }, []);

  const startListening = useCallback(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;

    // Fresh instance every run (avoids stale handlers & mobile quirks)
    const rec = new SR();
    rec.lang = language === "auto" ? (navigator.language || "en-US") : language;
    rec.continuous = true;          // Android Chrome OK; iOS uses webkit*
    rec.interimResults = true;
    rec.maxAlternatives = 1;

    finalRef.current = youText ? youText + " " : "";
    interimRef.current = "";

    rec.onresult = (e) => {
      let final = finalRef.current;
      let interim = "";

      // Process only the new chunk(s) starting at resultIndex
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const res = e.results[i];
        const txt = res[0]?.transcript || "";
        if (res.isFinal) {
          final += txt + " ";
        } else {
          interim = txt; // only keep the latest interim
        }
      }

      finalRef.current = final;
      interimRef.current = interim;
      setYouText(final + interim);
    };

    rec.onend = () => {
      // User may have stopped; keep whatever we had (no auto-restart)
      setListening(false);
    };
    rec.onerror = () => {
      setListening(false);
    };

    recRef.current = rec;
    setListening(true);
    rec.start();
  }, [language, youText]);

  const stopListening = useCallback(() => {
    try {
      recRef.current?.stop();
    } catch (_) {}
    setListening(false);
  }, []);

  /* ---- Cancel “auto-correct” but keep red squiggles ----
     We DO NOT touch your text unless 'Fix my grammar' is checked.
  */
  const maybeFixGrammar = async (text) => {
    if (!fixGrammar) return text;
    // If you have a server route, call it here. For now, return original.
    // Example:
    // const res = await fetch("/api/fix-grammar", { method: "POST", body: JSON.stringify({ text })});
    // const { fixed } = await res.json();
    // return fixed || text;
    return text;
  };

  const handleGetAnswer = useCallback(async () => {
    const clean = await maybeFixGrammar(youText.trim());
    // TODO: integrate your existing backend call here and setGuideText(awaitResponse)
    // For now, we just echo the cleaned prompt so the UI stays stable.
    setGuideText(
      clean
        ? `(demo) You asked:\n\n${clean}\n\n— Add your backend call to replace this.`
        : "Please write or speak a question."
    );
  }, [youText, fixGrammar]);

  /* ---- Sources helpers ---- */
  const addSource = () => {
    let url = srcUrl.trim();
    let label = srcLabel.trim();

    if (srcType !== "custom") {
      if (srcType === "sefaria" && srcA) {
        url = SRC_LINK.sefaria(srcA);
        label = label || `Sefaria • ${srcA}`;
      }
      if (srcType === "quran" && srcA && srcB) {
        url = SRC_LINK.quran(srcA, srcB);
        label = label || `Qur'an ${srcA}:${srcB}`;
      }
      if (srcType === "gutenberg" && srcA) {
        url = SRC_LINK.gutenberg(srcA);
        label = label || `Project Gutenberg #${srcA}`;
      }
    }
    if (!url) return;

    setSources((prev) => [...prev, { label: label || url, url }]);
    // reset fields
    setSrcA(""); setSrcB(""); setSrcLabel(""); setSrcUrl("");
    setSrcType("custom");
    setShowSourceForm(false);
  };

  /* ---- UI ---- */
  return (
    <main className="min-h-screen bg-[#fafafa] text-[#1b1b1b]">
      <section className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
        <h1 className="text-2xl font-semibold mb-2">
          Write or Speak to the Oracle
        </h1>

        <div className="flex flex-wrap gap-6">
          {/* LEFT: You */}
          <div className="flex-1 min-w-[300px]">
            <label className="block text-sm font-medium mb-2">You</label>
            <textarea
              value={youText}
              onChange={(e) => setYouText(e.target.value)}
              rows={8}
              className="w-full rounded-xl border border-[#ddd] p-3 leading-6 outline-none focus:ring"
              /* Keep red underline while blocking auto-correct/auto-capitalize */
              spellCheck={true}
              autoCorrect="off"
              autoCapitalize="off"
              autoComplete="off"
              inputMode="text"
            />

            <div className="flex items-center gap-4 mt-3">
              {speechAvailable ? (
                listening ? (
                  <button
                    onClick={stopListening}
                    className="px-4 py-2 rounded-xl bg-[#eee] border border-[#ddd]"
                    aria-label="Stop recording"
                  >
                    ⏹ Stop
                  </button>
                ) : (
                  <button
                    onClick={startListening}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#6a4df5] to-[#18c3b2] text-white"
                    aria-label="Start recording"
                  >
                    🎤 Start
                  </button>
                )
              ) : (
                <span className="text-sm text-[#777]">Speech not supported on this device.</span>
              )}

              <button
                onClick={handleGetAnswer}
                className="px-4 py-2 rounded-xl border border-[#ddd] hover:bg-[#f4f4f4]"
              >
                Get Answer →
              </button>
            </div>

            <div className="mt-3 flex items-center gap-3">
              <label className="flex items-center gap-2 text-sm select-none">
                <input
                  type="checkbox"
                  checked={fixGrammar}
                  onChange={(e) => setFixGrammar(e.target.checked)}
                />
                Fix my grammar (manual only)
              </label>

              <div className="flex items-center gap-2 text-sm">
                <span>Guide voice volume:</span>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={volume}
                  onChange={(e) => setVolume(Number(e.target.value))}
                />
              </div>
            </div>
          </div>

          {/* RIGHT: Guide */}
          <div className="flex-1 min-w-[300px]">
            <label className="block text-sm font-medium mb-2">Guide</label>
            <div className="w-full min-h-[208px] rounded-xl border border-[#ddd] p-3 whitespace-pre-wrap">
              {guideText || "—"}
            </div>

            {/* Sources */}
            <div className="mt-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium">Sources</h3>
                <button
                  onClick={() => setShowSourceForm((v) => !v)}
                  className="px-3 py-1.5 rounded-lg border border-[#ddd] hover:bg-[#f7f7f7]"
                >
                  + Add source
                </button>
              </div>

              {showSourceForm && (
                <div className="rounded-xl border border-[#ddd] p-3 mb-3">
                  <div className="flex flex-wrap gap-3">
                    <select
                      className="border rounded-md p-2"
                      value={srcType}
                      onChange={(e) => setSrcType(e.target.value)}
                    >
                      <option value="custom">Custom URL</option>
                      <option value="sefaria">Sefaria (ref)</option>
                      <option value="quran">Qur'an (surah/ayah)</option>
                      <option value="gutenberg">Gutenberg (book id)</option>
                    </select>

                    {srcType === "custom" && (
                      <>
                        <input
                          className="border rounded-md p-2 flex-1 min-w-[200px]"
                          placeholder="Source label (optional)"
                          value={srcLabel}
                          onChange={(e) => setSrcLabel(e.target.value)}
                        />
                        <input
                          className="border rounded-md p-2 flex-1 min-w-[240px]"
                          placeholder="https://…"
                          value={srcUrl}
                          onChange={(e) => setSrcUrl(e.target.value)}
                        />
                      </>
                    )}

                    {srcType === "sefaria" && (
                      <input
                        className="border rounded-md p-2 flex-1 min-w-[240px]"
                        placeholder="e.g., Berakhot 2a"
                        value={srcA}
                        onChange={(e) => setSrcA(e.target.value)}
                      />
                    )}

                    {srcType === "quran" && (
                      <>
                        <input
                          className="border rounded-md p-2 w-28"
                          placeholder="Surah"
                          value={srcA}
                          onChange={(e) => setSrcA(e.target.value)}
                        />
                        <input
                          className="border rounded-md p-2 w-28"
                          placeholder="Ayah"
                          value={srcB}
                          onChange={(e) => setSrcB(e.target.value)}
                        />
                      </>
                    )}

                    {srcType === "gutenberg" && (
                      <input
                        className="border rounded-md p-2 w-36"
                        placeholder="Book ID"
                        value={srcA}
                        onChange={(e) => setSrcA(e.target.value)}
                      />
                    )}

                    <button
                      onClick={addSource}
                      className="px-3 py-2 rounded-lg bg-[#1b1b1b] text-white"
                    >
                      Add
                    </button>
                  </div>
                </div>
              )}

              {sources.length > 0 ? (
                <ul className="list-disc pl-5 space-y-1">
                  {sources.map((s, i) => (
                    <li key={i}>
                      <a
                        href={s.url}
                        target="_blank"
                        rel="noreferrer"
                        className="underline"
                      >
                        {s.label}
                      </a>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-[#777]">No sources added yet.</p>
              )}
            </div>
          </div>
        </div>

        {/* Footer notice */}
        <p className="mt-8 text-sm text-[#666]">
          © 2025 Total-iora · A sanctuary of reflection. No promises. Only presence.
        </p>
      </section>
    </main>
  );
}
