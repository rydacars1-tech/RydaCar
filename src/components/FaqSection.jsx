import { useState } from "react";

const FAQS = [
  {
    question: "How do I make a booking?",
    answer:
      "You can easily book a ride by filling out the form on our home page, or by sending us a message directly on WhatsApp. We'll confirm your booking details promptly."
  },
  {
    question: "What areas do you cover?",
    answer:
      "We cover all local neighborhoods and provide long-distance travel services to major airports, train stations, and other cities across the region."
  },
  {
    question: "Can I pay by card?",
    answer:
      "Yes, all our drivers accept cash as well as major credit and debit cards. Contactless payment is also available for your convenience."
  },
  {
    question: "Do you provide airport transfers?",
    answer:
      "Absolutely! We specialize in reliable airport transfers to ensure you never miss a flight. We recommend pre-booking your airport ride for peace of mind."
  },
  {
    question: "Is there a cancellation fee?",
    answer:
      "We understand plans can change. If you need to cancel, please let us know at least 2 hours before your scheduled pickup time to avoid any cancellation charges."
  },
  {
    question: "Can I request a specific vehicle?",
    answer:
      "Yes, during the booking process you can select from our available fleet options including Saloon, Estate, and MPV (6 or 8 seaters) to suit your passenger and luggage needs."
  }
];

function FaqSection() {
  const [openIndex, setOpenIndex] = useState(null);

  const toggleFaq = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section id="faq" className="section section-alt">
      <div className="section-inner">
        <div className="section-header">
          <h2 className="section-title">Frequently Asked Questions</h2>
          <p className="section-subtitle">
            Find answers to common questions about our services and booking process.
          </p>
        </div>

        <div className="faq-list">
          {FAQS.map((faq, index) => (
            <div
              key={index}
              className={`faq-item ${openIndex === index ? "open" : ""}`}
              onClick={() => toggleFaq(index)}
            >
              <div className="faq-question">
                {faq.question}
                <span className="faq-toggle">{openIndex === index ? "−" : "+"}</span>
              </div>
              <div
                className="faq-answer"
                style={{
                  maxHeight: openIndex === index ? "200px" : "0",
                  opacity: openIndex === index ? 1 : 0
                }}
              >
                <div className="faq-answer-inner">{faq.answer}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default FaqSection;
