import { useRef, useState, useCallback, useEffect } from "react";

interface RaceVideoPlayerProps {
  videos: string[];
  finaleVideo?: string;
  isActive: boolean;
  poster: string;
  nitroActive: boolean;
  isRacing: boolean;
}

/**
 * Dual-video crossfade player for mobile (Android + iOS).
 * Two <video> elements alternate: while one plays, the next is preloaded.
 * On 'ended', the preloaded video starts and the old one loads the next src.
 */

function setupMobileVideo(el: HTMLVideoElement) {
  el.muted = true;
  el.volume = 0;
  el.playsInline = true;
  el.setAttribute("playsinline", "");
  el.setAttribute("webkit-playsinline", "");
  // Android webview / some browsers
  el.setAttribute("x5-playsinline", "");
  el.setAttribute("x5-video-player-type", "h5");
  el.setAttribute("x5-video-player-fullscreen", "false");
}

const RaceVideoPlayer = ({ videos, finaleVideo, isActive, poster, nitroActive, isRacing }: RaceVideoPlayerProps) => {
  const [playingFinale, setPlayingFinale] = useState(false);
  const [activeSlot, setActiveSlot] = useState<0 | 1>(0);
  const videoARef = useRef<HTMLVideoElement | null>(null);
  const videoBRef = useRef<HTMLVideoElement | null>(null);
  const finaleRef = useRef<HTMLVideoElement | null>(null);
  const currentIndexRef = useRef(0);

  const getRef = (slot: 0 | 1) => slot === 0 ? videoARef : videoBRef;
  const getNextSlot = (slot: 0 | 1): 0 | 1 => slot === 0 ? 1 : 0;

  // Start playing + preload next on mount/active
  useEffect(() => {
    if (!isActive || playingFinale) return;

    const activeVid = getRef(activeSlot).current;
    if (activeVid) {
      setupMobileVideo(activeVid);
      activeVid.src = videos[0];
      activeVid.load();
      activeVid.play().catch(() => {});
    }

    // Preload next video in the hidden slot
    const nextIndex = videos.length > 1 ? 1 : 0;
    const nextVid = getRef(getNextSlot(activeSlot)).current;
    if (nextVid) {
      setupMobileVideo(nextVid);
      nextVid.src = videos[nextIndex];
      nextVid.load();
    }
    currentIndexRef.current = 0;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isActive]);

  // Force play via user gesture (Android Chrome often blocks even muted autoplay)
  useEffect(() => {
    if (!isActive || playingFinale) return;

    const tryPlay = () => {
      const activeVid = getRef(activeSlot).current;
      if (activeVid && activeVid.paused) {
        activeVid.play().catch(() => {});
      }
    };

    document.addEventListener("touchstart", tryPlay, { once: true });
    document.addEventListener("click", tryPlay, { once: true });

    return () => {
      document.removeEventListener("touchstart", tryPlay);
      document.removeEventListener("click", tryPlay);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isActive, playingFinale]);

  // When finale video is set, switch to it
  useEffect(() => {
    if (finaleVideo && !playingFinale) {
      setPlayingFinale(true);
      videoARef.current?.pause();
      videoBRef.current?.pause();

      const vid = finaleRef.current;
      if (vid) {
        setupMobileVideo(vid);
        vid.src = finaleVideo;
        vid.load();
        vid.play().catch(() => {});
      }
    }
  }, [finaleVideo, playingFinale]);

  // When current race video ends, swap to preloaded one + preload next
  const handleEnded = useCallback(() => {
    if (playingFinale) return;

    const nextSlot = getNextSlot(activeSlot);
    const nextVid = getRef(nextSlot).current;

    if (nextVid) {
      nextVid.play().catch(() => {});
    }
    setActiveSlot(nextSlot);

    const nextIndex = (currentIndexRef.current + 1) % videos.length;
    currentIndexRef.current = nextIndex;

    const futureIndex = (nextIndex + 1) % videos.length;
    const oldVid = getRef(activeSlot).current;
    if (oldVid) {
      oldVid.src = videos[futureIndex];
      oldVid.load();
    }
  }, [videos, playingFinale, activeSlot]);

  const videoStyle = (isSlotActive: boolean) => ({
    filter: `brightness(${nitroActive ? 1.3 : 0.95}) saturate(${nitroActive ? 1.5 : 1.2}) contrast(1.1)`,
    transition: "opacity 0.3s ease, filter 0.3s ease",
    transform: `scale(${isRacing ? (nitroActive ? 1.12 : 1.05) : 1})`,
    opacity: isSlotActive ? 1 : 0,
    position: "absolute" as const,
    inset: 0,
    width: "100%",
    height: "100%",
    objectFit: "cover" as const,
  });

  return (
    <div
      className="absolute inset-0 z-[2]"
      style={{
        opacity: isActive ? 1 : 0,
        transition: "opacity 0.8s ease",
      }}
    >
      {/* Race video A */}
      {!playingFinale && (
        <video
          ref={videoARef}
          muted
          playsInline
          preload="auto"
          onEnded={activeSlot === 0 ? handleEnded : undefined}
          style={videoStyle(activeSlot === 0)}
        />
      )}

      {/* Race video B (preloaded, hidden until swap) */}
      {!playingFinale && (
        <video
          ref={videoBRef}
          muted
          playsInline
          preload="auto"
          onEnded={activeSlot === 1 ? handleEnded : undefined}
          style={videoStyle(activeSlot === 1)}
        />
      )}

      {/* Finale video (victory or defeat) */}
      <video
        ref={finaleRef}
        muted
        playsInline
        loop
        preload="none"
        className="absolute inset-0 w-full h-full object-cover"
        style={{
          filter: "brightness(1.1) saturate(1.2) contrast(1.05)",
          transition: "opacity 0.5s ease",
          opacity: playingFinale ? 1 : 0,
          zIndex: playingFinale ? 5 : 0,
          transform: "scale(1.02)",
        }}
      />
    </div>
  );
};

export default RaceVideoPlayer;
