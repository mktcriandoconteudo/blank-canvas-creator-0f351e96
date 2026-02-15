import { useRef, useState, useCallback } from "react";

interface RaceVideoPlayerProps {
  videos: string[];
  isActive: boolean;
  poster: string;
  nitroActive: boolean;
  isRacing: boolean;
}

const RaceVideoPlayer = ({ videos, isActive, poster, nitroActive, isRacing }: RaceVideoPlayerProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);

  const handleEnded = useCallback(() => {
    const nextIndex = (currentIndex + 1) % videos.length;
    setCurrentIndex(nextIndex);
    // Small delay to let the src change before playing
    setTimeout(() => {
      videoRef.current?.play();
    }, 50);
  }, [currentIndex, videos.length]);

  return (
    <div
      className="absolute inset-0 z-[2]"
      style={{
        opacity: isActive ? 1 : 0,
        transition: "opacity 0.8s ease",
      }}
    >
      <video
        ref={videoRef}
        key={currentIndex}
        autoPlay
        muted
        playsInline
        poster={poster}
        onEnded={handleEnded}
        className="absolute inset-0 w-full h-full object-cover"
        style={{
          filter: `brightness(${nitroActive ? 1.3 : 0.95}) saturate(${nitroActive ? 1.5 : 1.2}) contrast(1.1)`,
          transition: "filter 0.3s ease",
          transform: `scale(${isRacing ? (nitroActive ? 1.12 : 1.05) : 1})`,
        }}
      >
        <source src={videos[currentIndex]} type="video/mp4" />
      </video>
    </div>
  );
};

export default RaceVideoPlayer;
