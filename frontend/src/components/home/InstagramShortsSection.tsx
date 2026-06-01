import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ExternalLink, Loader2, Play, X } from "lucide-react";
import SectionWrapper from "@/components/common/SectionWrapper";
import { REEL_EMBED_HEIGHT, REEL_EMBED_WIDTH, reelEmbedUrl } from "@/data/instagramReels";
import { fetchInstagramReels, reelThumbnailProxyUrl, type InstagramReelDoc } from "@/lib/instagramApi";
import { cn } from "@/lib/utils";

const INSTAGRAM_PROFILE = "https://www.instagram.com/the.royaloven/";
const CARD_CLASS = "w-[200px] sm:w-[220px] md:w-[240px] aspect-[9/16]";

/** Scale Instagram embed to fit card width (no layout jump on play). */
function embedScaleStyle(cardWidthPx: number) {
  const scale = cardWidthPx / REEL_EMBED_WIDTH;
  return {
    width: REEL_EMBED_WIDTH,
    height: REEL_EMBED_HEIGHT,
    transform: `translateX(-50%) scale(${scale})`,
    transformOrigin: "top center" as const,
    left: "50%",
  };
}

const ReelCard = ({
  reel,
  index,
  isPlaying,
  cardWidthPx,
  onTogglePlay,
}: {
  reel: InstagramReelDoc;
  index: number;
  isPlaying: boolean;
  cardWidthPx: number;
  onTogglePlay: (reel: InstagramReelDoc) => void;
}) => {
  const [thumbFailed, setThumbFailed] = useState(false);
  const [thumbLoaded, setThumbLoaded] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.06 }}
      className={cn(
        "relative flex-shrink-0 snap-center snap-always overflow-hidden rounded-2xl",
        CARD_CLASS,
        "border bg-card shadow-md transition-shadow duration-300",
        isPlaying ? "border-primary/50 shadow-lg" : "border-border/80 hover:shadow-lg hover:border-primary/30",
      )}
    >
      {isPlaying ? (
        <div className="absolute inset-0 overflow-hidden bg-black">
          <iframe
            key={reel.shortcode}
            src={reelEmbedUrl(reel.shortcode)}
            title={`Royal Oven Instagram reel ${reel.shortcode}`}
            className="absolute top-0 border-0"
            style={embedScaleStyle(cardWidthPx)}
            allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
            allowFullScreen
          />
          <button
            type="button"
            onClick={() => onTogglePlay(reel)}
            className="absolute right-1.5 top-1.5 z-20 flex h-7 w-7 items-center justify-center rounded-full bg-black/70 text-white hover:bg-black/90 transition-colors"
            aria-label="Stop reel"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => onTogglePlay(reel)}
          className="group relative block h-full w-full text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          aria-label={`Play Instagram reel ${index + 1}`}
        >
          {!thumbLoaded && !thumbFailed && (
            <div className="absolute inset-0 animate-pulse bg-muted" aria-hidden />
          )}
          {!thumbFailed ? (
            <img
              src={reelThumbnailProxyUrl(reel.shortcode)}
              alt={`Royal Oven Instagram reel ${index + 1}`}
              className={cn(
                "absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105",
                thumbLoaded ? "opacity-100" : "opacity-0",
              )}
              loading="lazy"
              decoding="async"
              onLoad={() => setThumbLoaded(true)}
              onError={() => setThumbFailed(true)}
            />
          ) : (
            <div
              className="absolute inset-0 bg-gradient-to-br from-[#f09433] via-[#dc2743] to-[#bc1888]"
              aria-hidden
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/10" />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white/95 text-[#E1306C] shadow-lg transition-transform duration-300 group-hover:scale-110">
              <Play className="h-6 w-6 fill-current ml-0.5" aria-hidden />
            </span>
          </div>
        </button>
      )}
    </motion.div>
  );
};

const InstagramShortsSection = () => {
  const [reels, setReels] = useState<InstagramReelDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [playingShortcode, setPlayingShortcode] = useState<string | null>(null);
  const [cardWidthPx, setCardWidthPx] = useState(220);

  const loadReels = useCallback(async () => {
    setLoading(true);
    try {
      const list = await fetchInstagramReels();
      setReels(list);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadReels();
  }, [loadReels]);

  useEffect(() => {
    const updateWidth = () => {
      if (window.innerWidth >= 768) setCardWidthPx(240);
      else if (window.innerWidth >= 640) setCardWidthPx(220);
      else setCardWidthPx(200);
    };
    updateWidth();
    window.addEventListener("resize", updateWidth);
    return () => window.removeEventListener("resize", updateWidth);
  }, []);

  const handleTogglePlay = (reel: InstagramReelDoc) => {
    setPlayingShortcode((current) => (current === reel.shortcode ? null : reel.shortcode));
  };

  return (
    <SectionWrapper className="border-y border-border/70 bg-muted/30">
      

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" aria-label="Loading reels" />
        </div>
      ) : reels.length === 0 ? (
        <p className="font-body text-center text-muted-foreground py-8">Reels will appear here soon.</p>
      ) : (
        <div
          className={cn(
            "flex items-start gap-4 overflow-x-auto pb-2 -mx-1 px-1",
            "snap-x snap-mandatory scroll-smooth scrollbar-hide",
          )}
        >
          {reels.map((reel, i) => (
            <ReelCard
              key={reel._id}
              reel={reel}
              index={i}
              isPlaying={playingShortcode === reel.shortcode}
              cardWidthPx={cardWidthPx}
              onTogglePlay={handleTogglePlay}
            />
          ))}
        </div>
      )}

      <p className="font-body mt-6 text-center md:text-left text-sm text-muted-foreground">
        <a
          href={INSTAGRAM_PROFILE}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-primary font-semibold hover:underline"
        >
          Follow us on Instagram
          <ExternalLink className="h-3.5 w-3.5" aria-hidden />
        </a>
      </p>
    </SectionWrapper>
  );
};

export default InstagramShortsSection;
