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
  const [playingFinale, setPlayingFinale] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const finaleRef = useRef<HTMLVideoElement | null>(null);
  const currentIndexRef = useRef(0);

  // Start playing race video when active
  useEffect(() => {
    if (!isActive || playingFinale) return;
    const vid = videoRef.current;
    if (vid) {
      vid.play().catch(() => {});
    }
  }, [isActive, playingFinale]);

  // When finale video is set, switch to it
  useEffect(() => {
    if (finaleVideo && !playingFinale) {
      setPlayingFinale(true);
      if (videoRef.current) videoRef.current.pause();

      const vid = finaleRef.current;
      if (vid) {
        vid.src = finaleVideo;
        vid.play().catch(() => {});
      }
    }
  }, [finaleVideo, playingFinale]);

  // When current race video ends, advance to next one
  const handleEnded = useCallback(() => {
    if (playingFinale) return;
    const nextIndex = (currentIndexRef.current + 1) % videos.length;
    currentIndexRef.current = nextIndex;
    const vid = videoRef.current;
    if (vid) {
      vid.src = videos[nextIndex];
      vid.play().catch(() => {});
    }
  }, [videos, playingFinale]);

  return (
    <div
      className="absolute inset-0 z-[2]"
      style={{
        opacity: isActive ? 1 : 0,
        transition: "opacity 0.8s ease",
      }}
    >
      {/* Race video — starts with first video, advances on end */}
      {!playingFinale && (
        <video
          ref={videoRef}
          src={videos[0]}
          muted
          playsInline
          // @ts-ignore
          webkit-playsinline="true"
          preload="auto"
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
        ref={finaleRef}
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
