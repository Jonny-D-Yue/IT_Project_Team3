# TableMind AI Frontend

Frontend app for TableMind AI, covering customer ordering, staff operations, and admin management.

## Stack

- React
- Vite
- TailwindCSS
- React Router DOM
- Axios
- Context API
- Socket.IO client

## Run Locally

```bash
cd frontend
npm install
npm run dev
```

## Environment

```env
VITE_API_BASE_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

## Main Areas

- Customer ordering flow with QR-based table scan
- Staff live dashboard with socket updates
- Admin dashboard for menu, categories, tables, and analytics

## Notes

- Customer session state is persisted in localStorage with:
  - `restaurantId`
  - `tableNumber`
  - `sessionToken`
- Auth state is persisted for staff/admin.
- Cart state is persisted in localStorage.

## Customer QR Flow

Customer table entry now starts from:

```text
/scan/:restaurantId/:tableNumber
```

The scan page:

1. reads params from the URL,
2. validates the table with the backend,
3. creates a table session,
4. stores the session in localStorage,
5. redirects to `/menu`.

If the customer already has a valid stored session, protected customer routes continue working after refresh.

The backend can also export all table scan URLs to CSV for printing or handing off to a QR generator.

## API Smoke Checklist

1. Start the backend and confirm `GET /api/health` responds.
2. Visit `/scan/:restaurantId/:tableNumber` with a real restaurant ID and confirm a session is created automatically.
3. Open `/menu`, confirm categories and menu items load.
4. Add items to cart and place an order from `/checkout`.
5. Open `/assistant` and confirm chat history and new messages work for the scanned session.
6. Sign in at `/staff/login` and confirm the new order appears on the dashboard.
7. Sign in at `/admin/login`, then test category CRUD, menu CRUD, table settings, and analytics.
