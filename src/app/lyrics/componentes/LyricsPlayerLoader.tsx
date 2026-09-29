"use client";

import dynamic from "next/dynamic";

const LyricsPlayer = dynamic(
  () => import("./LyricsPlayer"),
  {
    ssr: false,
  }
);

export default function LyricsPlayerLoader() {
  return <LyricsPlayer />;
}
