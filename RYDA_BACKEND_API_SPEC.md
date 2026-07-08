# RYDA Backend API Specification

## 1. Purpose

This document defines the API contract for the Ryda backend microservices.

It is designed to give implementation-ready clarity for:

- routes
- request payloads
- response payloads
- authentication and authorization rules
- validation expectations
- event dependencies between services

This API spec follows the architecture defined in [RYDA_BACKEND_ARCHITECTURE.md](file:///c:/Users/Falak%20sher/Documents/Projects/Adeel/Ryda/RYDA_BACKEND_ARCHITECTURE.md).

## 2. General API Rules

### Base Public Prefix

All public routes should be exposed through:

```text
/api/v1
```

Examples:

```text
/api/v1/auth/login
/api/v1/users/drivers
/api/v1/bookings/customer
```

### Content Type

- request: `application/json`
- response: `application/json`

### Authentication Header

Protected routes must require:

```http
Authorization: Bearer <jwt_token>
```

### Standard Success Response

```json
{
  "success": true,
  "message": "Driver created successfully",
  "data": {}
}
```

### Standard Error Response

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "email",
      "message": "Email is required"
    }
  ]
}
```

### Common Roles

- `super_admin`
- `sub_admin`
- `driver`

### Common Status Codes

- `200` success
- `201` created
- `400` validation error
- `401` unauthorized
- `403` forbidden
- `404` not found
- `409` conflict
- `422` business rule failure
- `500` internal server error

## 3. Common Domain Objects

### User Summary

```json
{
  "id": "usr_001",
  "name": "Adeel Khan",
  "email": "adeel@example.com",
  "role": "driver",
  "status": "active"
}
```

### Driver Summary

```json
{
  "id": "drv_001",
  "name": "Ali Raza",
  "email": "ali@example.com",
  "phone": "+923001234567",
  "status": "active",
  "vehicleNumber": "LEA-1234"
}
```

### Booking Summary

```json
{
  "id": "bk_001",
  "bookingNumber": "BOOK-1001",
  "source": "customer",
  "status": "confirmed",
  "pickup": "Airport",
  "destination": "Gulberg",
  "fare": 2500,
  "paymentStatus": "paid",
  "driverId": "drv_001",
  "createdAt": "2026-07-02T09:00:00.000Z"
}
```

## 4. `auth-service`

Service base:

```text
/api/v1/auth
```

### `POST /auth/login`

Purpose:

- login for super admin, sub-admin, or driver

Auth:

- public

Request:

```json
{
  "email": "admin@ryda.com",
  "password": "StrongPassword123"
}
```

Validation:

- email required and valid
- password required

Success response:

```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "accessToken": "jwt_access_token",
    "refreshToken": "jwt_refresh_token",
    "expiresIn": 3600,
    "user": {
      "id": "usr_001",
      "name": "Admin User",
      "email": "admin@ryda.com",
      "role": "super_admin",
      "status": "active"
    }
  }
}
```

### `POST /auth/refresh`

Purpose:

- generate a new access token

Auth:

- public with refresh token payload

Request:

```json
{
  "refreshToken": "jwt_refresh_token"
}
```

Success response:

```json
{
  "success": true,
  "message": "Token refreshed successfully",
  "data": {
    "accessToken": "new_access_token",
    "expiresIn": 3600
  }
}
```

### `POST /auth/forgot-password`

Purpose:

- initiate password reset

Auth:

- public

Request:

```json
{
  "email": "driver@ryda.com"
}
```

Response:

```json
{
  "success": true,
  "message": "Password reset link sent if account exists",
  "data": null
}
```

Events:

- triggers `notification.email.requested`

### `POST /auth/reset-password`

Purpose:

- reset password using a valid token

Auth:

- public

Request:

```json
{
  "token": "reset_token",
  "newPassword": "NewStrongPassword123"
}
```

### `POST /auth/logout`

Purpose:

- invalidate refresh session or current login session

Auth:

- protected

Request:

```json
{
  "refreshToken": "jwt_refresh_token"
}
```

### `GET /auth/me`

Purpose:

- get currently logged-in user profile and role claims

Auth:

- protected

Success response:

```json
{
  "success": true,
  "message": "Current user fetched successfully",
  "data": {
    "id": "usr_001",
    "name": "Admin User",
    "email": "admin@ryda.com",
    "role": "super_admin",
    "permissions": [
      "dashboard.read",
      "users.write",
      "bookings.read"
    ]
  }
}
```

## 5. `user-service`

Service base:

```text
/api/v1/users
```

### `POST /users/sub-admins`

Purpose:

- create a sub-admin account

Auth:

- protected
- allowed roles: `super_admin`

Request:

```json
{
  "name": "Operations Manager",
  "email": "ops@ryda.com",
  "phone": "+923001112233",
  "password": "StrongPassword123",
  "permissions": [
    "dashboard.read",
    "bookings.read",
    "bookings.export",
    "drivers.read"
  ]
}
```

Success response:

```json
{
  "success": true,
  "message": "Sub-admin created successfully",
  "data": {
    "id": "sub_001",
    "name": "Operations Manager",
    "email": "ops@ryda.com",
    "role": "sub_admin",
    "status": "active"
  }
}
```

### `PATCH /users/sub-admins/:id`

Purpose:

- update sub-admin profile and permissions

Auth:

- protected
- allowed roles: `super_admin`

Request:

```json
{
  "name": "Updated Name",
  "phone": "+923001112244",
  "permissions": [
    "dashboard.read",
    "bookings.read"
  ]
}
```

### `DELETE /users/sub-admins/:id`

Purpose:

- soft delete or disable a sub-admin account

Auth:

- protected
- allowed roles: `super_admin`

### `GET /users/sub-admins`

Purpose:

- list sub-admin accounts

Auth:

- protected
- allowed roles: `super_admin`

Query params:

- `page`
- `limit`
- `search`
- `status`

### `POST /users/drivers`

Purpose:

- create a driver account from admin panel

Auth:

- protected
- allowed roles: `super_admin`, `sub_admin`

Request:

```json
{
  "name": "Ali Raza",
  "email": "ali@ryda.com",
  "phone": "+923001234567",
  "password": "DriverPass123",
  "licenseNumber": "LIC-2026-1001",
  "vehicleNumber": "LEA-1234",
  "vehicleType": "Sedan",
  "city": "Lahore"
}
```

Success response:

```json
{
  "success": true,
  "message": "Driver created successfully",
  "data": {
    "id": "drv_001",
    "name": "Ali Raza",
    "email": "ali@ryda.com",
    "status": "active",
    "temporaryPasswordSent": true
  }
}
```

Events:

- publishes `driver.created`
- may trigger `notification.email.requested`

### `PATCH /users/drivers/:id`

Purpose:

- update driver information

Auth:

- protected
- allowed roles: `super_admin`, `sub_admin`

Request:

```json
{
  "name": "Ali Raza Updated",
  "phone": "+923001234568",
  "vehicleNumber": "LEA-4321",
  "city": "Islamabad"
}
```

Events:

- publishes `driver.updated`

### `PATCH /users/drivers/:id/status`

Purpose:

- activate or deactivate a driver

Auth:

- protected
- allowed roles: `super_admin`, `sub_admin`

Request:

```json
{
  "status": "inactive",
  "reason": "Documents expired"
}
```

Validation:

- allowed status values: `active`, `inactive`

Events:

- publishes `driver.activated` or `driver.deactivated`

### `POST /users/drivers/:id/reset-password`

Purpose:

- reset a driver password from admin panel

Auth:

- protected
- allowed roles: `super_admin`, `sub_admin`

Request:

```json
{
  "newPassword": "NewDriverPass123"
}
```

### `GET /users/drivers`

Purpose:

- list drivers with filter and search

Auth:

- protected
- allowed roles: `super_admin`, `sub_admin`

Query params:

- `page`
- `limit`
- `search`
- `status`
- `city`
- `vehicleType`

Success response:

```json
{
  "success": true,
  "message": "Drivers fetched successfully",
  "data": {
    "items": [
      {
        "id": "drv_001",
        "name": "Ali Raza",
        "email": "ali@ryda.com",
        "phone": "+923001234567",
        "status": "active",
        "vehicleNumber": "LEA-1234"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 1
    }
  }
}
```

### `GET /users/drivers/:id`

Purpose:

- get full driver profile

Auth:

- protected
- allowed roles: `super_admin`, `sub_admin`

### `GET /users/profile/me`

Purpose:

- driver or admin profile lookup from user-service

Auth:

- protected

## 6. `qr-service`

Service base:

```text
/api/v1/qr
```

### `POST /qr`

Purpose:

- create a QR code record for a taxi or booking source

Auth:

- protected
- allowed roles: `super_admin`, `sub_admin`

Request:

```json
{
  "label": "Taxi 01",
  "vehicleNumber": "LEA-1234",
  "city": "Lahore",
  "locationName": "Airport Terminal",
  "driverId": "drv_001",
  "status": "active"
}
```

Success response:

```json
{
  "success": true,
  "message": "QR code created successfully",
  "data": {
    "id": "qr_001",
    "label": "Taxi 01",
    "token": "qr_token_001",
    "imageUrl": "/api/v1/qr/qr_001/image",
    "status": "active"
  }
}
```

### `GET /qr`

Purpose:

- list QR codes

Auth:

- protected
- allowed roles: `super_admin`, `sub_admin`

Query params:

- `page`
- `limit`
- `search`
- `status`
- `driverId`

### `GET /qr/:id`

Purpose:

- get QR code details

Auth:

- protected
- allowed roles: `super_admin`, `sub_admin`

### `PATCH /qr/:id`

Purpose:

- update QR code metadata or assignment

Auth:

- protected
- allowed roles: `super_admin`, `sub_admin`

Request:

```json
{
  "label": "Taxi 01 Updated",
  "driverId": "drv_002",
  "status": "active"
}
```

### `DELETE /qr/:id`

Purpose:

- soft delete a QR code

Auth:

- protected
- allowed roles: `super_admin`, `sub_admin`

### `GET /qr/:id/image`

Purpose:

- download or render the QR PNG image

Auth:

- protected
- allowed roles: `super_admin`, `sub_admin`

Response:

- binary image response

### `GET /qr/scan/:token`

Purpose:

- public endpoint used by customer after scanning QR

Auth:

- public

Success response:

```json
{
  "success": true,
  "message": "QR resolved successfully",
  "data": {
    "qrId": "qr_001",
    "label": "Taxi 01",
    "vehicleNumber": "LEA-1234",
    "city": "Lahore",
    "driverId": "drv_001",
    "isActive": true
  }
}
```

## 7. `pricing-service`

Service base:

```text
/api/v1/pricing
```

### `POST /pricing/estimate`

Purpose:

- calculate ride distance, duration, and estimated fare

Auth:

- public for customer booking flow
- protected for admin or driver internal usage

Request:

```json
{
  "pickup": {
    "address": "Allama Iqbal International Airport",
    "lat": 31.5216,
    "lng": 74.4036
  },
  "destination": {
    "address": "Gulberg III Lahore",
    "lat": 31.5204,
    "lng": 74.3587
  },
  "vehicleType": "Sedan",
  "city": "Lahore"
}
```

Success response:

```json
{
  "success": true,
  "message": "Fare estimated successfully",
  "data": {
    "distanceKm": 14.2,
    "estimatedDurationMinutes": 28,
    "baseFare": 1800,
    "serviceFee": 150,
    "tax": 50,
    "discount": 0,
    "totalFare": 2000,
    "currency": "PKR"
  }
}
```

Validation:

- pickup required
- destination required
- coordinates or valid addresses required

### `POST /pricing/recalculate`

Purpose:

- recalculate fare after settings updates or booking changes

Auth:

- protected
- allowed roles: `super_admin`, `sub_admin`, `driver`

## 8. `payment-service`

Service base:

```text
/api/v1/payments
```

### `POST /payments/checkout-session`

Purpose:

- create Stripe checkout session for customer booking flow

Auth:

- public

Request:

```json
{
  "qrId": "qr_001",
  "pricing": {
    "distanceKm": 14.2,
    "estimatedDurationMinutes": 28,
    "totalFare": 2000,
    "currency": "PKR"
  },
  "customer": {
    "name": "John Doe",
    "phone": "+923009998887"
  },
  "trip": {
    "pickup": "Airport",
    "destination": "Gulberg"
  }
}
```

Success response:

```json
{
  "success": true,
  "message": "Checkout session created successfully",
  "data": {
    "sessionId": "cs_test_123",
    "checkoutUrl": "https://checkout.stripe.com/session/test_123",
    "expiresAt": "2026-07-02T10:00:00.000Z"
  }
}
```

Events:

- publishes `payment.checkout.created`

### `POST /payments/webhook`

Purpose:

- receive Stripe webhook notifications

Auth:

- public
- protected by Stripe signature verification

Behavior:

- verify webhook signature
- store webhook log
- on successful payment publish `payment.completed`
- on failure publish `payment.failed`

Response:

```json
{
  "received": true
}
```

### `GET /payments/:id/status`

Purpose:

- fetch payment status for an internal booking or checkout reference

Auth:

- protected
- allowed roles: `super_admin`, `sub_admin`, `driver`

### `POST /payments/:id/refund`

Purpose:

- initiate refund in later phase

Auth:

- protected
- allowed roles: `super_admin`

Request:

```json
{
  "reason": "Customer cancellation"
}
```

## 9. `booking-service`

Service base:

```text
/api/v1/bookings
```

### Booking Status Values

- `draft`
- `payment_pending`
- `confirmed`
- `assigned`
- `accepted`
- `trip_started`
- `completed`
- `cancelled`
- `payment_failed`

### `POST /bookings/customer`

Purpose:

- create or finalize a booking after payment success

Auth:

- internal or protected service-to-service endpoint

Request:

```json
{
  "paymentId": "pay_001",
  "qrId": "qr_001",
  "customer": {
    "name": "John Doe",
    "phone": "+923009998887"
  },
  "trip": {
    "pickup": "Airport",
    "destination": "Gulberg",
    "pickupCoordinates": {
      "lat": 31.5216,
      "lng": 74.4036
    },
    "destinationCoordinates": {
      "lat": 31.5204,
      "lng": 74.3587
    }
  },
  "pricing": {
    "distanceKm": 14.2,
    "estimatedDurationMinutes": 28,
    "totalFare": 2000,
    "currency": "PKR"
  },
  "assignedDriverId": "drv_001"
}
```

Success response:

```json
{
  "success": true,
  "message": "Booking created successfully",
  "data": {
    "id": "bk_001",
    "bookingNumber": "BOOK-1001",
    "status": "confirmed",
    "paymentStatus": "paid"
  }
}
```

Events:

- publishes `booking.created`

### `POST /bookings/driver`

Purpose:

- driver manually creates a booking from driver portal

Auth:

- protected
- allowed roles: `driver`

Request:

```json
{
  "customer": {
    "name": "Walk-in Customer",
    "phone": "+923001110000"
  },
  "trip": {
    "pickup": "Mall Road",
    "destination": "Johar Town"
  },
  "pricing": {
    "distanceKm": 12.5,
    "estimatedDurationMinutes": 25,
    "totalFare": 1800,
    "currency": "PKR"
  }
}
```

Success response:

```json
{
  "success": true,
  "message": "Driver booking created successfully",
  "data": {
    "id": "bk_002",
    "bookingNumber": "BOOK-1002",
    "status": "assigned",
    "source": "driver"
  }
}
```

Events:

- publishes `booking.created`

### `GET /bookings`

Purpose:

- list bookings for admin view or driver filtered view

Auth:

- protected
- allowed roles: `super_admin`, `sub_admin`, `driver`

Query params:

- `page`
- `limit`
- `search`
- `status`
- `source`
- `driverId`
- `paymentStatus`
- `dateFrom`
- `dateTo`

Access rules:

- admins can view all bookings
- drivers can only view their own bookings

### `GET /bookings/:id`

Purpose:

- get booking detail

Auth:

- protected
- allowed roles: `super_admin`, `sub_admin`, `driver`

Access rules:

- drivers can only view their own booking

### `PATCH /bookings/:id/assign-driver`

Purpose:

- assign a booking to a driver

Auth:

- protected
- allowed roles: `super_admin`, `sub_admin`

Request:

```json
{
  "driverId": "drv_001"
}
```

Events:

- publishes `booking.assigned`

### `PATCH /bookings/:id/accept`

Purpose:

- driver accepts assigned booking

Auth:

- protected
- allowed roles: `driver`

Request:

```json
{
  "note": "Driver is on the way"
}
```

Events:

- publishes `booking.accepted`

### `PATCH /bookings/:id/start`

Purpose:

- driver starts the trip

Auth:

- protected
- allowed roles: `driver`

Request:

```json
{
  "startedAt": "2026-07-02T10:30:00.000Z"
}
```

Events:

- publishes `trip.started`

### `PATCH /bookings/:id/complete`

Purpose:

- driver completes the trip

Auth:

- protected
- allowed roles: `driver`

Request:

```json
{
  "completedAt": "2026-07-02T11:10:00.000Z",
  "finalFare": 2000,
  "paymentStatus": "paid"
}
```

Events:

- publishes `trip.completed`

### `PATCH /bookings/:id/cancel`

Purpose:

- cancel a booking

Auth:

- protected
- allowed roles: `super_admin`, `sub_admin`, `driver`

Request:

```json
{
  "reason": "Customer no-show"
}
```

Events:

- publishes `booking.cancelled`

### `GET /bookings/history`

Purpose:

- list completed bookings

Auth:

- protected
- allowed roles: `super_admin`, `sub_admin`, `driver`

Access rules:

- drivers only see their completed rides

### `GET /bookings/export`

Purpose:

- export admin booking data for CSV or Excel generation

Auth:

- protected
- allowed roles: `super_admin`, `sub_admin`

## 10. `notification-service`

Service base:

```text
/api/v1/notifications
```

### `POST /notifications/email`

Purpose:

- send direct email from an internal service or admin action

Auth:

- protected internal endpoint

Request:

```json
{
  "template": "booking_assigned",
  "to": [
    "driver@ryda.com"
  ],
  "payload": {
    "driverName": "Ali Raza",
    "bookingNumber": "BOOK-1001"
  }
}
```

Success response:

```json
{
  "success": true,
  "message": "Email queued successfully",
  "data": {
    "notificationId": "ntf_001",
    "status": "queued"
  }
}
```

### `GET /notifications/logs`

Purpose:

- list notification delivery history

Auth:

- protected
- allowed roles: `super_admin`, `sub_admin`

Query params:

- `page`
- `limit`
- `channel`
- `status`
- `template`

## 11. `dashboard-service`

Service base:

```text
/api/v1/dashboard
```

### `GET /dashboard/admin`

Purpose:

- fetch admin dashboard summary

Auth:

- protected
- allowed roles: `super_admin`, `sub_admin`

Success response:

```json
{
  "success": true,
  "message": "Admin dashboard fetched successfully",
  "data": {
    "totalBookings": 120,
    "activeQrCodes": 30,
    "completedBookings": 95,
    "pendingBookings": 10,
    "totalRevenue": 250000,
    "currency": "PKR"
  }
}
```

### `GET /dashboard/driver/:driverId`

Purpose:

- fetch driver dashboard summary

Auth:

- protected
- allowed roles: `super_admin`, `sub_admin`, `driver`

Access rules:

- drivers can only request their own dashboard

Success response:

```json
{
  "success": true,
  "message": "Driver dashboard fetched successfully",
  "data": {
    "totalBookings": 45,
    "pendingBookings": 3,
    "completedBookings": 40,
    "totalEarnings": 60000,
    "currency": "PKR"
  }
}
```

### `GET /dashboard/reports/bookings`

Purpose:

- booking analytics report

Auth:

- protected
- allowed roles: `super_admin`, `sub_admin`

Query params:

- `dateFrom`
- `dateTo`
- `source`
- `status`

### `GET /dashboard/reports/revenue`

Purpose:

- revenue analytics report

Auth:

- protected
- allowed roles: `super_admin`, `sub_admin`

Query params:

- `dateFrom`
- `dateTo`
- `city`

## 12. `settings-service`

Service base:

```text
/api/v1/settings
```

### `GET /settings`

Purpose:

- fetch combined system settings

Auth:

- protected
- allowed roles: `super_admin`, `sub_admin`

### `PATCH /settings`

Purpose:

- update grouped settings

Auth:

- protected
- allowed roles: `super_admin`

### `GET /settings/pricing`

Purpose:

- get pricing configuration

Auth:

- protected
- allowed roles: `super_admin`, `sub_admin`, `pricing-service`

### `PATCH /settings/pricing`

Purpose:

- update fare rules and pricing multipliers

Auth:

- protected
- allowed roles: `super_admin`

Request:

```json
{
  "baseFare": 150,
  "perKmRate": 100,
  "perMinuteRate": 20,
  "serviceFee": 150,
  "taxRatePercent": 5
}
```

### `GET /settings/stripe`

Purpose:

- get Stripe config metadata

Auth:

- protected
- allowed roles: `super_admin`

### `PATCH /settings/stripe`

Purpose:

- update Stripe config metadata

Auth:

- protected
- allowed roles: `super_admin`

Request:

```json
{
  "publishableKey": "pk_live_***",
  "webhookEnabled": true,
  "currency": "PKR"
}
```

### `GET /settings/email`

Purpose:

- get email provider settings metadata

Auth:

- protected
- allowed roles: `super_admin`

### `PATCH /settings/email`

Purpose:

- update email sender configuration

Auth:

- protected
- allowed roles: `super_admin`

Request:

```json
{
  "provider": "brevo",
  "fromName": "Ryda Car",
  "fromEmail": "noreply@ryda.com"
}
```

## 13. API Gateway Routing Map

Suggested route forwarding:

- `/api/v1/auth/*` -> `auth-service`
- `/api/v1/users/*` -> `user-service`
- `/api/v1/qr/*` -> `qr-service`
- `/api/v1/pricing/*` -> `pricing-service`
- `/api/v1/payments/*` -> `payment-service`
- `/api/v1/bookings/*` -> `booking-service`
- `/api/v1/notifications/*` -> `notification-service`
- `/api/v1/dashboard/*` -> `dashboard-service`
- `/api/v1/settings/*` -> `settings-service`

## 14. Validation Rules Summary

### Login

- email required
- password required

### Driver Create

- name required
- email required and unique
- phone required
- password required
- vehicle number required

### QR Create

- label required
- vehicle number required
- status must be valid

### Pricing Estimate

- pickup required
- destination required

### Booking Create

- customer name required
- customer phone required
- pickup required
- destination required
- pricing total required

## 15. Access Control Summary

### `super_admin`

- full access to all modules
- manage settings
- manage sub-admins
- manage drivers
- manage bookings
- view reports
- trigger refunds

### `sub_admin`

- dashboard access
- booking management access
- QR management access
- driver management access
- limited settings access if needed

### `driver`

- own profile access
- own bookings access
- create manual booking
- accept booking
- start trip
- complete trip
- own history access
- own dashboard access

## 16. Event Dependency Summary

### When Driver Is Created

- `user-service` publishes `driver.created`
- `notification-service` may send welcome credentials email

### When Payment Succeeds

- `payment-service` publishes `payment.completed`
- `booking-service` creates booking
- `notification-service` sends notifications
- `dashboard-service` updates aggregates

### When Booking Is Created

- `booking-service` publishes `booking.created`
- `notification-service` sends admin or driver email
- `dashboard-service` updates metrics

### When Trip Completes

- `booking-service` publishes `trip.completed`
- `notification-service` sends completion email
- `dashboard-service` updates revenue and history metrics

## 17. Implementation Notes

- Every protected route should validate JWT and role claims.
- Every service should expose `/health`.
- Pagination format should stay consistent across services.
- Public customer booking endpoints should be rate limited at gateway level.
- Stripe webhook route must bypass JWT auth and use webhook signature verification.
- Internal service-to-service endpoints should use either internal tokens or private network restrictions.

## 18. Immediate Build Order

Recommended implementation order:

1. `auth-service`
2. `user-service`
3. `qr-service`
4. `pricing-service`
5. `payment-service`
6. `booking-service`
7. `notification-service`
8. `dashboard-service`
9. `settings-service`

