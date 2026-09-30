"use client";

import { useEffect, useMemo, useState } from "react";
import type { Tense, VerbExample, VerbTable } from "@/data/types";
import HighlightedSentence from "@/app/componentes/HighlightedSentence";
import styles from "../styles/verbs.module.scss";

type LoadState = VerbTable | null;

function Example({ example }: { example: VerbExample }) {
  const { sentence, from, to, tense, readingTitle } = example;

  return (
    <>
      <HighlightedSentence
        sentence={sentence}
        from={from}
        to={to}
        tense={tense}
      />{" "}
      <span className={styles.exampleSource}>{readingTitle}</span>
    </>
  );
}

export default function VerbsTable() {
  const [data, setData] = useState<LoadState>(null);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [tense, setTense] = useState<Tense | "all">("all");
  const [series, setSeries] = useState<string>("all");

  useEffect(() => {
    let cancelled = false;

    fetch("/data/verbs.json")
      .then((response) => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.json();
      })
      .then((json: VerbTable) => {
        if (!cancelled) setData(json);
      })
      .catch((cause: Error) => {
        if (!cancelled) setError(cause.message);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const seriesList = useMemo(
    () =>
      data
        ? [...new Set(data.readings.map((item) => item.series))]
        : [],
    [data]
  );

  const rows = useMemo(() => {
    if (!data) return [];

    const needle = query.trim().toLowerCase();

    return data.verbs.filter((entry) => {
      if (needle) {
        const haystack =
          `${entry.lemma} ${entry.thirdPerson} ${entry.past}`.toLowerCase();
        if (!haystack.includes(needle)) return false;
      }

      return entry.examples.filter((example) => {
        if (tense !== "all" && example.tense !== tense) return false;
        if (series !== "all" && example.series !== series) return false;
        return true;
      }).length > 0;
    });
  }, [data, query, tense, series]);

  if (error) {
    return (
      <p className={styles.message}>
        No se pudo cargar la tabla de verbos ({error}). Genérala con{" "}
        <code>npm run verbs</code>.
      </p>
    );
  }

  if (!data) {
    return <p className={styles.message}>Cargando verbos…</p>;
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.controls}>
        <input
          className={styles.search}
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Buscar verbo, por ejemplo: fly"
          aria-label="Buscar verbo"
        />

        <div className={styles.filters}>
          <label className={styles.filter}>
            <span className={styles.filterLabel}>Tiempo</span>
            <select
              className={styles.select}
              value={tense}
              onChange={(event) =>
                setTense(event.target.value as Tense | "all")
              }
            >
              <option value="all">Todos</option>
              <option value="present">Simple present</option>
              <option value="past">Simple past</option>
            </select>
          </label>

          <label className={styles.filter}>
            <span className={styles.filterLabel}>Historia</span>
            <select
              className={styles.select}
              value={series}
              onChange={(event) => setSeries(event.target.value)}
            >
              <option value="all">Todas</option>
              {seriesList.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      <p className={styles.count}>
        {rows.length} de {data.total} verbos
        {rows.length < data.total && " · los filtros ocultan los que no tienen frase en ese tiempo o historia"}
      </p>

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th scope="col" className={styles.colLemma}>
                Verbo
              </th>
              <th scope="col" className={styles.colForm}>
                3ª persona
              </th>
              <th scope="col" className={styles.colForm}>
                Pasado
              </th>
              <th scope="col">Frase real</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((entry) => {
              const visible = entry.examples.filter((example) => {
                if (tense !== "all" && example.tense !== tense) return false;
                if (series !== "all" && example.series !== series)
                  return false;
                return true;
              });

              return (
                <tr key={entry.lemma}>
                  <th scope="row" className={styles.lemma}>
                    {entry.lemma}
                    {entry.irregular && (
                      <span className={styles.irregular}>irregular</span>
                    )}
                  </th>
                  <td className={styles.form}>{entry.thirdPerson}</td>
                  <td className={styles.form}>{entry.past}</td>
                  <td className={styles.example}>
                    {visible.length === 0 ? (
                      <span className={styles.noExample}>
                        sin frase en las lecturas todavía
                      </span>
                    ) : (
                      visible.map((example) => (
                        <p
                          key={`${example.readingId}-${example.tense}`}
                          className={styles.exampleLine}
                        >
                          <Example example={example} />
                        </p>
                      ))
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
