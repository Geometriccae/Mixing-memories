import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import ContactSection from "@/components/home/ContactSection";

const Contact = () => (
  <>
    <Navbar />
    <main className="min-h-screen">
      <ContactSection />
    </main>
    <Footer />
  </>
);

export default Contact;
