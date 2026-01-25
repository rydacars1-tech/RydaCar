import Header from "./components/Header.jsx";
import HomeSection from "./components/HomeSection.jsx";
import ServicesSection from "./components/ServicesSection.jsx";
import ContactSection from "./components/ContactSection.jsx";
import Footer from "./components/Footer.jsx";

function App() {
  return (
    <div className="app-root">
      <Header />
      <main className="app-main">
        <HomeSection />
        <ServicesSection />
        <ContactSection />
      </main>
      <Footer />
    </div>
  );
}

export default App;

