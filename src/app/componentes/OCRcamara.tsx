import React, { useRef, useState } from "react";
import Image from "next/image";
import styles from "../index.module.scss";
import { getWorker } from "../lib/tesseractWorker";
import { preprocessImage } from "../utils/preprocessImage";

export default function OCRCamera() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [capturedText, setCapturedText] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [detectedAddress, setDetectedAddress] = useState<string | null>(null);
  const [detectedPhone, setDetectedPhone] = useState<string | null>(null);
  const [detectedPrice, setDetectedPrice] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null); // 🆕 Nuevo estado

  // --- Detectores ---
  const detectPhone = (text: string) => {
    const match = text.match(/(?:\+?57)?\s?(\d{3}[-\s.]?\d{3}[-\s.]?\d{4})/);
    return match ? match[1].replace(/[\s.-]/g, "") : null;
  };

  const detectPrice = (text: string) => {
    const lines = text
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);

    const priceRegex =
      /(?:\$|COP|col|pesos)?\s*([0-9]{1,3}(?:[.,][0-9]{3})*(?:[.,][0-9]{2,3})?|[0-9]+(?:[.,][0-9]{1,3})?)(?:\s?(?:COP|col|pesos)?)?/gi;

    let detectedPrice: number | null = null;

    const looksLikeTime = (raw: string) => {
      const normalized = raw.replace(",", ".").trim();
      if (/:/.test(normalized)) {
        const parts = normalized.split(":");
        if (parts.length === 2) {
          const h = parseInt(parts[0], 10);
          const m = parseInt(parts[1], 10);
          if (!isNaN(h) && !isNaN(m) && h >= 0 && h <= 23 && m >= 0 && m <= 59)
            return true;
        }
      }
      if (/^\d+\.\d+$/.test(normalized)) {
        const [intPart, fracPart] = normalized.split(".");
        const h = parseInt(intPart, 10);
        const m = parseInt(fracPart.slice(0, 2), 10);
        if (!isNaN(h) && !isNaN(m) && h >= 0 && h <= 23 && m >= 0 && m <= 59)
          return true;
      }
      return false;
    };

    for (let i = lines.length - 1; i >= 0; i--) {
      const line = lines[i];
      if (/:/.test(line) && looksLikeTime(line)) continue;
      if (
        /Calle|Carrera|Cra|Cll|Av|Avenida|#|No|Tel|Teléfono|Total\s*Items/i.test(
          line
        )
      )
        continue;

      const matches = [...line.matchAll(priceRegex)];

      for (const match of matches) {
        const raw = match[1] ?? "";
        if (!raw) continue;
        if (looksLikeTime(raw)) continue;

        let valStr = raw.replace(/\s/g, "");

        if (/^\d{1,3}(\.\d{3})+(,\d{1,3})?$/.test(valStr)) {
          valStr = valStr.replace(/\./g, "").replace(",", ".");
        } else {
          valStr = valStr.replace(/,/g, ".");
        }

        valStr = valStr.replace(/[^\d.]/g, "");

        if (!valStr) continue;

        const dots = (valStr.match(/\./g) || []).length;
        if (dots > 1 && /^\d+\.\d+\.\d+/.test(valStr)) {
          valStr = valStr.replace(/\./g, "");
        }

        let numeric = parseFloat(valStr);
        if (isNaN(numeric)) continue;

        const originalHadThousandsSeparator = /[.,]\d{3}/.test(raw);
        if (numeric < 1000 && originalHadThousandsSeparator) {
        } else if (numeric < 1000) {
          const contextHasCurrencyHint =
            /[$]|COP|pesos|precio|total|valor/i.test(line);
          if (contextHasCurrencyHint) {
            numeric = numeric * 1000;
          } else {
            continue;
          }
        }

        if (numeric < 1000 || numeric > 99999999) continue;

        detectedPrice = Math.round(numeric);
        break;
      }

      if (detectedPrice) break;
    }

    if (!detectedPrice) return null;
    const formatted = detectedPrice.toLocaleString("es-CO");
    return `$${formatted}`;
  };

  const detectAndCorrectAddress = (text: string) => {
    const regex =
      /(Calle|Carrera|Cra|Cll|Av|Avenida|Cl\.?|Cr\.?)\s?\d{1,3}[a-zA-Z]?\s?[#-]?\s?\d{1,3}-?\d{0,3}/i;
    const match = text.match(regex);
    if (!match) return null;

    const address = match[0]
      .replace(/\s{2,}/g, " ")
      .replace(/[,.;:-]+$/, "")
      .trim();

    return address;
  };

  const processImage = async (imageData: string) => {
    setLoading(true);
    setCapturedText("");
    setDetectedAddress(null);
    setDetectedPhone(null);
    setDetectedPrice(null);

    try {
      const worker = await getWorker();
      const processed = await preprocessImage(imageData);
      const result = await worker.recognize(processed);
      const text = result.data.text.trim();

      if (!text || text.length < 10) {
        setCapturedText(
          "⚠️ No se pudo leer el texto. Verifica la iluminación o el enfoque."
        );
        return;
      }


      const addressInfo = detectAndCorrectAddress(text);
      if (addressInfo) setDetectedAddress(addressInfo);

      const phone = detectPhone(text);
      const price = detectPrice(text);

      if (phone) setDetectedPhone(phone);
      if (price) setDetectedPrice(price);

      setCapturedText(text);
    } catch (error) {
      console.error("Error en OCR:", error);
      setCapturedText("⚠️ Error al leer la imagen. Intenta nuevamente.");
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const imageData = reader.result as string;
        setPreviewImage(imageData); // 🆕 Mostrar imagen previa
        processImage(imageData);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCaptureClick = () => {
    fileInputRef.current?.click();
  };

  const handleWhatsAppSend = () => {
    const targetNumber = "573017844046";
    const info = [
      detectedAddress
        ? `📍 Dirección: ${detectedAddress}`
        : "❌ No se detectó la dirección.",
      detectedPhone
        ? `📞 Teléfono: ${detectedPhone}`
        : "❌ No se detectó el teléfono.",
      detectedPrice
        ? `💲 Precio: ${detectedPrice}`
        : "❌ No se detectó el precio.",
      "🟡 YA PAGO?",
    ]
      .filter(Boolean)
      .join("\n");

    const message = encodeURIComponent(info);
    window.open(`https://wa.me/${targetNumber}?text=${message}`, "_blank");
  };

  const handleCall = () => {
    if (detectedPhone) {
      const cleanedPhone = detectedPhone.replace(/\D/g, "");
      window.location.href = `tel:${cleanedPhone}`;
    }
  };

  return (
    <section className={styles.ocrCamera}>
      <div className={styles.controls}>
        <button
          onClick={handleCaptureClick}
          className={`${styles.btn} ${styles.primary}`}
          disabled={loading}
        >
          {loading ? "Procesando..." : "Subir imagen"}
        </button>

        <input
          type="file"
          accept="image/*"
          ref={fileInputRef}
          onChange={handleFileChange}
          className={styles.inputFile}
        />
      </div>

      {previewImage && ( // 🆕 Mostrar imagen
        <div className={styles.previewContainer}>
          <Image
            src={previewImage}
            alt="Imagen cargada"
            width={400} // Ajusta el tamaño según tu diseño
            height={400}
            className={styles.previewImage}
            priority
            unoptimized
          />
        </div>
      )}

      {loading && <p className={styles.status}>🕐 Analizando imagen...</p>}

      {!loading && capturedText && (
        <div className={styles.result}>
          <h3 className={styles.title}>📄 Resultado</h3>
          {/* <div className={styles.ticket}>
            <pre>{capturedText}</pre>
          </div> */}

          {(detectedAddress || detectedPhone || detectedPrice) && (
            <div>
              {detectedAddress ? (
                <p>
                  📍 <strong>Dirección:</strong> {detectedAddress}
                </p>
              ) : (
                <p>❌ No se detectó la dirección.</p>
              )}

              {detectedPhone ? (
                <p>
                  📞 <strong>Teléfono:</strong> {detectedPhone}
                </p>
              ) : (
                <p>❌ No se detectó el teléfono.</p>
              )}

              {detectedPrice ? (
                <p>
                  💲 <strong>Precio:</strong> {detectedPrice}
                </p>
              ) : (
                <p>❌ No se detectó el precio.</p>
              )}
            </div>
          )}

          <p className={styles.paymentCheck}>YA PAGO?</p>

          <div className={styles.controls}>
            <button
              onClick={handleWhatsAppSend}
              className={`${styles.btn} ${styles.success}`}
            >
              Enviar por WhatsApp
            </button>

            {detectedPhone && (
              <button
                onClick={handleCall}
                className={`${styles.btn} ${styles.secondary}`}
              >
                Llamar al número
              </button>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
