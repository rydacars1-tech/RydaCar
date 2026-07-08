# RYDA CAR – Taxi Booking System
## Driver Management & Booking Workflow

## Overview

The system follows a microservices architecture where the Admin manages QR codes, bookings, pricing, drivers, and system settings. Drivers receive their login credentials from the Admin and can access a dedicated Driver Dashboard to manage their assigned rides.

---

# Admin Panel

The Admin Panel now contains **5 modules**.

## 1. Dashboard
- View total bookings
- Revenue analytics
- Active QR Codes
- Business reports
- Booking statistics

## 2. QR Code Management
- Create QR Codes
- Update QR Codes
- Delete QR Codes
- Download or Print QR Codes

## 3. Booking Management
- View all bookings
- Search & Filter bookings
- View booking details
- Export reports
- Monitor bookings created by customers and drivers

## 4. User Management (New)

The User Management module allows the administrator to manage system users.

### Features

#### Sub Admin Management
- Create Sub Admin
- Update Sub Admin
- Delete Sub Admin
- Assign Roles & Permissions

#### Driver Management
- Create Driver Account
- Update Driver Information
- Activate / Deactivate Driver
- Reset Driver Password
- Manage Driver Profiles

When a Driver account is created, the system generates login credentials.

The Driver uses these credentials to access the Driver Portal.

---

## 5. Settings
- Pricing Configuration
- Stripe Configuration
- Email Settings
- System Settings

---

# Driver Portal

Each Driver has their own dashboard.

## Sidebar

### Dashboard
Displays driver-specific statistics:

- Total Bookings
- Pending Bookings
- Completed Bookings
- Total Earnings (Optional)
- Booking Overview
- Performance Summary

---

### Bookings

Displays all bookings assigned to the logged-in driver.

Driver can:

- View booking details
- Accept bookings
- Start trip
- Complete trip

---

### Create Booking

Drivers can also manually create bookings.

Workflow:

1. Driver creates booking.
2. Booking is saved.
3. Admin receives a notification.
4. Booking appears inside Admin Booking Management.

---

### History

Shows completed bookings.

Includes:

- Customer Information
- Pickup
- Destination
- Distance
- Fare
- Payment Status
- Completion Date

---

### Profile / Settings

Driver can:

- Update profile
- Change password
- View account information

---

# Driver Booking Workflow

## Booking Created by Customer

1. Customer scans Taxi QR Code.
2. Customer enters trip details.
3. Pricing Service calculates fare.
4. Customer completes payment using Stripe.
5. Payment is verified.
6. Booking Service creates booking.
7. Notification Service sends an **Email Notification** to the assigned Driver.
8. Driver receives booking inside Driver Dashboard.
9. Driver accepts the booking.
10. Driver starts the trip.
11. Driver completes the trip.
12. Admin receives a completion notification.
13. Booking is moved to Booking History.

---

# Booking Created by Driver

1. Driver logs into the system.
2. Driver creates a booking manually.
3. Booking Service saves the booking.
4. Admin receives an Email Notification.
5. Booking appears in Admin Booking Management.
6. Driver completes the ride.
7. Admin is notified that the booking has been completed.
8. Booking moves to History.

---

# Notification Flow

The system uses **Email Notifications** for communication.

Notifications include:

- New Booking Assigned to Driver
- Booking Created by Driver
- Booking Completed
- Payment Confirmation
- Admin Alerts

> SMS support can be added later if required.

---

# Authentication

Both Admin and Drivers authenticate through the Authentication Service.

Supports:

- JWT Authentication
- Login
- Refresh Token
- Password Reset
- Role-Based Access Control (RBAC)

---

# Microservices Used

- Authentication Service
- QR Service
- Booking Service
- Pricing Service
- Payment Service
- Notification Service
- Dashboard Service

RabbitMQ is used for asynchronous communication between services.

---

# External Services

- Google Maps API
- Stripe
- Email Service (Brevo / SendGrid)

---

# Benefits of the Architecture

- Scalable microservices architecture
- Independent deployment of services
- Secure authentication with JWT
- Role-based access control
- Driver-specific dashboards
- Real-time booking notifications
- Event-driven communication using RabbitMQ
- Easy future integration of Driver Mobile App
- High maintainability and performance