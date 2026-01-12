import { useState } from "react";
import Image from "next/image";
import styles from "../styles/index.module.scss";

export default function QRButton() {
  const [showImage, setShowImage] = useState(false);

  return (
    <>
      {/* Botón circular */}
      <button
        className={styles.qrButton}
        onClick={() => setShowImage(true)}
      >
        QR
      </button>

      {/* Imagen superpuesta */}
      {showImage && (
        <div className={styles.overlay} onClick={() => setShowImage(false)}>
          <div className={styles.imageContainer}>
            <Image
              src="/qr.jpeg" // 🔹 Cambia por el nombre de tu imagen real
              alt="Código QR"
              width={300}
              height={300}
              className={styles.qrImage}
            />
          </div>
        </div>
      )}
    </>
  );
}