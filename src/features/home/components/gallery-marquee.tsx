import platSenegalais1 from "@/assets/plat-senegalais-1.jpg";
import platSenegalais2 from "@/assets/plat-senegalais-2.jpg";
import platSenegalais3 from "@/assets/plat-senegalais-3.jpg";
import platSenegalais4 from "@/assets/plat-senegalais-4.jpg";
import platSenegalais5 from "@/assets/plat-senegalais-5.jpg";
import platSenegalais6 from "@/assets/plat-senegalais-6.jpg";
import platSenegalais7 from "@/assets/plat-senegalais-7.jpg";
import platSenegalais8 from "@/assets/plat-senegalais-8.jpg";
import platRow2_1 from "@/assets/plat-row2-1.jpg";
import platRow2_2 from "@/assets/plat-row2-2.jpg";
import platRow2_3 from "@/assets/plat-row2-3.jpg";
import platRow2_4 from "@/assets/plat-row2-4.jpg";
import platRow2_5 from "@/assets/plat-row2-5.jpg";
import platRow2_6 from "@/assets/plat-row2-6.jpg";
import platRow2_7 from "@/assets/plat-row2-7.jpg";
import platRow2_8 from "@/assets/plat-row2-8.jpg";
import platRow2_9 from "@/assets/plat-row2-9.jpg";
import platRow2_10 from "@/assets/plat-row2-10.jpg";
import { MarqueeRow } from "@/components/marquee-row";

const SENEGAL_PLATS = [
  { src: platSenegalais1, alt: "Barquettes de poulet braisé et couscous" },
  { src: platSenegalais2, alt: "Barquettes de poisson braisé et riz" },
  { src: platSenegalais3, alt: "Barquettes de riz au safran et sauce" },
  { src: platSenegalais4, alt: "Barquettes de poulet braisé et riz au safran" },
  { src: platSenegalais5, alt: "Barquettes de poulet braisé, riz et légumes" },
  { src: platSenegalais6, alt: "Barquettes de riz au safran et viande" },
  { src: platSenegalais7, alt: "Barquettes de poulet, crevettes et couscous" },
  { src: platSenegalais8, alt: "Barquettes de riz au poisson séché" },
];

const ROW2_PLATS: { src: string; alt: string }[] = [
  { src: platRow2_1, alt: "Salades de poulet grillé, avocat et légumes frais" },
  { src: platRow2_2, alt: "Salades de poulet croustillant et crudités" },
  { src: platRow2_3, alt: "Salades de crevettes, mangue et avocat" },
  { src: platRow2_4, alt: "Salades de poulet grillé, pain frais et sauce maison" },
  { src: platRow2_5, alt: "Poulet grillé, guacamole, riz et haricots rouges" },
  { src: platRow2_6, alt: "Salades de filets croustillants et légumes" },
  { src: platRow2_7, alt: "Salades de crudités, maïs, haricots verts et avocat" },
  { src: platRow2_8, alt: "Salades de crevettes, mangue et citron vert" },
  { src: platRow2_9, alt: "Salades de thon, œuf, olives et avocat" },
  { src: platRow2_10, alt: "Vermicelles de crevettes sautées, saveurs asiatiques" },
];

export function GalleryMarquee() {
  return (
    <section className="border-y border-border/70 bg-secondary/40 py-14">
      <div className="mx-auto max-w-6xl px-4 pb-10">
        <p className="text-center text-sm font-bold uppercase tracking-widest text-accent">
          Notre cuisine
        </p>
        <h2 className="mt-2 text-center font-display text-3xl font-bold leading-tight sm:text-4xl">
          Un aperçu de nos plats,
          <span className="block italic text-accent">prêts à déguster.</span>
        </h2>
      </div>
      <div className="flex flex-col gap-4">
        <MarqueeRow duration="60s">
          {SENEGAL_PLATS.map((p) => (
            <img
              key={p.src}
              src={p.src}
              alt={p.alt}
              loading="lazy"
              className="h-78 w-66 shrink-0 rounded-2xl object-cover shadow-warm transition-transform duration-300 hover:scale-[1.03] sm:h-90 sm:w-78"
            />
          ))}
        </MarqueeRow>
        <MarqueeRow duration="55s" reverse>
          {ROW2_PLATS.map((p) => (
            <img
              key={p.src}
              src={p.src}
              alt={p.alt}
              loading="lazy"
              className="h-78 w-66 shrink-0 rounded-2xl object-cover shadow-warm transition-transform duration-300 hover:scale-[1.03] sm:h-90 sm:w-78"
            />
          ))}
        </MarqueeRow>
      </div>
    </section>
  );
}
