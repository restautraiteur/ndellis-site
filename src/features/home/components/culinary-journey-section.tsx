import { useEffect, useRef, useState, type CSSProperties } from "react";
import cuisinePoster from "@/assets/cheffe-cuisine-poster.jpg";
import cuisineVideo from "@/assets/cheffe-cuisine.mp4";
import cuisineVideoWebm from "@/assets/cheffe-cuisine.webm";
import decoCrevette from "@/assets/deco-crevette.webp";
import motifOndule from "@/assets/motif-ondule.webp";

const CUISINES = [
  "Cuisine sénégalaise",
  "Saveurs asiatiques",
  "Grande cuisine européenne",
  "Menus sur mesure",
];

export function CulinaryJourneySection() {
  // La vidéo (1 Mo) n'est téléchargée que lorsque la section approche de l'écran.
  const videoBoxRef = useRef<HTMLDivElement>(null);
  const [showVideo, setShowVideo] = useState(false);

  useEffect(() => {
    const box = videoBoxRef.current;
    if (!box || !("IntersectionObserver" in window)) {
      setShowVideo(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setShowVideo(true);
          observer.disconnect();
        }
      },
      { rootMargin: "300px" },
    );
    observer.observe(box);
    return () => observer.disconnect();
  }, []);

  return (
    <section className="relative overflow-hidden bg-sidebar text-sidebar-foreground">
      {/* motif ondulé ton sur ton */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.06]"
        style={{ backgroundImage: `url(${motifOndule})`, backgroundSize: "900px" }}
      />
      <div className="relative mx-auto grid max-w-6xl items-center gap-10 px-4 py-16 md:grid-cols-[minmax(0,6fr)_minmax(0,6fr)]">
        <div className="order-first md:order-none">
          <p className="text-sm font-bold uppercase tracking-widest text-accent">Nos clients</p>
          <h2 className="mt-3 font-display text-3xl font-bold leading-tight sm:text-4xl">
            Un voyage culinaire,
            <span className="block italic text-accent">à chaque commande.</span>
          </h2>
          <p className="mt-5 max-w-xl text-sm leading-7 text-sidebar-foreground/80 sm:text-base">
            Familles, entreprises et événements : nos clients nous confient des plats divers et
            variés — du thiéboudienne et du poulet yassa aux saveurs asiatiques, en passant par les
            grandes classiques de la cuisine européenne. Chaque menu est pensé comme un voyage,
            adapté à vos envies et à l'occasion.
          </p>
          <p className="mt-4 max-w-xl text-sm leading-7 text-sidebar-foreground/80 sm:text-base">
            Dites-nous ce qui vous fait envie : nous composons la table, les jus frais et les
            quantités, et nous livrons tout prêt à déguster.
          </p>
          <div className="mt-7 flex flex-wrap gap-2">
            {CUISINES.map((item) => (
              <span
                key={item}
                className="rounded-full border border-accent/40 bg-accent/10 px-4 py-1.5 text-xs font-semibold text-accent"
              >
                {item}
              </span>
            ))}
          </div>
        </div>
        <div ref={videoBoxRef} className="relative mx-auto w-full max-w-md">
          <div className="absolute -inset-3 rounded-3xl border border-accent/30" />
          {/* crevette dessinée posée sur le bord droit de la vidéo */}
          <img
            src={decoCrevette}
            alt=""
            aria-hidden="true"
            loading="lazy"
            className="deco-float pointer-events-none absolute -right-14 bottom-16 z-10 w-36 select-none drop-shadow-[0_14px_22px_rgba(0,0,0,0.45)] sm:-right-20 sm:w-48"
            style={{ "--deco-rotate": "-14deg" } as CSSProperties}
          />
          {showVideo ? (
            <video
              poster={cuisinePoster}
              autoPlay
              muted
              loop
              playsInline
              preload="metadata"
              aria-label="La cheffe Ndellis Signé en pleine préparation en cuisine"
              className="relative aspect-[9/16] w-full rounded-2xl object-cover shadow-warm"
            >
              <source src={cuisineVideoWebm} type="video/webm" />
              <source src={cuisineVideo} type="video/mp4" />
            </video>
          ) : (
            <img
              src={cuisinePoster}
              alt="La cheffe Ndellis Signé en pleine préparation en cuisine"
              className="relative aspect-[9/16] w-full rounded-2xl object-cover shadow-warm"
            />
          )}
        </div>
      </div>
    </section>
  );
}
