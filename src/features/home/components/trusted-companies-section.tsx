import { Building2 } from "lucide-react";
import { MarqueeRow } from "@/components/marquee-row";

import logoBanqueMondiale from "@/assets/partenaires/banque-mondiale.webp";
import logoFree from "@/assets/partenaires/free.webp";
import logoOxium from "@/assets/partenaires/oxium-senegal.webp";
import logoUnicn from "@/assets/partenaires/unicn-africa.webp";
import logoYas from "@/assets/partenaires/yas.webp";

// Pour ajouter un partenaire : déposer son logo dans "src/assets/partenaires" puis l'ajouter ici.
const TRUSTED_COMPANIES: { name: string; sector: string; logo?: string }[] = [
  { name: "Free", sector: "Télécommunications", logo: logoFree },
  { name: "Oxium Sénégal", sector: "Services numériques", logo: logoOxium },
  { name: "Yas", sector: "Télécommunications", logo: logoYas },
  { name: "Banque Mondiale", sector: "Institution internationale", logo: logoBanqueMondiale },
  { name: "Unicn Africa", sector: "Entreprise", logo: logoUnicn },
];

type Company = (typeof TRUSTED_COMPANIES)[number];

// Seconde rangée décalée (elle commence au 3e partenaire) pour ne pas aligner les mêmes logos.
const SHIFTED = [...TRUSTED_COMPANIES.slice(2), ...TRUSTED_COMPANIES.slice(0, 2)];
// Listes répétées pour que chaque bandeau défilant remplisse toute la largeur, même sur grand écran.
const ROW_TOP = [...TRUSTED_COMPANIES, ...TRUSTED_COMPANIES, ...TRUSTED_COMPANIES];
const ROW_BOTTOM = [...SHIFTED, ...SHIFTED, ...SHIFTED];

export function TrustedCompaniesSection() {
  return (
    <section
      id="entreprises"
      className="relative scroll-mt-24 overflow-hidden bg-wine py-16 text-wine-foreground sm:py-20"
    >
      {/* halo doux pour donner du relief au bordeaux */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-32 left-1/2 size-[36rem] -translate-x-1/2 rounded-full bg-white/10 blur-3xl"
      />
      <div className="relative mx-auto max-w-6xl px-4 pb-10 text-center">
        <span className="inline-flex rounded-full border border-wine-foreground/30 bg-wine-foreground/10 px-4 py-1.5 text-xs font-semibold text-wine-foreground backdrop-blur">
          Ils nous font confiance
        </span>
        <h2 className="mt-3 font-display text-3xl font-bold leading-tight sm:text-4xl">
          Les entreprises qui nous ont
          <span className="block italic text-[#f3b8a0]">fait confiance.</span>
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-wine-foreground/80 sm:text-base">
          Déjeuners d'équipe, séminaires, réceptions et cocktails : des entreprises de Dakar
          comptent sur Ndelli's Traiteur pour régaler leurs collaborateurs et leurs invités.
        </p>
      </div>
      <div className="relative flex flex-col gap-4">
        <MarqueeRow duration="45s">
          {ROW_TOP.map((company, index) => (
            <CompanyCard key={`top-${company.name}-${index}`} company={company} />
          ))}
        </MarqueeRow>
        <MarqueeRow duration="50s" reverse>
          {ROW_BOTTOM.map((company, index) => (
            <CompanyCard key={`bottom-${company.name}-${index}`} company={company} />
          ))}
        </MarqueeRow>
      </div>
    </section>
  );
}

function CompanyCard({ company }: { company: Company }) {
  return (
    <div className="flex h-20 w-48 shrink-0 items-center gap-4 rounded-2xl border border-white/20 bg-card px-6 shadow-[0_18px_40px_-20px_rgba(0,0,0,0.5)] grayscale transition-all duration-300 hover:grayscale-0">
      {company.logo ? (
        <img
          src={company.logo}
          alt={company.name}
          loading="lazy"
          className="max-h-12 w-full object-contain"
        />
      ) : (
        <>
          <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-accent/15 text-accent">
            <Building2 className="size-6" aria-hidden="true" />
          </span>
          <span className="min-w-0 text-left">
            <span className="block truncate font-display text-lg font-bold text-foreground">
              {company.name}
            </span>
            <span className="block truncate text-xs text-muted-foreground">{company.sector}</span>
          </span>
        </>
      )}
    </div>
  );
}
