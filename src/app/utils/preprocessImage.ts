export const preprocessImage = (imageData: string): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = imageData;
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d")!;

      const MAX_WIDTH = 300;
      const scale = Math.min(1, MAX_WIDTH / img.width);
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      const imageDataObj = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageDataObj.data;

      // 🟢 Detectar límites del área blanca (recibo)
      let minX = canvas.width,
        minY = canvas.height,
        maxX = 0,
        maxY = 0;

      for (let y = 0; y < canvas.height; y++) {
        for (let x = 0; x < canvas.width; x++) {
          const i = (y * canvas.width + x) * 4;
          const r = data[i],
            g = data[i + 1],
            b = data[i + 2];
          const brightness = (r + g + b) / 3;
          if (brightness > 200) {
            // píxel blanco o casi blanco
            if (x < minX) minX = x;
            if (x > maxX) maxX = x;
            if (y < minY) minY = y;
            if (y > maxY) maxY = y;
          }
        }
      }

      // 🟢 Aplicar padding al área blanca
      const padding = 10;
      minX = Math.max(0, minX - padding);
      minY = Math.max(0, minY - padding);
      maxX = Math.min(canvas.width, maxX + padding);
      maxY = Math.min(canvas.height, maxY + padding);
      const cropWidth = maxX - minX;
      const cropHeight = maxY - minY;

      // 🟢 Crear nuevo canvas con solo el área blanca
      const croppedCanvas = document.createElement("canvas");
      const croppedCtx = croppedCanvas.getContext("2d")!;
      croppedCanvas.width = cropWidth;
      croppedCanvas.height = cropHeight;
      croppedCtx.drawImage(
        canvas,
        minX,
        minY,
        cropWidth,
        cropHeight,
        0,
        0,
        cropWidth,
        cropHeight
      );

      const croppedData = croppedCtx.getImageData(
        0,
        0,
        cropWidth,
        cropHeight
      );
      const cdata = croppedData.data;

      // 🟢 Aumentar contraste/brillo
      const brightnessBoost = 1.3;
      const contrast = 60;
      const factor = (259 * (contrast + 255)) / (255 * (259 - contrast));

      for (let i = 0; i < cdata.length; i += 4) {
        cdata[i] = factor * (cdata[i] - 128) + 128;
        cdata[i + 1] = factor * (cdata[i + 1] - 128) + 128;
        cdata[i + 2] = factor * (cdata[i + 2] - 128) + 128;

        cdata[i] *= brightnessBoost;
        cdata[i + 1] *= brightnessBoost;
        cdata[i + 2] *= brightnessBoost;
      }

      // 🟢 Umbral adaptativo (binarización)
      const blockSize = 8;
      const thresholdOffset = 15;
      const getGray = (x: number, y: number) => {
        const idx = (y * cropWidth + x) * 4;
        return (cdata[idx] + cdata[idx + 1] + cdata[idx + 2]) / 3;
      };

      for (let y = 0; y < cropHeight; y++) {
        for (let x = 0; x < cropWidth; x++) {
          let sum = 0;
          let count = 0;
          for (let dy = -blockSize; dy <= blockSize; dy++) {
            for (let dx = -blockSize; dx <= blockSize; dx++) {
              const nx = x + dx;
              const ny = y + dy;
              if (nx >= 0 && ny >= 0 && nx < cropWidth && ny < cropHeight) {
                sum += getGray(nx, ny);
                count++;
              }
            }
          }
          const avg = sum / count - thresholdOffset;
          const idx = (y * cropWidth + x) * 4;
          const gray = getGray(x, y);
          const value = gray > avg ? 255 : 0;
          cdata[idx] = cdata[idx + 1] = cdata[idx + 2] = value;
        }
      }

      croppedCtx.putImageData(croppedData, 0, 0);
      resolve(croppedCanvas.toDataURL("image/png"));
    };
  });
};