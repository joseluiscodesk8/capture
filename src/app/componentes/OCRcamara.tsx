"use client";

import React, { useRef, useState } from "react";
import Tesseract from "tesseract.js";
import styles from "../index.module.scss";

const OCRCamera: React.FC = () => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [capturedText, setCapturedText] = useState<string>("");
  const [formattedLines, setFormattedLines] = useState<string[]>([]);
  const [detectedAddress, setDetectedAddress] = useState<{ address: string; mapsUrl: string } | null>(null);
  const [loading, setLoading] = useState(false);

  // 📸 Abrir cámara o galería
  const openCameraOrGallery = () => {
    fileInputRef.current?.click();
  };

  // 📂 Manejar imagen seleccionada o tomada
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

  // 🧠 Procesar imagen con OCR
  const processImage = async (imageData: string) => {
    setLoading(true);
    setCapturedText("");
    setFormattedLines([]);
    setDetectedAddress(null);

    try {
      const worker = await Tesseract.createWorker();
      await worker.load();
      await worker.load();
      await worker.load("spa");
      await worker.reinitialize("spa");
      await worker.setParameters({
        tessedit_char_whitelist:
          "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZáéíóúÁÉÍÓÚñÑ#-_.:,;()@/ ",
      });
      const result = await worker.recognize(imageData);
      await worker.terminate();

      let text = result.data.text.trim();

      const lines = text
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line.length > 0);

      // 🔍 Detectar y corregir dirección
      const addressInfo = detectAndCorrectAddress(text);
      if (addressInfo) {
        setDetectedAddress(addressInfo);
        text += `\n\n📍 Dirección detectada:\n${addressInfo.address}`;
      }

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

  // 🧭 Detectar y corregir direcciones colombianas
  const detectAndCorrectAddress = (text: string) => {
    // Paso 1️⃣ - Buscar posibles frases con tipos de vía
    const regex =
      /\b(Calle|Carrera|Avenida|Diagonal|Transversal)\s+[A-Za-z0-9\s%&@°.,-]{1,40}/gi;

    const match = text.match(regex);
    if (!match) return null;

    let raw = match[0].trim();

    // Paso 2️⃣ - Normalizar texto y reemplazar errores comunes
    raw = raw
      .replace(/\s{2,}/g, " ")
      .replace(/[EeYy%&xX\$@°]/g, "#") // símbolos mal leídos -> numeral
      .replace(/#+/g, "#")
      .replace(/\s?#\s?/g, " #")
      .trim();

    // Paso 3️⃣ - Patrón estricto colombiano (4 parámetros)
    const addressPattern =
      /\b(Calle|Carrera|Avenida|Diagonal|Transversal)\s*(\d+[A-Za-z]?|[0-9]+\s*Sur)?\s*#\s*(\d+[A-Za-z]?|[0-9]+\s*Sur)\s*[-\s]?\s*(\d+)\b/i;

    const cleanMatch = raw.match(addressPattern);

    if (cleanMatch) {
      const [, via, num1, num2, num3] = cleanMatch;
      const address = `${via} ${num1?.replace(/\s+/g, "") || ""} #${num2
        ?.replace(/\s+/g, "")
        || ""}-${num3}`;

      const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
      return { address, mapsUrl };
    }

    // Paso 4️⃣ - Intentar corrección heurística (si el OCR falló)
    const fallback = raw
      .replace(
        /(Calle|Carrera|Avenida|Diagonal|Transversal)\s*(\d+)[A-Za-z]?\s*[^#\d]*\s*(\d+[A-Za-z]?)\s*[-\s]?\s*(\d+)/i,
        (_, via, num1, num2, num3) => `${via} ${num1} #${num2}-${num3}`
      );

    const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fallback)}`;
    return { address: fallback.trim(), mapsUrl };
  };

  // 💬 Enviar texto a WhatsApp
  const sendToWhatsApp = () => {
    const whatsappNumber = "573017844046";
    const url = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(capturedText)}`;
    window.open(url, "_blank");
  };

  // 🗺️ Abrir en Google Maps
  const openInMaps = (mapsUrl: string) => {
    window.open(mapsUrl, "_blank");
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

          {detectedAddress && (
            <div className={styles.mapSection}>
              <button
                onClick={() => openInMaps(detectedAddress.mapsUrl)}
                className={`${styles.btn} ${styles.mapBtn}`}
              >
                🗺️ Abrir en Maps
              </button>
            </div>
          )}

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
//   const [detectedAddress, setDetectedAddress] = useState<{ address: string; mapsUrl: string } | null>(null);
//   const [loading, setLoading] = useState(false);

//   // 📸 Abrir cámara o galería
//   const openCameraOrGallery = () => {
//     fileInputRef.current?.click();
//   };

//   // 📂 Manejar imagen seleccionada o tomada
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

//   // 🧠 Procesar imagen con OCR
//   const processImage = async (imageData: string) => {
//     setLoading(true);
//     setCapturedText("");
//     setFormattedLines([]);
//     setDetectedAddress(null);

//     try {
//       const worker = await Tesseract.createWorker();
//       await worker.load();
//       await worker.load();
//       await worker.load();
//       await worker.load();
//       await worker.load();
//       await worker.load("spa");
//       await worker.reinitialize("spa");
//       await worker.setParameters({
//         tessedit_char_whitelist:
//           "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZáéíóúÁÉÍÓÚñÑ#-_.:,;()@/ ",
//       });
//       const result = await worker.recognize(imageData);
//       await worker.terminate();

//       let text = result.data.text.trim();

//       // 🧹 Limpieza básica
//       const lines = text
//         .split("\n")
//         .map((line) => line.trim())
//         .filter((line) => line.length > 0);

//       // 🔍 Detectar dirección
//       const addressInfo = detectAddressAndGenerateMapLink(text);
//       if (addressInfo) {
//         setDetectedAddress(addressInfo);
//         text += `\n\n📍 Dirección detectada:\n${addressInfo.address}`;
//       }

//       // 🧾 Agregar pregunta al final
//       text += "\n\nYA PAGO?";
//       lines.push("YA PAGO?");

//       setCapturedText(text);
//       setFormattedLines(lines);
//     } catch (error) {
//       console.error("Error en OCR:", error);
//       setCapturedText("Error al leer la imagen.");
//     } finally {
//       setLoading(false);
//     }
//   };

//   // 🗺️ Detectar dirección y generar link de Google Maps
//   const detectAddressAndGenerateMapLink = (text: string) => {
//     const addressRegex =
//       /\b(Calle|Carrera|Avenida|Diagonal|Transversal)\s*\d+[A-Za-z]?\s*#?\s*\d+[A-Za-z]?\s*[-–]?\s*\d*[A-Za-z]*/i;

//     const match = text.match(addressRegex);
//     if (match) {
//       const address = match[0]
//         .replace(/\s{2,}/g, " ") // elimina espacios dobles
//         .replace(/\s?#\s?/g, "#") // asegura que el # esté bien pegado
//         .replace(/(\d)\s?9(\d)/g, "$1#$2") // 🔧 Corrige errores donde OCR leyó 9 en lugar de #
//         .trim();

//       const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
//         address
//       )}`;

//       return { address, mapsUrl };
//     }
//     return null;
//   };

//   // 💬 Enviar texto a WhatsApp
//   const sendToWhatsApp = () => {
//     const whatsappNumber = "573017844046"; // Número fijo
//     const url = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(
//       capturedText
//     )}`;
//     window.open(url, "_blank");
//   };

//   // 🗺️ Abrir Google Maps en la app del celular
//   const openInMaps = (mapsUrl: string) => {
//     window.open(mapsUrl, "_blank");
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

//           {detectedAddress && (
//             <div className={styles.mapSection}>
//               <button
//                 onClick={() => openInMaps(detectedAddress.mapsUrl)}
//                 className={`${styles.btn} ${styles.mapBtn}`}
//               >
//                 🗺️ Abrir en Maps
//               </button>
//             </div>
//           )}

//           <button
//             onClick={sendToWhatsApp}
//             className={`${styles.btn} ${styles.success}`}
//           >
//             📤 Enviar por WhatsApp
//           </button>
//         </article>
//       )}
//     </section>
//   );
// };

// export default OCRCamera;
