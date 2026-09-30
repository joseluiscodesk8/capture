"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "@/app/styles/shell.module.scss";

const LINKS = [
  { href: "/lyrics", label: "Letras" },
  { href: "/grammar", label: "Gramática" },
  { href: "/verbs", label: "Verbos" },
  { href: "/tenses", label: "Presente y pasado" },
];

export default function SiteHeader() {
  const pathname = usePathname();

  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <Link href="/" className={styles.brand}>
          <span className={styles.brandMark}>C</span>
          Catcher
        </Link>

        <nav className={styles.nav}>
          {LINKS.map((link) => {
            const isActive = pathname === link.href;

            return (
              <Link
                key={link.href}
                href={link.href}
                className={
                  isActive
                    ? `${styles.link} ${styles.activeLink}`
                    : styles.link
                }
                aria-current={isActive ? "page" : undefined}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
