import { useRef, useEffect } from "react";

interface SimpleVideoPlayerProps {
  videoSrc: string;
  isActive: boolean;
  nitroActive: boolean;
  isRacing: boolean;
  onVideoEnded?: () => void;
}

/**
 * Dead-simple single-video player for Thunder Bolt.
 * One video plays from start to finish. No crossfade, no swap, no dual slots.
 */
const SimpleVideoPlayer = ({ videoSrc, isActive, nitroActive, isRacing, onVideoEnded }: SimpleVideoPlayerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (!isActive || !videoRef.current) return;
    const vid = videoRef.current;
    vid.muted = true;
    vid.playsInline = true;
    vid.src = videoSrc;
    vid.load();
    vid.play().catch(() => {});
    console.log("[SimpleVideo] Playing:", videoSrc);

    const tryPlay = () => { if (vid.paused) vid.play().catch(() => {}); };
    document.addEventListener("touchstart", tryPlay, { once: true });
    document.addEventListener("click", tryPlay, { once: true });
    return () => {
      document.removeEventListener("touchstart", tryPlay);
      document.removeEventListener("click", tryPlay);
    };
  }, [isActive, videoSrc]);

  const baseFilter = `brightness(${nitroActive ? 1.3 : 0.95}) saturate(${nitroActive ? 1.5 : 1.2}) contrast(1.1)`;
  const baseTransform = `scale(${isRacing ? (nitroActive ? 1.12 : 1.05) : 1})`;

  return (
    <div
      className="absolute inset-0 z-[2]"
      style={{ opacity: isActive ? 1 : 0, transition: "opacity 0.8s ease" }}
    >
      <video
        ref={videoRef}
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover"
        onEnded={() => {
          console.log("[SimpleVideo] Video ended");
          onVideoEnded?.();
        }}
        style={{
          filter: baseFilter,
          transform: baseTransform,
          transition: "filter 0.3s ease",
        }}
      />
    </div>
  );
};

export default SimpleVideoPlayer;
