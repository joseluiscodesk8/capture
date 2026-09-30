import type { Tense } from "@/data/types";
import styles from "../styles/highlight.module.scss";

type Props = {
  sentence: string;
  from: number;
  to: number;
  tense: Tense;
};

export default function HighlightedSentence({ sentence, from, to, tense }: Props) {
  return (
    <>
      {sentence.slice(0, from)}
      <span
        className={tense === "present" ? styles.verbPresent : styles.verbPast}
      >
        {sentence.slice(from, to)}
      </span>
      {sentence.slice(to)}
    </>
  );
}