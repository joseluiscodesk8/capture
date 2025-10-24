"use client";

import dynamic from "next/dynamic";

const OCRCamera = dynamic(() => import("./componentes/OCRcamara"), {
  ssr: false,
});

export default function Home() {
  return (
    <main>
      <h1>Welcome to the Home Page</h1>
      <OCRCamera />
    </main>
  );
}
