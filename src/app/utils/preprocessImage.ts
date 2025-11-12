export const preprocessImage = (imageData: string): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = imageData;
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d")!;

      // 🟢 Escalado adaptativo (para móviles)
      const MAX_WIDTH = 300;
      const scale = Math.min(1, MAX_WIDTH / img.width);
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;

      // 🟢 Recorte del área central (ignora márgenes vacíos)
      const cropTop = img.height * 0.25;
      const cropHeight = img.height * 0.5;
      ctx.drawImage(
        img,
        0,
        cropTop,
        img.width,
        cropHeight,
        0,
        0,
        canvas.width,
        canvas.height
      );

      const imageDataObj = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageDataObj.data;

      // 🟢 Contraste y brillo ajustados
      const brightnessBoost = 1.2;
      const contrast = 55;
      const factor = (259 * (contrast + 255)) / (255 * (259 - contrast));

      for (let i = 0; i < data.length; i += 4) {
        data[i] = factor * (data[i] - 128) + 128;
        data[i + 1] = factor * (data[i + 1] - 128) + 128;
        data[i + 2] = factor * (data[i + 2] - 128) + 128;

        data[i] *= brightnessBoost;
        data[i + 1] *= brightnessBoost;
        data[i + 2] *= brightnessBoost;
      }

      // 🟢 Umbral adaptativo
      const blockSize = 8;
      const thresholdOffset = 15;

      const getGray = (x: number, y: number) => {
        const idx = (y * canvas.width + x) * 4;
        return (data[idx] + data[idx + 1] + data[idx + 2]) / 3;
      };

      for (let y = 0; y < canvas.height; y++) {
        for (let x = 0; x < canvas.width; x++) {
          let sum = 0;
          let count = 0;
          for (let dy = -blockSize; dy <= blockSize; dy++) {
            for (let dx = -blockSize; dx <= blockSize; dx++) {
              const nx = x + dx;
              const ny = y + dy;
              if (nx >= 0 && ny >= 0 && nx < canvas.width && ny < canvas.height) {
                sum += getGray(nx, ny);
                count++;
              }
            }
          }
          const avg = sum / count - thresholdOffset;
          const idx = (y * canvas.width + x) * 4;
          const gray = getGray(x, y);
          const value = gray > avg ? 255 : 0;
          data[idx] = data[idx + 1] = data[idx + 2] = value;
        }
      }

      ctx.putImageData(imageDataObj, 0, 0);
      resolve(canvas.toDataURL("image/png"));
    };
  });
};
