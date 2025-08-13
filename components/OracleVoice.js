// FILE: /components/OracleVoice.js
import React, { useState, useRef, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid'; // For generating unique request IDs

const OracleVoice = () => {
  const = useState(false);
  const = useState('');
  const = useState('');
  const = useState('');
  const = useState('Click the mic to start.');
  const = useState('auto');

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef();
  const speechRecognitionRef = useRef(null);
  const audioContextRef = useRef(null);
  const requestIdRef = useRef(null);

  // ARCHITECTURE: Prioritize MediaRecorder, use Web Speech API only for interim captions.
  const setupRecorders = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // 1. Setup MediaRecorder (Primary)
      setupMediaRecorder(stream);

      // 2. Setup Web Speech API (Optional, for live captions on compatible browsers)
      if ('webkitSpeechRecognition' in window |

| 'SpeechRecognition' in window) {
        setupWebSpeechRecognition();
      } else {
        setStatus('Live captions not supported on this browser. Recording is active.');
      }
    } catch (err) {
      console.error('Error accessing microphone:', err);
      setStatus('Microphone access denied. Please enable it in your browser settings.');
    }
  };

  // ARCHITECTURE: Robust codec selection for MediaRecorder
  const getBestMimeType = () => {
    const mimeTypes =;
    for (const mimeType of mimeTypes) {
      if (MediaRecorder.isTypeSupported(mimeType)) {
        return mimeType;
      }
    }
    return ''; // Fallback to browser default
  };

  const setupMediaRecorder = (stream) => {
    const mimeType = getBestMimeType();
    const options = mimeType? { mimeType } : {};
    mediaRecorderRef.current = new MediaRecorder(stream, options);

    mediaRecorderRef.current.ondataavailable = (event) => {
      if (event.data.size > 0) {
        audioChunksRef.current.push(event.data);
        sendAudioChunkToServer();
      }
    };

    mediaRecorderRef.current.onstop = () => {
      if (audioChunksRef.current.length > 0) {
        sendAudioChunkToServer(true); // Send final chunk
      }
      // Once recording stops, send the final concatenated text to the chat API
      if (finalText |

| interimText) {
        sendToChatAPI(finalText |

| interimText);
      }
    };
  };

  const setupWebSpeechRecognition = () => {
    const SpeechRecognition = window.SpeechRecognition |

| window.webkitSpeechRecognition;
    speechRecognitionRef.current = new SpeechRecognition();
    speechRecognitionRef.current.continuous = true;
    speechRecognitionRef.current.interimResults = true;
    speechRecognitionRef.current.lang = 'en-US'; // Default, will be overridden by server

    speechRecognitionRef.current.onresult = (event) => {
      let interim = '';
      let final = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          final += event.results[i].transcript;
        } else {
          interim += event.results[i].transcript;
        }
      }
      
      // UX: Prevent mangled English transcriptions for non-English speech
      if (/[؀-ۿא-ת]/.test(interim) && /[a-zA-Z]/.test(interim)) {
          // Detected non-English script but getting English words, likely a misrecognition.
          // Stop Web Speech and rely solely on MediaRecorder + server STT.
          if (speechRecognitionRef.current) {
              speechRecognitionRef.current.stop();
              setStatus('Switching to high-accuracy transcription...');
          }
          return;
      }

      setInterimText(interim);
      if (final) {
        setFinalText(prev => mergeNoDupe(prev, final.trim()));
      }
    };
  };

  const startRecording = () => {
    if (isRecording) return;
    setIsRecording(true);
    setFinalText('');
    setInterimText('');
    setReply('');
    setStatus('Listening...');
    requestIdRef.current = uuidv4(); // LOGGING: Generate unique ID for this interaction.

    setupRecorders().then(() => {
      if (mediaRecorderRef.current) {
        mediaRecorderRef.current.start(1200); // Send chunks every 1.2 seconds
      }
      if (speechRecognitionRef.current) {
        speechRecognitionRef.current.start();
      }
    });
  };

  const stopRecording = () => {
    if (!isRecording) return;
    setIsRecording(false);
    setStatus('Processing...');
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    if (speechRecognitionRef.current) {
      speechRecognitionRef.current.stop();
    }
  };

  const sendAudioChunkToServer = async (isFinal = false) => {
    if (audioChunksRef.current.length === 0) return;

    const blob = new Blob(audioChunksRef.current, { type: mediaRecorderRef.current.mimeType });
    audioChunksRef.current =; // Clear chunks after sending

    const reader = new FileReader();
    reader.readAsDataURL(blob);
    reader.onloadend = async () => {
      const base64Audio = reader.result.split(',')[1];
      try {
        const response = await fetch('/api/stt', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ audioChunk: base64Audio, requestId: requestIdRef.current }),
        });
        const data = await response.json();
        if (data.text) {
          setFinalText(prev => mergeNoDupe(prev, data.text.trim()));
          setDetectedLang(data.lang |

| 'auto');
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
    setStatus('Thinking...');
    try {
      const response = await fetch('/api/auracode-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, lang: detectedLang, requestId: requestIdRef.current }),
      });
      const data = await response.json();
      setReply(data.reply);
      setStatus('Reply received. Speaking...');
      speakOut(data.reply);
    } catch (error) {
      console.error('Chat API error:', error);
      setStatus('Sorry, I could not get a response.');
    }
  };

  const speakOut = async (text) => {
    try {
      // Prefer server-side TTS for quality and consistency
      const response = await fetch(`/api/tts?text=${encodeURIComponent(text)}&requestId=${requestIdRef.current}`);
      if (!response.ok) throw new Error(`Server TTS failed with status ${response.status}`);
      
      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      audio.play();
      audio.onended = () => setStatus('Click the mic to start.');
    } catch (error) {
      console.warn('Server TTS failed, falling back to device synthesis.', error);
      setStatus('Server voice unavailable, using device voice.');
      // Fallback to device's built-in speech synthesis
      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(text);
        // Attempt to set language for device voice
        if (detectedLang && detectedLang!== 'auto') {
            utterance.lang = detectedLang;
        }
        speechSynthesis.speak(utterance);
        utterance.onend = () => setStatus('Click the mic to start.');
      } else {
        setStatus('No voice output available on this device.');
      }
    }
  };

  // Helper to avoid word duplication from overlapping chunks
  const mergeNoDupe = (existing, newText) => {
    const existingWords = existing.split(/\s+/);
    const newWords = newText.split(/\s+/);
    let overlap = 0;
    for (let i = 1; i <= Math.min(existingWords.length, newWords.length); i++) {
      if (existingWords.slice(-i).join(' ') === newWords.slice(0, i).join(' ')) {
        overlap = i;
      }
    }
    return existing + ' ' + newWords.slice(overlap).join(' ');
  };

  return (
    <div>
      <button onClick={isRecording? stopRecording : startRecording}>
        {isRecording? 'Stop' : 'Start'} Mic
      </button>
      <p><strong>Status:</strong> {status}</p>
      <p><strong>You said:</strong> {finalText} <em>{interimText}</em></p>
      <p><strong>Reply:</strong> {reply}</p>
    </div>
  );
};

export default OracleVoice;
