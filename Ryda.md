## Ryda Web & Mobile Web App – Functional & Technical Plan

### 1. Project Overview
- **Goal**: Simple marketing + lead-generation site for Ryda (car booking service).
- **Platforms**: Mobile-first responsive website that also works on desktop.
- **Auth**: No login/signup. Users land directly on the **Home** section.
- **Core Sections**:
  - **Home** – Hero, “How to book a car” steps, preview of car images.
  - **Services** – What Ryda provides (types of cars, ride categories, extra services).
  - **Contact Us** – Email and WhatsApp details so users can reach Ryda.
- **Header**: Navigation buttons – **Home**, **Service**, **Contact Us**.
- **Footer**: Email, WhatsApp number, and Terms & Services info.

### 2. Tech Stack
- **Frontend**: React.js (SPA).
- **Styling**:
  - Mobile-first responsive design.
  - Reusable components for buttons, layout, and cards.
- **Backend / Database**: Firebase (Cloud Firestore or Realtime Database) for:
  - Storing contact messages (optional if we add a contact form).
  - Future extension for ride/booking requests.

### 3. Information Architecture & Navigation
- **Single Page Application** with sections:
  - `#home`
  - `#services`
  - `#contact`
- **Header navigation**:
  - Clicking **Home** scrolls to the Home section.
  - Clicking **Service** scrolls to the Services section.
  - Clicking **Contact Us** scrolls to the Contact section.
- **URL structure**:
  - Base URL only (e.g., `/`).
  - Optional: use hash fragments (`/#services`, `/#contact`) for direct linking.

### 4. Layout Structure
- **Header**:
  - Left side: Ryda logo or text brand (e.g., “Ryda”).
  - Right side: three buttons: Home, Service, Contact Us.
  - Sticky on top for mobile and desktop.
- **Main content**:
  - **Home Section** (hero + booking steps + car images).
  - **Services Section** (cards listing services).
  - **Contact Section** (contact info and optional form).
- **Footer**:
  - Email address (clickable mail link).
  - WhatsApp number (clickable WhatsApp link).
  - Short text for Terms & Services and a link to detailed terms (can be a modal or separate page in future).

### 5. Section Details

#### 5.1 Home Section
- **Hero Area**:
  - Big headline explaining Ryda, e.g., “Book your ride quickly with Ryda”.
  - Short subtext: what Ryda does and where it operates.
  - A primary CTA button: “Contact on WhatsApp” (opens WhatsApp chat).
- **Hero Layout (Professional Look)**:
  - Left side (or top on mobile): main text (headline + subtext + CTA).
  - Right side (or below on mobile): car image carousel with overlay “Book Me” form.
  - Background: clean gradient or image with dark overlay for readability.
- **How to Book a Car (Steps)**:
  - Show 3–4 simple steps, for example:
    1. Contact us on WhatsApp or email.
    2. Share pickup, drop-off, date, and time.
    3. Choose your car type.
    4. Confirm and enjoy your ride.
  - Displayed horizontally on desktop, stacked vertically on mobile.
- **Car Carousel (3–4 Images)**:
  - Auto-sliding carousel with manual controls (next/prev dots or arrows).
  - Each slide shows:
    - High-quality car image.
    - Short label (e.g., “Economy Car”, “Business Sedan”, “SUV”, “Luxury”).
  - Smooth transitions and responsive height for mobile/desktop.
- **“Book Me” Reservation Form (on top of carousel area)**:
  - Professional compact form, always visible next to or over the carousel.
  - Fields:
    - Pickup Location.
    - Drop-off Location.
    - Date.
    - Time.
    - Car Type (select: Economy, Business, SUV, Luxury).
    - Number of Passengers.
    - Contact (phone or WhatsApp number).
  - Buttons and behavior:
    - Primary button: “Request Booking”.
    - On submit (first version): either open WhatsApp with pre-filled message or just show a success message; later we can connect it to Firebase.
  - Validation:
    - Required fields: pickup, drop-off, date, time, contact.
    - Simple inline error messages for missing required inputs.
- **Additional Home Information (below hero)**:
  - Short section “Why choose Ryda?” with 3–4 points (safe drivers, on-time, clean cars, fair prices).
  - Short “How it works” recap (can reuse the steps).
  - Optional small testimonials or trust indicators to keep it professional.

#### 5.2 Services Section
- **Intro text**:
  - One short paragraph summarizing Ryda services.
- **Service List** (as cards or list items):
  - Local city rides.
  - Airport pickups and drops.
  - Outstation / long-distance rides.
  - Hourly / daily rental service.
  - Corporate / business rides.
  - Any extra services (e.g., event rides, wedding cars) if needed.
- **Each service card** includes:
  - Icon or small image.
  - Service title.
  - Short description of what is included.

#### 5.3 Contact Us Section
- **Primary contact information**:
  - **Email**: official Ryda email address.
  - **WhatsApp**: official business WhatsApp number.
- **Display style**:
  - Clear, large, and easy to tap on mobile.
  - Icons for email and WhatsApp.
  - Buttons such as “Email Us” and “Chat on WhatsApp”.
- **Optional Contact Form** (if we want to use Firebase):
  - Fields:
    - Full Name
    - Email
    - Phone Number
    - Message / Ride requirement
  - On submit:
    - Save to Firebase (contact_messages collection).
    - Show “Message sent” success state.

### 6. Footer Details
- **Content**:
  - “© Ryda [Year]. All rights reserved.”
  - Email displayed with a mailto link.
  - WhatsApp number with a wa.me link.
  - Short line: “By contacting us you agree to our Terms & Services.”
- **Terms & Services**:
  - For now: a short text summary (high-level; no legal detail).
  - Later: we can add:
    - A dedicated Terms & Services page (new route or modal).
    - Privacy policy information.

### 7. Component Plan (React)
- **App**:
  - Wraps layout, sections, and manages scroll behavior for nav.
- **Layout Components**:
  - `Header`
  - `Footer`
  - `MainLayout` (optional wrapper for the three sections).
- **Section Components**:
  - `HomeSection`
  - `ServicesSection`
  - `ContactSection`
- **UI Components**:
  - `Button` (primary/secondary, full-width on mobile).
  - `Card` (for cars and services).
  - `IconWithText` (for contact information).
  - `SectionTitle` (title + subtitle).

### 8. Firebase Usage Plan
- **Firebase Setup**:
  - Create Firebase project in Firebase console.
  - Enable Firestore or Realtime Database.
  - Get config object and initialize in React app.
- **Data we plan to store first**:
  - `contact_messages` collection:
    - `name`: string
    - `email`: string
    - `phone`: string
    - `message`: string
    - `createdAt`: timestamp
- **Future data (optional)**:
  - `bookings` collection:
    - `pickupLocation`, `dropLocation`, `date`, `time`.
    - `carType`.
    - `contactReference` (link to contact_messages entry).
- **Security rules (high level)**:
  - Write rules so only server or authenticated admin can read all contact messages.
  - Allow unauthenticated write of new contact messages (for basic lead capture).

### 9. Responsive Design Guidelines
- **Mobile-first**:
  - Header becomes a simple top bar; nav buttons may be inline or in a menu.
  - Sections stack vertically with comfortable padding.
  - Buttons full-width or large touch targets.
- **Tablet & Desktop**:
  - More spacing and larger grids for car and service cards.
  - Multi-column layout (e.g., 3 cards per row on desktop).
- **Images**:
  - Use responsive images (max-width: 100%, height: auto).
  - Compress images for fast loading.

### 10. Content Checklist
- **Branding**:
  - Ryda logo or wordmark.
  - Brand colors and font choices.
- **Home Section**:
  - Hero title and subtitle text.
  - Booking steps copy.
  - Car category list and descriptions.
- **Services Section**:
  - Final service names.
  - Short descriptions for each service.
- **Contact Section**:
  - Final email.
  - Final WhatsApp number.
  - Optional contact form text.
- **Footer**:
  - Terms & Services short text.
  - Copyright.

### 11. Future Enhancements (Not in first version)
- Multi-language support.
- Basic analytics (track clicks on WhatsApp and email).
- Detailed Terms & Services and Privacy Policy pages.
- Admin dashboard to see Firebase contact messages.
- Full booking flow with date, time, and pricing.

