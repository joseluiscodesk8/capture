import Link from "next/link";
import songsData from "@/data/songs.json";
import grammarData from "@/data/grammar.json";
import readingsData from "@/data/readings.json";
import styles from "./styles/home.module.scss";

type Song = {
  id: string;
  title: string;
  audio: string;
  lrc: string;
};

export default function Home() {
  const songs = songsData as Song[];
  const topics = grammarData.topics;
  const readings = readingsData.readings;
  const exerciseCount = topics.reduce(
    (total, topic) => total + topic.exercises.length,
    0
  );
  const levels = Array.from(new Set(topics.map((topic) => topic.level)));

  return (
    <main className={styles.page}>
      <div className={styles.intro}>
        <h1 className={styles.title}>Practica inglés con canciones</h1>
        <p className={styles.subtitle}>
          Escucha las letras sincronizadas para entrenar el oído, y usa esas
          mismas frases para practicar la gramática.
        </p>
      </div>

      <div className={styles.grid}>
        <Link href="/lyrics" className={styles.card}>
          <span className={styles.cardIcon} aria-hidden="true">
            ♪
          </span>
          <h2 className={styles.cardTitle}>Letras</h2>
          <p className={styles.cardText}>
            Reproductor con las letras sincronizadas: la línea activa se resalta
            y se centra sola mientras suena la canción.
          </p>
          <div className={styles.cardMeta}>
            <span className={styles.tag}>
              {songs.length} canciones
            </span>
            <span className={styles.tag}>LRC</span>
          </div>
          <span className={styles.cta}>Abrir Letras →</span>
        </Link>

        <Link href="/grammar" className={styles.card}>
          <span className={styles.cardIcon} aria-hidden="true">
            A+
          </span>
          <h2 className={styles.cardTitle}>Gramática</h2>
          <p className={styles.cardText}>
            Ejercicios de relleno sobre frases reales de las canciones, y
            lecturas de historias contadas enteras en simple present o simple
            past.
          </p>
          <div className={styles.cardMeta}>
            <span className={styles.tag}>
              {topics.length} temas
            </span>
            <span className={styles.tag}>{exerciseCount} ejercicios</span>
            <span className={styles.tag}>{readings.length} lecturas</span>
            <span className={styles.tag}>{levels.join(" · ")}</span>
          </div>
          <span className={styles.cta}>Abrir Gramática →</span>
        </Link>
      </div>
    </main>
  );
}
