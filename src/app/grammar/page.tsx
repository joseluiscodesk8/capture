import type { Metadata } from "next";
import GrammarView from "./componentes/GrammarView";
import grammarData from "@/data/grammar.json";
import songsData from "@/data/songs.json";
import type { GrammarData, Song } from "@/data/types";
import styles from "./styles/grammar.module.scss";

export const metadata: Metadata = {
  title: "Gramática · Catcher",
  description:
    "Ejercicios de gramática sobre frases reales de las canciones: elige la forma correcta y lee la explicación.",
};

export default function GrammarPage() {
  const { topics } = grammarData as GrammarData;
  const songs = songsData as Song[];

  return (
    <main className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Gramática</h1>
        <p className={styles.subtitle}>
          Completa la frase con la forma correcta y mira por qué.
        </p>
      </div>

      <GrammarView topics={topics} songs={songs} />
    </main>
  );
}
