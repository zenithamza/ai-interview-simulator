import { useCallback, useEffect, useRef, useState } from "react";

// Wraps the browser's SpeechRecognition API to capture a spoken answer
// as text, plus a live amplitude reading (via getUserMedia) for the
// waveform visualizer. No external speech-to-text service required.
export function useSpeechRecorder() {
  const [isSupported] = useState(
    () => typeof window !== "undefined" && ("SpeechRecognition" in window || "webkitSpeechRecognition" in window)
  );
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [interim, setInterim] = useState("");
  const [level, setLevel] = useState(0);
  const [error, setError] = useState(null);

  const recognitionRef = useRef(null);
  const audioCtxRef = useRef(null);
  const analyserRef = useRef(null);
  const rafRef = useRef(null);
  const streamRef = useRef(null);

  const stopAudioMeter = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop());
    if (audioCtxRef.current) audioCtxRef.current.close().catch(() => {});
    setLevel(0);
  }, []);

  const startAudioMeter = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      audioCtxRef.current = ctx;
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      analyserRef.current = analyser;

      const data = new Uint8Array(analyser.frequencyBinCount);
      const tick = () => {
        analyser.getByteFrequencyData(data);
        const avg = data.reduce((sum, v) => sum + v, 0) / data.length;
        setLevel(Math.min(1, avg / 90));
        rafRef.current = requestAnimationFrame(tick);
      };
      tick();
    } catch (err) {
      // Mic permission denied — recognition can still work without the meter.
      console.warn("Mic level metering unavailable:", err.message);
    }
  }, []);

  const start = useCallback(() => {
    setError(null);
    setTranscript("");
    setInterim("");

    if (!isSupported) {
      setError("Voice recognition isn't supported in this browser. Try Chrome or Edge, or type your answer.");
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onresult = (event) => {
      let finalText = "";
      let interimText = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const res = event.results[i];
        if (res.isFinal) finalText += res[0].transcript + " ";
        else interimText += res[0].transcript;
      }
      if (finalText) setTranscript((prev) => (prev + " " + finalText).trim());
      setInterim(interimText);
    };

    recognition.onerror = (event) => {
      if (event.error === "no-speech") return;
      setError(`Recognition error: ${event.error}`);
    };

    recognition.onend = () => {
      setIsRecording(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
    startAudioMeter();
    setIsRecording(true);
  }, [isSupported, startAudioMeter]);

  const stop = useCallback(() => {
    recognitionRef.current?.stop();
    stopAudioMeter();
    setIsRecording(false);
  }, [stopAudioMeter]);

  useEffect(() => () => {
    recognitionRef.current?.stop();
    stopAudioMeter();
  }, [stopAudioMeter]);

  const fullText = (transcript + " " + interim).trim();

  return { isSupported, isRecording, transcript, interim, fullText, level, error, start, stop, setTranscript };
}
