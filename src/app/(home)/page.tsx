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

const CameraCapture = dynamic(
  () => import("./componentes/CameraCapture"),
  {
    ssr: false,
  }
);

const LyricsPlayer = dynamic(
  () => import("./componentes/LyricsPlayer"),
  {
    ssr: false,
  }
);


export default function Home() {
  return (
    <main>
      <h1>Patinando Todos Los Marditos Dias</h1>
      <LyricsPlayer />
      {/* <CameraCapture /> */}
{/*       <Audioranscriber />
      <QRButton /> */}
    </main>
  );
}
