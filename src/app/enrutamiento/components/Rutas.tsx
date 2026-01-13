"use client";

import { useState, useRef, useEffect } from "react";
import Deliverman from "./Deliverman";
import styles from "../styles/index.module.scss";

interface DeliveryMan {
  name: string;
}

interface TaskImage {
  id: number;
  file?: File; // Hacer opcional para localStorage
  preview: string;
  status: "pagado" | "precio" | null;
  price?: number;
  tempPrice?: string;
  deliveryFee?: number;
  tempDeliveryFee?: string;
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

// Clave para localStorage
const STORAGE_KEY = "rutas-app-data";

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

  const [route, setRoute] = useState<RouteDeliveryMan[]>(() => {
    // Cargar datos del localStorage al iniciar
    if (typeof window !== "undefined") {
      const savedData = localStorage.getItem(STORAGE_KEY);
      if (savedData) {
        try {
          return JSON.parse(savedData);
        } catch (error) {
          console.error("Error al cargar datos del localStorage:", error);
        }
      }
    }
    return [];
  });

  const [activeDeliveryMan, setActiveDeliveryMan] = useState<string | null>(() => {
    // Restaurar el repartidor activo si existe
    if (typeof window !== "undefined") {
      const savedActive = localStorage.getItem(`${STORAGE_KEY}-active`);
      return savedActive || null;
    }
    return null;
  });

  const [activeTaskId, setActiveTaskId] = useState<number | null>(null);
  const [newTaskName, setNewTaskName] = useState("");

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const taskIdRef = useRef<number>(0);

  useEffect(() => {
    taskIdRef.current = Date.now();
  }, []);

  // Función para guardar datos en localStorage
  const saveToLocalStorage = (routes: RouteDeliveryMan[], activeMan: string | null) => {
    if (typeof window !== "undefined") {
      // Guardar las rutas
      localStorage.setItem(STORAGE_KEY, JSON.stringify(routes));
      
      // Guardar el repartidor activo
      if (activeMan) {
        localStorage.setItem(`${STORAGE_KEY}-active`, activeMan);
      } else {
        localStorage.removeItem(`${STORAGE_KEY}-active`);
      }
    }
  };

  // Actualizar localStorage cuando cambie route
  useEffect(() => {
    saveToLocalStorage(route, activeDeliveryMan);
  }, [route, activeDeliveryMan]);

  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const [imageToDelete, setImageToDelete] = useState<number | null>(null);

  const handleSelectDeliveryMan = (man: DeliveryMan) => {
    if (!route.some((r) => r.name === man.name)) {
      setRoute((prev) => [...prev, { name: man.name, tasks: [] }]);
    }
    setActiveDeliveryMan(man.name);
    setActiveTaskId(null);
  };

  const handleAddTask = (name: string, taskLabel: string) => {
    if (!taskLabel.trim()) return;

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
                  label: taskLabel,
                  images: [],
                },
              ],
            }
          : man
      )
    );

    setActiveTaskId(newTaskId);
    setNewTaskName("");
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
      file, // Guardamos la referencia al archivo
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
                      images: task.images.filter((img) => img.id !== imageId),
                    }
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
                        img.id === imageId ? { ...img, tempPrice: value } : img
                      ),
                    }
                  : task
              ),
            }
          : man
      )
    );
  };

  const setImagePrice = (taskId: number, imageId: number, price: number) => {
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

  const setTempImageDeliveryFee = (
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
                          ? { ...img, tempDeliveryFee: value }
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

  const setImageDeliveryFee = (
    taskId: number,
    imageId: number,
    fee: number
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
                          ? { ...img, deliveryFee: fee, tempDeliveryFee: undefined }
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

  // Función para limpiar todos los datos
  const clearAllData = () => {
    if (confirm("¿Estás seguro de que quieres eliminar todos los datos? Esta acción no se puede deshacer.")) {
      setRoute([]);
      setActiveDeliveryMan(null);
      setActiveTaskId(null);
      
      if (typeof window !== "undefined") {
        localStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem(`${STORAGE_KEY}-active`);
      }
    }
  };

  // Función existente para calcular total de efectivo
  const calculateTotalByDeliveryMan = (name: string): number => {
    const man = route.find((m) => m.name === name);
    if (!man) return 0;

    return man.tasks.reduce(
      (acc, task) =>
        acc + task.images.reduce((imgAcc, img) => imgAcc + (img.price ?? 0), 0),
      0
    );
  };

  // Nueva función para calcular total de domicilios
  const calculateTotalDeliveryFeeByDeliveryMan = (name: string): number => {
    const man = route.find((m) => m.name === name);
    if (!man) return 0;

    return man.tasks.reduce(
      (acc, task) =>
        acc + task.images.reduce((imgAcc, img) => imgAcc + (img.deliveryFee ?? 0), 0),
      0
    );
  };

  // NUEVA FUNCIÓN DE LIQUIDACIÓN
  const calcularLiquidacion = (name: string): number => {
    const totalEfectivo = calculateTotalByDeliveryMan(name);
    const totalDomicilios = calculateTotalDeliveryFeeByDeliveryMan(name);
    
    return totalEfectivo - totalDomicilios;
  };

  const activeMan = route.find((m) => m.name === activeDeliveryMan);
  const activeTask = activeMan?.tasks.find((t) => t.id === activeTaskId);

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

      {/* Botón para limpiar todos los datos */}
      {route.length > 0 && (
        <button 
          onClick={clearAllData}
          style={{
            margin: "1rem",
            padding: "0.5rem 1rem",
            backgroundColor: "#ff4444",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer"
          }}
        >
          Limpiar todos los datos
        </button>
      )}

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
        <>
          <section>
            <input
              type="text"
              placeholder="Nombre de la ruta"
              value={newTaskName}
              onChange={(e) => setNewTaskName(e.target.value)}
              className={styles.routeInput}
            />

            <button
              onClick={() => handleAddTask(activeMan.name, newTaskName)}
              className={styles.addButton}
              disabled={!newTaskName.trim()}
            >
              Asignar ruta
            </button>
          </section>
          <section>
            <h2>{activeMan.name}</h2>

            <p>
              <strong>Total a cobrar:</strong> $
              {calculateTotalByDeliveryMan(activeMan.name)}
            </p>
            <p>
              <strong>Total domicilios:</strong> $
              {calculateTotalDeliveryFeeByDeliveryMan(activeMan.name)}
            </p>
            <p>
              <strong>Liquidación:</strong> $
              {calcularLiquidacion(activeMan.name)}
            </p>

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
        </>
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
            <button
              className={styles.addComanda}
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
                style={{ 
                  border: "1px solid #ccc", 
                  padding: "0.5rem",
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.5rem"
                }}
              >
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

                <div>
                  <h4 style={{ margin: "0 0 0.25rem 0" }}>Efectivo:</h4>
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
                    <p style={{ color: "green", fontWeight: "bold", margin: 0 }}>
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
                          style={{ width: "100%" }}
                        />
                      ) : (
                        <p style={{ margin: 0 }}>${img.price}</p>
                      )}
                    </>
                  )}
                </div>

                <div>
                  <h4 style={{ margin: "0 0 0.25rem 0" }}>Domicilio:</h4>
                  {img.deliveryFee === undefined ? (
                    <input
                      type="number"
                      placeholder="Valor domicilio"
                      value={img.tempDeliveryFee ?? ""}
                      onChange={(e) =>
                        setTempImageDeliveryFee(
                          activeTask.id,
                          img.id,
                          e.target.value
                        )
                      }
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && img.tempDeliveryFee) {
                          setImageDeliveryFee(
                            activeTask.id,
                            img.id,
                            Number(img.tempDeliveryFee)
                          );
                        }
                      }}
                      style={{ width: "100%" }}
                    />
                  ) : (
                    <p style={{ margin: 0 }}>${img.deliveryFee}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </>
  );
}