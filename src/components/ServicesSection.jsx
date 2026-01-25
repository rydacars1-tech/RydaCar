const services = [
  {
    title: "City rides",
    description: "Comfortable point to point rides inside the city for daily travel."
  },
  {
    title: "Airport transfers",
    description: "On time pickup and drop for departures and arrivals."
  },
  {
    title: "Outstation trips",
    description: "Long distance travel with professional drivers for full and multi day trips."
  },
  {
    title: "Hourly rental",
    description: "Car and driver on an hourly or daily basis for your schedule."
  },
  {
    title: "Corporate rides",
    description: "Business travel solutions for your team and guests."
  },
  {
    title: "Event and wedding cars",
    description: "Premium vehicles for events, weddings and special occasions."
  }
];

function ServicesSection() {
  return (
    <section id="services" className="section section-alt">
      <div className="section-inner">
        <div className="section-header">
          <h2 className="section-title">Our services</h2>
          <p className="section-subtitle">
            Ryda provides car services for your daily travel, airport drops and long journeys.
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
