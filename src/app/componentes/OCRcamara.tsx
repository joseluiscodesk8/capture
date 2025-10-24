"use client";

import React, { useRef, useState } from "react";
import Tesseract from "tesseract.js";
import styles from "../index.module.scss";

const OCRCamera: React.FC = () => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [capturedText, setCapturedText] = useState<string>("");
  const [formattedLines, setFormattedLines] = useState<string[]>([]);
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
    setFormattedLines([]);
    try {
      const result = await Tesseract.recognize(imageData, "spa");
      const text = result.data.text.trim();

      // Limpieza básica y formato visual
      const lines = text
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line.length > 0);

      setCapturedText(text);
      setFormattedLines(lines);
    } catch (error) {
      console.error("Error en OCR:", error);
      setCapturedText("Error al leer la imagen.");
    } finally {
      setLoading(false);
    }
  };

  // Enviar por WhatsApp directamente
  const sendToWhatsApp = () => {
    const whatsappNumber = "573017844046"; // 🔹 número destino fijo
    const url = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(
      capturedText
    )}`;
    window.open(url, "_blank");
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

          <button
            onClick={sendToWhatsApp}
            className={`${styles.btn} ${styles.success}`}
          >
            📤 Enviar por WhatsApp
          </button>
        </article>
      )}
    </section>
  );
};

export default OCRCamera;


// "use client";

// import React, { useRef, useState } from "react";
// import Tesseract from "tesseract.js";
// import styles from "../index.module.scss";

// const OCRCamera: React.FC = () => {
//   const fileInputRef = useRef<HTMLInputElement | null>(null);
//   const [capturedText, setCapturedText] = useState<string>("");
//   const [formattedLines, setFormattedLines] = useState<string[]>([]);
//   const [loading, setLoading] = useState(false);

//   // Abrir selector nativo (cámara o galería)
//   const openCameraOrGallery = () => {
//     fileInputRef.current?.click();
//   };

//   // Manejar imagen seleccionada o tomada
//   const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
//     const file = event.target.files?.[0];
//     if (!file) return;

//     const reader = new FileReader();
//     reader.onload = async () => {
//       const imageData = reader.result as string;
//       await processImage(imageData);
//     };
//     reader.readAsDataURL(file);
//   };

//   // Procesar imagen con OCR
//   const processImage = async (imageData: string) => {
//     setLoading(true);
//     setCapturedText("");
//     setFormattedLines([]);
//     try {
//       const result = await Tesseract.recognize(imageData, "spa");
//       const text = result.data.text.trim();

//       // Limpieza básica y formato visual
//       const lines = text
//         .split("\n")
//         .map((line) => line.trim())
//         .filter((line) => line.length > 0);

//       setCapturedText(text);
//       setFormattedLines(lines);
//     } catch (error) {
//       console.error("Error en OCR:", error);
//       setCapturedText("Error al leer la imagen.");
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <section className={styles.ocrCamera}>
//       <div className={styles.controls}>
//         <button
//           onClick={openCameraOrGallery}
//           className={`${styles.btn} ${styles.primary}`}
//         >
//           Tomar o seleccionar imagen
//         </button>

//         <input
//           type="file"
//           accept="image/*"
//           ref={fileInputRef}
//           onChange={handleImageUpload}
//           className={styles.inputFile}
//         />
//       </div>

//       {loading && <p className={styles.status}>📸 Procesando imagen...</p>}

//       {!loading && formattedLines.length > 0 && (
//         <article className={styles.result}>
//           <h2 className={styles.title}>🧾 Texto detectado:</h2>
//           <div className={styles.ticket}>
//             {formattedLines.map((line, index) => (
//               <div key={index} className={styles.ticketLine}>
//                 {line}
//               </div>
//             ))}
//           </div>
//         </article>
//       )}
//     </section>
//   );
// };

// export default OCRCamera;
