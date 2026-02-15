import { useRef, useEffect, useState } from "react";

interface SimpleVideoPlayerProps {
  raceVideo: string;
  finaleVideo?: string;
  isActive: boolean;
  nitroActive: boolean;
  isRacing: boolean;
}

/**
 * Dead-simple video player for car-specific races.
 * One video at a time. No crossfade, no dual slots.
 * Plays raceVideo on loop during race, switches to finaleVideo when set.
 */
const SimpleVideoPlayer = ({ raceVideo, finaleVideo, isActive, nitroActive, isRacing }: SimpleVideoPlayerProps) => {
  const raceRef = useRef<HTMLVideoElement>(null);
  const finaleRef = useRef<HTMLVideoElement>(null);
  const [showFinale, setShowFinale] = useState(false);

  // Play race video on mount
  useEffect(() => {
    if (!isActive || !raceRef.current) return;
    const vid = raceRef.current;
    vid.muted = true;
    vid.playsInline = true;
    vid.src = raceVideo;
    vid.load();
    vid.play().catch(() => {});

    // Force play on user interaction (mobile)
    const tryPlay = () => { if (vid.paused) vid.play().catch(() => {}); };
    document.addEventListener("touchstart", tryPlay, { once: true });
    document.addEventListener("click", tryPlay, { once: true });
    return () => {
      document.removeEventListener("touchstart", tryPlay);
      document.removeEventListener("click", tryPlay);
    };
  }, [isActive, raceVideo]);

  // When finaleVideo arrives, switch immediately
  useEffect(() => {
    if (!finaleVideo || !finaleRef.current) return;
    const vid = finaleRef.current;
    vid.muted = true;
    vid.playsInline = true;
    vid.src = finaleVideo;
    vid.load();

    console.log("[SimpleVideo] Loading finale:", finaleVideo);

    const play = () => {
      console.log("[SimpleVideo] Playing finale NOW");
      setShowFinale(true);
      raceRef.current?.pause();
      vid.currentTime = 0;
      vid.play().catch((e) => console.warn("[SimpleVideo] play failed:", e));
    };

    if (vid.readyState >= 3) {
      play();
    } else {
      vid.addEventListener("canplay", play, { once: true });
      const t = setTimeout(play, 1500);
      return () => { clearTimeout(t); vid.removeEventListener("canplay", play); };
    }
  }, [finaleVideo]);

  const baseFilter = `brightness(${nitroActive ? 1.3 : 0.95}) saturate(${nitroActive ? 1.5 : 1.2}) contrast(1.1)`;
  const baseTransform = `scale(${isRacing ? (nitroActive ? 1.12 : 1.05) : 1})`;

  return (
    <div
      className="absolute inset-0 z-[2]"
      style={{ opacity: isActive ? 1 : 0, transition: "opacity 0.8s ease" }}
    >
      {/* Race video */}
      <video
        ref={raceRef}
        muted
        playsInline
        loop
        className="absolute inset-0 w-full h-full object-cover"
        style={{
          filter: baseFilter,
          transform: baseTransform,
          transition: "opacity 0.3s ease, filter 0.3s ease",
          opacity: showFinale ? 0 : 1,
          zIndex: 1,
        }}
      />
      {/* Finale video */}
      <video
        ref={finaleRef}
        muted
        playsInline
        loop
        className="absolute inset-0 w-full h-full object-cover"
        style={{
          filter: "brightness(1.1) saturate(1.2) contrast(1.05)",
          transition: "opacity 0.5s ease",
          opacity: showFinale ? 1 : 0,
          zIndex: showFinale ? 10 : 0,
          transform: "scale(1.02)",
        }}
      />
    </div>
  );
};

export default SimpleVideoPlayer;
