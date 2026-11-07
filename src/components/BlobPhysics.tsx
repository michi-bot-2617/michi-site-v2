
import { useEffect, useRef, useState } from "react";

/**
 * Soft-body blob physics. The blob is a ring of point masses connected by
 * springs (structure + internal pressure). The user can grab and throw it.
 * Motion is simulation-driven; reduced motion swaps to a gentle still image
 * with no autoplay.
 */

type Point = {
  x: number;
  y: number;
  px: number; // previous x (verlet)
  py: number;
};

const POINT_COUNT = 24;
const PRESSURE = 1.35; // outward push keeping the blob round
const STIFFNESS = 0.9; // spring correction factor
const DAMPING = 0.985;
const GRAVITY = 0.05;
const FLOOR_BOUNCE = 0.55;

export default function BlobPhysics() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [hintHidden, setHintHidden] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let width = 0;
    let height = 0;
    let points: Point[] = [];
    let restLength = 0;
    let targetRestLength = 0;
    let radius = 0;

    let dragging: number | null = null;
    let dragX = 0;
    let dragY = 0;
    let velocityTrace: { x: number; y: number; t: number }[] = [];

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      radius = Math.min(width, height) * 0.22;
      targetRestLength =
        (2 * Math.PI * radius) / POINT_COUNT / Math.SQRT2;

      if (points.length === 0) {
        points = Array.from({ length: POINT_COUNT }, (_, i) => {
          const angle = (i / POINT_COUNT) * Math.PI * 2;
          const x = width / 2 + Math.cos(angle) * radius;
          const y = height * 0.45 + Math.sin(angle) * radius;
          return { x, y, px: x, py: y };
        });
        restLength = targetRestLength;
      }
    };

    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);

    const nearestPoint = (x: number, y: number): number | null => {
      let best = -1;
      let bestDist = Infinity;
      for (let i = 0; i < points.length; i++) {
        const dx = points[i].x - x;
        const dy = points[i].y - y;
        const d = dx * dx + dy * dy;
        if (d < bestDist) {
          bestDist = d;
          best = i;
        }
      }
      // only grab if reasonably close (within 2.5x radius of center)
      const cx = points.reduce((s, p) => s + p.x, 0) / POINT_COUNT;
      const cy = points.reduce((s, p) => s + p.y, 0) / POINT_COUNT;
      const dc = Math.hypot(x - cx, y - cy);
      return bestDist < Math.pow(radius * 1.1, 2) || dc < radius
        ? best
        : null;
    };

    const pointerPos = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      return { x: e.clientX - rect.left, y: e.clientY - rect.top };
    };

    const onPointerDown = (e: PointerEvent) => {
      const { x, y } = pointerPos(e);
      const idx = nearestPoint(x, y);
      if (idx !== null) {
        dragging = idx;
        dragX = x;
        dragY = y;
        velocityTrace = [{ x, y, t: performance.now() }];
        canvas.setPointerCapture(e.pointerId);
        setHintHidden(true);
      }
    };

    const onPointerMove = (e: PointerEvent) => {
      if (dragging === null) return;
      const { x, y } = pointerPos(e);
      dragX = x;
      dragY = y;
      velocityTrace.push({ x, y, t: performance.now() });
      if (velocityTrace.length > 6) velocityTrace.shift();
    };

    const onPointerUp = () => {
      if (dragging === null) return;
      // throw velocity from recent trace
      const now = performance.now();
      const old =
        velocityTrace.find((v) => now - v.t < 120) ?? velocityTrace[0];
      const last = velocityTrace[velocityTrace.length - 1];
      if (old && last && last.t > old.t) {
        const dt = (last.t - old.t) / 16.7;
        const vx = (last.x - old.x) / Math.max(dt, 1) * 0.4;
        const vy = (last.y - old.y) / Math.max(dt, 1) * 0.4;
        for (const p of points) {
          p.px = p.x - vx;
          p.py = p.y - vy;
        }
      }
      dragging = null;
    };

    canvas.addEventListener("pointerdown", onPointerDown);
    canvas.addEventListener("pointermove", onPointerMove);
    canvas.addEventListener("pointerup", onPointerUp);
    canvas.addEventListener("pointercancel", onPointerUp);

    const step = () => {
      restLength += (targetRestLength - restLength) * 0.05;

      // verlet integration
      for (const p of points) {
        const vx = (p.x - p.px) * DAMPING;
        const vy = (p.y - p.py) * DAMPING;
        p.px = p.x;
        p.py = p.y;
        p.x += vx;
        p.y += vy + GRAVITY;
      }

      // drag constraint
      if (dragging !== null) {
        const p = points[dragging];
        p.x += (dragX - p.x) * 0.55;
        p.y += (dragY - p.y) * 0.55;
        p.px = p.x;
        p.py = p.y;
      }

      // springs between neighbors
      for (let iter = 0; iter < 3; iter++) {
        for (let i = 0; i < POINT_COUNT; i++) {
          const a = points[i];
          const b = points[(i + 1) % POINT_COUNT];
          const dx = b.x - a.x;
          const dy = b.y - a.y;
          const dist = Math.hypot(dx, dy) || 0.0001;
          const diff = ((dist - restLength) / dist) * STIFFNESS * 0.5;
          const ox = dx * diff;
          const oy = dy * diff;
          if (i !== dragging) {
            a.x += ox;
            a.y += oy;
          }
          if ((i + 1) % POINT_COUNT !== dragging) {
            b.x -= ox;
            b.y -= oy;
          }
        }

        // internal pressure: push outward from centroid
        const cx = points.reduce((s, p) => s + p.x, 0) / POINT_COUNT;
        const cy = points.reduce((s, p) => s + p.y, 0) / POINT_COUNT;
        for (let i = 0; i < POINT_COUNT; i++) {
          if (i === dragging) continue;
          const p = points[i];
          const dx = p.x - cx;
          const dy = p.y - cy;
          const dist = Math.hypot(dx, dy) || 0.0001;
          const push = ((radius - dist) / dist) * 0.02 * PRESSURE;
          p.x += dx * push;
          p.y += dy * push;
        }
      }

      // walls and floor
      for (const p of points) {
        if (p.y > height - 4) {
          p.y = height - 4;
          const vy = p.y - p.py;
          p.py = p.y + vy * FLOOR_BOUNCE;
          const vx = p.x - p.px;
          p.px = p.x - vx * 0.92;
        }
        if (p.x < 4) {
          p.x = 4;
          p.px = p.x + (p.px - p.x) * -FLOOR_BOUNCE;
        }
        if (p.x > width - 4) {
          p.x = width - 4;
          p.px = p.x + (p.px - p.x) * -FLOOR_BOUNCE;
        }
        if (p.y < 4) p.y = 4;
      }
    };

    const draw = () => {
      ctx.clearRect(0, 0, width, height);

      // smooth closed curve through points (catmull-rom)
      ctx.beginPath();
      const pts = points;
      const n = pts.length;
      ctx.moveTo(
        (pts[n - 1].x + pts[0].x) / 2,
        (pts[n - 1].y + pts[0].y) / 2,
      );
      for (let i = 0; i < n; i++) {
        const curr = pts[i];
        const next = pts[(i + 1) % n];
        const midX = (curr.x + next.x) / 2;
        const midY = (curr.y + next.y) / 2;
        ctx.quadraticCurveTo(curr.x, curr.y, midX, midY);
      }
      ctx.closePath();

      // blob gradient: warm orange, darker at bottom
      const cx = pts.reduce((s, p) => s + p.x, 0) / n;
      const cy = pts.reduce((s, p) => s + p.y, 0) / n;
      const grad = ctx.createRadialGradient(
        cx - radius * 0.25,
        cy - radius * 0.35,
        radius * 0.1,
        cx,
        cy,
        radius * 1.35,
      );
      grad.addColorStop(0, "#ff8a50");
      grad.addColorStop(0.55, "#ff5a1f");
      grad.addColorStop(1, "#c23a0a");

      ctx.fillStyle = grad;
      ctx.fill();

      // eyes: two small dark marks that look toward velocity
      const vx = pts.reduce((s, p) => s + (p.x - p.px), 0) / n;
      const vy = pts.reduce((s, p) => s + (p.y - p.py), 0) / n;
      const lookX = Math.max(-6, Math.min(6, vx * 2));
      const lookY = Math.max(-6, Math.min(6, vy * 2));
      const eyeY = cy - radius * 0.15 + lookY;
      const eyeDX = radius * 0.28;
      ctx.fillStyle = "#1a0a00";
      for (const side of [-1, 1]) {
        ctx.beginPath();
        ctx.ellipse(
          cx + side * eyeDX + lookX,
          eyeY,
          radius * 0.07,
          radius * 0.1,
          0,
          0,
          Math.PI * 2,
        );
        ctx.fill();
      }
    };

    let raf = 0;
    let running = true;

    if (reducedMotion) {
      // static single frame, no loop
      draw();
    } else {
      const loop = () => {
        if (!running) return;
        step();
        draw();
        raf = requestAnimationFrame(loop);
      };
      raf = requestAnimationFrame(loop);
    }

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      observer.disconnect();
      canvas.removeEventListener("pointerdown", onPointerDown);
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerup", onPointerUp);
      canvas.removeEventListener("pointercancel", onPointerUp);
    };
  }, []);

  return (
    <div
      className="blob-stage"
      role="img"
      aria-label="Interactive soft-body blob. Drag it around and throw it."
    >
      <canvas
        ref={canvasRef}
        style={{ width: "100%", aspectRatio: "2 / 1" }}
      />
      <p className="blob-stage-hint" data-hidden={hintHidden}>
        Grab it. Throw it. It recovers.
      </p>
    </div>
  );
}
