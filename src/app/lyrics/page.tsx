import type { Metadata } from "next";
import LyricsPlayerLoader from "./componentes/LyricsPlayerLoader";
import styles from "./styles/lyrics.module.scss";

export const metadata: Metadata = {
  title: "Letras · Catcher",
  description:
    "Escucha canciones con las letras sincronizadas: la línea activa se resalta y se centra sola.",
};

export default function LyricsPage() {
  return (
    <main className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Letras</h1>
        <p className={styles.subtitle}>
          Elige una canción. La línea activa se resalta y se centra sola.
        </p>
      </div>

      <LyricsPlayerLoader />
    </main>
  );
}
