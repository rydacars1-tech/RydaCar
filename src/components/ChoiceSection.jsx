import React from "react";

function ChoiceSection() {
  const features = [
    {
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="32"
          height="32"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M5 18H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h3.19M15 6h2a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-3.19"></path>
          <line x1="23" y1="13" x2="23" y2="11"></line>
          <polyline points="11 6 7 12 13 12 9 18"></polyline>
        </svg>
      ),
      title: "Local & Long Distance",
      description: "Metered jobs (incl. tolls)",
    },
    {
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="32"
          height="32"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="2" y="5" width="20" height="14" rx="2"></rect>
          <line x1="2" y1="10" x2="22" y2="10"></line>
        </svg>
      ),
      title: "Fixed (up-front) fares",
      description: "Know the price before you ride.",
    },
    {
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="32"
          height="32"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <line x1="12" y1="1" x2="12" y2="23"></line>
          <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
        </svg>
      ),
      title: "Transparent pricing",
      description: "No hidden fees or surprises.",
    },
    {
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="32"
          height="32"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
          <line x1="16" y1="2" x2="16" y2="6"></line>
          <line x1="8" y1="2" x2="8" y2="6"></line>
          <line x1="3" y1="10" x2="21" y2="10"></line>
          <path d="M12 14h.01"></path>
          <path d="M16 14h.01"></path>
          <path d="M8 14h.01"></path>
          <path d="M12 18h.01"></path>
          <path d="M16 18h.01"></path>
          <path d="M8 18h.01"></path>
        </svg>
      ),
      title: "On demand or scheduled",
      description: "Book now or plan ahead.",
    },
  ];

  return (
    <section className="section section-choice">
      <div className="section-inner">
        <div className="choice-header">
          <h2 className="section-title">It's your choice</h2>
          <p className="section-subtitle">
            Everyone's travel needs are different. Choose from our range of
            products and services.
          </p>
        </div>
        <div className="choice-grid">
          {features.map((feature, index) => (
            <div key={index} className="choice-item">
              <div className="choice-icon">{feature.icon}</div>
              <div className="choice-content">
                <h3 className="choice-title">{feature.title}</h3>
                <p className="choice-desc">{feature.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default ChoiceSection;
