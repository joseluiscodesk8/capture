import { useEffect, useRef, useState } from "react";

// Diccionario para convertir palabras a números
const NUMBER_WORDS: Record<string, string> = {
  cero: "0",
  uno: "1",
  una: "1",
  dos: "2",
  tres: "3",
  cuatro: "4",
  cinco: "5",
  seis: "6",
  siete: "7",
  ocho: "8",
  nueve: "9",
};

function extractNumber(text: string): string {
  const processed = text
    .split(" ")
    .map((w) => NUMBER_WORDS[w] ?? w)
    .join("");

  return processed.replace(/\D/g, "");
}

function extractColombianPhone(text: string): string {
  let processed = text
    .split(" ")
    .map((w) => NUMBER_WORDS[w] ?? w)
    .join("");

  processed = processed.replace(/\D/g, "");

  if (processed.startsWith("3") && processed.length >= 10) {
    return processed.slice(0, 10);
  }

  if (processed.startsWith("60") && processed.length >= 10) {
    return processed.slice(0, 10);
  }

  return processed;
}

export default function AudioTranscriber() {
  const [isRecording, setIsRecording] = useState(false);
  const [text, setText] = useState("");
  const [capturedText, setCapturedText] = useState("");
  const [phoneCaptured, setPhoneCaptured] = useState("");
  const [priceCaptured, setPriceCaptured] = useState("");

  const recognitionRef = useRef<SpeechRecognition | null>(null);

  const isCapturingDireccionRef = useRef(false);
  const isCapturingTelefonoRef = useRef(false);
  const isCapturingPrecioRef = useRef(false);

  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // ============================================================
  // ⬇️⬇️ **STOP RECORDING VA ANTES DEL useEffect** (solución al error)
  // ============================================================
  const stopRecording = () => {
    recognitionRef.current?.stop();
    setIsRecording(false);

    isCapturingDireccionRef.current = false;
    isCapturingTelefonoRef.current = false;
    isCapturingPrecioRef.current = false;

    if (timeoutRef.current) clearTimeout(timeoutRef.current);
  };

  const startRecording = () => {
    recognitionRef.current?.start();
    setIsRecording(true);
  };

  // ============================================================
  // INICIO DEL useEffect
  // ============================================================
  useEffect(() => {
    const SpeechRecognitionClass =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognitionClass) {
      console.error("El navegador no soporta SpeechRecognition");
      return;
    }

    const recognition = new SpeechRecognitionClass();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "es-ES";

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let transcriptFull = "";

      for (let i = 0; i < event.results.length; i++) {
        transcriptFull += event.results[i][0].transcript;
      }

      setText(transcriptFull);

      // =======================================
      // 🔥 AUTO-APAGADO DEL MICRÓFONO
      // =======================================
      if (timeoutRef.current) clearTimeout(timeoutRef.current);

      timeoutRef.current = setTimeout(() => {
        console.log("Silencio detectado → micrófono apagado");
        stopRecording();
      }, 1000); // 1 segundo sin hablar

      const normalized = transcriptFull
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");

      // ======================================================
      // === COMANDO: DIRECCION ===============================
      // ======================================================
      if (normalized.includes("direccion")) {
        isCapturingDireccionRef.current = true;
        isCapturingTelefonoRef.current = false;
        isCapturingPrecioRef.current = false;

        setCapturedText("");

        const after = normalized.split("direccion")[1]?.trim() ?? "";
        if (after.length > 0) {
          const processed = after.replace(/\bnumeral\b/g, "#");
          setCapturedText(processed);
        }
        return;
      }

      if (isCapturingDireccionRef.current) {
        const processed = normalized.replace(/\bnumeral\b/g, "#");
        setCapturedText(processed.trim());
      }

      // ======================================================
      // === COMANDO: TELEFONO ================================
      // ======================================================
      if (normalized.includes("telefono")) {
        isCapturingTelefonoRef.current = true;
        isCapturingDireccionRef.current = false;
        isCapturingPrecioRef.current = false;

        setPhoneCaptured("");

        const after = normalized.split("telefono")[1]?.trim() ?? "";
        if (after.length > 0) {
          const phone = extractColombianPhone(after);
          setPhoneCaptured(phone);
        }
        return;
      }

      if (isCapturingTelefonoRef.current) {
        const phone = extractColombianPhone(normalized);
        setPhoneCaptured(phone);
      }

      // ======================================================
      // === COMANDO: PRECIO =================================
      // ======================================================
      if (normalized.includes("precio")) {
        isCapturingPrecioRef.current = true;
        isCapturingDireccionRef.current = false;
        isCapturingTelefonoRef.current = false;

        setPriceCaptured("");

        const after = normalized.split("precio")[1]?.trim() ?? "";
        if (after.length > 0) {
          const num = extractNumber(after);
          setPriceCaptured(num);
        }
        return;
      }

      if (isCapturingPrecioRef.current) {
        const num = extractNumber(normalized);
        setPriceCaptured(num);
      }
    };

    recognition.onerror = (event) => {
      console.error("SpeechRecognition error:", event.error);
    };

    recognitionRef.current = recognition;
  }, []);

  // ============================================================
  // RENDER
  // ============================================================
  return (
    <div style={{ padding: "18px", fontFamily: "Arial" }}>
      <h2>Transcriptor de Audio</h2>

      <button
        onClick={isRecording ? stopRecording : startRecording}
        style={{
          padding: "10px 20px",
          background: isRecording ? "#d9534f" : "#5cb85c",
          color: "white",
          border: "none",
          borderRadius: "8px",
          cursor: "pointer",
        }}
      >
        {isRecording ? "Detener" : "Iniciar"}
      </button>

      <h3>🔊 Texto completo escuchado:</h3>
      <div
        style={{
          marginTop: "10px",
          padding: "10px",
          background: "#f1f1f1",
          borderRadius: "8px",
        }}
      >
        {text}
      </div>

      <h3 style={{ marginTop: "20px" }}>📍 Dirección capturada:</h3>
      <div
        style={{
          marginTop: "10px",
          padding: "10px",
          background: "#d0f0d0",
          borderRadius: "8px",
          minHeight: "60px",
          fontWeight: "bold",
        }}
      >
        {capturedText || "Di: 'dirección' para activar este modo"}
      </div>

      <h3 style={{ marginTop: "20px" }}>📞 Teléfono capturado:</h3>
      <div
        style={{
          marginTop: "10px",
          padding: "10px",
          background: "#d0e0ff",
          borderRadius: "8px",
          minHeight: "60px",
          fontWeight: "bold",
        }}
      >
        {phoneCaptured || "Di: 'teléfono' seguido del número"}
      </div>

      <h3 style={{ marginTop: "20px" }}>💵 Precio capturado:</h3>
      <div
        style={{
          marginTop: "10px",
          padding: "10px",
          background: "#ffe7c2",
          borderRadius: "8px",
          minHeight: "60px",
          fontWeight: "bold",
        }}
      >
        {priceCaptured || "Di: 'precio' seguido del valor"}
      </div>
    </div>
  );
}
