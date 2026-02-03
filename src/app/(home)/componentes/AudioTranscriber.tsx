import { useEffect, useRef, useState } from "react";
import styles from "../styles/AudioTranscriber.module.scss";

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

function blockNumberWords(text: string): string {
  return text
    .split(" ")
    .map((w) => (NUMBER_WORDS[w] ? "" : w))
    .filter(Boolean)
    .join(" ");
}

export default function AudioTranscriber() {
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

  /* ================= MIC CONTROL ================= */

  const startRecording = () => {
    recognitionRef.current?.start();
  };

  const stopRecording = () => {
    recognitionRef.current?.stop();

    isCapturingDireccionRef.current =
      isCapturingTelefonoRef.current =
      isCapturingPrecioRef.current =
        false;

    setActiveCapture(null);
  };

  /* ================= ARM CAPTURE ================= */

  const armDireccionCapture = () => {
    setCapturedText("");
    isCapturingDireccionRef.current = true;
    isCapturingTelefonoRef.current = false;
    isCapturingPrecioRef.current = false;
    setActiveCapture("direccion");
  };

  const armTelefonoCapture = () => {
    setPhoneCaptured("");
    isCapturingTelefonoRef.current = true;
    isCapturingDireccionRef.current = false;
    isCapturingPrecioRef.current = false;
    setActiveCapture("telefono");
  };

  const armPrecioCapture = () => {
    setPriceCaptured("");
    isCapturingPrecioRef.current = true;
    isCapturingDireccionRef.current = false;
    isCapturingTelefonoRef.current = false;
    setActiveCapture("precio");
  };

  /* ================= SPEECH ================= */

  useEffect(() => {
    const SpeechRecognitionClass =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognitionClass) return;

    const recognition = new SpeechRecognitionClass();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "es-ES";

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let transcriptFull = "";

      for (let i = 0; i < event.results.length; i++) {
        transcriptFull += event.results[i][0].transcript;
      }

      const normalized = transcriptFull
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");

      if (isCapturingDireccionRef.current) {
        let processed = normalized.replace(/\bnumeral\b/g, "#");
        processed = blockNumberWords(processed);
        setCapturedText(processed.trim());
      }

      if (isCapturingTelefonoRef.current) {
        setPhoneCaptured(extractColombianPhone(normalized));
      }

      if (isCapturingPrecioRef.current) {
        setPriceCaptured(extractNumber(normalized));
      }
    };

    recognitionRef.current = recognition;
  }, []);

  /* ================= ACTIONS ================= */

  const sendWhatsApp = () => {
    const numeroDestino = "573017844046";
    const mensaje = `
${capturedText}
${phoneCaptured}
${priceCaptured}
Ya pagó?
`.trim();

    window.open(
      `https://wa.me/${numeroDestino}?text=${encodeURIComponent(mensaje)}`,
      "_blank"
    );
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

  /* ================= UI ================= */

  return (
    <main className={styles.container}>
      <h3 className={styles.title}>Dirección</h3>
      <section>
        <button
          className={`${styles.recordBtn} ${styles.btnDireccion} ${
            activeCapture === "direccion" ? styles.activeBtn : ""
          }`}
          onMouseDown={() => {
            armDireccionCapture();
            startRecording();
          }}
          onMouseUp={stopRecording}
          onMouseLeave={stopRecording}
          onTouchStart={() => {
            armDireccionCapture();
            startRecording();
          }}
          onTouchEnd={stopRecording}
          onTouchCancel={stopRecording}
        >
          📍
        </button>

        <div className={`${styles.box} ${styles.boxDireccion}`}>
          {capturedText}
        </div>

        <button className={styles.secondaryBtn} onClick={openInMaps}>
          Maps
        </button>
      </section>

      <h3 className={styles.title}>Teléfono</h3>
      <section>
        <button
          className={`${styles.recordBtn} ${styles.btnTelefono} ${
            activeCapture === "telefono" ? styles.activeBtn : ""
          }`}
          onMouseDown={() => {
            armTelefonoCapture();
            startRecording();
          }}
          onMouseUp={stopRecording}
          onMouseLeave={stopRecording}
          onTouchStart={() => {
            armTelefonoCapture();
            startRecording();
          }}
          onTouchEnd={stopRecording}
          onTouchCancel={stopRecording}
        >
          📞
        </button>

        <div className={`${styles.box} ${styles.boxTelefono}`}>
          {phoneCaptured}
        </div>

        <button className={styles.secondaryBtn} onClick={callPhone}>
          Llamar
        </button>
      </section>

      <h3 className={styles.title}>Precio</h3>
      <section>
        <button
          className={`${styles.recordBtn} ${styles.btnPrecio} ${
            activeCapture === "precio" ? styles.activeBtn : ""
          }`}
          onMouseDown={() => {
            armPrecioCapture();
            startRecording();
          }}
          onMouseUp={stopRecording}
          onMouseLeave={stopRecording}
          onTouchStart={() => {
            armPrecioCapture();
            startRecording();
          }}
          onTouchEnd={stopRecording}
          onTouchCancel={stopRecording}
        >
          💵
        </button>

        <div className={`${styles.box} ${styles.boxPrecio}`}>
          {priceCaptured}
        </div>
         <button
          className={`${styles.recordBtn} ${styles.btnPrecio} ${
            activeCapture === "precio" ? styles.activeBtn : ""
          }`}
          onMouseDown={() => {
            armPrecioCapture();
            startRecording();
          }}
          onMouseUp={stopRecording}
          onMouseLeave={stopRecording}
          onTouchStart={() => {
            armPrecioCapture();
            startRecording();
          }}
          onTouchEnd={stopRecording}
          onTouchCancel={stopRecording}
        >
          💵
        </button>
      </section>

      <button className={styles.whatsappBtn} onClick={sendWhatsApp}>
        Enviar por WhatsApp
      </button>
    </main>
  );
}
