"use client";

import { useEffect, useMemo, useState } from "react";
import HangmanCanvas from "./HangmanCanvas";
import styles from "../styles/index.module.scss";

const WORDS = ["approach", "grateful", "crow", "vast"];

function getRandomWord() {
  return WORDS[Math.floor(Math.random() * WORDS.length)];
}

function Keyboard({
  onGuess,
  used,
  disabled,
}: {
  onGuess: (l: string) => void;
  used: string[];
  disabled: boolean;
}) {
  const letters = "abcdefghijklmnopqrstuvwxyz".split("");

  return (
    <div className={styles.keyboard}>
      {letters.map((l) => {
        const isUsed = used.includes(l);

        return (
          <button
            key={l}
            onClick={() => onGuess(l)}
            disabled={isUsed || disabled}
            className={`${styles.key} ${
              isUsed ? styles.keyUsed : ""
            } ${disabled ? styles.keyDisabled : ""}`}
          >
            {l}
          </button>
        );
      })}
    </div>
  );
}

export default function Hangman() {
  const [word, setWord] = useState("");
  const [guesses, setGuesses] = useState<string[]>([]);
  const [errors, setErrors] = useState(0);
  const [status, setStatus] = useState<"playing" | "won" | "lost">("playing");
  const [trigger, setTrigger] = useState(0);
  const [revealed, setRevealed] = useState<number[]>([]);

  useEffect(() => {
    resetGame();
  }, []);

  const maxErrors = word.length;

  const maskedWord = useMemo(() => {
    return word
      .split("")
      .map((l, i) => {
        if (revealed.includes(i)) return l;
        if (guesses.includes(l)) return l;
        return "_";
      })
      .join(" ");
  }, [word, guesses, revealed]);

  useEffect(() => {
    if (!word) return;

    const allRevealed = word
      .split("")
      .every((l, i) => revealed.includes(i) || guesses.includes(l));

    if (allRevealed) setStatus("won");
    if (errors >= maxErrors) setStatus("lost");
  }, [guesses, errors, word, revealed, maxErrors]);

  function handleGuess(letter: string) {
    if (status !== "playing") return;
    if (guesses.includes(letter)) return;

    setGuesses((prev) => [...prev, letter]);

    if (!word.includes(letter)) {
      setErrors((e) => {
        const next = e + 1;
        setTrigger((t) => t + 1);
        return next;
      });
    }
  }

  function resetGame() {
    const newWord = getRandomWord();

    setWord(newWord);
    setGuesses([]);
    setErrors(0);
    setStatus("playing");
    setTrigger(0);

    const indexes = [0, newWord.length - 1];
    setRevealed([...new Set(indexes)]);
  }

  return (
    <div className={styles.container}>
      <HangmanCanvas trigger={trigger} isDead={status === "lost"} />

      <p className={styles.word}>{maskedWord}</p>

      <Keyboard
        onGuess={handleGuess}
        used={guesses}
        disabled={status !== "playing"}
      />

      <p className={styles.info}>
        Intentos: {errors} / {maxErrors}
      </p>

      <p className={styles.result}>
        {status === "won" && "🎉 Ganaste!"}
        {status === "lost" && `💀 Perdiste! Era: ${word}`}
      </p>

      <button className={styles.button} onClick={resetGame}>
        Reiniciar
      </button>
    </div>
  );
}