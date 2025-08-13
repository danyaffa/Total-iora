// FILE: /components/OracleVoice.js
import React, { useState, useRef } from 'react';

// Generate request IDs without the uuid package
function makeId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return 'req_' + Math.random().toString(36).slice(2) + Date.now().toString(36);
}

const OracleVoice = ({ path }) => {
  // STATE (same semantics as your original)
  const [isRecording, setIsRecording] = useState(false);
  const [interimText, setInterimText] = useState('');
  const [finalText, setFinalText] = useState('');
  const [reply, setReply] = useState('');
  const [status, setStatus] = useState('Click the mic to start.');
  const [detectedLang, setDetectedLang] = useState('auto');

  // REFS
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const speechRecognitionRef = useRef(null);
  const requestIdRef = useRef(null);

  // Best MediaRecorder mimeType
  const getBestMimeType = () => {
    const mimeTypes = [
      'audio/webm;codecs=opus',
      'audio/mp4;codecs=aac',
      'audio/ogg;codecs=opus',
      'audio/webm'
    ];
    for (const mimeType of mimeTypes) {
      if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(mimeType)) return mimeType;
    }
    return '';
  };

  const setupMediaRecorder = (stream) => {
    const mimeType = getBestMimeType();
    const options = mimeType ? { mimeType } : {};
    mediaRecorderRef.current = new MediaRecorder(stream, options);

    mediaRecorderRef.current.ondataavailable = (event) => {
      if (event?.data?.size > 0) audioChunksRef.current.push(event.data);
    };

    mediaRecorderRef.current.onstop = () => {
      if (audioChunksRef.current.length > 0) {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: mediaRecorderRef.current.mimeType || 'audio/webm'
        });
        sendAudioToServer(audioBlob);
      }
    };
  };

  const setupWebSpeechRecognition = () => {
    const SR = typeof window !== 'undefined' && (window.SpeechRecognition || window.webkitSpeechRecognition);
    if (!SR) return;
    speechRecognitionRef.current = new SR();
    speechRecognitionRef.current.continuous = true;
    speechRecognitionRef.current.interimResults = true;
    speechRecognitionRef.current.lang = 'en-US';

    speechRecognitionRef.current.onresult = (event) => {
      let interim = '';
      let final = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) final += event.results[i].transcript;
        else interim += event.results[i].transcript;
      }

      // Mixed-script guard → let server STT handle it
      if (/[؀-ۿא-ת]/.test(interim) && /[a-zA-Z]/.test(interim)) {
        speechRecognitionRef.current?.stop();
        setStatus('Switching to high-accuracy transcription…');
        return;
      }

      setInterimText(interim);
      if (final) setFinalText((prev) => mergeNoDupe(prev, final.trim()));
    };
  };

  const startRecording = async () => {
    if (isRecording) return;
    setIsRecording(true);
    setFinalText('');
    setInterimText('');
    setReply('');
    setStatus('Listening…');
    requestIdRef.current = makeId();
    audioChunksRef.current = [];

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setupMediaRecorder(stream);
      if (typeof window !== 'undefined' && (window.webkitSpeechRecognition || window.SpeechRecognition)) {
        setupWebSpeechRecognition();
      } else {
        setStatus('Live captions not supported. Recording is active.');
      }
      mediaRecorderRef.current?.start();
      speechRecognitionRef.current?.start();
    } catch (err) {
      console.error('Mic access error:', err);
      setStatus('Microphone access denied. Please enable it.');
      setIsRecording(false);
    }
  };

  const stopRecording = () => {
    if (!isRecording) return;
    setIsRecording(false);
    setStatus('Processing…');
    if (mediaRecorderRef.current?.state === 'recording') mediaRecorderRef.current.stop();
    speechRecognitionRef.current?.stop();

    setTimeout(() => {
      const textToProcess = finalText || interimText;
      if (!textToProcess && audioChunksRef.current.length === 0) {
        setStatus('Could not hear you. Please try again.');
      }
    }, 500);
  };

  const sendAudioToServer = (audioBlob) => {
    const reader = new FileReader();
    reader.readAsDataURL(audioBlob);
    reader.onloadend = async () => {
      try {
        const base64Audio = String(reader.result || '').split(',')[1] || '';
        const response = await fetch('/api/stt', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          // KEEP your original field name
          body: JSON.stringify({ audioChunk: base64Audio, requestId: requestIdRef.current })
        });
        const data = await response.json();
        if (data?.text) {
          setFinalText(data.text);
          setDetectedLang(data.lang || 'auto');
          sendToChatAPI(data.text);
        } else {
          setStatus('Could not transcribe audio. Please try again.');
        }
      } catch (error) {
        console.error('STT API error:', error);
        setStatus('Error transcribing audio.');
      }
    };
  };

  const sendToChatAPI = async (text) => {
    if (!text) {
      setStatus('Could not hear you. Please try again.');
      return;
    }
    setStatus('Thinking…');
    try {
      const response = await fetch('/api/auracode-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // KEEP your original body shape
        body: JSON.stringify({ message: text, lang: detectedLang, requestId: requestIdRef.current })
      });
      const data = await response.json();
      const out = data?.reply || '…';
      setReply(out);
      setStatus('Reply received. Speaking…');
      speakOut(out);
    } catch (error) {
      console.error('Chat API error:', error);
      setStatus('Sorry, I could not get a response.');
    }
  };

  const speakOut = async (text) => {
    try {
      // KEEP your original GET /api/tts returning audio/mpeg
      const response = await fetch(`/api/tts?text=${encodeURIComponent(text)}&requestId=${requestIdRef.current}`);
      if (!response.ok) throw new Error(`Server TTS failed: ${response.status}`);
      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      audio.play();
      audio.onended = () => setStatus('Click the mic to start.');
    } catch (error) {
      console.warn('Server TTS failed, falling back to device synthesis.', error);
      setStatus('Server voice unavailable, using device voice.');
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        const utter = new SpeechSynthesisUtterance(text);
        if (detectedLang && detectedLang !== 'auto') {
          utter.lang =
            detectedLang.startsWith('ar') ? 'ar-SA' :
            detectedLang.startsWith('he') ? 'he-IL' : 'en-US';
        }
        speechSynthesis.speak(utter);
        utter.onend = () => setStatus('Click the mic to start.');
      } else {
        setStatus('No voice output available on this device.');
      }
    }
  };

  const mergeNoDupe = (existing, newText) => {
    if (!existing.trim()) return newText;
    const A = existing.split(/\s+/), B = newText.split(/\s+/);
    let overlap = 0;
    for (let i = 1; i <= Math.min(A.length, B.length); i++) {
      if (A.slice(-i).join(' ') === B.slice(0, i).join(' ')) overlap = i;
    }
    return existing + ' ' + B.slice(overlap).join(' ');
  };

  return (
    <div>
      <button onClick={isRecording ? stopRecording : startRecording}>
        {isRecording ? 'Stop' : 'Start'} Mic
      </button>
      <p><strong>Status:</strong> {status}</p>
      <p><strong>You said:</strong> {finalText} <em>{interimText}</em></p>
      <p><strong>Reply:</strong> {reply}</p>
    </div>
  );
};

export default OracleVoice;
