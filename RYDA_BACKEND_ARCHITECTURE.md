# RYDA Backend Architecture Master Plan

## 1. Objective

This document defines the production backend architecture for the Ryda taxi booking system.

The architecture is based on:

- Node.js microservices
- MongoDB hosted on the same IONOS Linux VPS
- Docker and Docker Compose deployment
- RabbitMQ for asynchronous communication
- Nginx as reverse proxy and API gateway entry
- Frontend and backend hosted on the same VPS

The goal is to keep the system modular, scalable, and easy to maintain while still being practical for a single VPS deployment.

## 2. Core Product Scope

Ryda has two main application areas:

- Admin Panel
- Driver Portal

Core business capabilities:

- QR-based taxi booking
- Customer booking flow
- Driver-created booking flow
- Driver trip lifecycle management
- Pricing calculation
- Stripe payment flow
- Admin monitoring and reporting
- Email-based notifications
- Role-based access control

## 3. High-Level Architecture

### External Access Layer

- `frontend`: React web app served behind Nginx
- `api-gateway`: public API entrypoint
- `nginx`: reverse proxy, SSL termination, static frontend serving, route forwarding

### Core Infrastructure

- `mongodb`: primary database running on the VPS
- `rabbitmq`: event bus for inter-service communication
- `redis` (optional but recommended later): caching, rate limit storage, session helpers

### Backend Microservices

- `auth-service`
- `user-service`
- `qr-service`
- `booking-service`
- `pricing-service`
- `payment-service`
- `notification-service`
- `dashboard-service`
- `settings-service`

## 4. Recommended Deployment Style

For the current Ryda stage, the best choice is:

- one Git monorepo
- separate Node.js services inside the monorepo
- each service deployed as its own Docker container
- Docker Compose for orchestration on the IONOS VPS

This gives:

- easier maintenance
- consistent code sharing
- isolated services
- simpler deployment on one VPS
- clean path to Kubernetes later if required

## 5. Service Responsibilities

### 5.1 `api-gateway`

Responsibilities:

- single public API entrypoint
- route requests to internal services
- validate public route access
- forward auth headers
- basic rate limiting
- request and response logging

Public examples:

- `/api/auth/*`
- `/api/bookings/*`
- `/api/qr/*`
- `/api/pricing/*`
- `/api/payments/*`
- `/api/admin/*`
- `/api/driver/*`

Implementation note:

- Nginx can sit in front of the gateway
- gateway can be Node.js if centralized auth and request policies are needed
- if simplicity is preferred, Nginx can route directly to services and JWT validation can stay inside services

### 5.2 `auth-service`

Responsibilities:

- admin login
- sub-admin login
- driver login
- JWT issuing
- refresh token flow
- password reset flow
- role and permission token claims
- session or token invalidation rules

Key data owned:

- credentials
- password hashes
- refresh tokens
- roles
- permissions
- auth audit logs

Main endpoints:

- `POST /auth/login`
- `POST /auth/refresh`
- `POST /auth/forgot-password`
- `POST /auth/reset-password`
- `POST /auth/logout`
- `GET /auth/me`

### 5.3 `user-service`

Responsibilities:

- create sub-admin accounts
- manage driver profiles
- activate and deactivate drivers
- update driver details
- assign role sets to sub-admins
- expose admin-facing user management APIs

Key data owned:

- admin profiles
- sub-admin profiles
- driver profiles
- account status
- profile metadata
- emergency and contact data if needed later

Main endpoints:

- `POST /users/sub-admins`
- `PATCH /users/sub-admins/:id`
- `DELETE /users/sub-admins/:id`
- `POST /users/drivers`
- `PATCH /users/drivers/:id`
- `PATCH /users/drivers/:id/status`
- `GET /users/drivers`
- `GET /users/drivers/:id`

Events published:

- `driver.created`
- `driver.updated`
- `driver.activated`
- `driver.deactivated`
- `subadmin.created`

### 5.4 `qr-service`

Responsibilities:

- create QR records
- update QR records
- delete QR records
- generate QR image
- download or print QR
- map QR to taxi, location, or driver assignment metadata
- resolve QR code scans into booking context

Key data owned:

- qr codes
- qr images or image metadata
- taxi assignments
- qr status
- location or vehicle references

Main endpoints:

- `POST /qr`
- `GET /qr`
- `GET /qr/:id`
- `PATCH /qr/:id`
- `DELETE /qr/:id`
- `GET /qr/:id/image`
- `GET /qr/scan/:token`

### 5.5 `booking-service`

Responsibilities:

- create bookings from customer flow
- create bookings from driver flow
- store booking lifecycle
- assign driver
- allow driver acceptance
- allow trip start
- allow trip completion
- maintain booking history
- support admin search, filters, and export data preparation

Booking states:

- `draft`
- `payment_pending`
- `confirmed`
- `assigned`
- `accepted`
- `trip_started`
- `completed`
- `cancelled`
- `payment_failed`

Key data owned:

- bookings
- booking history
- trip state transitions
- assigned driver reference
- customer ride request data
- ride summary data

Main endpoints:

- `POST /bookings/customer`
- `POST /bookings/driver`
- `GET /bookings`
- `GET /bookings/:id`
- `PATCH /bookings/:id/assign-driver`
- `PATCH /bookings/:id/accept`
- `PATCH /bookings/:id/start`
- `PATCH /bookings/:id/complete`
- `PATCH /bookings/:id/cancel`
- `GET /bookings/history`

Events published:

- `booking.created`
- `booking.assigned`
- `booking.accepted`
- `trip.started`
- `trip.completed`
- `booking.cancelled`

### 5.6 `pricing-service`

Responsibilities:

- calculate distance
- estimate duration
- calculate fare
- apply pricing settings
- support taxes, fees, and discounts later

Inputs:

- pickup
- destination
- trip type
- pricing settings
- Google Maps distance matrix or routes API result

Outputs:

- distance
- estimated time
- base fare
- taxes
- service fees
- total fare

Main endpoints:

- `POST /pricing/estimate`
- `POST /pricing/recalculate`

### 5.7 `payment-service`

Responsibilities:

- create Stripe checkout session
- create payment intent if needed later
- process Stripe webhooks
- verify payment status
- store payment logs
- trigger booking creation after successful payment
- handle refunds in future phase

Key data owned:

- payment sessions
- payment logs
- webhook logs
- transaction status
- refund records

Main endpoints:

- `POST /payments/checkout-session`
- `POST /payments/webhook`
- `GET /payments/:id/status`
- `POST /payments/:id/refund`

Events published:

- `payment.checkout.created`
- `payment.completed`
- `payment.failed`
- `payment.refunded`

### 5.8 `notification-service`

Responsibilities:

- send booking notification emails
- send driver assignment emails
- send booking completion emails
- send payment confirmation emails
- send admin alert emails
- prepare templates for later SMS support

Channels:

- email now
- SMS later
- WhatsApp later if needed

Key data owned:

- notification logs
- template identifiers
- delivery status
- retry metadata

Main endpoints:

- `POST /notifications/email`
- `GET /notifications/logs`

Events consumed:

- `booking.created`
- `booking.assigned`
- `trip.completed`
- `payment.completed`
- `driver.created`

### 5.9 `dashboard-service`

Responsibilities:

- aggregate admin dashboard metrics
- aggregate driver dashboard metrics
- produce booking statistics
- produce revenue and analytics summaries
- build precomputed views for fast dashboard rendering

Key data owned:

- analytics snapshots
- reporting aggregates
- chart-ready datasets

Main endpoints:

- `GET /dashboard/admin`
- `GET /dashboard/driver/:driverId`
- `GET /dashboard/reports/bookings`
- `GET /dashboard/reports/revenue`

### 5.10 `settings-service`

Responsibilities:

- manage pricing settings
- manage Stripe configuration metadata
- manage email settings
- manage system settings
- expose centralized configuration to internal services

Key data owned:

- pricing rules
- system settings
- Stripe config metadata
- email sender config metadata
- feature flags if needed later

Main endpoints:

- `GET /settings`
- `PATCH /settings`
- `GET /settings/pricing`
- `PATCH /settings/pricing`
- `GET /settings/stripe`
- `PATCH /settings/stripe`

## 6. Database Strategy With MongoDB

MongoDB will be hosted on your own VPS, not on a third-party database provider.

Recommended approach:

- one MongoDB server instance
- separate database per service
- each service owns its own data
- no direct cross-service collection access

Recommended database names:

- `ryda_auth`
- `ryda_users`
- `ryda_qr`
- `ryda_bookings`
- `ryda_payments`
- `ryda_notifications`
- `ryda_dashboard`
- `ryda_settings`

This keeps service boundaries clean while still running on one MongoDB instance.

## 7. Suggested Collections Per Service

### `ryda_auth`

- `users_credentials`
- `roles`
- `permissions`
- `refresh_tokens`
- `password_reset_tokens`
- `auth_audit_logs`

### `ryda_users`

- `admins`
- `sub_admins`
- `drivers`
- `driver_status_logs`

### `ryda_qr`

- `qr_codes`
- `qr_assignments`
- `vehicles`

### `ryda_bookings`

- `bookings`
- `booking_history`
- `booking_events`

### `ryda_payments`

- `payment_sessions`
- `payment_logs`
- `stripe_webhook_logs`
- `refunds`

### `ryda_notifications`

- `notification_logs`
- `notification_templates`

### `ryda_dashboard`

- `admin_metrics`
- `driver_metrics`
- `daily_reports`
- `revenue_reports`

### `ryda_settings`

- `pricing_settings`
- `stripe_settings`
- `email_settings`
- `system_settings`

## 8. Synchronous vs Asynchronous Communication

### Use synchronous HTTP for:

- login and token refresh
- fetching booking details
- listing drivers
- reading settings
- pricing estimate request
- creating Stripe checkout session

### Use RabbitMQ events for:

- payment success or failure
- booking created
- driver created
- booking assigned
- trip started
- trip completed
- analytics updates
- notification triggers

Rule:

- Use HTTP when a request needs an immediate response
- Use RabbitMQ when one action should trigger background work in other services

## 9. Main Business Flows

### 9.1 Customer Booking Flow

1. Customer scans QR code
2. Frontend calls `qr-service` to resolve QR data
3. Customer enters trip details
4. Frontend calls `pricing-service` for estimate
5. Frontend calls `payment-service` to create Stripe checkout session
6. Customer completes payment on Stripe
7. Stripe webhook hits `payment-service`
8. `payment-service` verifies webhook and publishes `payment.completed`
9. `booking-service` consumes event and creates booking
10. `booking-service` publishes `booking.created`
11. `notification-service` sends driver and admin email
12. `dashboard-service` updates reporting data

### 9.2 Driver-Created Booking Flow

1. Driver logs in through `auth-service`
2. Driver creates booking from Driver Portal
3. Frontend calls `booking-service`
4. `booking-service` stores booking
5. `booking-service` publishes `booking.created`
6. `notification-service` emails admin
7. `dashboard-service` updates reporting metrics
8. Driver later starts and completes trip through `booking-service`

### 9.3 Trip Lifecycle Flow

1. Admin assigns driver or booking already belongs to driver
2. Driver opens assigned booking
3. Driver accepts booking
4. Driver starts trip
5. Driver completes trip
6. `booking-service` publishes lifecycle events
7. `notification-service` and `dashboard-service` react

## 10. Event Contracts

Recommended event names:

- `driver.created`
- `driver.updated`
- `booking.created`
- `booking.assigned`
- `booking.accepted`
- `trip.started`
- `trip.completed`
- `booking.cancelled`
- `payment.checkout.created`
- `payment.completed`
- `payment.failed`
- `payment.refunded`
- `notification.email.requested`

Suggested event payload shape:

```json
{
  "event": "booking.created",
  "timestamp": "2026-07-02T10:00:00.000Z",
  "service": "booking-service",
  "correlationId": "uuid-or-trace-id",
  "data": {
    "bookingId": "bk_123",
    "source": "customer",
    "driverId": "drv_001",
    "paymentStatus": "paid"
  }
}
```

## 11. Security Design

### Authentication

- JWT access tokens
- refresh tokens
- hashed passwords with bcrypt or argon2
- password reset tokens with expiry

### Authorization

- roles: `super_admin`, `sub_admin`, `driver`
- permission-based route guards for admin modules

### VPS and Infrastructure Security

- expose only ports `80` and `443` publicly
- keep MongoDB and RabbitMQ internal only
- use Docker internal network for service-to-service traffic
- restrict MongoDB access to localhost or private Docker network
- protect webhook routes with signature validation
- store secrets in environment files outside version control
- enable firewall rules on the VPS

## 12. Logging and Monitoring

Minimum production logging:

- gateway access logs
- service application logs
- error logs
- webhook logs
- RabbitMQ consumer failure logs

Recommended additions:

- correlation ID on each request
- request tracing across services
- daily log rotation
- uptime monitoring for containers
- health endpoints for every service

Health endpoints:

- `/health`
- `/ready`

## 13. Docker Compose Production Layout

Recommended containers:

- `nginx`
- `frontend`
- `api-gateway`
- `auth-service`
- `user-service`
- `qr-service`
- `booking-service`
- `pricing-service`
- `payment-service`
- `notification-service`
- `dashboard-service`
- `settings-service`
- `mongodb`
- `rabbitmq`
- `redis` optional

Recommended networks:

- `public_net`
- `internal_net`

Recommended volumes:

- `mongodb_data`
- `rabbitmq_data`
- `nginx_logs`

Rule:

- only `nginx` should bind public ports
- internal services should only expose ports to the Docker network

## 14. Environment Variable Strategy

Each service should have its own environment file.

Examples:

- `AUTH_PORT`
- `AUTH_MONGO_URI`
- `AUTH_JWT_SECRET`
- `AUTH_REFRESH_SECRET`
- `BOOKING_MONGO_URI`
- `PAYMENT_STRIPE_SECRET_KEY`
- `PAYMENT_STRIPE_WEBHOOK_SECRET`
- `RABBITMQ_URL`
- `EMAIL_PROVIDER`
- `EMAIL_API_KEY`
- `GOOGLE_MAPS_API_KEY`

Shared env rules:

- keep service-specific secrets separate
- use one shared RabbitMQ host
- use one shared MongoDB host with separate DB names
- never commit production secrets

## 15. Recommended Monorepo Structure

```text
ryda-backend/
  apps/
    api-gateway/
    auth-service/
    user-service/
    qr-service/
    booking-service/
    pricing-service/
    payment-service/
    notification-service/
    dashboard-service/
    settings-service/
  packages/
    common/
    config/
    logger/
    contracts/
    auth-utils/
  docker/
    nginx/
    compose/
  scripts/
  docs/
    backend/
  .env
  .env.production
  docker-compose.yml
  package.json
```

## 16. Recommended Shared Packages

### `packages/common`

- shared utilities
- error response helpers
- base DTO helpers

### `packages/contracts`

- event names
- queue payload schemas
- shared API contracts

### `packages/config`

- env parsing
- config validation

### `packages/logger`

- structured logger
- request context logger

### `packages/auth-utils`

- JWT helpers
- role guard helpers

## 17. Implementation Recommendation

Since your backend stack is Node.js, the best practical implementation approach is:

- Node.js monorepo
- one service per app
- Express or Fastify for lighter services
- NestJS if you want stronger structure and faster scaling for team development

Recommended final choice:

- use NestJS if you want a more enterprise and maintainable structure
- use Express or Fastify if you want the lightest custom setup

For Ryda, NestJS is the stronger long-term option, but the architecture in this document works with any Node.js framework.

## 18. Build Phases

### Phase 1: Foundation

- monorepo setup
- Docker Compose setup
- Nginx reverse proxy
- MongoDB and RabbitMQ
- shared config and logger package

### Phase 2: Core Services

- auth-service
- user-service
- qr-service
- booking-service
- pricing-service

### Phase 3: Payment and Notifications

- payment-service
- Stripe webhook integration
- notification-service

### Phase 4: Reporting and Settings

- dashboard-service
- settings-service
- export and analytics support

### Phase 5: Production Hardening

- backups
- monitoring
- retries and dead-letter queues
- rate limiting
- audit logs
- role and permission refinement

## 19. Final Architecture Decision Summary

Ryda backend should be built as:

- Dockerized Node.js microservices
- MongoDB hosted on your own IONOS VPS
- RabbitMQ for event-driven communication
- Nginx as reverse proxy
- one monorepo with separate services
- one MongoDB server with separate databases per service
- frontend and backend hosted together on the same VPS

This architecture is the right balance of:

- scalability
- maintainability
- deployment simplicity
- production readiness

## 20. Immediate Next Deliverables

After approval of this architecture, the next documents to create are:

1. API contract document for each service
2. MongoDB schema design document
3. RabbitMQ queue and exchange design
4. Docker Compose production file
5. backend monorepo scaffold

