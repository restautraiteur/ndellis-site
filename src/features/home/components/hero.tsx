import heroImage from "@/assets/plats-traiteur-header.webp";

export function Hero() {
  return (
    <section className="relative overflow-hidden border-b border-border/70">
      <img
        src={heroImage}
        alt="Plats sénégalais et jus frais préparés par le traiteur"
        width={1600}
        height={912}
        className="h-[400px] w-full object-cover sm:h-[520px] lg:h-[600px]"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-sidebar/95 via-sidebar/65 to-sidebar/10" />
      <div className="absolute inset-0 flex items-center pt-24 sm:pt-32">
        <div className="mx-auto w-full max-w-6xl px-4">
          <div className="max-w-2xl text-sidebar-foreground">
            <p className="text-sm font-bold uppercase tracking-widest text-accent">
              Votre table, notre passion
            </p>
            <h1 className="mt-3 font-display text-4xl font-bold leading-tight sm:text-6xl">
              Le goût de la maison,
              <span className="block italic text-accent">préparé chaque jour.</span>
            </h1>
            <p className="mt-5 max-w-lg text-sm leading-6 text-sidebar-foreground/85 sm:text-base">
              Découvrez le menu de la semaine et réservez vos plats et jus frais avant l'heure
              limite.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
