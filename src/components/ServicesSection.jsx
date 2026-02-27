const services = [
  {
    title: "The Big Days",
    description: "Races, hen/stag dos, and big nights out."
  },
  {
    title: "The Daily Grind",
    description: "Dependable school runs and quick shopping trips."
  },
  {
    title: "The Getaways",
    description: "Nationwide airport transfers to start your holiday right."
  },
  {
    title: "Flexible Fleet",
    description: "High-capacity vehicles for up to 8 passengers."
  }
];

function ServicesSection() {
  return (
    <section id="services" className="section section-alt">
      <div className="section-inner">
        <div className="section-header">
          <h2 className="section-title">Our Services</h2>
          <p className="section-subtitle">
            Ryda provides reliable car services for all your travel needs.
          </p>
        </div>
        <div className="services-grid">
          {services.map((service) => (
            <article key={service.title} className="service-card">
              <h3 className="service-title">{service.title}</h3>
              <p className="service-text">{service.description}</p>
            </article>
          ))}
        </div>
        <div className="services-cta">
          <h3 className="services-cta-title">Book your ride with Ryda</h3>
          <p className="services-cta-text">
            Ready to travel? Share your trip details and request your booking now.
          </p>
          <button
            type="button"
            className="services-cta-button"
            onClick={() => {
              const el = document.getElementById("home");
              if (el) {
                el.scrollIntoView({ behavior: "smooth", block: "start" });
              }
            }}
          >
            Go to booking form
          </button>
        </div>
      </div>
    </section>
  );
}

export default ServicesSection;
