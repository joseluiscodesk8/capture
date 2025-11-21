"use client";

import dynamic from "next/dynamic";

const QRButton = dynamic(() => import("./componentes/QRButton"), {
  ssr: false,
});

const Audioranscriber = dynamic(
  () => import("./componentes/AudioTranscriber"),
  {
    ssr: false,
  }
);

const ImagenCaptureslider = dynamic(
  () => import("./componentes/OCRcamara"),
  { ssr: false }
);

export default function Home() {
  return (
    <main>
      <h1>Patinando Todos Los Marditos Dias</h1>
      <ImagenCaptureslider />
      <Audioranscriber />
      <QRButton />
    </main>
  );
}
