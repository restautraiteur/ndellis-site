import type { ReactNode } from "react";

import fondAliments from "@/assets/fond-aliments.jpg";

/** Bloc unique « Notre cheffe » + toque + « Service traiteur », sur un seul fond « table et aliments ». */
export function FoodBackdrop({ children }: { children: ReactNode }) {
  return (
    <div className="relative overflow-hidden">
      <img
        src={fondAliments}
        alt=""
        aria-hidden="true"
        loading="lazy"
        className="pointer-events-none absolute inset-0 size-full select-none object-cover"
      />
      {/* voile marron identique pour les deux parties (cheffe et traiteur) : les aliments restent visibles en transparence */}
      <div aria-hidden="true" className="absolute inset-0 bg-sidebar/65" />
      <div className="relative">{children}</div>
    </div>
  );
}
