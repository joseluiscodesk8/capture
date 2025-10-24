"use client";

import React, { useRef, useState } from "react";
import Tesseract from "tesseract.js";
import styles from "../index.module.scss";

const OCRCamera: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [isCameraActive, setIsCameraActive] = useState(false);
  const [capturedText, setCapturedText] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // Activar cámara
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsCameraActive(true);
        setImagePreview(null);
        setCapturedText(""); // limpia texto previo
      }
    } catch (error) {
      console.error("No se pudo acceder a la cámara:", error);
    }
  };

  // Detener cámara
  const stopCamera = () => {
    const stream = videoRef.current?.srcObject as MediaStream;
    stream?.getTracks().forEach((track) => track.stop());
    setIsCameraActive(false);
  };

  // Capturar imagen desde cámara
  const capturePhoto = async () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");
    if (!context) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    const imageData = canvas.toDataURL("image/png");
    setImagePreview(imageData);

    // 🚀 Detenemos la cámara justo después de capturar
    stopCamera();

    await processImage(imageData);
  };

  // Seleccionar imagen desde galería o cámara
  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async () => {
      const imageData = reader.result as string;
      setImagePreview(imageData);
      setIsCameraActive(false);
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
      setCapturedText(result.data.text);
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
        {!isCameraActive ? (
          <button onClick={startCamera} className={`${styles.btn} ${styles.primary}`}>
            Activar cámara
          </button>
        ) : (
          <button onClick={stopCamera} className={`${styles.btn} ${styles.danger}`}>
            Detener cámara
          </button>
        )}

        <button
          onClick={() => fileInputRef.current?.click()}
          className={`${styles.btn} ${styles.secondary}`}
        >
          Seleccionar imagen
        </button>

        <input
          type="file"
          accept="image/*"
          capture="environment"
          ref={fileInputRef}
          onChange={handleImageUpload}
          className={styles.inputFile}
        />
      </div>

      <div className={styles.preview}>
        {isCameraActive && (
          <video ref={videoRef} autoPlay playsInline className={styles.previewVideo} />
        )}
        {imagePreview && !isCameraActive && (
          <img src={imagePreview} alt="Vista previa" className={styles.previewImage} />
        )}
      </div>

      {/* ✅ El botón solo aparece si la cámara está activa */}
      {isCameraActive && (
        <button onClick={capturePhoto} className={`${styles.btn} ${styles.success}`}>
          {loading ? "Procesando..." : "Capturar texto"}
        </button>
      )}

      <canvas ref={canvasRef} className={styles.hiddenCanvas} />

      {loading && <p className={styles.status}>Leyendo texto...</p>}

      {capturedText && (
        <article className={styles.result}>
          <h2 className={styles.title}>Texto detectado:</h2>
          <p className={styles.text}>{capturedText}</p>
        </article>
      )}
    </section>
  );
};

export default OCRCamera;