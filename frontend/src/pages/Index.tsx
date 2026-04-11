import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import HeroSection from "@/components/home/HeroSection";
import FeaturedProducts from "@/components/home/FeaturedProducts";
import AboutSection from "@/components/home/AboutSection";
import TestimonialsSection from "@/components/home/TestimonialsSection";
import ContactSection from "@/components/home/ContactSection";

const Index = () => (
  <>
    <Navbar />
    <main>
      <HeroSection />
      <FeaturedProducts />
      <AboutSection />
      <TestimonialsSection />
      <ContactSection />
    </main>
    <Footer />
  </>
);

export default Index;
