import { Heart, Cake, Briefcase, PartyPopper, MessageCircle, type LucideIcon } from "lucide-react";
import traiteurBuffet from "@/assets/traiteur-buffet.jpg";
import { Button } from "@ui/components/ui/button";
import { CLIENT, WHATSAPP_URL } from "@/config/client";

const EVENT_TYPES: { icon: LucideIcon; label: string }[] = [
  { icon: Heart, label: "Mariages" },
  { icon: Cake, label: "Baptêmes" },
  { icon: PartyPopper, label: "Anniversaires" },
  { icon: Briefcase, label: "Entreprises & travail" },
];

export function CateringEventsSection() {
  return (
    <section id="traiteur" className="scroll-mt-24 text-sidebar-foreground">
      <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 pb-20 pt-16 sm:pb-24 md:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
        <div>
          <p className="text-sm font-bold uppercase tracking-widest text-accent">
            Service traiteur sur devis
          </p>
          <h2 className="mt-3 max-w-2xl font-display text-3xl font-bold leading-tight sm:text-4xl">
            Vos grandes occasions,
            <span className="block italic text-accent">notre savoir-faire.</span>
          </h2>
          <p className="mt-5 max-w-xl text-sm leading-7 text-sidebar-foreground/90 sm:text-base">
            Mariages, baptêmes, anniversaires, événements d'entreprise : nous composons des buffets
            et des tables sur mesure, adaptés à votre nombre d'invités et à vos envies. Chaque
            prestation est étudiée sur devis, avec les mêmes plats généreux et élégants que nos
            menus du quotidien.
          </p>
          <div className="mt-7 flex flex-wrap gap-2">
            {EVENT_TYPES.map((item) => (
              <span
                key={item.label}
                className="flex items-center gap-2 rounded-full border border-accent/40 bg-sidebar/40 px-4 py-1.5 text-xs font-semibold text-accent backdrop-blur-sm"
              >
                <item.icon className="size-3.5" aria-hidden="true" />
                {item.label}
              </span>
            ))}
          </div>
          <div className="mt-9 flex flex-wrap items-center gap-4">
            <Button asChild size="lg" className="rounded-full">
              <a
                href={WHATSAPP_URL}
                target="_blank"
                rel="noreferrer"
                aria-label="Demander un devis sur WhatsApp"
              >
                <MessageCircle className="mr-2 size-5" />
                Demander un devis sur WhatsApp
              </a>
            </Button>
            <p className="text-sm font-semibold text-sidebar-foreground/90">
              WhatsApp : <span className="text-accent">{CLIENT.whatsappDisplay}</span>
            </p>
          </div>
        </div>
        <div className="relative mx-auto w-full max-w-sm">
          <div className="absolute -inset-3 rounded-3xl border border-accent/30" />
          <img
            src={traiteurBuffet}
            alt="Buffet traiteur : poulet grillé, patates douces rôties, brocolis et légumes frais"
            width={736}
            height={1313}
            loading="lazy"
            className="relative aspect-[3/4] w-full rounded-2xl object-cover shadow-warm"
          />
        </div>
      </div>
    </section>
  );
}
