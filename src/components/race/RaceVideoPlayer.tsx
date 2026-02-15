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
 * Dual-video crossfade player to avoid static poster flash on mobile.
 * Two <video> elements alternate: while one plays, the next is preloaded.
 * On 'ended', the preloaded video starts and the old one loads the next src.
 */
const RaceVideoPlayer = ({ videos, finaleVideo, isActive, poster, nitroActive, isRacing }: RaceVideoPlayerProps) => {
  const [playingFinale, setPlayingFinale] = useState(false);
  const [activeSlot, setActiveSlot] = useState<0 | 1>(0); // which video element is visible
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
      activeVid.src = videos[0];
      activeVid.play().catch(() => {});
    }

    // Preload next video in the hidden slot
    const nextIndex = videos.length > 1 ? 1 : 0;
    const nextVid = getRef(getNextSlot(activeSlot)).current;
    if (nextVid) {
      nextVid.src = videos[nextIndex];
      nextVid.load();
    }
    currentIndexRef.current = 0;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isActive]);

  // When finale video is set, switch to it
  useEffect(() => {
    if (finaleVideo && !playingFinale) {
      setPlayingFinale(true);
      // Pause both race videos
      videoARef.current?.pause();
      videoBRef.current?.pause();

      const vid = finaleRef.current;
      if (vid) {
        vid.src = finaleVideo;
        vid.play().catch(() => {});
      }
    }
  }, [finaleVideo, playingFinale]);

  // When current race video ends, swap to preloaded one + preload next
  const handleEnded = useCallback(() => {
    if (playingFinale) return;

    const nextSlot = getNextSlot(activeSlot);
    const nextVid = getRef(nextSlot).current;

    // Play the preloaded video immediately (no src change = no flash)
    if (nextVid) {
      nextVid.play().catch(() => {});
    }
    setActiveSlot(nextSlot);

    // Advance index and preload the NEXT video in the now-hidden slot
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
          // @ts-ignore
          webkit-playsinline="true"
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
          // @ts-ignore
          webkit-playsinline="true"
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
