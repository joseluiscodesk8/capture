"use client";

import { useState, useRef, useEffect } from "react";
import Deliverman from "./Deliverman";

interface DeliveryMan {
  name: string;
}

interface TaskImage {
  id: number;
  file: File;
  preview: string;
  status: "pagado" | "precio" | null;
  price?: number;
  tempPrice?: string;
}

interface Task {
  id: number;
  label: string;
  images: TaskImage[];
}

interface RouteDeliveryMan {
  name: string;
  tasks: Task[];
}

export default function Rutas() {
  const deliveryMen: DeliveryMan[] = [
    { name: "Angelo" },
    { name: "Luis C" },
    { name: "Andres" },
  ];

  const [route, setRoute] = useState<RouteDeliveryMan[]>([]);
  const [activeDeliveryMan, setActiveDeliveryMan] = useState<string | null>(null);
  const [activeTaskId, setActiveTaskId] = useState<number | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const taskIdRef = useRef<number>(0);

  useEffect(() => {
    taskIdRef.current = Date.now();
  }, []);

  const handleSelectDeliveryMan = (man: DeliveryMan) => {
    if (!route.some((r) => r.name === man.name)) {
      setRoute((prev) => [...prev, { name: man.name, tasks: [] }]);
    }
    setActiveDeliveryMan(man.name);
    setActiveTaskId(null);
  };

  const handleAddTask = (name: string) => {
    const newTaskId = taskIdRef.current++;

    setRoute((prev) =>
      prev.map((man) =>
        man.name === name
          ? {
              ...man,
              tasks: [
                ...man.tasks,
                {
                  id: newTaskId,
                  label: `Tarea ${man.tasks.length + 1}`,
                  images: [],
                },
              ],
            }
          : man
      )
    );

    setActiveTaskId(newTaskId);
    setTimeout(() => fileInputRef.current?.click(), 0);
  };

  const handleAddImages = (files: FileList) => {
    if (!activeDeliveryMan || activeTaskId === null) return;

    const images: TaskImage[] = Array.from(files).map((file, index) => ({
      id: Date.now() + index,
      file,
      preview: URL.createObjectURL(file),
      status: null,
    }));

    setRoute((prev) =>
      prev.map((man) =>
        man.name === activeDeliveryMan
          ? {
              ...man,
              tasks: man.tasks.map((task) =>
                task.id === activeTaskId
                  ? { ...task, images: [...task.images, ...images] }
                  : task
              ),
            }
          : man
      )
    );
  };

  const setImageStatus = (
    taskId: number,
    imageId: number,
    status: "pagado" | "precio"
  ) => {
    setRoute((prev) =>
      prev.map((man) =>
        man.name === activeDeliveryMan
          ? {
              ...man,
              tasks: man.tasks.map((task) =>
                task.id === taskId
                  ? {
                      ...task,
                      images: task.images.map((img) =>
                        img.id === imageId
                          ? {
                              ...img,
                              status,
                              price: status === "pagado" ? undefined : img.price,
                              tempPrice: undefined,
                            }
                          : img
                      ),
                    }
                  : task
              ),
            }
          : man
      )
    );
  };

  const setTempImagePrice = (
    taskId: number,
    imageId: number,
    value: string
  ) => {
    setRoute((prev) =>
      prev.map((man) =>
        man.name === activeDeliveryMan
          ? {
              ...man,
              tasks: man.tasks.map((task) =>
                task.id === taskId
                  ? {
                      ...task,
                      images: task.images.map((img) =>
                        img.id === imageId
                          ? { ...img, tempPrice: value }
                          : img
                      ),
                    }
                  : task
              ),
            }
          : man
      )
    );
  };

  const setImagePrice = (
    taskId: number,
    imageId: number,
    price: number
  ) => {
    setRoute((prev) =>
      prev.map((man) =>
        man.name === activeDeliveryMan
          ? {
              ...man,
              tasks: man.tasks.map((task) =>
                task.id === taskId
                  ? {
                      ...task,
                      images: task.images.map((img) =>
                        img.id === imageId
                          ? { ...img, price, tempPrice: undefined }
                          : img
                      ),
                    }
                  : task
              ),
            }
          : man
      )
    );
  };

  // ===== CALCULADORA TOTAL POR REPARTIDOR =====
  const calculateTotalByDeliveryMan = (deliveryManName: string): number => {
    const man = route.find((m) => m.name === deliveryManName);
    if (!man) return 0;

    return man.tasks.reduce((tasksAcc, task) => {
      const taskTotal = task.images.reduce(
        (imagesAcc, img) => imagesAcc + (img.price ?? 0),
        0
      );
      return tasksAcc + taskTotal;
    }, 0);
  };

  const activeMan = route.find((m) => m.name === activeDeliveryMan);
  const activeTask = activeMan?.tasks.find((t) => t.id === activeTaskId);

  return (
    <>
      <Deliverman
        deliveryMen={deliveryMen.filter(
          (man) => !route.some((r) => r.name === man.name)
        )}
        onSelect={handleSelectDeliveryMan}
      />

      <section>
        <h2>Repartidores asignados</h2>
        <ul>
          {route.map((man) => (
            <li key={man.name}>
              <button onClick={() => setActiveDeliveryMan(man.name)}>
                {man.name}
              </button>
            </li>
          ))}
        </ul>
      </section>

      {activeMan && (
        <section>
          <h2>{activeMan.name}</h2>

          <p>
            <strong>Total a cobrar:</strong> $
            {calculateTotalByDeliveryMan(activeMan.name)}
          </p>

          <button onClick={() => handleAddTask(activeMan.name)}>
            Asignar tarea
          </button>

          <ul>
            {activeMan.tasks.map((task) => (
              <li key={task.id}>
                <button
                  onClick={() => setActiveTaskId(task.id)}
                  style={{
                    fontWeight:
                      task.id === activeTaskId ? "bold" : "normal",
                  }}
                >
                  {task.label}
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        multiple
        hidden
        onChange={(e) =>
          e.target.files && handleAddImages(e.target.files)
        }
      />

      {activeTask && (
        <section>
          <h3>{activeTask.label}</h3>

          <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
            {activeTask.images.map((img) => (
              <div
                key={img.id}
                style={{ border: "1px solid #ccc", padding: "0.5rem" }}
              >
                <img src={img.preview} alt="" width={100} />

                {img.status === null && (
                  <div>
                    <button
                      onClick={() =>
                        setImageStatus(activeTask.id, img.id, "pagado")
                      }
                    >
                      Ya pagado
                    </button>
                    <button
                      onClick={() =>
                        setImageStatus(activeTask.id, img.id, "precio")
                      }
                    >
                      Precio
                    </button>
                  </div>
                )}

                {img.status === "pagado" && (
                  <p style={{ color: "green", fontWeight: "bold" }}>
                    Ya pagado
                  </p>
                )}

                {img.status === "precio" && (
                  <>
                    {img.price === undefined ? (
                      <input
                        type="number"
                        placeholder="Precio"
                        autoFocus
                        value={img.tempPrice ?? ""}
                        onChange={(e) =>
                          setTempImagePrice(
                            activeTask.id,
                            img.id,
                            e.target.value
                          )
                        }
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && img.tempPrice) {
                            setImagePrice(
                              activeTask.id,
                              img.id,
                              Number(img.tempPrice)
                            );
                          }
                        }}
                      />
                    ) : (
                      <p>
                        <strong>Precio:</strong> ${img.price}
                      </p>
                    )}
                  </>
                )}
              </div>
            ))}
          </div>
        </section>
      )}
    </>
  );
}
