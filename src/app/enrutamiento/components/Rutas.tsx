"use client";

import { useState, useRef, useEffect } from "react";
import Deliverman from "./Deliverman";
import styles from "../styles/index.module.scss";
import {
  saveImage,
  getImage,
  deleteImage,
  compressImage,
} from "../lib/imageStorage";

interface DeliveryMan {
  name: string;
}

interface TaskImage {
  id: number;
  imageId: string; // ID en IndexedDB
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

// Lista predeterminada de rutas
const RUTAS_PREDETERMINADAS = [
  "poblado",
  "castropol",
  "ciudad del rio",
  "barrio colombia",
  "centro",
  "belen",
  "belen san bernardo",
  "belen malibu",
  "belen la mota",
  "belencito",
  "castilla",
  "manrique",
  "aranjuez",
  "pedregal",
  "laureles",
  "calazans",
  "palmas",
  "loma del indio",
  "loma de los bernal",
  "robledo",
  "rodeo alto",
  "san german",
  "los colores",
  "estadio",
  "sur americana",
  "san javier",
  "la america",
  "santa monica",
  "buenos aires",
  "barrio palmas",
  "la milagrosa",
  "bello",
  "envigado",
  "sabaneta",
  "ditaires",
  "guayaval",
  "itagui",
  "la estrella"
];

export default function Rutas() {
  const deliveryMen: DeliveryMan[] = [
    { name: "Kevin" },
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

  useEffect(() => {
    const restoreImages = async () => {
      const updatedRoutes = await Promise.all(
        route.map(async (man) => ({
          ...man,
          tasks: await Promise.all(
            man.tasks.map(async (task) => ({
              ...task,
              images: await Promise.all(
                task.images.map(async (img) => {
                  const blob = await getImage(img.imageId);
                  if (!blob) return img;

                  return {
                    ...img,
                    preview: URL.createObjectURL(blob),
                  };
                })
              ),
            }))
          ),
        }))
      );

      setRoute(updatedRoutes);
    };

    if (route.length > 0) {
      restoreImages();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [activeDeliveryMan, setActiveDeliveryMan] = useState<string | null>(() => {
    // Restaurar el repartidor activo si existe
    if (typeof window !== "undefined") {
      const savedActive = localStorage.getItem(`${STORAGE_KEY}-active`);
      return savedActive || null;
    }
    return null;
  });

  const [activeTaskId, setActiveTaskId] = useState<number | null>(null);
  const [selectedRoutes, setSelectedRoutes] = useState<string[]>([]);

  // Estado para mostrar/ocultar las rutas
  const [showRoutes, setShowRoutes] = useState<boolean>(false);

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

  // Actualizar localStorage cuando cambie route o activeDeliveryMan
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

  const toggleRouteSelection = (routeName: string) => {
    setSelectedRoutes((prev) =>
      prev.includes(routeName)
        ? prev.filter((r) => r !== routeName)
        : [...prev, routeName]
    );
  };

  const handleAddTask = (name: string) => {
    if (selectedRoutes.length === 0) {
      alert("Selecciona al menos una ruta");
      return;
    }

    const finalRouteName = selectedRoutes.join("-");

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
                  label: finalRouteName,
                  images: [],
                },
              ],
            }
          : man
      )
    );

    setActiveTaskId(newTaskId);
    setSelectedRoutes([]);
    setTimeout(() => fileInputRef.current?.click(), 0);
  };

  const handleAddMoreImages = (taskId: number) => {
    setActiveTaskId(taskId);
    setTimeout(() => fileInputRef.current?.click(), 0);
  };

  const handleAddImages = async (files: FileList) => {
    if (!activeDeliveryMan || activeTaskId === null) return;

    const newImages: TaskImage[] = [];

    for (const file of Array.from(files)) {
      const compressedBlob = await compressImage(file);
      const imageId = crypto.randomUUID();

      await saveImage(imageId, compressedBlob);

      newImages.push({
        id: Date.now() + Math.random(),
        imageId,
        preview: URL.createObjectURL(compressedBlob),
        status: null,
      });
    }

    setRoute((prev) =>
      prev.map((man) =>
        man.name === activeDeliveryMan
          ? {
              ...man,
              tasks: man.tasks.map((task) =>
                task.id === activeTaskId
                  ? { ...task, images: [...task.images, ...newImages] }
                  : task
              ),
            }
          : man
      )
    );
  };

  const removeImage = async (
    taskId: number,
    imageId: number,
    imageKey: string
  ) => {
    await deleteImage(imageKey);

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
  const calcularLiquidacion = (name: string): number | null => {
    const totalEfectivo = calculateTotalByDeliveryMan(name);

    if (totalEfectivo === 0) {
      return null;
    }

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

      {activeMan && (
        <>
          <section className={styles.routeSection}>
            <h4 className={styles.title}>Seleccionar rutas</h4>

            {/* botón icono entre h4 y Asignar ruta (en la misma fila superior) */}
            <button
              type="button"
              className={`${styles.toggleIcon} ${showRoutes ? styles.open : ""}`}
              aria-expanded={showRoutes}
              aria-controls="routes-container"
              aria-label={showRoutes ? "Ocultar rutas" : "Mostrar rutas"}
              onClick={() => setShowRoutes((s) => !s)}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path d="M6 15l6-6 6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>

            <button
              onClick={() => handleAddTask(activeMan.name)}
              className={styles.addButton}
            >
              Asignar ruta
            </button>

            {/* fila 2: el contenedor de rutas ocupa todas las columnas */}
            <div
              id="routes-container"
              className={`${styles.routesContainer} ${showRoutes ? styles.expanded : styles.collapsed}`}
              aria-hidden={!showRoutes}
            >
              {RUTAS_PREDETERMINADAS.map((ruta) => (
                <label key={ruta} className={styles.routeItem}>
                  <input
                    type="checkbox"
                    checked={selectedRoutes.includes(ruta)}
                    onChange={() => toggleRouteSelection(ruta)}
                  />
                  {ruta.charAt(0).toUpperCase() + ruta.slice(1)}
                </label>
              ))}
            </div>

            {/* fila 3: sección con la lista de repartidores (debajo del div) */}
            <section className={styles.deliveryListSection}>
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
          </section>

          <section>
            <h2>{activeMan.name}</h2>

            <p>
              <strong>Cash:</strong> $
              {calculateTotalByDeliveryMan(activeMan.name)}
            </p>
            <p>
              <strong>Domicilios:</strong> $
              {calculateTotalDeliveryFeeByDeliveryMan(activeMan.name)}
            </p>
            {calculateTotalByDeliveryMan(activeMan.name) > 0 && (
              <p>
                <strong>Liquidación:</strong> $
                {calcularLiquidacion(activeMan.name)}
              </p>
            )}
          </section>

          <section className={styles.taskList}>
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
        <section className={styles.taskSection}>
          {activeTask.images.length > 0 && (
            <button
              className={styles.addComanda}
              onClick={() => handleAddMoreImages(activeTask.id)}
            >
              Agregar comanda
            </button>
          )}

          <div className={styles.imagesContainer}>
            {activeTask.images.map((img) => (
              <div key={img.id} className={styles.imageCard}>
                <div
                  className={styles.imageWrapper}
                  onPointerDown={() => handleImagePressStart(img.id)}
                  onPointerUp={handleImagePressEnd}
                  onPointerLeave={handleImagePressEnd}
                >
                  <img src={img.preview} alt="" />

                  {imageToDelete === img.id && (
                    <button
                      onClick={() => {
                        removeImage(activeTask.id, img.id, img.imageId);
                        setImageToDelete(null);
                      }}
                    >
                      Eliminar
                    </button>
                  )}
                </div>

                <div className={styles.section}>
                  <h4>Efectivo:</h4>

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
                        <p>${img.price}</p>
                      )}
                    </>
                  )}
                </div>

                <div className={styles.section}>
                  <h4>Domicilio:</h4>

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
                    />
                  ) : (
                    <p>${img.deliveryFee}</p>
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