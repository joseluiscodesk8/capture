import Tesseract, { createWorker } from "tesseract.js";

let workerPromise: Promise<Tesseract.Worker> | null = null;

export const getWorker = async () => {
  if (!workerPromise) {
    workerPromise = (async () => {
      const worker = await createWorker("spa");
      await worker.setParameters({
        tessedit_pageseg_mode: Tesseract.PSM.SPARSE_TEXT, // más flexible para recibos
        tessedit_char_whitelist:
          "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZáéíóúÁÉÍÓÚñÑ#-_.:,;()@/+$% ",
        preserve_interword_spaces: "1",
        user_defined_dpi: "70",
      });
      return worker;
    })();
  }
  return workerPromise;
};