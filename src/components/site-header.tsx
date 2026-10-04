import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { Clock, MapPin, Menu, MessageCircle, ShoppingBag } from "lucide-react";
import logo from "@core/assets/logo.png";
import ustensiles from "@/assets/ustensiles-cuisine.webp";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@ui/components/ui/sheet";
import { useCart } from "@/features/cart/cart-context";
import { cn } from "@core/lib/utils";
import { CLIENT, WHATSAPP_URL } from "@/config/client";

const NAV_LINK =
  "rounded-full px-4 py-2 text-sm font-medium text-sidebar-foreground/75 transition-colors hover:text-accent";

/** `overlay` : la barre est posée en haut, à l'intérieur du visuel d'en-tête (accueil). */
/** Liens vers les sections de la page d'accueil (ancres `id` sur chaque section). */
const HOME_SECTIONS = [
  { hash: "menu", label: "Menu" },
  { hash: "jus", label: "Jus" },
  { hash: "traiteur", label: "Traiteur" },
  { hash: "entreprises", label: "Entreprises" },
  { hash: "temoignages", label: "Témoignages" },
];

const FOOTER_TITLE = "font-display text-lg font-bold text-sidebar-foreground";
const FOOTER_LINK = "text-sidebar-foreground/75 transition-colors hover:text-accent";

export function SiteHeader({ overlay = false }: { overlay?: boolean }) {
  const { count } = useCart();
  return (
    <header
      className={cn(
        "sticky top-0 z-40 px-3 pt-3 sm:px-4",
        overlay && "fixed inset-x-0 top-6 h-0 px-4 pt-0 sm:top-10 sm:px-8 sm:pt-0",
      )}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 rounded-full border-[3px] border-[oklch(0.7_0.08_60)] bg-sidebar p-2.5 text-sidebar-foreground shadow-warm">
        <Link to="/" className="flex min-w-0 items-center gap-2.5">
          <img
            src={logo}
            alt={CLIENT.legalName}
            width={256}
            height={256}
            className="size-11 shrink-0 rounded-full bg-white object-cover ring-2 ring-accent/60 sm:size-12"
          />
          <span className="font-display text-xl font-bold tracking-tight text-sidebar-foreground sm:text-2xl">
            Traiteur<span className="text-accent">.</span>
          </span>
        </Link>
        <nav className="flex shrink-0 items-center gap-1">
          {HOME_SECTIONS.map((section) => (
            <Link
              key={section.hash}
              to="/"
              hash={section.hash}
              hashScrollIntoView={{ behavior: "smooth" }}
              className={cn(NAV_LINK, "hidden px-3 lg:inline-flex xl:px-4")}
            >
              {section.label}
            </Link>
          ))}
          <Link
            to="/abonnement"
            className={cn(NAV_LINK, "hidden px-3 lg:inline-flex xl:px-4")}
            activeProps={{ className: "text-accent" }}
          >
            Abonnement
          </Link>
          <Link
            to="/commande"
            aria-label={count > 0 ? `Panier (${count} article${count > 1 ? "s" : ""})` : "Panier"}
            className="flex items-center gap-2 rounded-full bg-accent px-4 py-2.5 text-sm font-semibold text-accent-foreground transition-opacity hover:opacity-90 lg:ml-2 lg:px-5"
          >
            <ShoppingBag className="size-4" />
            <span className="hidden sm:inline">Panier</span>
            {count > 0 && (
              <span
                key={count}
                className="animate-badge-bump rounded-full bg-accent-foreground/20 px-2 text-xs font-bold"
              >
                {count}
              </span>
            )}
          </Link>
          <MobileMenu />
        </nav>
      </div>
    </header>
  );
}

function MobileMenu() {
  const [open, setOpen] = useState(false);
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button
          type="button"
          aria-label="Ouvrir le menu"
          className="ml-1 flex size-10 items-center justify-center rounded-full border border-sidebar-foreground/25 text-sidebar-foreground transition-colors hover:text-accent lg:hidden"
        >
          <Menu className="size-5" />
        </button>
      </SheetTrigger>
      <SheetContent
        side="right"
        className="w-72 border-sidebar-border bg-sidebar text-sidebar-foreground [&>button]:text-sidebar-foreground"
      >
        <SheetTitle className="font-display text-2xl font-bold text-sidebar-foreground">
          Traiteur<span className="text-accent">.</span>
        </SheetTitle>
        <nav className="mt-8 flex flex-col gap-1">
          {HOME_SECTIONS.map((section) => (
            <Link
              key={section.hash}
              to="/"
              hash={section.hash}
              hashScrollIntoView={{ behavior: "smooth" }}
              onClick={() => setOpen(false)}
              className={cn(NAV_LINK, "px-3 py-3 text-base")}
            >
              {section.label}
            </Link>
          ))}
          <Link
            to="/abonnement"
            onClick={() => setOpen(false)}
            className={cn(NAV_LINK, "px-3 py-3 text-base")}
            activeProps={{ className: "text-accent" }}
          >
            Abonnement
          </Link>
          <Link
            to="/commande"
            onClick={() => setOpen(false)}
            className={cn(NAV_LINK, "px-3 py-3 text-base")}
            activeProps={{ className: "text-accent" }}
          >
            Panier
          </Link>
        </nav>
      </SheetContent>
    </Sheet>
  );
}

export function SiteFooter() {
  return (
    <footer className="relative mt-16 overflow-hidden bg-sidebar text-sidebar-foreground">
      <img
        src={ustensiles}
        alt=""
        aria-hidden="true"
        loading="lazy"
        className="pointer-events-none absolute -bottom-10 -right-16 w-[520px] max-w-none select-none opacity-[0.07] sm:w-[640px]"
      />
      <div className="relative mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div>
          <Link to="/" className="flex items-center gap-3">
            <img
              src={logo}
              alt={CLIENT.legalName}
              width={256}
              height={256}
              loading="lazy"
              className="size-14 rounded-full bg-white object-cover ring-2 ring-accent/60"
            />
            <span className="font-display text-2xl font-bold tracking-tight">
              Traiteur<span className="text-accent">.</span>
            </span>
          </Link>
          <p className="mt-4 max-w-xs text-sm leading-6 text-sidebar-foreground/75">
            Cuisine sénégalaise faite maison, jus frais et service traiteur pour vos événements à
            Dakar.
          </p>
        </div>

        <div>
          <h2 className={FOOTER_TITLE}>Navigation</h2>
          <ul className="mt-4 space-y-2.5 text-sm">
            {HOME_SECTIONS.map((section) => (
              <li key={section.hash}>
                <Link
                  to="/"
                  hash={section.hash}
                  hashScrollIntoView={{ behavior: "smooth" }}
                  className={FOOTER_LINK}
                >
                  {section.label}
                </Link>
              </li>
            ))}
            <li>
              <Link to="/abonnement" className={FOOTER_LINK}>
                Abonnement
              </Link>
            </li>
            <li>
              <Link to="/commande" className={FOOTER_LINK}>
                Panier
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h2 className={FOOTER_TITLE}>Contact</h2>
          <ul className="mt-4 space-y-3 text-sm text-sidebar-foreground/75">
            <li>
              <a
                href={WHATSAPP_URL}
                target="_blank"
                rel="noreferrer"
                className={cn(FOOTER_LINK, "flex items-center gap-2")}
              >
                <MessageCircle className="size-4 shrink-0 text-accent" aria-hidden="true" />
                WhatsApp : {CLIENT.whatsappDisplay}
              </a>
            </li>
            <li className="flex items-center gap-2">
              <MapPin className="size-4 shrink-0 text-accent" aria-hidden="true" />
              Livraison à {CLIENT.city}
            </li>
          </ul>
        </div>

        <div>
          <h2 className={FOOTER_TITLE}>Commandes</h2>
          <ul className="mt-4 space-y-3 text-sm text-sidebar-foreground/75">
            <li className="flex items-start gap-2">
              <Clock className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden="true" />
              Précommandes du lundi au vendredi
            </li>
            <li>Paiement sécurisé : Wave, Orange Money, Free Money ou carte.</li>
          </ul>
        </div>
      </div>

      <div className="relative border-t border-sidebar-foreground/10">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-5 text-xs text-sidebar-foreground/60 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} {CLIENT.legalName}. Tous droits réservés.
          </p>
          <p>
            Site réalisé par{" "}
            <a href="mailto:aishaseye074@gmail.com" className="hover:text-sidebar-foreground">
              aishaseye074@gmail.com
            </a>{" "}
            ·{" "}
            <a href="tel:+221704072668" className="hover:text-sidebar-foreground">
              70 407 26 68
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
