import type { Metadata } from "next";
import GrammarView from "./componentes/GrammarView";
import grammarData from "@/data/grammar.json";
import readingsData from "@/data/readings.json";
import songsData from "@/data/songs.json";
import type { GrammarData, ReadingData, Song } from "@/data/types";
import styles from "./styles/grammar.module.scss";

export const metadata: Metadata = {
  title: "Gramática · Catcher",
  description:
    "Ejercicios de gramática sobre frases reales de las canciones, y lecturas de historias contadas enteras en simple present o simple past.",
};

export default function GrammarPage() {
  const { topics } = grammarData as GrammarData;
  const { readings } = readingsData as ReadingData;
  const songs = songsData as Song[];

  return (
    <main className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Gramática</h1>
        <p className={styles.subtitle}>
          Completa la frase con la forma correcta, o lee una historia entera en
          un solo tiempo verbal.
        </p>
      </div>

      <GrammarView topics={topics} songs={songs} readings={readings} />
    </main>
  );
}
