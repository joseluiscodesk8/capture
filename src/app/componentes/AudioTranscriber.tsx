import { useEffect, useRef, useState } from "react";
import styles from "../AudioTranscriber.module.scss";

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

function replaceNumberWords(text: string): string {
  return text
    .split(" ")
    .map((w) => NUMBER_WORDS[w] ?? w)
    .join(" ");
}

function extractNumber(text: string): string {
  return text
    .split(" ")
    .map((w) => NUMBER_WORDS[w] ?? w)
    .join("")
    .replace(/\D/g, "");
}

function extractColombianPhone(text: string): string {
  const processed = text
    .split(" ")
    .map((w) => NUMBER_WORDS[w] ?? w)
    .join("")
    .replace(/\D/g, "");

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

  const [capturedText, setCapturedText] = useState("");
  const [phoneCaptured, setPhoneCaptured] = useState("");
  const [priceCaptured, setPriceCaptured] = useState("");

  const [activeCapture, setActiveCapture] = useState<
    "direccion" | "telefono" | "precio" | null
  >(null);

  const recognitionRef = useRef<SpeechRecognition | null>(null);

  const isCapturingDireccionRef = useRef(false);
  const isCapturingTelefonoRef = useRef(false);
  const isCapturingPrecioRef = useRef(false);

  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // ⏳ NUEVO → Timeout para 3s sin audio
  const inactivityTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // ⏳ Función para reiniciar el timeout de inactividad
  const resetInactivityTimeout = () => {
    if (inactivityTimeoutRef.current)
      clearTimeout(inactivityTimeoutRef.current);

    inactivityTimeoutRef.current = setTimeout(() => {
      console.log("Sin audio 3s → apagando micrófono");
      stopRecording();
    }, 3000); // 3 segundos
  };

  const stopRecording = () => {
    recognitionRef.current?.stop();
    setIsRecording(false);

    isCapturingDireccionRef.current =
      isCapturingTelefonoRef.current =
      isCapturingPrecioRef.current =
        false;

    setActiveCapture(null);

    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    // 🔥 limpiar timeout de inactividad
    if (inactivityTimeoutRef.current)
      clearTimeout(inactivityTimeoutRef.current);
  };

  const startRecording = () => {
    resetInactivityTimeout(); // ⏳ activa vigilancia de 3s sin audio
    recognitionRef.current?.start();
    setIsRecording(true);
  };

  const startCapturingDireccion = () => {
    setCapturedText("");
    isCapturingDireccionRef.current = true;
    isCapturingTelefonoRef.current = false;
    isCapturingPrecioRef.current = false;

    setActiveCapture("direccion");
    startRecording();
  };

  const startCapturingTelefono = () => {
    setPhoneCaptured("");
    isCapturingTelefonoRef.current = true;
    isCapturingDireccionRef.current = false;
    isCapturingPrecioRef.current = false;

    setActiveCapture("telefono");
    startRecording();
  };

  const startCapturingPrecio = () => {
    setPriceCaptured("");
    isCapturingPrecioRef.current = true;
    isCapturingDireccionRef.current = false;
    isCapturingTelefonoRef.current = false;

    setActiveCapture("precio");
    startRecording();
  };

  useEffect(() => {
    const SpeechRecognitionClass =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognitionClass) return;

    const recognition = new SpeechRecognitionClass();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "es-ES";

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      resetInactivityTimeout(); // 🔥 reinicia timeout de 3s cada vez que escucha algo

      let transcriptFull = "";
      for (let i = 0; i < event.results.length; i++) {
        transcriptFull += event.results[i][0].transcript;
      }

      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => stopRecording(), 1000);

      const normalized = transcriptFull
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");

      if (isCapturingDireccionRef.current) {
        let processed = normalized.replace(/\bnumeral\b/g, "#");
        processed = replaceNumberWords(processed);
        setCapturedText(processed.trim());
      }

      if (isCapturingTelefonoRef.current) {
        setPhoneCaptured(extractColombianPhone(normalized));
      }

      if (isCapturingPrecioRef.current) {
        setPriceCaptured(extractNumber(normalized));
      }
    };

    recognition.onerror = (e) =>
      console.error("SpeechRecognition error:", e.error);

    recognitionRef.current = recognition;
  }, []);

  const sendWhatsApp = () => {
    const numeroDestino = "573017844046";

    const mensaje = `
       ${capturedText}
    ${phoneCaptured}
    ${priceCaptured}
    Ya pagó?
           `.trim();

    const url = `https://wa.me/${numeroDestino}?text=${encodeURIComponent(
      mensaje
    )}`;
    window.open(url, "_blank");
  };

  const openInMaps = () => {
    if (!capturedText.trim()) return;
    window.open(
      `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
        capturedText
      )}`,
      "_blank"
    );
  };

  const callPhone = () => {
    if (!phoneCaptured.trim()) return;
    window.location.href = `tel:${phoneCaptured}`;
  };

  return (
    <div className={styles.container}>
      <h3 className={styles.title}>Dirección</h3>

      <div className={`${styles.box} ${styles.boxDireccion}`}>
        {capturedText}

        <button
          onClick={startCapturingDireccion}
          className={`${styles.recordBtn} ${styles.btnDireccion} ${
            activeCapture === "direccion" ? styles.activeBtn : ""
          }`}
        >
          📍
        </button>

        {capturedText && (
          <div className={`${styles.right} ${styles.rightVisible}`}>
            <button
              className={`${styles.secondaryBtn} ${styles.mapBtn}`}
              onClick={openInMaps}
            >
              Maps
            </button>
          </div>
        )}
      </div>

      <h3 className={styles.title}>Teléfono</h3>

      <div className={`${styles.box} ${styles.boxTelefono}`}>
        {phoneCaptured}

        <button
          onClick={startCapturingTelefono}
          className={`${styles.recordBtn} ${styles.btnTelefono} ${
            activeCapture === "telefono" ? styles.activeBtn : ""
          }`}
        >
          📞
        </button>

        {phoneCaptured && (
          <div className={`${styles.right} ${styles.rightVisible}`}>
            <button
              className={`${styles.secondaryBtn} ${styles.callBtn}`}
              onClick={callPhone}
            >
              Llamar
            </button>
          </div>
        )}
      </div>

      <h3 className={styles.title}>Precio</h3>

      <div className={`${styles.box} ${styles.boxPrecio}`}>
        {priceCaptured}

        <button
          onClick={startCapturingPrecio}
          className={`${styles.recordBtn} ${styles.btnPrecio} ${
            activeCapture === "precio" ? styles.activeBtn : ""
          }`}
        >
          💵
        </button>
      </div>

      <button className={styles.whatsappBtn} onClick={sendWhatsApp}>
        Enviar por WhatsApp
      </button>
    </div>
  );
}
