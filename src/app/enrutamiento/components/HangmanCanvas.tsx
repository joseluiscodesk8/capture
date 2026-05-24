"use client";

import { useEffect, useRef } from "react";
import styles from "../styles/index.module.scss";

type Props = {
  trigger: number;
  isDead: boolean;
};

export default function HangmanCanvas({ trigger, isDead }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const projectile = useRef({ x: 20, y: 220, active: false });
  const dummyY = useRef(80);
  const velocity = useRef(0);

  useEffect(() => {
    if (trigger === 0) return;

    projectile.current = { x: 20, y: 220, active: true };
  }, [trigger]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d")!;
    let animationId: number;

    function drawStructure() {
      ctx.beginPath();
      ctx.moveTo(200, 250);
      ctx.lineTo(350, 250);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(300, 250);
      ctx.lineTo(300, 40);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(300, 40);
      ctx.lineTo(230, 40);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(230, 40);
      ctx.lineTo(230, dummyY.current);
      ctx.stroke();
    }

    function drawDummy() {
      const y = dummyY.current;

      ctx.beginPath();
      ctx.arc(230, y + 10, 10, 0, Math.PI * 2);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(230, y + 20);
      ctx.lineTo(230, y + 60);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(230, y + 30);
      ctx.lineTo(210, y + 45);
      ctx.moveTo(230, y + 30);
      ctx.lineTo(250, y + 45);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(230, y + 60);
      ctx.lineTo(210, y + 90);
      ctx.moveTo(230, y + 60);
      ctx.lineTo(250, y + 90);
      ctx.stroke();
    }

    function drawProjectile() {
      const p = projectile.current;

      if (!p.active) return;

      p.x += 6;
      p.y -= 3;

      if (p.x > 220) {
        p.active = false;
        dummyY.current += 10;
      }

      ctx.fillRect(p.x, p.y, 6, 6);
    }

    function updatePhysics() {
      if (isDead) {
        velocity.current += 0.5;
        dummyY.current += velocity.current;

        if (dummyY.current > 170) {
          dummyY.current = 170;
        }
      }
    }

    function loop() {
      ctx.clearRect(0, 0, 400, 300);

      drawStructure();
      drawDummy();
      drawProjectile();
      updatePhysics();

      animationId = requestAnimationFrame(loop);
    }

    loop();

    return () => cancelAnimationFrame(animationId);
  }, [isDead]);

  return (
    <canvas
      ref={canvasRef}
      width={400}
      height={300}
      className={styles.canvas}
    />
  );
}