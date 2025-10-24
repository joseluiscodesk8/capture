"use client";

import React, { useRef, useState } from "react";
import Tesseract from "tesseract.js";
import styles from "../index.module.scss";

const OCRCamera: React.FC = () => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [capturedText, setCapturedText] = useState<string>("");
  const [loading, setLoading] = useState(false);

  // Abrir selector nativo (cámara o galería)
  const openCameraOrGallery = () => {
    fileInputRef.current?.click();
  };

  // Manejar imagen seleccionada o tomada
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

  // Procesar imagen con OCR
  const processImage = async (imageData: string) => {
    setLoading(true);
    setCapturedText("");
    try {
      const result = await Tesseract.recognize(imageData, "spa");
      setCapturedText(result.data.text.trim());
    } catch (error) {
      console.error("Error en OCR:", error);
      setCapturedText("Error al leer la imagen.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className={styles.ocrCamera}>
      <div className={styles.controls}>
        <button
          onClick={openCameraOrGallery}
          className={`${styles.btn} ${styles.primary}`}
        >
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

      {!loading && capturedText && (
        <article className={styles.result}>
          <h2 className={styles.title}>Texto detectado:</h2>
          <p className={styles.text}>{capturedText}</p>
        </article>
      )}
    </section>
  );
};

export default OCRCamera;