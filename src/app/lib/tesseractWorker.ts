import Tesseract, { createWorker } from "tesseract.js";

let workerPromise: Promise<Tesseract.Worker> | null = null;

export const getWorker = async () => {
  if (!workerPromise) {
    workerPromise = (async () => {
      const worker = await createWorker("spa", 1);
      await worker.setParameters({
        tessedit_pageseg_mode: Tesseract.PSM.AUTO, // más flexible para recibos
        tessedit_char_whitelist:
          "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZáéíóúÁÉÍÓÚñÑ#-_.:,;()@/+$% ",
        preserve_interword_spaces: "1",
        user_defined_dpi: "200",
      });
      return worker;
    })();
  }
  return workerPromise;
};