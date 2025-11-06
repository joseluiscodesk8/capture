// lib/tesseractWorker.ts
import Tesseract, { createWorker } from "tesseract.js";

let workerPromise: Promise<Tesseract.Worker> | null = null;

export const getWorker = async () => {
  if (!workerPromise) {
    workerPromise = (async () => {
      const worker = await createWorker("spa", 1); // 1 = logging off
      await worker.setParameters({
        tessedit_char_whitelist:
          "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZáéíóúÁÉÍÓÚñÑ#-_.:,;()@/+$% ",
      });
      return worker;
    })();
  }
  return workerPromise;
};
