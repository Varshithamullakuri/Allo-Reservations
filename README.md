# Allo Reservations

A production-ready ecommerce inventory reservation system built with Next.js 15, TypeScript, Tailwind CSS, shadcn-style UI components, Prisma, PostgreSQL, Zod, and TanStack Query.

The core behavior mirrors checkout stock holds: inventory can be reserved for a short window, confirmed into a sale, released by the user, or expired by cleanup. The backend is designed to prevent overselling under concurrent requests.

## Architecture

- `app/` contains Next.js App Router pages and REST route handlers.
- `services/` contains the business logic and transaction boundaries.
- `schemas/` contains Zod validation shared by API and actions.
- `components/` contains shadcn-style reusable UI and feature components.
- `hooks/` contains TanStack Query hooks for frontend state.
- `lib/` contains Prisma, errors, API responses, constants, and utilities.
- `prisma/` contains schema, migrations, and seed data.
- `scripts/` contains the scheduled expiry utility.

## Database

The system uses four core tables:

- `Product`: catalog item with `sku`, `name`, and `description`.
- `Warehouse`: fulfillment location.
- `inventory`: stock per `(product_id, warehouse_id)`.
- `reservations`: pending, confirmed, released, or expired stock hold.

`inventory` has a unique constraint on `(product_id, warehouse_id)`.

Available stock is calculated as:

```txt
availableStock = totalStock - reservedStock
```

The included migration also adds check constraints so stock cannot become negative and `reservedStock` cannot exceed `totalStock`.

## Concurrency Handling

The critical reservation path is implemented in [services/reservation.service.ts](services/reservation.service.ts).

`POST /api/reservations` performs:

1. Starts a Prisma transaction.
2. Locks the exact inventory row with:

```sql
SELECT id, total_stock, reserved_stock
FROM inventory
WHERE product_id = $1
  AND warehouse_id = $2
FOR UPDATE
```

3. Calculates available stock while the row is locked.
4. Throws `409 Conflict` if stock is insufficient.
5. Increments `reservedStock`.
6. Creates the reservation with a 10-minute expiry.
7. Commits the transaction.

If stock is `1` and two users reserve simultaneously, one transaction locks and commits first. The second waits, reads the updated `reservedStock`, sees `availableStock = 0`, and receives `409 Conflict`.

Confirm and release also lock the reservation row and inventory row inside transactions. Confirm is retry-safe for an already confirmed reservation, and release is retry-safe for an already released reservation.

## Reservation Expiry

Reservations expire after 10 minutes.

Expiry is handled by a scheduled cleanup utility plus lazy cleanup before inventory/reservation reads:

```bash
npm run reservations:expire
```

The cleanup uses `FOR UPDATE SKIP LOCKED` so multiple cleanup workers can safely run at the same time:

```sql
SELECT id, product_id, warehouse_id, quantity
FROM reservations
WHERE status = 'PENDING'
  AND expires_at <= NOW()
FOR UPDATE SKIP LOCKED
```

There is also an HTTP job endpoint:

```bash
curl -X POST http://localhost:3000/api/jobs/expire-reservations
```

## API

### `GET /api/products`

Returns products with warehouse inventory:

```json
{
  "data": [
    {
      "id": "11111111-1111-1111-1111-111111111111",
      "name": "iPhone 15",
      "sku": "IPHONE-15-128-BLK",
      "inventories": [
        {
          "warehouseId": "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
          "totalStock": 10,
          "reservedStock": 0,
          "availableStock": 10
        }
      ]
    }
  ]
}
```

### `GET /api/products/:id`

Returns detailed product inventory.

### `POST /api/reservations`

Body:

```json
{
  "productId": "11111111-1111-1111-1111-111111111111",
  "warehouseId": "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
  "quantity": 1
}
```

Responses:

- `201 Created` with reservation data.
- `400 Bad Request` for Zod validation errors.
- `404 Not Found` when inventory does not exist.
- `409 Conflict` when stock is insufficient.

### `GET /api/reservations/:id`

Returns reservation details.

### `POST /api/reservations/:id/confirm`

Confirms a pending reservation, decrements `totalStock`, decrements `reservedStock`, and marks the reservation `CONFIRMED`.

### `POST /api/reservations/:id/release`

Releases a pending reservation, decrements `reservedStock`, and marks the reservation `RELEASED`.

### `GET /api/reservations`

Returns recent reservation history for the admin dashboard.

### `GET /api/dashboard`

Returns inventory metrics, product inventory, and recent reservations.

## Frontend

Pages:

- `/`: product listing with warehouse inventory, available stock, quantity input, reserve action, loading states, and toast errors.
- `/reservations/:id`: checkout page with reservation details, countdown timer, confirm, and cancel flow.
- `/reservations/:id/success`: confirmation success state.
- `/dashboard`: admin metrics, inventory analytics, and reservation history.

Frontend state is handled with TanStack Query. Mutations invalidate inventory, reservation history, and dashboard cache entries after successful operations.

## Setup

Requirements:

- Node.js 22+
- PostgreSQL 16+
- npm

Create your environment file:

```bash
cp .env.example .env
```

Install dependencies:

```bash
npm install
```

Run migrations:

```bash
npx prisma migrate dev
```

Seed data:

```bash
npm run seed
```

Start development:

```bash
npm run dev
```

Open:

```txt
http://localhost:3000
```

## Docker

Start PostgreSQL and the Next.js app:

```bash
docker compose up --build
```

The app container runs:

```bash
npx prisma migrate deploy
npm run seed
npm run start
```

Default Docker database URL:

```txt
postgresql://postgres:postgres@postgres:5432/allo_reservations?schema=public
```

## Seed Data

Products:

- iPhone 15
- MacBook Pro
- AirPods

Warehouses:

- Chennai
- Bangalore
- Hyderabad

Example inventory:

- iPhone Chennai stock: 10
- iPhone Bangalore stock: 5
- MacBook Pro Chennai stock: 4
- AirPods Chennai stock: 25

## Concurrency Smoke Test

After seeding, set one inventory row to stock `1` in PostgreSQL, then fire two reservation requests at the same product and warehouse at the same time:

```bash
curl -s -X POST http://localhost:3000/api/reservations \
  -H "Content-Type: application/json" \
  -d '{"productId":"11111111-1111-1111-1111-111111111111","warehouseId":"aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa","quantity":1}' &

curl -s -X POST http://localhost:3000/api/reservations \
  -H "Content-Type: application/json" \
  -d '{"productId":"11111111-1111-1111-1111-111111111111","warehouseId":"aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa","quantity":1}' &

wait
```

Expected result: one request returns `201 Created`; the other returns `409 Conflict`.

## Design Decisions

- Route handlers are thin and delegate to services.
- Services own transactions and locking.
- Raw SQL is used only where PostgreSQL row-level locking is required.
- Prisma is still used for typed reads/writes around the lock.
- Expiry cleanup is idempotent and can be safely called by a scheduler.
- The frontend avoids optimistic stock decrements because inventory correctness belongs to the database.

## Tradeoffs

- No Redis lock is included because PostgreSQL row locks are sufficient for the single database write path.
- Expiry is implemented as a scheduled utility plus lazy API cleanup instead of a long-running worker.
- Authentication is not included; production admin routes should be protected.
- Payments and order creation are intentionally outside this inventory reservation boundary.

## Future Improvements

- Add authentication and role-based admin access.
- Add idempotency keys for create reservation requests.
- Add WebSocket or SSE stock updates.
- Add audit logs for every inventory mutation.
- Add integration tests with concurrent reservation workers.
- Add monitoring around transaction wait time and conflict rates.
