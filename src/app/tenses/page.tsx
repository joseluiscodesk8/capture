import type { Metadata } from "next";
import TenseAccordion from "./componentes/TenseAccordion";
import { TENSE_GROUPS } from "@/data/tenses";
import styles from "./styles/tenses.module.scss";

export const metadata: Metadata = {
  title: "Presente y pasado · Catcher",
  description:
    "Los cuatro presentes y los cuatro pasados del inglés, con explicaciones detalladas, cómo se forman y cuándo se usan.",
};

export default function TensesPage() {
  return (
    <main className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Presente y pasado</h1>
        <p className={styles.subtitle}>
          La familia completa: los{" "}
          <strong className={styles.presentWord}>cuatro presentes</strong> y los{" "}
          <strong className={styles.pastWord}>cuatro pasados</strong> del
          inglés, con su explicación. Las lecturas de Catcher usan solo el
          simple present y el simple past; aquí tienes los demás para
          reconocerlos y aprenderlos.
        </p>
      </div>

      <TenseAccordion groups={TENSE_GROUPS} />
    </main>
  );
}