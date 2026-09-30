"use client";

import { useState } from "react";
import type { TenseInfo } from "@/data/tenses";
import styles from "../styles/tenses.module.scss";

type Props = {
  groups: {
    key: "present" | "past";
    label: string;
    intro: string;
    items: TenseInfo[];
  }[];
};

function TenseBody({ info }: { info: TenseInfo }) {
  return (
    <div className={styles.body}>
      <p className={styles.intro}>{info.intro}</p>

      <h4
        className={`${styles.sectionLabel} ${
          info.group === "present"
            ? styles.sectionPresent
            : styles.sectionPast
        }`}
      >
        Cuándo se usa
      </h4>
      <ul className={styles.uses}>
        {info.uses.map((use) => (
          <li key={use.text} className={styles.use}>
            <span>{use.text}</span>
            {use.example && <span className={styles.useExample}>{use.example}</span>}
          </li>
        ))}
      </ul>

      <h4
        className={`${styles.sectionLabel} ${
          info.group === "present"
            ? styles.sectionPresent
            : styles.sectionPast
        }`}
      >
        Cómo se forma
      </h4>
      <div className={styles.formsTable}>
        {info.forms.map((row) => (
          <div key={row.label} className={styles.formRow}>
            <span className={styles.formLabel}>{row.label}</span>
            <span className={styles.formula}>{row.formula}</span>
            <code className={styles.formExample}>{row.example}</code>
          </div>
        ))}
      </div>

      <h4
        className={`${styles.sectionLabel} ${
          info.group === "present"
            ? styles.sectionPresent
            : styles.sectionPast
        }`}
      >
        Con qué suele ir
      </h4>
      <p className={styles.markers}>
        {info.markers.map((marker) => (
          <span
            key={marker}
            className={`${styles.marker} ${
              info.group === "present" ? styles.markerPresent : styles.markerPast
            }`}
          >
            {marker}
          </span>
        ))}
      </p>

      <h4
        className={`${styles.sectionLabel} ${
          info.group === "present"
            ? styles.sectionPresent
            : styles.sectionPast
        }`}
      >
        Ejemplos
      </h4>
      <ul className={styles.examples}>
        {info.examples.map((example) => (
          <li
            key={example}
            className={`${styles.example} ${
              info.group === "present"
                ? styles.examplePresent
                : styles.examplePast
            }`}
          >
            {example}
          </li>
        ))}
      </ul>

      <h4
        className={`${styles.sectionLabel} ${
          info.group === "present"
            ? styles.sectionPresent
            : styles.sectionPast
        }`}
      >
        Fallos típicos
      </h4>
      <ul className={styles.mistakes}>
        {info.mistakes.map((mistake) => (
          <li key={mistake} className={styles.mistake}>
            {mistake}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function TenseAccordion({ groups }: Props) {
  const [openId, setOpenId] = useState<string | null>(null);

  const toggle = (id: string) => {
    setOpenId((current) => (current === id ? null : id));
  };

  return (
    <div className={styles.accordions}>
      {groups.map((group) => (
        <section key={group.key} className={styles.group}>
          <h2
            className={`${styles.groupTitle} ${
              group.key === "present"
                ? styles.groupTitlePresent
                : styles.groupTitlePast
            }`}
          >
            {group.label}
            <span
              className={`${styles.groupCount} ${
                group.key === "present"
                  ? styles.groupCountPresent
                  : styles.groupCountPast
              }`}
            >
              {group.items.length} tiempos
            </span>
          </h2>
          <p className={styles.groupIntro}>{group.intro}</p>

          <div className={styles.tenseList}>
            {group.items.map((info) => {
              const isOpen = openId === info.id;

              return (
                <article
                  key={info.id}
                  className={`${styles.tense} ${
                    isOpen ? styles.tenseOpen : styles.tenseClosed
                  }`}
                >
                  <button
                    type="button"
                    className={styles.tenseHead}
                    onClick={() => toggle(info.id)}
                    aria-expanded={isOpen}
                  >
                    <span className={styles.tenseName}>{info.name}</span>
                    {info.pronunciation && (
                      <span className={styles.tenseAlias}>
                        {info.pronunciation}
                      </span>
                    )}
                    <span
                      className={`${styles.chevron} ${
                        isOpen ? styles.chevronOpen : ""
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

                  <TenseBody info={info} />
                </article>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}