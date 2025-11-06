// utils/preprocessImage.ts
export const preprocessImage = (imageData: string): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = imageData;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d")!;
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
  
        const imageDataObj = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageDataObj.data;
  
        // Convertir a blanco y negro (binarización básica)
        for (let i = 0; i < data.length; i += 4) {
          const brightness =
            0.34 * data[i] + 0.5 * data[i + 1] + 0.16 * data[i + 2];
          const value = brightness > 140 ? 255 : 0; // ajusta umbral (130–150)
          data[i] = data[i + 1] = data[i + 2] = value;
        }
  
        ctx.putImageData(imageDataObj, 0, 0);
        resolve(canvas.toDataURL("image/png"));
      };
    });
  };
  