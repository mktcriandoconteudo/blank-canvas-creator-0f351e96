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
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);
  const finaleRef = useRef<HTMLVideoElement>(null);

  // Pre-load all videos
  useEffect(() => {
    videoRefs.current.forEach((v) => {
      if (v) v.load();
    });
  }, []);

  // When active, play current video
  useEffect(() => {
    if (isActive && !playingFinale && videoRefs.current[currentIndex]) {
      videoRefs.current[currentIndex]?.play().catch(() => {});
    }
  }, [isActive, currentIndex, playingFinale]);

  // When finale video is set, switch to it
  useEffect(() => {
    if (finaleVideo && !playingFinale) {
      setPlayingFinale(true);
      // Pause current race video
      videoRefs.current[currentIndex]?.pause();
      setTimeout(() => {
        finaleRef.current?.play().catch(() => {});
      }, 100);
    }
  }, [finaleVideo, playingFinale, currentIndex]);

  const handleEnded = useCallback(() => {
    if (playingFinale) return; // Don't cycle if playing finale
    const next = (currentIndex + 1) % videos.length;
    setCurrentIndex(next);
  }, [currentIndex, videos.length, playingFinale]);

  return (
    <div
      className="absolute inset-0 z-[2]"
      style={{
        opacity: isActive ? 1 : 0,
        transition: "opacity 0.8s ease",
      }}
    >
      {/* Race battle videos */}
      {videos.map((src, i) => (
        <video
          key={i}
          ref={(el) => { videoRefs.current[i] = el; }}
          muted
          playsInline
          poster={i === 0 ? poster : undefined}
          preload="auto"
          onEnded={i === currentIndex ? handleEnded : undefined}
          className="absolute inset-0 w-full h-full object-cover"
          style={{
            filter: `brightness(${nitroActive ? 1.3 : 0.95}) saturate(${nitroActive ? 1.5 : 1.2}) contrast(1.1)`,
            transition: "filter 0.3s ease, opacity 0.5s ease",
            transform: `scale(${isRacing ? (nitroActive ? 1.12 : 1.05) : 1})`,
            opacity: !playingFinale && i === currentIndex ? 1 : 0,
            zIndex: i === currentIndex ? 2 : 1,
          }}
        >
          <source src={src} type="video/mp4" />
        </video>
      ))}

      {/* Finale video (victory or defeat) */}
      {finaleVideo && (
        <video
          ref={finaleRef}
          muted
          playsInline
          loop
          preload="auto"
          className="absolute inset-0 w-full h-full object-cover"
          style={{
            filter: "brightness(1) saturate(1.2) contrast(1.1)",
            transition: "opacity 0.5s ease",
            opacity: playingFinale ? 1 : 0,
            zIndex: 3,
          }}
        >
          <source src={finaleVideo} type="video/mp4" />
        </video>
      )}
    </div>
  );
};

export default RaceVideoPlayer;
