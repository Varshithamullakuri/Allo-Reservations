CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TYPE reservation_status AS ENUM ('PENDING', 'CONFIRMED', 'RELEASED', 'EXPIRED');

CREATE TABLE products (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  name VARCHAR NOT NULL,
  description VARCHAR,
  sku VARCHAR NOT NULL,
  created_at TIMESTAMP(6) NOT NULL DEFAULT (now() AT TIME ZONE 'utc'::text),
  updated_at TIMESTAMPTZ(6) DEFAULT (now() AT TIME ZONE 'utc'::text),
  CONSTRAINT products_pkey PRIMARY KEY (id)
);

CREATE TABLE warehouses (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  city TEXT NOT NULL,
  created_at TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
  CONSTRAINT warehouses_pkey PRIMARY KEY (id)
);

CREATE TABLE inventory (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL,
  warehouse_id UUID NOT NULL,
  total_stock INTEGER NOT NULL DEFAULT 0,
  reserved_stock INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
  CONSTRAINT inventory_pkey PRIMARY KEY (id),
  CONSTRAINT inventory_total_stock_non_negative CHECK (total_stock >= 0),
  CONSTRAINT inventory_reserved_stock_non_negative CHECK (reserved_stock >= 0),
  CONSTRAINT inventory_reserved_not_greater_than_total CHECK (reserved_stock <= total_stock)
);

CREATE TABLE reservations (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL,
  warehouse_id UUID NOT NULL,
  quantity INTEGER NOT NULL,
  status reservation_status NOT NULL DEFAULT 'PENDING',
  expires_at TIMESTAMPTZ(6) NOT NULL,
  created_at TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
  CONSTRAINT reservations_pkey PRIMARY KEY (id),
  CONSTRAINT reservations_quantity_positive CHECK (quantity > 0)
);

CREATE UNIQUE INDEX products_sku_key ON products(sku);
CREATE INDEX products_sku_idx ON products(sku);
CREATE UNIQUE INDEX warehouses_name_city_unique ON warehouses(name, city);
CREATE UNIQUE INDEX inventory_product_warehouse_unique ON inventory(product_id, warehouse_id);
CREATE INDEX inventory_product_id_idx ON inventory(product_id);
CREATE INDEX inventory_warehouse_id_idx ON inventory(warehouse_id);
CREATE INDEX reservations_status_expires_at_idx ON reservations(status, expires_at);

ALTER TABLE inventory
  ADD CONSTRAINT inventory_product_id_fkey
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE NO ACTION ON UPDATE NO ACTION;

ALTER TABLE inventory
  ADD CONSTRAINT inventory_warehouse_id_fkey
  FOREIGN KEY (warehouse_id) REFERENCES warehouses(id) ON DELETE NO ACTION ON UPDATE NO ACTION;

ALTER TABLE reservations
  ADD CONSTRAINT reservations_inventory_fk
  FOREIGN KEY (product_id, warehouse_id) REFERENCES inventory(product_id, warehouse_id) ON DELETE NO ACTION ON UPDATE NO ACTION;

ALTER TABLE reservations
  ADD CONSTRAINT reservations_product_fk
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE NO ACTION ON UPDATE NO ACTION;

ALTER TABLE reservations
  ADD CONSTRAINT reservations_warehouse_fk
  FOREIGN KEY (warehouse_id) REFERENCES warehouses(id) ON DELETE NO ACTION ON UPDATE NO ACTION;
