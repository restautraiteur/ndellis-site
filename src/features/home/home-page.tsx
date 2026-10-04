import { SiteFooter, SiteHeader } from "@/components/site-header";
// Bannière classique : remplacer <HeroShowcase /> par <Hero /> pour y revenir.
// import { Hero } from "@/features/home/components/hero";
import { HeroShowcase } from "@/features/home/components/hero-showcase";
import { WeeklyMenu } from "@/features/menu/components/weekly-menu";
import { JuiceSection } from "@/features/juices/components/juice-section";
import { SubscriptionCta } from "@/features/subscriptions/subscription-cta";
import { TestimonialsSection } from "@/features/home/components/testimonials-section";
import { GalleryMarquee } from "@/features/home/components/gallery-marquee";
import { CulinaryJourneySection } from "@/features/home/components/culinary-journey-section";
import { BestSellerSection } from "@/features/home/components/best-seller-section";
import { ChefSection } from "@/features/home/components/chef-section";
import { CateringEventsSection } from "@/features/home/components/catering-section";
import { ChefHatDivider } from "@/features/home/components/chef-hat-divider";
import { FoodBackdrop } from "@/features/home/components/food-backdrop";
import { TrustedCompaniesSection } from "@/features/home/components/trusted-companies-section";
import { CartBar } from "@/features/cart/components/cart-bar";
import menuPattern from "@/assets/doodles-aliments.webp";

export function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader overlay />

      <HeroShowcase />

      {/* Motif du menu commun au menu et au bandeau abonnement : le bandeau fait partie du menu et
          déborde sur les jus (sa marge négative arrête le motif pile au début des jus). */}
      <div className="abo-zone relative">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-repeat opacity-[0.12] mix-blend-multiply"
          style={{ backgroundImage: `url(${menuPattern})`, backgroundSize: "520px" }}
        />
        <WeeklyMenu />
        <SubscriptionCta />
      </div>

      <JuiceSection />

      <GalleryMarquee />

      <CulinaryJourneySection />

      <BestSellerSection />

      <FoodBackdrop>
        <ChefSection />
        <ChefHatDivider />
        <CateringEventsSection />
      </FoodBackdrop>

      <TrustedCompaniesSection />

      <TestimonialsSection />

      <CartBar />
      <SiteFooter />
    </div>
  );
}
