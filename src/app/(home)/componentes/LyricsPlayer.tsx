"use client";

import { useEffect, useRef, useState } from "react";
import styles from "../styles/index.module.scss";
import songsData from "../../data/songs.json";

type LyricLine = {
  time: number;
  text: string;
};

type Song = {
  title: string;
  audio: string;
  lrc: string;
};

const OFFSET = -0.2;

function parseLRC(lrc: string): LyricLine[] {
  const result: LyricLine[] = [];
  const lines = lrc.split("\n");

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;

    if (/^\[(ar|ti|al|by|offset):/i.test(line)) continue;

    const matches = [
      ...line.matchAll(/\[(\d{1,2}):(\d{2})(?:\.(\d{1,3}))?\]/g),
    ];

    if (matches.length === 0) continue;

    const text = line.replace(/\[.*?\]/g, "").trim();
    if (!text) continue;

    for (const match of matches) {
      const minutes = parseInt(match[1], 10);
      const seconds = parseInt(match[2], 10);
      const ms = match[3] ? parseInt(match[3].padEnd(3, "0"), 10) : 0;

      result.push({
        time: minutes * 60 + seconds + ms / 1000,
        text,
      });
    }
  }

  return result.sort((a, b) => a.time - b.time);
}

export default function LyricsPlayer() {
  const songs = songsData as Song[];

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const lineRefs = useRef<(HTMLParagraphElement | null)[]>([]);
  const lastScrollIndex = useRef(-1);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [lyrics, setLyrics] = useState<LyricLine[]>([]);
  const [currentTime, setCurrentTime] = useState(0);

  useEffect(() => {
    const loadLRC = async () => {
      try {
        const res = await fetch(songs[currentIndex].lrc);
        const text = await res.text();
        setLyrics(parseLRC(text));
      } catch (err) {
        console.error("Error loading LRC:", err);
        setLyrics([]);
      }
    };

    if (songs.length > 0) {
      loadLRC();
    }
  }, [currentIndex, songs]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const update = () => setCurrentTime(audio.currentTime);

    audio.addEventListener("timeupdate", update);
    return () => audio.removeEventListener("timeupdate", update);
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.currentTime = 0;
    setCurrentTime(0);
    lastScrollIndex.current = -1;

    audio.play().catch(() => {});
  }, [currentIndex]);

  const getActiveIndex = () => {
    for (let i = lyrics.length - 1; i >= 0; i--) {
      if (currentTime >= lyrics[i].time + OFFSET) {
        return i;
      }
    }
    return 0;
  };

  const activeIndex = getActiveIndex();

  useEffect(() => {
    if (activeIndex === lastScrollIndex.current) return;
    lastScrollIndex.current = activeIndex;

    const el = lineRefs.current[activeIndex];
    if (!el) return;

    el.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
  }, [activeIndex]);

  return (
    <div className={styles.container}>
      {/* 🔘 selector */}
      <div className={styles.playlist}>
        {songs.map((song, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            className={
              index === currentIndex ? styles.activeSong : ""
            }
          >
            {song.title}
          </button>
        ))}
      </div>

      {/* 🎵 audio */}
      <audio
        ref={audioRef}
        controls
        src={songs[currentIndex]?.audio}
        className={styles.player}
      />

      {/* 🎤 lyrics */}
      <div className={styles.lyrics}>
        {lyrics.map((line, i) => {
          const distance = Math.abs(i - activeIndex);

          let className = styles.line;

          if (i === activeIndex) {
            className += ` ${styles.active}`;
          } else if (distance === 1) {
            className += ` ${styles.near}`;
          } else {
            className += ` ${styles.far}`;
          }

          return (
            <p
              key={i}
              ref={(el) => {
                lineRefs.current[i] = el;
              }}
              className={className}
            >
              {line.text}
            </p>
          );
        })}
      </div>
    </div>
  );
}