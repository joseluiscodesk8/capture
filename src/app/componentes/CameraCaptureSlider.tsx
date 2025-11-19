import React, { useRef, useState } from "react";
import Image from "next/image";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";

export default function CameraCaptureSlider() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [images, setImages] = useState<string[]>([]);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);

  const openCamera = async () => {
    try {
      const videoStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });

      setStream(videoStream);
      setCameraOpen(true);

      if (videoRef.current) {
        videoRef.current.srcObject = videoStream;
      }
    } catch (error) {
      console.error("Error abriendo la cámara", error);
    }
  };

  const closeCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
    }
    setCameraOpen(false);
  };

  const takePhoto = () => {
    if (!canvasRef.current || !videoRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const imageUrl = canvas.toDataURL("image/png");

    setImages((prev) => [...prev, imageUrl]);
  };

  const clearImages = () => setImages([]);

  return (
    <div style={{ padding: "20px", maxWidth: "500px", margin: "auto" }}>
      <h2>Captura de imágenes</h2>

      {/* Botón para abrir cámara */}
      {!cameraOpen && (
        <button
          onClick={openCamera}
          style={{
            marginBottom: "20px",
            padding: "10px 15px",
            background: "#1d3557",
            color: "white",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
          }}
        >
          Abrir cámara
        </button>
      )}

      {/* Cámara visible solo cuando está abierta */}
      {cameraOpen && (
        <div>
          <div
            style={{
              width: "100%",
              height: "300px",
              marginBottom: "20px",
              borderRadius: "10px",
              overflow: "hidden",
              background: "#000",
            }}
          >
            <video
              ref={videoRef}
              autoPlay
              playsInline
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            ></video>
          </div>

          <button
            onClick={takePhoto}
            style={{
              padding: "10px 20px",
              background: "#457b9d",
              color: "white",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
              marginRight: "10px",
            }}
          >
            Tomar foto
          </button>

          <button
            onClick={closeCamera}
            style={{
              padding: "10px 20px",
              background: "#e63946",
              color: "white",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
            }}
          >
            Cerrar cámara
          </button>

          <canvas ref={canvasRef} style={{ display: "none" }} />
        </div>
      )}

      {/* Slider */}
      {images.length > 0 && !cameraOpen && (
        <Swiper spaceBetween={10} slidesPerView={1} style={{ height: "300px" }}>
          {images.map((src, index) => (
            <SwiperSlide key={index}>
              <div style={{ position: "relative", width: "100%", height: "100%" }}>
                <Image
                  src={src}
                  alt={`Foto ${index + 1}`}
                  fill
                  style={{ objectFit: "cover", borderRadius: "10px" }}
                />
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      )}

      {/* Botón para eliminar todas las fotos */}
      {images.length > 0 && !cameraOpen && (
        <button
          onClick={clearImages}
          style={{
            marginTop: "15px",
            padding: "10px 15px",
            background: "#e63946",
            color: "white",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
          }}
        >
          Eliminar todas las fotos
        </button>
      )}
    </div>
  );
}