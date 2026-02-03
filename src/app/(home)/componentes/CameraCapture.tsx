import { useRef, useState } from "react";
import styles from "../styles/index.module.scss";

export default function CameraCapture() {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [images, setImages] = useState<string[]>([]);

  // 🔧 CONFIGURACIÓN DE TAMAÑO
  const imageHeight = 320; // px → cambia aquí el tamaño

  const openCamera = () => {
    inputRef.current?.click();
  };

  const onCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const url = URL.createObjectURL(file);
    setImages((prev) => [...prev, url]);
    e.target.value = "";
  };

  return (
    <section className={styles.container}>
      {/* 🔝 HEADER STICKY */}
      <header className={styles.header}>
        <button className={styles.cameraButton} onClick={openCamera}>
          📷 <span>Abrir cámara</span>
        </button>

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className={styles.hiddenInput}
          onChange={onCapture}
        />
      </header>

      {/* 🖼️ SLIDER */}
      {images.length > 0 && (
        <div
          className={styles.slider}
          style={{ "--img-height": `${imageHeight}px` } as React.CSSProperties}
        >
          {images.map((img, i) => (
            <div key={i} className={styles.slide}>
              <img src={img} />
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
