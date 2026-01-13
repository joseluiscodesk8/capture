"use client";

import styles from "../styles/index.module.scss";

interface DeliveryMan {
  name: string;
}

interface DelivermanProps {
  deliveryMen: DeliveryMan[];
  onSelect: (man: DeliveryMan) => void;
}

export default function Deliverman({
  deliveryMen,
  onSelect,
}: DelivermanProps) {
  return (
    <section>
      <ul className={styles.deliveryManList}>
        {deliveryMen.map((man) => (
          <li key={man.name}>
            <button onClick={() => onSelect(man)}>
              {man.name}
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
