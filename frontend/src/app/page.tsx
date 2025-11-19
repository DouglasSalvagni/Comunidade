import NavbarInspira from "@/components/inspira/NavbarInspira";
import HeroInspira from "@/components/inspira/HeroInspira";
import FeaturesInspira from "@/components/inspira/FeaturesInspira";
import AudioPreviewInspira from "@/components/inspira/AudioPreviewInspira";
import PricingInspira from "@/components/inspira/PricingInspira";
import FooterInspira from "@/components/inspira/FooterInspira";

export default function Home() {
  return (
    <div className={`${quicksand.className} min-h-screen bg-brand-dark text-white selection:bg-brand-teal selection:text-brand-dark`}>
      <NavbarInspira />
      <main>
        <HeroInspira />
        <FeaturesInspira />
        <AudioPreviewInspira />
        <PricingInspira />
      </main>
      <FooterInspira />
    </div>
  );
}
import { Quicksand } from "next/font/google";

const quicksand = Quicksand({ subsets: ["latin"], weight: ["400", "500", "600", "700"] });
