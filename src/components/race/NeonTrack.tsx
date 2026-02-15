import { useEffect, useRef } from "react";

const NeonTrack = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animFrame: number;
    let offset = 0;

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

      // Road
      const roadTop = h() * 0.25;
      const roadBottom = h() * 0.85;
      ctx.fillStyle = "hsl(220, 15%, 8%)";
      ctx.fillRect(0, roadTop, w(), roadBottom - roadTop);

      // Lane divider
      const laneY = (roadTop + roadBottom) / 2;
      ctx.setLineDash([30, 20]);
      ctx.lineDashOffset = -offset;
      ctx.strokeStyle = "hsl(220, 15%, 25%)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, laneY);
      ctx.lineTo(w(), laneY);
      ctx.stroke();
      ctx.setLineDash([]);

      // Neon edge lines (top)
      ctx.shadowColor = "hsl(185, 80%, 55%)";
      ctx.shadowBlur = 15;
      ctx.strokeStyle = "hsl(185, 80%, 55%)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, roadTop);
      ctx.lineTo(w(), roadTop);
      ctx.stroke();

      // Neon edge lines (bottom)
      ctx.shadowColor = "hsl(270, 60%, 60%)";
      ctx.strokeStyle = "hsl(270, 60%, 60%)";
      ctx.beginPath();
      ctx.moveTo(0, roadBottom);
      ctx.lineTo(w(), roadBottom);
      ctx.stroke();

      ctx.shadowBlur = 0;

      // Moving neon dashes on edges
      for (let i = 0; i < 20; i++) {
        const x = ((i * (w() / 10) + offset * 2) % (w() + 60)) - 30;
        
        // Top edge lights
        ctx.fillStyle = `hsla(185, 80%, 55%, ${0.3 + Math.sin(i + offset * 0.01) * 0.2})`;
        ctx.fillRect(x, roadTop - 4, 15, 3);

        // Bottom edge lights  
        ctx.fillStyle = `hsla(270, 60%, 60%, ${0.3 + Math.cos(i + offset * 0.01) * 0.2})`;
        ctx.fillRect(x, roadBottom + 1, 15, 3);
      }

      offset += 3;
      animFrame = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animFrame);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 h-full w-full"
    />
  );
};

export default NeonTrack;
