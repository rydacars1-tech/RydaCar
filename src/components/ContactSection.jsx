const EMAIL = "contact@ryda.example";
const WHATSAPP_NUMBER = "923001234567";

function ContactSection() {
  const whatsappLink = `https://wa.me/${WHATSAPP_NUMBER}`;
  const mailLink = `mailto:${EMAIL}`;

  return (
    <section id="contact" className="section">
      <div className="section-inner contact-inner">
        <div className="section-header">
          <h2 className="section-title">Contact us</h2>
          <p className="section-subtitle">
            Reach out to Ryda on email or WhatsApp for bookings and any questions.
          </p>
        </div>

        <div className="contact-cards">
          <div className="contact-card">
            <h3 className="contact-title">Email</h3>
            <p className="contact-text">Send us your trip details or questions.</p>
            <a href={mailLink} className="contact-button">
              {EMAIL}
            </a>
          </div>

          <div className="contact-card">
            <h3 className="contact-title">WhatsApp</h3>
            <p className="contact-text">Chat with us directly for fast booking confirmation.</p>
            <a
              href={whatsappLink}
              target="_blank"
              rel="noreferrer"
              className="contact-button contact-button-primary"
            >
              Chat on WhatsApp
            </a>
            <div className="contact-small">Number: {WHATSAPP_NUMBER}</div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default ContactSection;

