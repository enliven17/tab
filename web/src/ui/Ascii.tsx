import { useEffect, useRef } from "react";

// Light to dense. The densest cells print a digit instead, so figures surface
// and sink in the field like amounts on a bill.
const RAMP = [" ", ".", "·", ":", "-", "=", "+", "*", "%", "#"];
const CELL_W = 10;
const CELL_H = 17;
const FRAME_MS = 60;

/** A stable pseudo-random digit for a cell. */
function digit(col: number, row: number, beat: number): string {
  const n = Math.sin(col * 12.9898 + row * 78.233 + beat * 3.1) * 43758.5453;
  return String(Math.floor((n - Math.floor(n)) * 10));
}

/**
 * A drifting field of printer characters drawn on a canvas. It fills its
 * parent, brightens under the pointer, pauses off screen and draws one still
 * frame when the visitor prefers reduced motion.
 */
export function AsciiField({ color = "#1c1a16", accent = "#d2412a" }: { color?: string; accent?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const still = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const pointer = { x: -1e4, y: -1e4 };
    let cols = 0;
    let rows = 0;
    let frame = 0;
    let last = 0;
    let visible = true;

    const resize = () => {
      const ratio = Math.min(devicePixelRatio || 1, 2);
      const { width, height } = canvas.getBoundingClientRect();
      canvas.width = Math.round(width * ratio);
      canvas.height = Math.round(height * ratio);
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
      ctx.font = `13px "JetBrains Mono", ui-monospace, monospace`;
      ctx.textBaseline = "top";
      cols = Math.ceil(width / CELL_W);
      rows = Math.ceil(height / CELL_H);
      draw(performance.now());
    };

    const draw = (now: number) => {
      const t = now / 2600;
      const beat = Math.floor(now / 900);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          // Three slow waves, plus a bump around the pointer.
          let v =
            Math.sin(col * 0.11 + t * 1.3) +
            Math.sin(row * 0.23 - t) +
            Math.sin((col + row) * 0.07 + t * 0.6);
          const dx = col * CELL_W - pointer.x;
          const dy = row * CELL_H - pointer.y;
          v += 2.4 * Math.exp(-(dx * dx + dy * dy) / 9000);
          const level = Math.max(0, Math.min(RAMP.length - 1, Math.floor(((v + 3) / 6) * RAMP.length)));
          if (level === 0) continue;
          const dense = level >= RAMP.length - 2;
          ctx.fillStyle = dense && (col + row) % 7 === 0 ? accent : color;
          ctx.globalAlpha = 0.12 + (level / RAMP.length) * 0.5;
          ctx.fillText(dense ? digit(col, row, beat) : RAMP[level], col * CELL_W, row * CELL_H);
        }
      }
      ctx.globalAlpha = 1;
    };

    const tick = (now: number) => {
      frame = requestAnimationFrame(tick);
      if (!visible || now - last < FRAME_MS) return;
      last = now;
      draw(now);
    };

    const move = (event: PointerEvent) => {
      const box = canvas.getBoundingClientRect();
      pointer.x = event.clientX - box.left;
      pointer.y = event.clientY - box.top;
    };

    const sized = new ResizeObserver(resize);
    sized.observe(canvas);
    const seen = new IntersectionObserver(([entry]) => (visible = entry.isIntersecting));
    seen.observe(canvas);
    addEventListener("pointermove", move, { passive: true });
    if (!still) frame = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(frame);
      sized.disconnect();
      seen.disconnect();
      removeEventListener("pointermove", move);
    };
  }, [color, accent]);

  return <canvas ref={ref} className="ascii" aria-hidden="true" />;
}

/** TAB in block characters, for the footer. */
export const WORDMARK = [
  "████████╗ █████╗ ██████╗ ",
  "╚══██╔══╝██╔══██╗██╔══██╗",
  "   ██║   ███████║██████╔╝",
  "   ██║   ██╔══██║██╔══██╗",
  "   ██║   ██║  ██║██████╔╝",
  "   ╚═╝   ╚═╝  ╚═╝╚═════╝ ",
].join("\n");
