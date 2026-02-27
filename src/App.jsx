import Header from "./components/Header.jsx";
import HomeSection from "./components/HomeSection.jsx";
import ServicesSection from "./components/ServicesSection.jsx";
import ChoiceSection from "./components/ChoiceSection.jsx";
import ContactSection from "./components/ContactSection.jsx";
import FaqSection from "./components/FaqSection.jsx";
import Footer from "./components/Footer.jsx";

function App() {
  return (
    <div className="app-root">
      <Header />
      <main className="app-main">
        <HomeSection />
        <ServicesSection />
        <ChoiceSection />
        <ContactSection />
        <FaqSection />
      </main>
      <Footer />
    </div>
  );
}

export default App;

