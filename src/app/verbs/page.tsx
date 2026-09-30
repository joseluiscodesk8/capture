import type { Metadata } from "next";
import VerbsTable from "./componentes/VerbsTable";
import styles from "./styles/verbs.module.scss";

export const metadata: Metadata = {
  title: "Verbos · Catcher",
  description:
    "Tabla de verbos con sus tres formas y una frase real de las lecturas de Catcher.",
};

export default function VerbsPage() {
  return (
    <main className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Verbos</h1>
        <p className={styles.subtitle}>
          Las tres formas de cada verbo y una frase real de las lecturas. En la
          frase, el verbo va en el color de su tiempo: azul en presente, naranja
          en pasado.
        </p>
      </div>

      <VerbsTable />
    </main>
  );
}
