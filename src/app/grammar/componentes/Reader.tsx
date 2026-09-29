"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Reading, ReadingTimings } from "@/data/types";
import { groupSentences } from "@/lib/reading-blocks.mjs";
import styles from "../styles/reader.module.scss";

type Props = {
  reading: Reading;
};

function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const total = Math.floor(seconds);
  const minutes = Math.floor(total / 60);
  return `${minutes}:${String(total % 60).padStart(2, "0")}`;
}

export default function Reader({ reading }: Props) {
  const panelRef = useRef<HTMLDivElement | null>(null);
  const blockRefs = useRef<(HTMLParagraphElement | null)[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const [activeIndex, setActiveIndex] = useState(0);
  const [loaded, setLoaded] = useState<{
    id: string;
    data: ReadingTimings;
  } | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [follow, setFollow] = useState(true);
  const [listenOnly, setListenOnly] = useState(false);
  const [loopIndex, setLoopIndex] = useState<number | null>(null);

  const blocks = useMemo(() => groupSentences(reading.text), [reading.text]);
  const timings = loaded?.id === reading.id ? loaded.data : null;
  const hasAudio = Boolean(reading.audio && timings);
  const audioDriven = hasAudio && isPlaying && follow;

  useEffect(() => {
    if (!reading.timings) return;

    let cancelled = false;

    fetch(reading.timings)
      .then((res) => (res.ok ? res.json() : null))
      .then((data: ReadingTimings | null) => {
        if (!cancelled && data) {
          setLoaded({ id: reading.id, data });
        }
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [reading.id, reading.timings]);

  const blockAt = useCallback(
    (time: number) => {
      if (!timings) return 0;

      let found = 0;
      for (let i = 0; i < timings.starts.length; i += 1) {
        if (time >= timings.starts[i]) found = i;
      }
      return found;
    },
    [timings]
  );

  const syncActive = useCallback(() => {
    const panel = panelRef.current;
    if (!panel) return;

    const readingLine = panel.scrollTop + panel.clientHeight / 2;
    let closest = 0;
    let closestDistance = Number.POSITIVE_INFINITY;

    blockRefs.current.forEach((el, index) => {
      if (!el) return;

      const center = el.offsetTop + el.offsetHeight / 2;
      const distance = Math.abs(center - readingLine);

      if (distance < closestDistance) {
        closestDistance = distance;
        closest = index;
      }
    });

    setActiveIndex((current) => (current === closest ? current : closest));
  }, []);

  useEffect(() => {
    const panel = panelRef.current;
    if (!panel) return;

    panel.addEventListener("scroll", syncActive, { passive: true });
    window.addEventListener("resize", syncActive);

    return () => {
      panel.removeEventListener("scroll", syncActive);
      window.removeEventListener("resize", syncActive);
    };
  }, [syncActive]);

  useEffect(() => {
    if (!audioDriven) return;

    const el = blockRefs.current[activeIndex];
    if (!el) return;

    el.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [activeIndex, audioDriven]);

  const goTo = useCallback(
    (index: number) => {
      const target = Math.max(0, Math.min(index, blocks.length - 1));
      const audio = audioRef.current;

      if (audio && timings) {
        const start = timings.starts[target];
        if (typeof start === "number") audio.currentTime = start;
      }

      blockRefs.current[target]?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    },
    [blocks.length, timings]
  );

  const onKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    const isSpace = event.key === " " || event.key === "Spacebar";
    const isNext = event.key === "ArrowDown" || event.key === "ArrowRight";
    const isPrevious = event.key === "ArrowUp" || event.key === "ArrowLeft";

    let step = 0;
    if (isSpace) step = event.shiftKey ? -1 : 1;
    else if (isNext) step = 1;
    else if (isPrevious) step = -1;

    if (step === 0) return;

    event.preventDefault();
    goTo(activeIndex + step);
  };

  const onScroll = () => {
    syncActive();
    if (isPlaying) setFollow(false);
  };

  const onTimeUpdate = () => {
    const audio = audioRef.current;
    if (!audio) return;

    const time = audio.currentTime;
    setCurrentTime(time);

    if (loopIndex !== null && timings) {
      const nextStart = timings.starts[loopIndex + 1];
      const loopEnd =
        typeof nextStart === "number" ? nextStart : timings.duration;

      if (time >= loopEnd) {
        audio.currentTime = timings.starts[loopIndex];
        setCurrentTime(timings.starts[loopIndex]);
        return;
      }
    }

    if (follow) setActiveIndex(blockAt(time));
  };

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (audio.paused) {
      setFollow(true);
      audio.play().catch(() => {});
    } else {
      audio.pause();
    }
  };

  const toggleLoop = () => {
    setLoopIndex((current) => (current === activeIndex ? null : activeIndex));
  };

  const progress =
    hasAudio && duration > 0
      ? (currentTime / duration) * 100
      : blocks.length > 0
        ? (activeIndex / blocks.length) * 100
        : 0;

  const tenseLabel = reading.tense === "present" ? "simple present" : "simple past";

  return (
    <div className={styles.reader}>
      <audio
        ref={audioRef}
        src={reading.audio}
        preload="metadata"
        aria-hidden="true"
        className={styles.audio}
        onTimeUpdate={onTimeUpdate}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={() => setIsPlaying(false)}
        onLoadedMetadata={(event) =>
          setDuration(event.currentTarget.duration || timings?.duration || 0)
        }
      />

      <div className={styles.topbar}>
        <span className={styles.series}>{reading.series}</span>
        <span className={styles.counter}>
          Bloque {activeIndex + 1} de {blocks.length}
        </span>
      </div>

      {hasAudio ? (
        <div className={styles.controls}>
          <button
            type="button"
            onClick={togglePlay}
            className={styles.playBtn}
            aria-label={isPlaying ? "Pausar" : "Reproducir"}
          >
            <span aria-hidden="true">{isPlaying ? "❚❚" : "▶"}</span>
            <span>{isPlaying ? "Pausa" : "Escuchar"}</span>
          </button>

          <div className={styles.progressTrack}>
            <div
              className={styles.progressFill}
              style={{ width: `${progress}%` }}
            />
          </div>

          <span className={styles.time}>
            {formatTime(currentTime)} / {formatTime(duration)}
          </span>

          <button
            type="button"
            onClick={() => setFollow((value) => !value)}
            className={
              follow
                ? `${styles.toggle} ${styles.toggleOn}`
                : styles.toggle
            }
            aria-pressed={follow}
          >
            Seguir
          </button>

          <button
            type="button"
            onClick={() => {
              setListenOnly((value) => {
                if (!value) setFollow(true);
                return !value;
              });
            }}
            className={
              listenOnly
                ? `${styles.toggle} ${styles.toggleOn}`
                : styles.toggle
            }
            aria-pressed={listenOnly}
          >
            Solo audio
          </button>

          <button
            type="button"
            onClick={toggleLoop}
            className={
              loopIndex !== null
                ? `${styles.toggle} ${styles.toggleOn}`
                : styles.toggle
            }
            aria-pressed={loopIndex !== null}
          >
            {loopIndex !== null
              ? `Repitiendo ${loopIndex + 1}`
              : "Repetir bloque"}
          </button>
        </div>
      ) : (
        <div className={styles.progressTrack}>
          <div
            className={styles.progressFill}
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      <div
        ref={panelRef}
        onScroll={onScroll}
        className={
          listenOnly
            ? `${styles.panel} ${styles.panelListenOnly}`
            : styles.panel
        }
        tabIndex={0}
        onKeyDown={onKeyDown}
        role="group"
        aria-label={`Lectura en ${tenseLabel}: ${reading.title}`}
      >
        <div className={styles.spacerTop} />

        {blocks.map((block, index) => {
          const distance = Math.abs(index - activeIndex);

          let className = styles.block;
          if (index === activeIndex) className += ` ${styles.blockActive}`;
          else if (distance === 1) className += ` ${styles.blockNear}`;
          else className += ` ${styles.blockFar}`;

          return (
            <p
              key={index}
              ref={(el) => {
                blockRefs.current[index] = el;
              }}
              className={className}
              onClick={() => goTo(index)}
            >
              {block.fragments.map((fragment, position) => (
                <span key={position}>
                  {position > 0 && <br />}
                  {fragment}
                </span>
              ))}
            </p>
          );
        })}

        <div className={styles.spacerBottom} />
      </div>

      <p className={styles.hint}>
        {hasAudio
          ? "Pulsa Escuchar y sigue el bloque. Arrastra el texto para leer por tu cuenta."
          : "Arrastra el texto o usa las flechas ↑ ↓ y la barra espaciadora."}
      </p>

      {reading.vocabulary.length > 0 && (
        <div className={styles.glossary}>
          <p className={styles.glossaryTitle}>Palabras clave</p>
          <dl className={styles.glossaryList}>
            {reading.vocabulary.map((item) => (
              <div key={item.term} className={styles.glossaryItem}>
                <dt className={styles.term}>{item.term}</dt>
                <dd className={styles.meaning}>{item.meaning}</dd>
              </div>
            ))}
          </dl>
        </div>
      )}
    </div>
  );
}
