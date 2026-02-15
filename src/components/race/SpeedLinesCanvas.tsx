import { useEffect, useRef } from "react";

interface SpeedLinesCanvasProps {
  speed: number;
  isRacing: boolean;
  nitroActive: boolean;
}

const SpeedLinesCanvas = ({ speed, isRacing, nitroActive }: SpeedLinesCanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animFrame: number;
    let particles: { x: number; y: number; len: number; speed: number; opacity: number; hue: number }[] = [];

    const resize = () => {
      canvas.width = canvas.offsetWidth * window.devicePixelRatio;
      canvas.height = canvas.offsetHeight * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };
    resize();
    window.addEventListener("resize", resize);

    const w = () => canvas.offsetWidth;
    const h = () => canvas.offsetHeight;

    const draw = () => {
      ctx.clearRect(0, 0, w(), h());

      if (!isRacing) {
        animFrame = requestAnimationFrame(draw);
        return;
      }

      // Spawn speed lines
      const spawnRate = nitroActive ? 8 : 3;
      for (let i = 0; i < spawnRate; i++) {
        particles.push({
          x: w() + Math.random() * 100,
          y: Math.random() * h(),
          len: 40 + Math.random() * (nitroActive ? 200 : 80),
          speed: 8 + Math.random() * speed * 0.5,
          opacity: 0.15 + Math.random() * 0.3,
          hue: nitroActive ? 210 : (Math.random() > 0.5 ? 185 : 270),
        });
      }

      // Spawn rain drops
      for (let i = 0; i < 4; i++) {
        particles.push({
          x: Math.random() * w(),
          y: -10,
          len: 8 + Math.random() * 15,
          speed: 12 + Math.random() * 8,
          opacity: 0.08 + Math.random() * 0.12,
          hue: 200,
        });
      }

      // Update and draw
      particles = particles.filter((p) => {
        // Speed lines move left
        if (p.hue !== 200) {
          p.x -= p.speed;
          if (p.x + p.len < 0) return false;

          ctx.strokeStyle = `hsla(${p.hue}, 80%, 60%, ${p.opacity})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p.x + p.len, p.y);
          ctx.stroke();
        } else {
          // Rain drops fall diagonally
          p.x -= p.speed * 0.3;
          p.y += p.speed;
          if (p.y > h()) return false;

          ctx.strokeStyle = `hsla(200, 40%, 70%, ${p.opacity})`;
          ctx.lineWidth = 0.8;
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p.x + p.len * 0.2, p.y - p.len);
          ctx.stroke();
        }
        return true;
      });

      // Vignette
      const vGrad = ctx.createRadialGradient(w() / 2, h() / 2, w() * 0.3, w() / 2, h() / 2, w() * 0.8);
      vGrad.addColorStop(0, "transparent");
      vGrad.addColorStop(1, `rgba(0, 0, 0, ${nitroActive ? 0.6 : 0.35})`);
      ctx.fillStyle = vGrad;
      ctx.fillRect(0, 0, w(), h());

      animFrame = requestAnimationFrame(draw);
    };

    draw();
    return () => {
      cancelAnimationFrame(animFrame);
      window.removeEventListener("resize", resize);
    };
  }, [speed, isRacing, nitroActive]);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none absolute inset-0 z-[5] h-full w-full"
    />
  );
};

export default SpeedLinesCanvas;
