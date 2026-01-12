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

      {activeMan && (
        <section>
          <h2>{activeMan.name}</h2>

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
        onChange={(e) => {
          if (e.target.files) {
            handleAddImages(e.target.files);
            e.target.value = "";
          }
        }}
      />

      {activeTask && (
        <section>
          <h3>{activeTask.label}</h3>

          {activeTask.images.length > 0 && (
            <button
              onClick={() => handleAddMoreImages(activeTask.id)}
              style={{ marginBottom: "1rem" }}
            >
              Agregar más fotos
            </button>
          )}

          <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
            {activeTask.images.map((img) => (
              <div
                key={img.id}
                style={{ border: "1px solid #ccc", padding: "0.5rem" }}
              >
                <img src={img.preview} alt="" width={100} />
              </div>
            ))}
          </div>
        </section>
      )}
    </>
  );
}
