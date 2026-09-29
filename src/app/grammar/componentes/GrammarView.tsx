"use client";

import { useState } from "react";
import Link from "next/link";
import type { GrammarTopic, Song } from "@/data/types";
import styles from "../styles/grammar.module.scss";

type Props = {
  topics: GrammarTopic[];
  songs: Song[];
};

export default function GrammarView({ topics, songs }: Props) {
  const [topicId, setTopicId] = useState(topics[0]?.id ?? "");
  const [step, setStep] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [solved, setSolved] = useState<Record<string, number>>({});

  const topic = topics.find((item) => item.id === topicId) ?? topics[0];
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
    setStep(0);
    setPicked(null);
  };

  const choose = (option: string) => {
    if (picked !== null) return;
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
    const currentIndex = topics.findIndex((item) => item.id === topic.id);
    const nextTopic = topics[(currentIndex + 1) % topics.length];
    selectTopic(nextTopic.id);
  };

  if (!topic) {
    return <p className={styles.card}>Todavía no hay temas de gramática.</p>;
  }

  return (
    <div className={styles.layout}>
      <aside className={styles.sidebar}>
        <p className={styles.sidebarTitle}>Temas</p>
        <div className={styles.topicList}>
          {topics.map((item) => (
            <button
              key={item.id}
              onClick={() => selectTopic(item.id)}
              className={
                item.id === topic.id
                  ? `${styles.topicButton} ${styles.topicActive}`
                  : styles.topicButton
              }
              aria-current={item.id === topic.id ? "true" : undefined}
            >
              <span className={styles.topicTop}>
                <span className={styles.topicName}>{item.title}</span>
                <span className={styles.level}>{item.level}</span>
              </span>
              <span className={styles.topicMeta}>
                {solved[item.id] ?? 0}/{item.exercises.length} resueltos
              </span>
            </button>
          ))}
        </div>
      </aside>

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
              <button className={styles.ghostBtn} onClick={() => selectTopic(topic.id)}>
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
                  pickedCorrect ? styles.feedbackOk : styles.feedbackFail
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
    </div>
  );
}
