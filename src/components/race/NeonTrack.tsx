import { useEffect, useRef } from "react";

interface NeonTrackProps {
  scrollOffset: number;
  playerLane: number; // 0 = top lane, 1 = bottom lane (Y position ratio within road)
  opponentLane: number;
}

const NeonTrack = ({ scrollOffset, playerLane, opponentLane }: NeonTrackProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animFrame: number;

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
      frameRef.current++;
      const frame = frameRef.current;
      const speed = scrollOffset;
      
      ctx.clearRect(0, 0, w(), h());

      const roadTop = h() * 0.12;
      const roadBottom = h() * 0.88;
      const roadH = roadBottom - roadTop;

      // === Parallax background (distant city lights) ===
      const bgOffset = (speed * 0.3) % w();
      for (let i = 0; i < 60; i++) {
        const bx = ((i * (w() / 20) - bgOffset) % (w() + 100)) - 50;
        const by = i % 2 === 0 ? roadTop - 15 - Math.random() * 20 : roadBottom + 10 + Math.random() * 20;
        const hue = i % 3 === 0 ? 185 : i % 3 === 1 ? 270 : 30;
        const alpha = 0.15 + Math.sin(frame * 0.02 + i) * 0.1;
        ctx.fillStyle = `hsla(${hue}, 80%, 55%, ${alpha})`;
        ctx.fillRect(bx, by, 2 + Math.random() * 3, 1.5);
      }

      // === Asphalt base with gradient ===
      const asphaltGrad = ctx.createLinearGradient(0, roadTop, 0, roadBottom);
      asphaltGrad.addColorStop(0, "hsl(220, 12%, 10%)");
      asphaltGrad.addColorStop(0.5, "hsl(220, 10%, 8%)");
      asphaltGrad.addColorStop(1, "hsl(220, 12%, 10%)");
      ctx.fillStyle = asphaltGrad;
      ctx.fillRect(0, roadTop, w(), roadH);

      // === Wet road reflections (subtle streaks) ===
      const reflOffset = (speed * 1.5) % w();
      ctx.globalAlpha = 0.04;
      for (let i = 0; i < 30; i++) {
        const rx = ((i * (w() / 10) - reflOffset) % (w() + 200)) - 100;
        const ry = roadTop + Math.random() * roadH;
        const rw = 40 + Math.random() * 80;
        const reflGrad = ctx.createLinearGradient(rx, ry, rx + rw, ry);
        reflGrad.addColorStop(0, "transparent");
        reflGrad.addColorStop(0.5, "hsl(200, 30%, 40%)");
        reflGrad.addColorStop(1, "transparent");
        ctx.fillStyle = reflGrad;
        ctx.fillRect(rx, ry, rw, 1.5);
      }
      ctx.globalAlpha = 1;

      // === Tire marks (burnt rubber on asphalt) ===
      const tireOffset = (speed * 0.8) % w();
      ctx.globalAlpha = 0.06;
      ctx.strokeStyle = "hsl(0, 0%, 20%)";
      ctx.lineWidth = 3;
      for (let i = 0; i < 8; i++) {
        const tx = ((i * (w() / 4) - tireOffset) % (w() + 300)) - 150;
        const ty = roadTop + roadH * (0.3 + (i % 3) * 0.2);
        ctx.beginPath();
        ctx.moveTo(tx, ty);
        ctx.bezierCurveTo(tx + 30, ty - 3, tx + 60, ty + 5, tx + 100, ty + 2);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;

      // === Road grain texture ===
      ctx.globalAlpha = 0.03;
      for (let i = 0; i < 200; i++) {
        const gx = Math.random() * w();
        const gy = roadTop + Math.random() * roadH;
        ctx.fillStyle = Math.random() > 0.5 ? "hsl(0,0%,25%)" : "hsl(0,0%,5%)";
        ctx.fillRect(gx, gy, 1, 1);
      }
      ctx.globalAlpha = 1;

      // === Lane divider (dashed center line, scrolling) ===
      const laneY = (roadTop + roadBottom) / 2;
      ctx.setLineDash([40, 25]);
      ctx.lineDashOffset = -speed * 2;
      ctx.strokeStyle = "hsl(50, 60%, 50%)";
      ctx.lineWidth = 2.5;
      ctx.shadowColor = "hsl(50, 60%, 50%)";
      ctx.shadowBlur = 4;
      ctx.beginPath();
      ctx.moveTo(0, laneY);
      ctx.lineTo(w(), laneY);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.shadowBlur = 0;

      // === Neon edge barriers (top) ===
      const pulseT = Math.sin(frame * 0.05) * 0.3 + 0.7;
      const pulseTPlayer = Math.sin(frame * 0.08 + playerLane * 3) * 0.2 + 0.8;

      // Top barrier
      ctx.shadowColor = `hsla(185, 80%, 55%, ${pulseT})`;
      ctx.shadowBlur = 20;
      ctx.strokeStyle = `hsla(185, 80%, 55%, ${0.6 + pulseT * 0.4})`;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(0, roadTop);
      ctx.lineTo(w(), roadTop);
      ctx.stroke();

      // Top barrier inner glow
      ctx.shadowBlur = 0;
      const topGlowGrad = ctx.createLinearGradient(0, roadTop, 0, roadTop + 20);
      topGlowGrad.addColorStop(0, `hsla(185, 80%, 55%, ${0.12 * pulseTPlayer})`);
      topGlowGrad.addColorStop(1, "transparent");
      ctx.fillStyle = topGlowGrad;
      ctx.fillRect(0, roadTop, w(), 20);

      // Bottom barrier
      const pulseB = Math.sin(frame * 0.05 + 2) * 0.3 + 0.7;
      ctx.shadowColor = `hsla(270, 60%, 60%, ${pulseB})`;
      ctx.shadowBlur = 20;
      ctx.strokeStyle = `hsla(270, 60%, 60%, ${0.6 + pulseB * 0.4})`;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(0, roadBottom);
      ctx.lineTo(w(), roadBottom);
      ctx.stroke();

      // Bottom barrier inner glow
      ctx.shadowBlur = 0;
      const botGlowGrad = ctx.createLinearGradient(0, roadBottom, 0, roadBottom - 20);
      botGlowGrad.addColorStop(0, `hsla(270, 60%, 60%, ${0.12 * pulseB})`);
      botGlowGrad.addColorStop(1, "transparent");
      ctx.fillStyle = botGlowGrad;
      ctx.fillRect(0, roadBottom - 20, w(), 20);

      // === Moving barrier posts (scrolling neon pillars) ===
      const postSpacing = w() / 8;
      const postOffset = (speed * 2) % postSpacing;
      for (let i = -1; i < 10; i++) {
        const px = i * postSpacing - postOffset;
        if (px < -20 || px > w() + 20) continue;

        const postPulse = Math.sin(frame * 0.06 + i * 0.8) * 0.3 + 0.7;

        // Top post
        ctx.fillStyle = `hsla(185, 80%, 55%, ${0.5 * postPulse})`;
        ctx.shadowColor = "hsl(185, 80%, 55%)";
        ctx.shadowBlur = 12;
        ctx.fillRect(px - 2, roadTop - 8, 4, 12);

        // Bottom post
        ctx.fillStyle = `hsla(270, 60%, 60%, ${0.5 * postPulse})`;
        ctx.shadowColor = "hsl(270, 60%, 60%)";
        ctx.fillRect(px - 2, roadBottom - 4, 4, 12);
      }
      ctx.shadowBlur = 0;

      // === Speed lines (parallax streaks on road) ===
      const speedLineOffset = (speed * 3) % w();
      ctx.globalAlpha = 0.08;
      ctx.strokeStyle = "hsl(185, 60%, 50%)";
      ctx.lineWidth = 1;
      for (let i = 0; i < 15; i++) {
        const sx = ((i * (w() / 5) - speedLineOffset) % (w() + 200)) - 100;
        const sy = roadTop + 10 + (i * 17) % roadH;
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.lineTo(sx + 30 + Math.random() * 40, sy);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;

      animFrame = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animFrame);
      window.removeEventListener("resize", resize);
    };
  }, [scrollOffset, playerLane, opponentLane]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 h-full w-full"
    />
  );
};

export default NeonTrack;
