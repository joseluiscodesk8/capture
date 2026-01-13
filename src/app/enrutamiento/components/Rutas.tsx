"use client";

import { useState, useRef, useEffect } from "react";
import Deliverman from "./Deliverman";
import styles from "../styles/index.module.scss";

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
      { name: "Julio" },
      { name: "Wilson" },
      { name: "Luggi" },
      { name: "Eduawr" },
      { name: "Sachi" },
      { name: "Manuel" },
      { name: "Jose Luis" },
    ];

  const [route, setRoute] = useState<RouteDeliveryMan[]>([]);
  const [activeDeliveryMan, setActiveDeliveryMan] = useState<string | null>(null);
  const [activeTaskId, setActiveTaskId] = useState<number | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const taskIdRef = useRef<number>(0);

  useEffect(() => {
    taskIdRef.current = Date.now();
  }, []);

  // ===== LONG PRESS =====
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const [imageToDelete, setImageToDelete] = useState<number | null>(null);

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
                  label: `Ruta ${man.tasks.length + 1}`,
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

  const handleAddMoreImages = (taskId: number) => {
    setActiveTaskId(taskId);
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

  // ===== ELIMINAR IMAGEN =====
  const removeImage = (taskId: number, imageId: number) => {
    setRoute((prev) =>
      prev.map((man) =>
        man.name === activeDeliveryMan
          ? {
              ...man,
              tasks: man.tasks.map((task) =>
                task.id === taskId
                  ? {
                      ...task,
                      images: task.images.filter(
                        (img) => img.id !== imageId
                      ),
                    }
                  : task
              ),
            }
          : man
      )
    );
  };

  // ===== ESTADO DE IMÁGENES =====
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
                              price:
                                status === "pagado" ? undefined : img.price,
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

  // ===== TOTAL =====
  const calculateTotalByDeliveryMan = (name: string): number => {
    const man = route.find((m) => m.name === name);
    if (!man) return 0;

    return man.tasks.reduce(
      (acc, task) =>
        acc +
        task.images.reduce((imgAcc, img) => imgAcc + (img.price ?? 0), 0),
      0
    );
  };

  const activeMan = route.find((m) => m.name === activeDeliveryMan);
  const activeTask = activeMan?.tasks.find((t) => t.id === activeTaskId);

  // ===== LONG PRESS HANDLERS =====
  const handleImagePressStart = (imageId: number) => {
    longPressTimer.current = setTimeout(() => {
      setImageToDelete(imageId);
    }, 600);
  };

  const handleImagePressEnd = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  return (
    <>
      <Deliverman
        deliveryMen={deliveryMen.filter(
          (man) => !route.some((r) => r.name === man.name)
        )}
        onSelect={handleSelectDeliveryMan}
      />

      <section>
        <ul className={styles.deliveryManList}>
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

          <button onClick={() => handleAddTask(activeMan.name)}
            className={styles.addButton}>
            Asignar ruta
          </button>

          <ul>
            {activeMan.tasks.map((task) => (
              <li key={task.id}>
                <button
                  onClick={() => setActiveTaskId(task.id)}
                  className={styles.taskButton}
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
        onChange={(e) => {
          if (e.target.files) {
            handleAddImages(e.target.files);
            e.target.value = "";
          }
        }}
      />

      {activeTask && (
        <section>

          {activeTask.images.length > 0 && (
            <button className={styles.addComanda}
              onClick={() => handleAddMoreImages(activeTask.id)}
              style={{ marginBottom: "1rem" }}
            >
              Agregar comanda
            </button>
          )}

          <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
            {activeTask.images.map((img) => (
              <div
                key={img.id}
                style={{ border: "1px solid #ccc", padding: "0.5rem" }}
              >
                {/* IMAGEN + LONG PRESS */}
                <div
                  style={{ position: "relative" }}
                  onPointerDown={() => handleImagePressStart(img.id)}
                  onPointerUp={handleImagePressEnd}
                  onPointerLeave={handleImagePressEnd}
                >
                  <img src={img.preview} alt="" width={100} />

                  {imageToDelete === img.id && (
                    <button
                      onClick={() => {
                        removeImage(activeTask.id, img.id);
                        setImageToDelete(null);
                      }}
                      style={{
                        position: "absolute",
                        inset: 0,
                        background: "rgba(0,0,0,0.6)",
                        color: "#fff",
                        border: "none",
                        fontWeight: "bold",
                      }}
                    >
                      Eliminar
                    </button>
                  )}
                </div>

                {/* ESTADOS */}
                {img.status === null && (
                  <div className={styles.statusButtons}>
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
                      Efectivo
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
                        ${img.price}
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
