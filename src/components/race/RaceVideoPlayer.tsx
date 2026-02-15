import { useRef, useState, useCallback, useEffect } from "react";

interface RaceVideoPlayerProps {
  videos: string[];
  finaleVideo?: string;
  isActive: boolean;
  poster: string;
  nitroActive: boolean;
  isRacing: boolean;
}

const RaceVideoPlayer = ({ videos, finaleVideo, isActive, poster, nitroActive, isRacing }: RaceVideoPlayerProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [playingFinale, setPlayingFinale] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const finaleRef = useRef<HTMLVideoElement>(null);

  // Play current video when active or index changes
  useEffect(() => {
    if (!isActive || playingFinale) return;
    const vid = videoRef.current;
    if (vid) {
      vid.src = videos[currentIndex];
      vid.load();
      vid.play().catch(() => {});
    }
  }, [isActive, currentIndex, playingFinale, videos]);

  // When finale video is set, switch to it
  useEffect(() => {
    if (finaleVideo && !playingFinale) {
      setPlayingFinale(true);
      // Pause current race video
      if (videoRef.current) videoRef.current.pause();

      const vid = finaleRef.current;
      if (vid) {
        vid.src = finaleVideo;
        vid.load();
        const tryPlay = () => {
          vid.play().catch(() => {});
        };
        if (vid.readyState >= 3) {
          tryPlay();
        } else {
          vid.addEventListener("canplay", tryPlay, { once: true });
        }
      }
    }
  }, [finaleVideo, playingFinale]);

  const handleEnded = useCallback(() => {
    if (playingFinale) return;
    setCurrentIndex((prev) => (prev + 1) % videos.length);
  }, [videos.length, playingFinale]);

  return (
    <div
      className="absolute inset-0 z-[2]"
      style={{
        opacity: isActive ? 1 : 0,
        transition: "opacity 0.8s ease",
      }}
    >
      {/* Single race video element — iOS only supports one playing at a time */}
      {!playingFinale && (
        <video
          ref={(el) => {
            (videoRef as any).current = el;
            if (el) { el.muted = true; el.volume = 0; }
          }}
          muted
          playsInline
          // @ts-ignore
          webkit-playsinline="true"
          poster={poster}
          onEnded={handleEnded}
          className="absolute inset-0 w-full h-full object-cover"
          style={{
            filter: `brightness(${nitroActive ? 1.3 : 0.95}) saturate(${nitroActive ? 1.5 : 1.2}) contrast(1.1)`,
            transition: "filter 0.3s ease",
            transform: `scale(${isRacing ? (nitroActive ? 1.12 : 1.05) : 1})`,
          }}
        />
      )}

      {/* Finale video (victory or defeat) */}
      <video
        ref={(el) => {
          (finaleRef as any).current = el;
          if (el) { el.muted = true; el.volume = 0; }
        }}
        muted
        playsInline
        // @ts-ignore
        webkit-playsinline="true"
        loop
        preload="none"
        className="absolute inset-0 w-full h-full object-cover"
        style={{
          filter: "brightness(1.05) saturate(1.3) contrast(1.1)",
          transition: "opacity 0.6s ease",
          opacity: playingFinale ? 1 : 0,
          zIndex: playingFinale ? 5 : 0,
        }}
      />
    </div>
  );
};

export default RaceVideoPlayer;
