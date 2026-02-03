import { useRef, useState } from "react";
import styles from "../styles/index.module.scss";

export default function CameraCapture() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [images, setImages] = useState<string[]>([]);
  const [cameraOpen, setCameraOpen] = useState(false);

  /* ================= OPEN CAMERA ================= */

  const openCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
        audio: false,
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      setCameraOpen(true);
    } catch (err) {
      console.error("Error al abrir la cámara", err);
    }
  };

  /* ================= CLOSE CAMERA ================= */

  const closeCamera = () => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setCameraOpen(false);
  };

  /* ================= CAPTURE ================= */

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(video, 0, 0);
    const imageData = canvas.toDataURL("image/jpeg", 0.9);

    setImages((prev) => [imageData, ...prev]);
  };

  /* ================= UI ================= */

  return (
    <section className={styles.container}>
      {!cameraOpen && (
        <button className={styles.captureBtn} onClick={openCamera}>
          📷 Abrir cámara
        </button>
      )}

      {cameraOpen && (
        <> <video
            ref={videoRef}
            autoPlay
            playsInline
            className={styles.video}
          />

          <div className={styles.cameraActions}>
            <button className={styles.captureBtn} onClick={capturePhoto}>
              📸 Tomar foto
            </button>

            <button className={styles.closeBtn} onClick={closeCamera}>
              ❌ Cerrar cámara
            </button>
          </div>
        </>
      )}

      <canvas ref={canvasRef} className={styles.hiddenCanvas} />

      {images.length > 0 && (
        <div className={styles.gallery}>
          {images.map((img, i) => (
            <img key={i} src={img} className={styles.image} />
          ))}
        </div>
      )}
    </section>
  );
}
