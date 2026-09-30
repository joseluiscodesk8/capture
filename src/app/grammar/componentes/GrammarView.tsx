"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { GrammarTopic, Reading, Song } from "@/data/types";
import Reader from "./Reader";
import styles from "../styles/grammar.module.scss";

type Props = {
  topics: GrammarTopic[];
  songs: Song[];
  readings: Reading[];
};

function readingTenseLabel(tense: Reading["tense"]) {
  return tense === "present" ? "Simple present" : "Simple past";
}

export default function GrammarView({ topics, songs, readings }: Props) {
  const [topicId, setTopicId] = useState(topics[0]?.id ?? "");
  const [readingSeries, setReadingSeries] = useState<string | null>(null);
  const [readingId, setReadingId] = useState<string | null>(null);
  const [openExercises, setOpenExercises] = useState(false);
  const [openLecturas, setOpenLecturas] = useState(false);
  const [step, setStep] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [solved, setSolved] = useState<Record<string, number>>({});

  const topic = topics.find((item) => item.id === topicId) ?? topics[0];

  const seriesGroups = useMemo(() => {
    const groups = new Map<string, Reading[]>();

    for (const item of readings) {
      const list = groups.get(item.series) ?? [];
      list.push(item);
      groups.set(item.series, list);
    }

    return [...groups.entries()].map(([series, items]) => ({ series, items }));
  }, [readings]);

  const seriesReadings = useMemo(
    () => seriesGroups.find((group) => group.series === readingSeries)?.items ?? [],
    [seriesGroups, readingSeries]
  );

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
    setReadingSeries(null);
    setReadingId(null);
    setStep(0);
    setPicked(null);
  };

  const selectSeries = (series: string) => {
    setOpenLecturas(true);

    if (series === readingSeries) return;

    setReadingSeries(series);
    setReadingId(null);
  };

  const selectReading = (id: string) => {
    setOpenLecturas(true);
    setReadingId((current) => (current === id ? null : id));
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

  if (!topic && !readingSeries) {
    return (
      <p className={styles.card}>Todavía no hay contenido de gramática.</p>
    );
  }

  return (
    <div className={styles.layout}>
      <aside className={styles.sidebar}>
        <section className={styles.sidebarSection}>
          <button
            type="button"
            className={styles.sectionHeader}
            onClick={() => setOpenExercises((current) => !current)}
            aria-expanded={openExercises}
          >
            <span className={styles.sectionTitle}>Ejercicios</span>
            <span className={styles.sectionCount}>{topics.length}</span>
            <span
              className={`${styles.chevron} ${
                openExercises ? styles.chevronOpen : ""
              }`}
              aria-hidden="true"
            >
              <svg width="10" height="6" viewBox="0 0 10 6" fill="none">
                <path
                  d="M1 1l4 4 4-4"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
          </button>

          {openExercises && (
            <div className={styles.sectionBody}>
              <div className={styles.topicList}>
                {topics.map((item) => {
                  const isActive =
                    readingSeries === null && item.id === topic?.id;

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
                        {solved[item.id] ?? 0}/{item.exercises.length}{" "}
                        resueltos
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </section>

        {readings.length > 0 && (
          <section className={styles.sidebarSection}>
            <button
              type="button"
              className={styles.sectionHeader}
              onClick={() => setOpenLecturas((current) => !current)}
              aria-expanded={openLecturas}
            >
              <span className={styles.sectionTitle}>Lecturas</span>
              <span className={styles.sectionCount}>
                {seriesGroups.length}
              </span>
              <span
                className={`${styles.chevron} ${
                  openLecturas ? styles.chevronOpen : ""
                }`}
                aria-hidden="true"
              >
                <svg width="10" height="6" viewBox="0 0 10 6" fill="none">
                  <path
                    d="M1 1l4 4 4-4"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
            </button>

            {openLecturas && (
              <div className={styles.sectionBody}>
                <div className={styles.topicList}>
                  {seriesGroups.map((group) => {
                    const isActive = readingSeries === group.series;

                    return (
                      <button
                        key={group.series}
                        type="button"
                        onClick={() => selectSeries(group.series)}
                        className={
                          isActive
                            ? `${styles.topicButton} ${styles.topicActive}`
                            : styles.topicButton
                        }
                        aria-current={isActive ? "true" : undefined}
                      >
                        <span className={styles.topicName}>{group.series}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </section>
        )}
      </aside>

      {readingSeries ? (
        <section className={styles.card}>
          <div className={styles.cardTop}>
            <h2 className={styles.cardTitle}>{readingSeries}</h2>
          </div>

          <p className={styles.summary}>
            Elige una versión de la historia. Están cerradas para que elijas
            sin que ocupen espacio.
          </p>

          <div className={styles.readingPicker}>
            {seriesReadings.map((item) => {
              const isOpen = item.id === readingId;

              return (
                <div
                  key={item.id}
                  className={
                    isOpen
                      ? `${styles.readingOption} ${styles.readingOptionOpen}`
                      : styles.readingOption
                  }
                >
                  <button
                    type="button"
                    onClick={() => selectReading(item.id)}
                    className={styles.readingOptionHead}
                    aria-expanded={isOpen}
                  >
                    <span className={styles.readingOptionTitle}>
                      {item.title}
                    </span>
                    <span className={styles.readingOptionMeta}>
                      <span className={styles.tenseBadge}>
                        {item.tense === "present" ? "Presente" : "Pasado"}
                      </span>
                      <span className={styles.readingOptionSub}>
                        {readingTenseLabel(item.tense)}
                      </span>
                    </span>
                  </button>

                  {isOpen && (
                    <div className={styles.readingBody}>
                      <p className={styles.summary}>
                        Lectura completa en{" "}
                        {item.tense === "present"
                          ? "simple present"
                          : "simple past"}
                        . El bloque que lees queda oscuro; el resto se apaga.
                      </p>

                      <Reader key={item.id} reading={item} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
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
