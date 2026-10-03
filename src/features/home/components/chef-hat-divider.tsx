import decoToque from "@/assets/deco-toque.webp";

/** Séparateur entre « Notre cheffe » et « Service traiteur » : toque au centre, filets dorés de part et d'autre. */
export function ChefHatDivider() {
  return (
    <div aria-hidden="true" className="relative">
      <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 sm:gap-6">
        <DividerLine side="left" />
        <img
          src={decoToque}
          alt=""
          width={500}
          height={421}
          loading="lazy"
          className="deco-float w-20 shrink-0 select-none drop-shadow-[0_10px_18px_rgba(0,0,0,0.45)] sm:w-28"
        />
        <DividerLine side="right" />
      </div>
    </div>
  );
}

function DividerLine({ side }: { side: "left" | "right" }) {
  const toHat = side === "left";
  return (
    <div className={`flex flex-1 items-center gap-2 ${toHat ? "" : "flex-row-reverse"}`}>
      <span
        className={`h-px flex-1 ${
          toHat
            ? "bg-gradient-to-r from-transparent via-accent/40 to-accent"
            : "bg-gradient-to-l from-transparent via-accent/40 to-accent"
        }`}
      />
      <span className="size-1.5 rotate-45 bg-accent" />
      <span className="h-px w-6 bg-accent sm:w-10" />
    </div>
  );
}
