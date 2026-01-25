import { useEffect, useState } from "react";
import car1 from "../assets/car1.jpg";
import car2 from "../assets/car2.jpeg";
import car3 from "../assets/car3.jpg";

const cars = [
  {
    id: 1,
    label: "Economy car",
    image: car1
  },
  {
    id: 2,
    label: "Business sedan",
    image: car2
  },
  {
    id: 3,
    label: "SUV",
    image: car3
  }
];

const WHATSAPP_NUMBER = "923001234567";

function HomeSection() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [selectedCarId, setSelectedCarId] = useState(cars[0].id);
  const [pickup, setPickup] = useState("");
  const [dropoff, setDropoff] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [carType, setCarType] = useState("Economy");
  const [passengers, setPassengers] = useState("1");
  const [contact, setContact] = useState("");
  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);

  const selectedCar = cars.find((car) => car.id === selectedCarId) || cars[0];

  useEffect(() => {
    const id = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % cars.length);
    }, 5000);
    return () => clearInterval(id);
  }, []);

  function handleSelectSlide(index) {
    setActiveIndex(index);
  }

  function validate() {
    const nextErrors = {};
    if (!pickup.trim()) nextErrors.pickup = "Pickup location is required";
    if (!dropoff.trim()) nextErrors.dropoff = "Drop-off location is required";
    if (!date) nextErrors.date = "Date is required";
    if (!time) nextErrors.time = "Time is required";
    if (!contact.trim()) nextErrors.contact = "Contact number is required";
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
      `Car: ${selectedCar.label}`,
      `Car type: ${carType}`,
      `Passengers: ${passengers}`,
      `Contact: ${contact}`
    ];
    const message = encodeURIComponent(messageLines.join("\n"));
    return `https://wa.me/${WHATSAPP_NUMBER}?text=${message}`;
  }

  function handleSubmit(event) {
    event.preventDefault();
    if (!validate()) return;
    const url = buildWhatsAppUrl();
    window.open(url, "_blank");
    setSubmitted(true);
  }

  return (
    <section
      id="home"
      className="home"
      style={{ backgroundImage: `url(${cars[activeIndex].image})` }}
    >
      <div className="home-inner">
        <div className="home-hero-text">
          <div className="home-info-card">
            <h1 className="home-title">Book your ride with Ryda</h1>
            <p className="home-subtitle">
              Reliable, comfortable rides for airport transfers, city trips and outstation journeys.
            </p>
            <ul className="home-highlights">
              <li>Professional, verified drivers</li>
              <li>Clean and comfortable vehicles</li>
              <li>On time pickup and transparent pricing</li>
            </ul>
            <div className="home-steps">
              <div className="home-step">
                <div className="home-step-number">1</div>
                <div>
                  <div className="home-step-title">Contact us</div>
                  <div className="home-step-text">Reach us on WhatsApp or email with your trip plan.</div>
                </div>
              </div>
              <div className="home-step">
                <div className="home-step-number">2</div>
                <div>
                  <div className="home-step-title">Share details</div>
                  <div className="home-step-text">Pickup, drop-off, date, time and passenger count.</div>
                </div>
              </div>
              <div className="home-step">
                <div className="home-step-number">3</div>
                <div>
                  <div className="home-step-title">Choose your car</div>
                  <div className="home-step-text">Economy, business, SUV or luxury as you like.</div>
                </div>
              </div>
              <div className="home-step">
                <div className="home-step-number">4</div>
                <div>
                  <div className="home-step-title">Confirm and ride</div>
                  <div className="home-step-text">We confirm and your driver arrives on time.</div>
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
                  placeholder="Airport, home, office"
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
                  placeholder="Hotel, station"
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
                  <label className="home-label">Car</label>
                  <select
                    className="home-input"
                    value={selectedCarId}
                    onChange={(e) => setSelectedCarId(Number(e.target.value))}
                  >
                    {cars.map((car) => (
                      <option key={car.id} value={car.id}>
                        {car.label}
                      </option>
                    ))}
                  </select>
                  <div className="home-car-note">Selected car: {selectedCar.label}</div>
                </div>
                <div className="home-field-group">
                  <label className="home-label">Car type</label>
                  <select
                    className="home-input"
                    value={carType}
                    onChange={(e) => setCarType(e.target.value)}
                  >
                    <option value="Economy">Economy</option>
                    <option value="Business">Business</option>
                    <option value="SUV">SUV</option>
                    <option value="Luxury">Luxury</option>
                  </select>
                </div>
                <div className="home-field-group">
                  <label className="home-label">Passengers</label>
                  <select
                    className="home-input"
                    value={passengers}
                    onChange={(e) => setPassengers(e.target.value)}
                  >
                    <option value="1">1</option>
                    <option value="2">2</option>
                    <option value="3">3</option>
                    <option value="4">4</option>
                    <option value="5+">5+</option>
                  </select>
                </div>
              </div>

              <div className="home-field-group">
                <label className="home-label">Contact (phone or WhatsApp)</label>
                <input
                  type="tel"
                  className="home-input"
                  value={contact}
                  onChange={(e) => setContact(e.target.value)}
                  placeholder="Include country code if possible"
                />
                {errors.contact && <div className="home-error">{errors.contact}</div>}
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
          <h3>How Ryda works</h3>
          <p>Contact us, share your trip details, choose your car and confirm.</p>
        </div>
        <div className="home-info-block">
          <h3>Why choose Ryda</h3>
          <p>Safe drivers, clean vehicles and reliable on time pickup.</p>
        </div>
        <div className="home-info-block">
          <h3>Trips we cover</h3>
          <p>City rides, airport transfers and long distance outstation journeys.</p>
        </div>
      </div>
    </section>
  );
}

export default HomeSection;
