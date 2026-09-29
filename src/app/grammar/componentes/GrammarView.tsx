"use client";

import { useState } from "react";
import Link from "next/link";
import type { GrammarTopic, Reading, Song } from "@/data/types";
import Reader from "./Reader";
import styles from "../styles/grammar.module.scss";

type Props = {
  topics: GrammarTopic[];
  songs: Song[];
  readings: Reading[];
};

export default function GrammarView({ topics, songs, readings }: Props) {
  const [topicId, setTopicId] = useState(topics[0]?.id ?? "");
  const [readingId, setReadingId] = useState<string | null>(null);
  const [step, setStep] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [solved, setSolved] = useState<Record<string, number>>({});

  const topic = topics.find((item) => item.id === topicId) ?? topics[0];
  const reading = readings.find((item) => item.id === readingId) ?? null;

  const exercises = topic?.exercises ?? [];
  const total = exercises.length;
  const done = step >= total;
  const exercise = exercises[step];
  const pickedCorrect = picked !== null && picked === exercise?.answer;

  const songTitle = (id: string) => songs.find((song) => song.id === id)?.title;
  const topicSongs = (topic?.songIds ?? [])
    .map(songTitle)
    .filter((title): title is string => Boolean(title));

  const selectTopic = (id: string) => {
    setTopicId(id);
    setReadingId(null);
    setStep(0);
    setPicked(null);
  };

  const selectReading = (id: string) => {
    setReadingId(id);
  };

  const choose = (option: string) => {
    if (picked !== null || !topic) return;
    setPicked(option);
    if (option === exercise.answer) {
      setSolved((current) => ({
        ...current,
        [topic.id]: Math.min((current[topic.id] ?? 0) + 1, total),
      }));
    }
  };

  const next = () => {
    setStep((current) => current + 1);
    setPicked(null);
  };

  const goToNextTopic = () => {
    if (!topic) return;
    const currentIndex = topics.findIndex((item) => item.id === topic.id);
    const nextTopic = topics[(currentIndex + 1) % topics.length];
    selectTopic(nextTopic.id);
  };

  if (!topic && !reading) {
    return (
      <p className={styles.card}>Todavía no hay contenido de gramática.</p>
    );
  }

  return (
    <div className={styles.layout}>
      <aside className={styles.sidebar}>
        <p className={styles.sidebarTitle}>Ejercicios</p>
        <div className={styles.topicList}>
          {topics.map((item) => {
            const isActive = reading === null && item.id === topic?.id;

            return (
              <button
                key={item.id}
                onClick={() => selectTopic(item.id)}
                className={
                  isActive
                    ? `${styles.topicButton} ${styles.topicActive}`
                    : styles.topicButton
                }
                aria-current={isActive ? "true" : undefined}
              >
                <span className={styles.topicTop}>
                  <span className={styles.topicName}>{item.title}</span>
                  <span className={styles.level}>{item.level}</span>
                </span>
                <span className={styles.topicMeta}>
                  {solved[item.id] ?? 0}/{item.exercises.length} resueltos
                </span>
              </button>
            );
          })}
        </div>

        {readings.length > 0 && (
          <>
            <p className={`${styles.sidebarTitle} ${styles.sidebarTitleSpaced}`}>
              Lecturas
            </p>
            <div className={styles.topicList}>
              {readings.map((item) => {
                const isActive = item.id === readingId;

                return (
                  <button
                    key={item.id}
                    onClick={() => selectReading(item.id)}
                    className={
                      isActive
                        ? `${styles.topicButton} ${styles.topicActive}`
                        : styles.topicButton
                    }
                    aria-current={isActive ? "true" : undefined}
                  >
                    <span className={styles.topicTop}>
                      <span className={styles.topicName}>{item.title}</span>
                      <span className={styles.tenseBadge}>
                        {item.tense === "present" ? "Presente" : "Pasado"}
                      </span>
                    </span>
                    <span className={styles.topicMeta}>{item.series}</span>
                  </button>
                );
              })}
            </div>
          </>
        )}
      </aside>

      {reading ? (
        <section className={styles.card}>
          <div className={styles.cardTop}>
            <h2 className={styles.cardTitle}>{reading.title}</h2>
          </div>

          <p className={styles.summary}>
            Lectura completa en{" "}
            {reading.tense === "present" ? "simple present" : "simple past"}.
            El bloque que lees queda oscuro; el resto se apaga.
          </p>

          <Reader key={reading.id} reading={reading} />
        </section>
      ) : topic ? (
        <section className={styles.card}>
          <div className={styles.cardTop}>
            <h2 className={styles.cardTitle}>{topic.title}</h2>
            <Link href="/lyrics" className={styles.source}>
              {topicSongs.join(" · ")} →
            </Link>
          </div>

          <p className={styles.summary}>{topic.summary}</p>

          {done ? (
            <div className={styles.done}>
              <p className={styles.doneIcon}>✓</p>
              <p className={styles.doneTitle}>Tema completado</p>
              <p className={styles.doneText}>
                Has pasado los {total} ejercicios de {topic.title}. Puedes
                repetirlos o pasar al siguiente tema.
              </p>
              <div className={`${styles.actions} ${styles.actionsCenter}`}>
                <button
                  className={styles.ghostBtn}
                  onClick={() => selectTopic(topic.id)}
                >
                  Repetir tema
                </button>
                <button className={styles.primaryBtn} onClick={goToNextTopic}>
                  Siguiente tema
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className={styles.progressRow}>
                <div className={styles.progressTrack}>
                  <div
                    className={styles.progressFill}
                    style={{ width: `${(step / total) * 100}%` }}
                  />
                </div>
                <span className={styles.progressText}>
                  {step + 1} / {total}
                </span>
              </div>

              <p className={styles.line}>
                {exercise.line.split("___")[0]}
                <span
                  className={
                    picked === null
                      ? styles.gap
                      : pickedCorrect
                        ? `${styles.gap} ${styles.gapCorrect}`
                        : `${styles.gap} ${styles.gapWrong}`
                  }
                >
                  {picked ?? "answer"}
                </span>
                {exercise.line.split("___")[1]}
              </p>

              <div className={styles.options}>
                {exercise.options.map((option) => {
                  let className = styles.option;

                  if (picked !== null) {
                    if (option === exercise.answer) {
                      className = styles.optionCorrect;
                    } else if (option === picked) {
                      className = styles.optionWrong;
                    } else {
                      className = styles.optionIdle;
                    }
                  }

                  return (
                    <button
                      key={option}
                      className={className}
                      onClick={() => choose(option)}
                      disabled={picked !== null}
                    >
                      {option}
                    </button>
                  );
                })}
              </div>

              {picked !== null && (
                <div
                  className={
                    pickedCorrect
                      ? styles.feedbackOk
                      : styles.feedbackFail
                  }
                >
                  <span className={styles.feedbackLabel}>
                    {pickedCorrect
                      ? "¡Correcto!"
                      : `La respuesta es "${exercise.answer}"`}
                  </span>
                  {exercise.explanation}
                </div>
              )}

              <div className={styles.actions}>
                <button
                  className={styles.primaryBtn}
                  onClick={next}
                  disabled={picked === null}
                >
                  Siguiente
                </button>
                {picked === null && (
                  <span className={styles.hint}>
                    Elige la opción que complete la frase.
                  </span>
                )}
              </div>
            </>
          )}
        </section>
      ) : null}
    </div>
  );
}
