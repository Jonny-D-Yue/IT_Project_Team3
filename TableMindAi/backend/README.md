# TableMind AI Backend

Backend API for TableMind AI, a restaurant smart-ordering platform for customers, staff, and admins.

## Features

- JWT authentication for admin and staff
- Restaurant settings and table validation/session flow
- Per-table QR entry using `restaurantId + tableNumber`
- Category and menu item CRUD
- Customer order creation with menu snapshot pricing
- Staff order management with real-time Socket.IO updates
- AI chat and recommendation endpoints grounded in menu data
- Admin AI dish-photo import with optional Cloudinary image persistence
- Admin analytics and daily checkout support
- MongoDB seed script with sample data and accounts
- Table QR URL generator script

## Tech Stack

- Node.js
- Express.js
- MongoDB + Mongoose
- JWT
- bcryptjs
- Socket.IO
- dotenv
- CORS
- express-async-handler
- Gemini API integration with safe fallback when no key is configured

## Folder Structure

```text
backend/
  src/
    config/
    controllers/
    middlewares/
    models/
    routes/
    services/
    sockets/
    utils/
    validators/
    scripts/
    seed/
    app.js
    server.js
  .env.example
  package.json
  README.md
```

## Environment Setup

1. Copy `.env.example` to `.env`.
2. Fill in the environment values.

```env
PORT=5000
NODE_ENV=development
MONGODB_URI=your_mongodb_uri
JWT_SECRET=your_jwt_secret
GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL=gemini-2.5-flash
CLIENT_URL=http://localhost:5173
REQUEST_BODY_LIMIT=15mb
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
```

## Install and Run

```bash
npm install
npm run dev
```

Production:

```bash
npm start
```

## Seed Sample Data

```bash
npm run seed
```

This creates:

- Default restaurant
- Sample categories
- Sample menu items
- Admin user
- Staff user

The seed command prints the restaurant ID. You will use that ID in QR URLs.

## Generate Table QR URLs

Generate scan URLs for all tables:

```bash
npm run qr:urls
```

Export the same data to CSV:

```bash
npm run qr:csv
```

Use a deployed frontend URL:

```bash
npm run qr:urls -- --base-url https://your-frontend-domain.com
npm run qr:csv -- --base-url https://your-frontend-domain.com
```

Use a specific restaurant ID:

```bash
npm run qr:urls -- --restaurant-id YOUR_RESTAURANT_ID
npm run qr:csv -- --restaurant-id YOUR_RESTAURANT_ID
```

Use a custom CSV path:

```bash
npm run qr:urls -- --csv output/my-table-qr-urls.csv
```

Example output:

```text
Table 1: http://localhost:5173/scan/<restaurantId>/1
Table 2: http://localhost:5173/scan/<restaurantId>/2
Table 3: http://localhost:5173/scan/<restaurantId>/3
```

Default CSV file:

```text
backend/output/table-qr-urls.csv
```

## Customer QR Flow

Customer QR codes now point to:

```text
/scan/:restaurantId/:tableNumber
```

The backend endpoints now expect `restaurantId` and `tableNumber` for:

- `POST /api/tables/validate`
- `POST /api/tables/session`

AI chat payloads also include `restaurantId` so session checks stay scoped to the correct restaurant.

## Sample Accounts

- Admin: `admin@tablemind.ai` / `Admin123!`
- Staff: `staff@tablemind.ai` / `Staff123!`

## API Overview

### Auth

- `POST /api/auth/login`
- `GET /api/auth/me`

### Restaurant

- `GET /api/restaurant`
- `PUT /api/restaurant/settings`

### Tables

- `POST /api/tables/validate`
- `POST /api/tables/session`
- `GET /api/tables/config`

Request example:

```json
{
  "restaurantId": "YOUR_RESTAURANT_ID",
  "tableNumber": 9
}
```

### Categories

- `GET /api/categories`
- `POST /api/categories`
- `PUT /api/categories/:id`
- `DELETE /api/categories/:id`

### Menu

- `GET /api/menu`
- `GET /api/menu/:id`
- `POST /api/menu`
- `PUT /api/menu/:id`
- `DELETE /api/menu/:id`

### Orders

- `POST /api/orders`
- `GET /api/orders`
- `GET /api/orders/:id`
- `PATCH /api/orders/:id/status`
- `GET /api/orders/table/:tableNumber`

### AI

- `GET /api/ai/chat`
- `POST /api/ai/chat`
- `POST /api/ai/recommend`
- `POST /api/ai/menu-from-image` (admin only)

### Admin

- `GET /api/admin/analytics`

## Notes

- All successful responses use:

```json
{
  "success": true,
  "message": "Human readable message",
  "data": {}
}
```

- Errors use:

```json
{
  "success": false,
  "message": "Human readable error message"
}
```

- If `GEMINI_API_KEY` is missing, AI endpoints return a safe menu-aware fallback response.
- Gemini model selection is configurable via `GEMINI_MODEL`. This project defaults to `gemini-2.5-flash`.
- If Cloudinary env vars are configured, admin dish-photo imports persist the image and prefill `imageUrl`.
- If dish-photo uploads are large, increase `REQUEST_BODY_LIMIT`. This project defaults to `15mb`.
