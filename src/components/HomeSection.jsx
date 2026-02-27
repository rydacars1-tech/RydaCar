import { useState } from "react";
import car1 from "../assets/car1.jpg";

const WHATSAPP_NUMBER = "923001234567";

const VEHICLE_TYPES = [
  { label: "Saloon", maxPassengers: 4 },
  { label: "Estate", maxPassengers: 4 },
  { label: "MPV - 6 Seater", maxPassengers: 6 },
  { label: "MPV - 8 Seater", maxPassengers: 8 },
  { label: "Wheelchair", maxPassengers: 4 }
];

function HomeSection() {
  const [pickup, setPickup] = useState("");
  const [dropoff, setDropoff] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [vehicleType, setVehicleType] = useState(VEHICLE_TYPES[0].label);
  const [passengers, setPassengers] = useState(1);
  const [contact, setContact] = useState("");
  const [email, setEmail] = useState("");
  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);

  function validate() {
    const nextErrors = {};
    if (!pickup.trim()) nextErrors.pickup = "Pickup location is required";
    if (!dropoff.trim()) nextErrors.dropoff = "Drop-off location is required";
    if (!date) nextErrors.date = "Date is required";
    if (!time) nextErrors.time = "Time is required";
    if (!contact.trim()) nextErrors.contact = "Contact number is required";
    if (!email.trim()) nextErrors.email = "Email address is required";

    const selectedVehicle = VEHICLE_TYPES.find((v) => v.label === vehicleType);
    if (selectedVehicle && passengers > selectedVehicle.maxPassengers) {
      nextErrors.passengers = `Max ${selectedVehicle.maxPassengers} passengers for ${vehicleType}`;
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  function buildWhatsAppUrl() {
    const messageLines = [
      "New Ryda booking request:",
      "",
      `Pickup: ${pickup}`,
      `Drop-off: ${dropoff}`,
      `Date: ${date}`,
      `Time: ${time}`,
      `Vehicle Type: ${vehicleType}`,
      `Passengers: ${passengers}`,
      `Contact: ${contact}`,
      `Email: ${email}`
    ];
    const message = encodeURIComponent(messageLines.join("\n"));
    return `https://wa.me/${WHATSAPP_NUMBER}?text=${message}`;
  }

  function handleSubmit(event) {
    event.preventDefault();
    if (!validate()) {
      // If there are errors, ensure we show the popup/alert if it's a passenger error
      const selectedVehicle = VEHICLE_TYPES.find((v) => v.label === vehicleType);
      if (selectedVehicle && passengers > selectedVehicle.maxPassengers) {
        alert(
          `Error: The selected vehicle (${vehicleType}) only supports up to ${selectedVehicle.maxPassengers} passengers. Please select a larger vehicle or reduce passengers.`
        );
      }
      return;
    }
    const url = buildWhatsAppUrl();
    window.open(url, "_blank");
    setSubmitted(true);
  }

  return (
    <section
      id="home"
      className="home"
      style={{ backgroundImage: `url(${car1})` }}
    >
      <div className="home-inner">
        <div className="home-hero-text">
          <div className="home-info-card">
            <h1 className="home-title">Your Trusted Local Transport Partner</h1>
            <p className="home-subtitle">
              Need a lift? We pride ourselves on being the most reliable and fair-priced private hire
              service in the area. From solo trips to group outings of up to 8 people, we’re here to
              get you—and your luggage—where you need to be, safely and on time.
            </p>
            <div className="home-steps">
              <div className="home-step">
                <div className="home-step-number">1</div>
                <div>
                  <div className="home-step-title">Contact us</div>
                  <div className="home-step-text">
                    Contact us via phone, WhatsApp or email with your trip plans.
                  </div>
                </div>
              </div>
              <div className="home-step">
                <div className="home-step-number">2</div>
                <div>
                  <div className="home-step-title">Choose your vehicle</div>
                  <div className="home-step-text">
                    Select the perfect vehicle for your journey.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="home-hero-right">
          <div className="home-booking-card">
            <h2 className="home-booking-title">Book your ride</h2>
            <p className="home-booking-subtitle">
              Fill the reservation form and we will confirm with you on WhatsApp.
            </p>

            <form onSubmit={handleSubmit} className="home-booking-form">
              <div className="home-field-group">
                <label className="home-label">Pickup location</label>
                <input
                  type="text"
                  className="home-input"
                  value={pickup}
                  onChange={(e) => setPickup(e.target.value)}
                  placeholder="Enter pickup address"
                />
                {errors.pickup && <div className="home-error">{errors.pickup}</div>}
              </div>

              <div className="home-field-group">
                <label className="home-label">Drop-off location</label>
                <input
                  type="text"
                  className="home-input"
                  value={dropoff}
                  onChange={(e) => setDropoff(e.target.value)}
                  placeholder="Enter drop-off address"
                />
                {errors.dropoff && <div className="home-error">{errors.dropoff}</div>}
              </div>

              <div className="home-two-columns">
                <div className="home-field-group">
                  <label className="home-label">Date</label>
                  <input
                    type="date"
                    className="home-input"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                  />
                  {errors.date && <div className="home-error">{errors.date}</div>}
                </div>
                <div className="home-field-group">
                  <label className="home-label">Time</label>
                  <input
                    type="time"
                    className="home-input"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                  />
                  {errors.time && <div className="home-error">{errors.time}</div>}
                </div>
              </div>

              <div className="home-two-columns">
                <div className="home-field-group">
                  <label className="home-label">Vehicle Type</label>
                  <select
                    className="home-input"
                    value={vehicleType}
                    onChange={(e) => setVehicleType(e.target.value)}
                  >
                    {VEHICLE_TYPES.map((v) => (
                      <option key={v.label} value={v.label}>
                        {v.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="home-field-group">
                  <label className="home-label">Passengers</label>
                  <input
                    type="number"
                    min="1"
                    max="8"
                    className="home-input"
                    value={passengers}
                    onChange={(e) => setPassengers(Number(e.target.value))}
                  />
                  {errors.passengers && <div className="home-error">{errors.passengers}</div>}
                </div>
              </div>

              <div className="home-two-columns">
                <div className="home-field-group">
                  <label className="home-label">Contact Number</label>
                  <input
                    type="tel"
                    className="home-input"
                    value={contact}
                    onChange={(e) => setContact(e.target.value)}
                    placeholder="Required"
                  />
                  {errors.contact && <div className="home-error">{errors.contact}</div>}
                </div>

                <div className="home-field-group">
                  <label className="home-label">Email Address</label>
                  <input
                    type="email"
                    className="home-input"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Required"
                  />
                  {errors.email && <div className="home-error">{errors.email}</div>}
                </div>
              </div>

              <button type="submit" className="home-submit">
                Request booking on WhatsApp
              </button>

              {submitted && (
                <div className="home-success">Booking details sent. We will reply on WhatsApp.</div>
              )}
            </form>
          </div>
        </div>
      </div>

      <div className="home-bottom-info">
        <div className="home-info-block">
          <div className="home-info-icon">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
            </svg>
          </div>
          <div>
            <h3>How Ryda works</h3>
            <p>Contact us, share your trip details, choose your vehicle and confirm.</p>
          </div>
        </div>
        <div className="home-info-block">
          <div className="home-info-icon">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
            </svg>
          </div>
          <div>
            <h3>Why choose Ryda</h3>
            <p>Safe drivers, clean vehicles and reliable on time pickup.</p>
          </div>
        </div>
        <div className="home-info-block">
          <div className="home-info-icon">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="2" y1="12" x2="22" y2="12"></line>
              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
            </svg>
          </div>
          <div>
            <h3>Trips we cover</h3>
            <p>The Big Days, Daily Grind, Getaways and Flexible Fleet options.</p>
          </div>
        </div>
      </div>
    </section>
  );
}

export default HomeSection;
