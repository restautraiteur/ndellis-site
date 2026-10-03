import { Building2 } from "lucide-react";
import { SectionPill } from "@/components/section-pill";
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
      className="scroll-mt-24 border-b border-border/70 bg-background py-16 sm:py-20"
    >
      <div className="mx-auto max-w-6xl px-4 pb-10 text-center">
        <SectionPill>Ils nous font confiance</SectionPill>
        <h2 className="mt-3 font-display text-3xl font-bold leading-tight sm:text-4xl">
          Les entreprises qui nous ont
          <span className="block italic text-accent">fait confiance.</span>
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-muted-foreground sm:text-base">
          Déjeuners d'équipe, séminaires, réceptions et cocktails : des entreprises de Dakar
          comptent sur Ndelli's Traiteur pour régaler leurs collaborateurs et leurs invités.
        </p>
      </div>
      <div className="flex flex-col gap-4">
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
    <div className="flex h-20 w-48 shrink-0 items-center gap-4 rounded-2xl border border-border/60 bg-card px-6 shadow-card grayscale transition-all duration-300 hover:grayscale-0 hover:shadow-warm">
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
