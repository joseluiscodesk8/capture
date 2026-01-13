
import React, { useRef, useState } from "react";
import Image from "next/image";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import styles from "../index.module.scss";

export default function SimpleCamera() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewImages, setPreviewImages] = useState<string[]>([]);

  const handleCaptureClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    const newImages: string[] = [];

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        newImages.push(reader.result as string);

        if (newImages.length === files.length) {
          setPreviewImages((prev) => [...prev, ...newImages]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const deleteAllImages = () => {
    setPreviewImages([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <section className={styles.ocrCamera}>
      <div className={styles.controls}>
        <button
          onClick={handleCaptureClick}
          className={`${styles.btn} ${styles.primary}`}
        >
          Tomar fotos
        </button>

        <input
          type="file"
          accept="image/*"
          capture="environment"
          ref={fileInputRef}
          onChange={handleFileChange}
          multiple
          className={styles.inputFile}
        />
      </div>

      {previewImages.length > 0 && (
        <button
          onClick={deleteAllImages}
          className={`${styles.btn} ${styles.danger}`}
        >
          Eliminar todas las fotos
        </button>
      )}

      {/* Slider con SWIPER */}
      {previewImages.length > 0 && (
        <Swiper
          spaceBetween={20}
          slidesPerView={1}
          className={styles.slider}
        >
          {previewImages.map((img, index) => (
            <SwiperSlide key={index}>
              <div className={styles.slideWrapper}>
                <Image
                  src={img}
                  alt={`Foto ${index + 1}`}
                  width={350}
                  height={350}
                  className={styles.previewImage}
                  priority
                  unoptimized
                />
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      )}
    </section>
  );
}

// import React, { useRef, useState } from "react";
// import Image from "next/image";
// import styles from "../index.module.scss";

// export default function SimpleCamera() {
//   const fileInputRef = useRef<HTMLInputElement>(null);
//   const [previewImages, setPreviewImages] = useState<string[]>([]);

//   const handleCaptureClick = () => {
//     fileInputRef.current?.click();
//   };

//   const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
//     const files = event.target.files;
//     if (!files) return;

//     const newImages: string[] = [];

//     Array.from(files).forEach((file) => {
//       const reader = new FileReader();
//       reader.onloadend = () => {
//         newImages.push(reader.result as string);

//         // cuando todos los archivos están leídos actualizamos el state una sola vez
//         if (newImages.length === files.length) {
//           setPreviewImages((prev) => [...prev, ...newImages]);
//         }
//       };
//       reader.readAsDataURL(file);
//     });
//   };

//   const deleteAllImages = () => {
//     setPreviewImages([]);
//     if (fileInputRef.current) {
//       fileInputRef.current.value = ""; // resetea el input
//     }
//   };

//   return (
//     <section className={styles.ocrCamera}>
//       <div className={styles.controls}>
//         <button
//           onClick={handleCaptureClick}
//           className={`${styles.btn} ${styles.primary}`}
//         >
//           Tomar fotos
//         </button>

//         <input
//           type="file"
//           accept="image/*"
//           capture="environment"
//           ref={fileInputRef}
//           onChange={handleFileChange}
//           multiple     // ← ← permite seleccionar varias fotos
//           className={styles.inputFile}
//         />
//       </div>

//       {/* Mostrar botón de eliminar si hay imágenes */}
//       {previewImages.length > 0 && (
//         <button
//           onClick={deleteAllImages}
//           className={`${styles.btn} ${styles.danger}`}
//         >
//           Eliminar todas las fotos
//         </button>
//       )}

//       {/* Galería de fotos */}
//       <div className={styles.gallery}>
//         {previewImages.map((img, index) => (
//           <Image
//             key={index}
//             src={img}
//             alt={`Foto ${index + 1}`}
//             width={300}
//             height={300}
//             className={styles.previewImage}
//             priority
//             unoptimized
//           />
//         ))}
//       </div>
//     </section>
//   );
// }
