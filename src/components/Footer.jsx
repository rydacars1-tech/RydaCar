const EMAIL = "contact@ryda.example";
const WHATSAPP_NUMBER = "923001234567";

function Footer() {
  const year = new Date().getFullYear();
  const whatsappLink = `https://wa.me/${WHATSAPP_NUMBER}`;
  const mailLink = `mailto:${EMAIL}`;

  return (
    <footer className="footer">
      <div className="footer-inner">
        <div className="footer-brand">Ryda</div>
        <div className="footer-contact">
          <a href={mailLink} className="footer-link">
            {EMAIL}
          </a>
          <a href={whatsappLink} target="_blank" rel="noreferrer" className="footer-link">
            WhatsApp: {WHATSAPP_NUMBER}
          </a>
        </div>
        <div className="footer-meta">
          <span>© {year} Ryda. All rights reserved.</span>
          <span>By contacting us you agree to our Terms & Services.</span>
        </div>
      </div>
    </footer>
  );
}

export default Footer;

