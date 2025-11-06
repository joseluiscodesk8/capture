"use client";

import React, { useRef, useState } from "react";
import styles from "../index.module.scss";

import { getWorker } from "../lib/tesseractWorker";
import { preprocessImage } from "../utils/preprocessImage";

type DetectedAddress = { address: string; mapsUrl: string } | null;

const OCRCamera: React.FC = () => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [capturedText, setCapturedText] = useState<string>("");
  const [formattedLines, setFormattedLines] = useState<string[]>([]);
  const [detectedAddress, setDetectedAddress] = useState<DetectedAddress>(null);
  const [detectedPhone, setDetectedPhone] = useState<string | null>(null);
  const [detectedPrice, setDetectedPrice] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const openCameraOrGallery = () => {
    fileInputRef.current?.click();
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async () => {
      const imageData = reader.result as string;
      await processImage(imageData);
    };
    reader.readAsDataURL(file);
  };

  const processImage = async (imageData: string) => {
    setLoading(true);
    setCapturedText("");
    setFormattedLines([]);
    setDetectedAddress(null);
    setDetectedPhone(null);
    setDetectedPrice(null);
  
    try {
      const worker = await getWorker();
  
      // Preprocesar imagen antes del OCR
      const processed = await preprocessImage(imageData);
  
      const result = await worker.recognize(processed);
      let text = result.data.text.trim();
  
      if (!text || text.length < 10) {
        setCapturedText("⚠️ No se pudo leer el texto. Verifica la iluminación o el enfoque.");
        return;
      }
  
      const lines = text
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line.length > 0);
  
      // Detectar campos
      const addressInfo = detectAndCorrectAddress(text);
      if (addressInfo) setDetectedAddress(addressInfo);
  
      const phone = detectPhone(text);
      const price = detectPrice(text);
  
      if (phone) setDetectedPhone(phone);
      if (price) setDetectedPrice(price);
  
      // Agregar "YA PAGO?" al final
      text += "\n\nYA PAGO?";
      lines.push("YA PAGO?");
  
      setCapturedText(text);
      setFormattedLines(lines);
    } catch (error) {
      console.error("Error en OCR:", error);
      setCapturedText("⚠️ Error al leer la imagen. Intenta nuevamente.");
    } finally {
      setLoading(false);
    }
  };
  

  const detectAndCorrectAddress = (text: string): DetectedAddress => {
    const regex =
      /\b(Calle|Carrera|Avenida|Diagonal|Transversal)\s*(\d+[A-Za-z]?(\s*sur)?)\s*#\s*(\d+[A-Za-z]?(\s*sur)?)\s*[-–]\s*(\d+)\b/gi;

    const match = regex.exec(text);
    if (!match) return null;

    const via = match[1].trim();
    const param1 = match[2].replace(/\s+/g, "").replace(/sur$/i, " sur").trim();
    const param2 = match[4].replace(/\s+/g, "").replace(/sur$/i, " sur").trim();
    const param3 = match[6].trim();

    const address = `${via} ${param1} #${param2}-${param3}`;
    const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;

    return { address, mapsUrl };
  };

  const detectPrice = (text: string): string | null => {
    const priceRegex = /\b(\$?\s?\d{1,6}(?:[.,]\d{3})*(?:[.,]\d{2})?)\b/g;
    const matches: string[] = [];

    let match;
    while ((match = priceRegex.exec(text)) !== null) {
      const digits = match[1].replace(/[^\d]/g, "");
      if (digits.length > 1 && digits.length <= 6) matches.push(digits);
    }

    if (matches.length === 0) return null;

    const validNumbers = matches
      .map((num) => parseInt(num, 10))
      .filter((n) => n > 0 && n < 1000000);

    if (validNumbers.length === 0) return null;

    let priceNumber = Math.max(...validNumbers);

    if (priceNumber < 1000) {
      while (priceNumber * 10 < 10000) {
        priceNumber *= 10;
      }
      priceNumber = Math.floor(priceNumber / 1000) * 1000;
    } else if (priceNumber < 10000) {
      priceNumber = Math.round(priceNumber / 100) * 1000;
    } else {
      priceNumber = Math.round(priceNumber / 1000) * 1000;
    }

    const formatted = priceNumber.toLocaleString("es-CO");
    return `$ ${formatted}`;
  };

  const detectPhone = (text: string): string | null => {
    const phoneRegex = /(\+?57)?[\s\-\.]?(3\d{2}[\s\-\.]?\d{3}[\s\-\.]?\d{4})/g;
    const matches = [...text.matchAll(phoneRegex)];

    if (matches.length === 0) return null;

    const rawPhone = matches[0][2];
    const cleanPhone = rawPhone.replace(/\D/g, "");

    if (cleanPhone.length === 10 && cleanPhone.startsWith("3")) {
      return cleanPhone;
    }

    return null;
  };

  const sendToWhatsApp = () => {
    const whatsappNumber = "573017844046";
    const parts: string[] = [];

    parts.push(`Teléfono: ${detectedPhone ?? "(no detectado)"}`);
    parts.push(`Dirección: ${detectedAddress?.address ?? "(no detectada)"}`);
    parts.push(`Precio: ${detectedPrice ?? "(no detectado)"}`);
    parts.push("YA PAGO?");

    const url = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(parts.join("\n"))}`;
    window.open(url, "_blank");
  };

  // 🔹 Nueva función para abrir la app de llamadas
  const callPhoneNumber = () => {
    if (!detectedPhone) {
      alert("⚠️ No se detectó ningún número de teléfono válido.");
      return;
    }

    window.location.href = `tel:${detectedPhone}`;
  };

  const openInMaps = (mapsUrl: string) => {
    window.open(mapsUrl, "_blank");
  };

  return (
    <section className={styles.ocrCamera}>
      <div className={styles.controls}>
        <button onClick={openCameraOrGallery} className={`${styles.btn} ${styles.primary}`}>
          Tomar o seleccionar imagen
        </button>

        <input
          type="file"
          accept="image/*"
          ref={fileInputRef}
          onChange={handleImageUpload}
          className={styles.inputFile}
        />
      </div>

      {loading && <p className={styles.status}>📸 Procesando imagen...</p>}

      {!loading && formattedLines.length > 0 && (
        <article className={styles.result}>
          <h2 className={styles.title}>🧾 Texto detectado:</h2>

          <div className={styles.ticket}>
            {formattedLines.map((line, index) => (
              <div key={index} className={styles.ticketLine}>
                {line}
              </div>
            ))}
          </div>

          <div className={styles.extracted}>
            <h3>🔎 Campos extraídos</h3>
            <p>
              <strong>Teléfono:</strong> {detectedPhone ?? <em>(no detectado)</em>}
            </p>
            <p>
              <strong>Dirección:</strong>{" "}
              {detectedAddress ? (
                <>
                  {detectedAddress.address}{" "}
                  <button
                    onClick={() => openInMaps(detectedAddress.mapsUrl)}
                    className={`${styles.btn} ${styles.mapBtn}`}
                  >
                    🗺️ Abrir en Maps
                  </button>
                </>
              ) : (
                <em>(no detectada)</em>
              )}
            </p>
            <p>
              <strong>Precio:</strong> {detectedPrice ?? <em>(no detectado)</em>}
            </p>
          </div>

          <div className={styles.actions}>
            <button onClick={sendToWhatsApp} className={`${styles.btn} ${styles.success}`}>
              📤 Enviar por WhatsApp
            </button>
            <button onClick={callPhoneNumber} className={`${styles.btn} ${styles.primary}`}>
              📞 Llamar
            </button>
          </div>
        </article>
      )}
    </section>
  );
};

export default OCRCamera;