import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import ContentCategories from "@/components/ContentCategories";
import Benefits from "@/components/Benefits";
import Pricing from "@/components/Pricing";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <Hero />
      <ContentCategories />
      <Benefits />
      <Pricing />
      <Footer />
    </div>
  );
}
