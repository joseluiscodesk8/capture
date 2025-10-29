"use client";

import React, { useRef, useState } from "react";
import Tesseract from "tesseract.js";
import styles from "../index.module.scss";

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
      const worker = await Tesseract.createWorker("spa");

      await worker.setParameters({
        tessedit_char_whitelist:
          "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZáéíóúÁÉÍÓÚñÑ#-_.:,;()@/+$% ",
      });

      const result = await worker.recognize(imageData);
      await worker.terminate();

      let text = result.data.text.trim();

      const lines = text
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line.length > 0);

      const addressInfo = detectAndCorrectAddress(text);
      if (addressInfo) setDetectedAddress(addressInfo);

      const phone = detectPhone(text); // Ensure detectPhone is defined below
      const price = detectPrice(text);

      if (phone) setDetectedPhone(phone);
      if (price) setDetectedPrice(price);

      text += "\n\nYA PAGO?";
      lines.push("YA PAGO?");

      setCapturedText(text);
      setFormattedLines(lines);
    } catch (error) {
      console.error("Error en OCR:", error);
      setCapturedText("Error al leer la imagen.");
    } finally {
      setLoading(false);
    }
  };

  const detectAndCorrectAddress = (text: string): DetectedAddress => {
    // Expresión regular robusta para direcciones colombianas
    const regex =
      /\b(Calle|Carrera|Avenida|Diagonal|Transversal)\s*(\d+[A-Za-z]?(\s*sur)?)\s*#\s*(\d+[A-Za-z]?(\s*sur)?)\s*[-–]\s*(\d+)\b/gi;
  
    const match = regex.exec(text);
    if (!match) return null;
  
    // Extraemos los grupos relevantes
    const via = match[1].trim();
    const param1 = match[2].replace(/\s+/g, "").replace(/sur$/i, " sur").trim();
    const param2 = match[4].replace(/\s+/g, "").replace(/sur$/i, " sur").trim();
    const param3 = match[6].trim();
  
    // Construimos la dirección final
    const address = `${via} ${param1} #${param2}-${param3}`;
  
    // Creamos el enlace de Google Maps
    const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
  
    return { address, mapsUrl };
  };
  

  const detectPrice = (text: string): string | null => {
    // Buscar posibles precios en el texto
    const priceRegex = /\b(\$?\s?\d{1,6}(?:[.,]\d{3})*(?:[.,]\d{2})?)\b/g;
    const matches: string[] = [];
  
    let match;
    while ((match = priceRegex.exec(text)) !== null) {
      // Extraer solo dígitos
      const digits = match[1].replace(/[^\d]/g, "");
      if (digits.length > 1 && digits.length <= 6) matches.push(digits);
    }
  
    if (matches.length === 0) return null;
  
    // Convertir a números válidos (descartar cosas absurdas)
    const validNumbers = matches
      .map((num) => parseInt(num, 10))
      .filter((n) => n > 0 && n < 1000000);
  
    if (validNumbers.length === 0) return null;
  
    // Tomar el número más alto (más probable que sea el precio)
    let priceNumber = Math.max(...validNumbers);
  
    // 🔹 Ajuste: siempre tener 5 dígitos y terminar en “000”
    if (priceNumber < 1000) {
      // Si tiene menos de 4 dígitos, lo multiplicamos hasta tener miles
      while (priceNumber * 10 < 10000) {
        priceNumber *= 10;
      }
      // Aseguramos terminar en .000
      priceNumber = Math.floor(priceNumber / 1000) * 1000;
    } else if (priceNumber < 10000) {
      // Ej: 2300 → 23.000
      priceNumber = Math.round(priceNumber / 100) * 1000;
    } else {
      // Asegurar múltiplo de mil
      priceNumber = Math.round(priceNumber / 1000) * 1000;
    }
  
    const formatted = priceNumber.toLocaleString("es-CO");
    return `$ ${formatted}`;
  };
  
  

  const detectPhone = (text: string): string | null => {
    const phoneRegex = /\b\d{7,10}\b/g;
    const match = text.match(phoneRegex);
    return match ? match[0] : null;
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
          </div>
        </article>
      )}
    </section>
  );
};

export default OCRCamera;