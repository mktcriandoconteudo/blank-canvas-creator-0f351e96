import { useRef, useState, useCallback, useEffect } from "react";

interface RaceVideoPlayerProps {
  videos: string[];
  isActive: boolean;
  poster: string;
  nitroActive: boolean;
  isRacing: boolean;
}

const RaceVideoPlayer = ({ videos, isActive, poster, nitroActive, isRacing }: RaceVideoPlayerProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);

  // Pre-load all videos
  useEffect(() => {
    videoRefs.current.forEach((v) => {
      if (v) v.load();
    });
  }, []);

  // When active, play current video
  useEffect(() => {
    if (isActive && videoRefs.current[currentIndex]) {
      videoRefs.current[currentIndex]?.play().catch(() => {});
    }
  }, [isActive, currentIndex]);

  const handleEnded = useCallback(() => {
    const next = (currentIndex + 1) % videos.length;
    setCurrentIndex(next);
  }, [currentIndex, videos.length]);

  return (
    <div
      className="absolute inset-0 z-[2]"
      style={{
        opacity: isActive ? 1 : 0,
        transition: "opacity 0.8s ease",
      }}
    >
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
            transition: "filter 0.3s ease, opacity 0.4s ease",
            transform: `scale(${isRacing ? (nitroActive ? 1.12 : 1.05) : 1})`,
            opacity: i === currentIndex ? 1 : 0,
            zIndex: i === currentIndex ? 2 : 1,
          }}
        >
          <source src={src} type="video/mp4" />
        </video>
      ))}
    </div>
  );
};

export default RaceVideoPlayer;
