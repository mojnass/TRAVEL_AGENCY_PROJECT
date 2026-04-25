# Backend Test Plan

Mohamad Kaddah can use this as the starting structure for Section X.

## Auth

- Register a new user.
- Login with valid credentials.
- Reject duplicate registration.
- Reject invalid password.
- Protect `/api/auth/me` without token.
- Allow admin access only for users with `ADMIN` role.

## Flights

- Search cached route results.
- Fetch detail by offer id.
- Fetch seat map.
- Generate e-ticket payload after booking.
- Admin creates, updates, and deletes flight offers.

## Secondary Services

- Search hotels, restaurants, attractions, and spa by city/type/category.
- Fetch detail pages by id.
- Create booking records for each service type.
- Admin CRUD requires admin role.

## Bundles And Payments

- Fetch published bundles.
- Compose a user bundle.
- Share a user bundle by link.
- Checkout creates pending payment.
- Completing payment creates invoice.
- Refund creates refund record.
- Generate itinerary payload.

## Dashboard And Notifications

- List user notifications.
- Count unread notifications.
- Mark notification as read.
- Admin dashboard returns users and table counts.
