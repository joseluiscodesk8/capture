"use client";

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
      <h2>Repartidores</h2>

      <ul>
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
