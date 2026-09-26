-- Create enum type "appointment_status"
CREATE TYPE "appointment_status" AS ENUM ('confirmed', 'done', 'cancelled');
-- Create enum type "payment_method"
CREATE TYPE "payment_method" AS ENUM ('cash', 'pix', 'debit', 'credit');
-- Add value to enum type: "member_role"
ALTER TYPE "member_role" ADD VALUE 'manager' AFTER 'owner';
-- Create "services" table
CREATE TABLE "services" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" uuid NOT NULL,
  "name" character varying(120) NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT "PK_ba2d347a3168a296416c6c5ccb2" PRIMARY KEY ("id"),
  CONSTRAINT "FK_847c3b57ab049376d3380329a9c" FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id") ON UPDATE NO ACTION ON DELETE CASCADE
);
-- Create index "IDX_847c3b57ab049376d3380329a9" to table: "services"
CREATE INDEX "IDX_847c3b57ab049376d3380329a9" ON "services" ("tenant_id");
-- Modify "members" table
ALTER TABLE "members" ADD COLUMN "commission_rate" numeric(5,2) NULL;
-- Create "appointments" table
CREATE TABLE "appointments" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" uuid NOT NULL,
  "professional_id" uuid NOT NULL,
  "client_name" character varying(120) NOT NULL,
  "client_phone" character varying(11) NOT NULL,
  "start_at" timestamptz NOT NULL,
  "end_at" timestamptz NOT NULL,
  "status" "appointment_status" NOT NULL DEFAULT 'confirmed',
  "cancel_token" character varying(64) NOT NULL,
  "cancelled_at" timestamptz NULL,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT "PK_4a437a9a27e948726b8bb3e36ad" PRIMARY KEY ("id"),
  CONSTRAINT "FK_60b7a60cf6727d87d525a750414" FOREIGN KEY ("professional_id") REFERENCES "members" ("id") ON UPDATE NO ACTION ON DELETE CASCADE,
  CONSTRAINT "FK_75b2a97fbf18573d71d10561135" FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id") ON UPDATE NO ACTION ON DELETE CASCADE
);
-- Create index "IDX_39d339321f64bfd85880f24b1d" to table: "appointments"
CREATE INDEX "IDX_39d339321f64bfd85880f24b1d" ON "appointments" ("tenant_id", "professional_id", "start_at");
-- Create index "IDX_5500049ed9b24ad4f29c267483" to table: "appointments"
CREATE INDEX "IDX_5500049ed9b24ad4f29c267483" ON "appointments" ("tenant_id", "client_phone", "start_at");
-- Create index "IDX_ec2caf24b398d9d4fc0e7aea6e" to table: "appointments"
CREATE UNIQUE INDEX "IDX_ec2caf24b398d9d4fc0e7aea6e" ON "appointments" ("cancel_token");
-- Create "appointment_services" table
CREATE TABLE "appointment_services" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "appointment_id" uuid NOT NULL,
  "service_id" uuid NOT NULL,
  "price" numeric(10,2) NOT NULL,
  "duration_minutes" integer NOT NULL,
  CONSTRAINT "PK_8423f59b66c157533b4df8b0459" PRIMARY KEY ("id"),
  CONSTRAINT "FK_5aafcd787c270f1fd2e01376a6b" FOREIGN KEY ("service_id") REFERENCES "services" ("id") ON UPDATE NO ACTION ON DELETE RESTRICT,
  CONSTRAINT "FK_923e323e598280a0454e1d1b7cf" FOREIGN KEY ("appointment_id") REFERENCES "appointments" ("id") ON UPDATE NO ACTION ON DELETE CASCADE
);
-- Create index "IDX_923e323e598280a0454e1d1b7c" to table: "appointment_services"
CREATE INDEX "IDX_923e323e598280a0454e1d1b7c" ON "appointment_services" ("appointment_id");
-- Create "expense_entries" table
CREATE TABLE "expense_entries" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" uuid NOT NULL,
  "description" character varying(200) NOT NULL,
  "category" character varying(60) NULL,
  "amount" numeric(10,2) NOT NULL,
  "date" date NOT NULL,
  "recurring" boolean NOT NULL DEFAULT false,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT "PK_6167e65550782ed47b3c8f7be82" PRIMARY KEY ("id"),
  CONSTRAINT "FK_6e9eb5edc21c9ac56950445e54b" FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id") ON UPDATE NO ACTION ON DELETE CASCADE
);
-- Create index "IDX_6e9eb5edc21c9ac56950445e54" to table: "expense_entries"
CREATE INDEX "IDX_6e9eb5edc21c9ac56950445e54" ON "expense_entries" ("tenant_id");
-- Create "products" table
CREATE TABLE "products" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" uuid NOT NULL,
  "name" character varying(120) NOT NULL,
  "category" character varying(60) NULL,
  "price" numeric(10,2) NOT NULL,
  "cost" numeric(10,2) NOT NULL DEFAULT 0,
  "quantity" numeric(10,2) NOT NULL DEFAULT 0,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT "PK_0806c755e0aca124e67c0cf6d7d" PRIMARY KEY ("id"),
  CONSTRAINT "FK_9c365ebf78f0e8a6d9e4827ea70" FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id") ON UPDATE NO ACTION ON DELETE CASCADE
);
-- Create index "IDX_9c365ebf78f0e8a6d9e4827ea7" to table: "products"
CREATE INDEX "IDX_9c365ebf78f0e8a6d9e4827ea7" ON "products" ("tenant_id");
-- Create "professional_schedules" table
CREATE TABLE "professional_schedules" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" uuid NOT NULL,
  "professional_id" uuid NOT NULL,
  "weekday" smallint NOT NULL,
  "start_minute" integer NOT NULL,
  "end_minute" integer NOT NULL,
  "break_start_minute" integer NULL,
  "break_end_minute" integer NULL,
  CONSTRAINT "PK_90481c5d5bc68cf10f008590cc3" PRIMARY KEY ("id"),
  CONSTRAINT "FK_d733924c161bf403dea7f768343" FOREIGN KEY ("professional_id") REFERENCES "members" ("id") ON UPDATE NO ACTION ON DELETE CASCADE
);
-- Create index "IDX_b65bca96553dc479ff97296ccd" to table: "professional_schedules"
CREATE INDEX "IDX_b65bca96553dc479ff97296ccd" ON "professional_schedules" ("tenant_id");
-- Create index "IDX_c3a3a4baa2bf54865c28949da1" to table: "professional_schedules"
CREATE UNIQUE INDEX "IDX_c3a3a4baa2bf54865c28949da1" ON "professional_schedules" ("professional_id", "weekday");
-- Create "professional_services" table
CREATE TABLE "professional_services" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" uuid NOT NULL,
  "professional_id" uuid NOT NULL,
  "service_id" uuid NOT NULL,
  "price" numeric(10,2) NOT NULL,
  "duration_minutes" integer NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT "PK_0a792d3d12548bf1ae788f55654" PRIMARY KEY ("id"),
  CONSTRAINT "FK_2fad8b472d2afd9af6c048b715c" FOREIGN KEY ("service_id") REFERENCES "services" ("id") ON UPDATE NO ACTION ON DELETE CASCADE,
  CONSTRAINT "FK_34a4319abc2199d0e68811d1824" FOREIGN KEY ("professional_id") REFERENCES "members" ("id") ON UPDATE NO ACTION ON DELETE CASCADE
);
-- Create index "IDX_1c47f74d26f46a82df6811c317" to table: "professional_services"
CREATE INDEX "IDX_1c47f74d26f46a82df6811c317" ON "professional_services" ("tenant_id");
-- Create index "IDX_b3073a22d2e21fadf41fa8e255" to table: "professional_services"
CREATE UNIQUE INDEX "IDX_b3073a22d2e21fadf41fa8e255" ON "professional_services" ("professional_id", "service_id");
-- Create "professional_time_off" table
CREATE TABLE "professional_time_off" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" uuid NOT NULL,
  "professional_id" uuid NOT NULL,
  "date" date NOT NULL,
  "start_minute" integer NULL,
  "end_minute" integer NULL,
  CONSTRAINT "PK_f313f7e5d9b0fbad8a1fa493c79" PRIMARY KEY ("id"),
  CONSTRAINT "FK_583cec6738e69df0d1a9b26bb33" FOREIGN KEY ("professional_id") REFERENCES "members" ("id") ON UPDATE NO ACTION ON DELETE CASCADE
);
-- Create index "IDX_3f755eb6fb86ba8288b856c513" to table: "professional_time_off"
CREATE INDEX "IDX_3f755eb6fb86ba8288b856c513" ON "professional_time_off" ("tenant_id");
-- Create index "IDX_bb0fb0f612ea31f4523ae8e5cf" to table: "professional_time_off"
CREATE INDEX "IDX_bb0fb0f612ea31f4523ae8e5cf" ON "professional_time_off" ("professional_id", "date");
-- Create "revenue_entries" table
CREATE TABLE "revenue_entries" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" uuid NOT NULL,
  "appointment_id" uuid NOT NULL,
  "amount" numeric(10,2) NOT NULL,
  "payment_method" "payment_method" NOT NULL,
  "recorded_by_id" uuid NULL,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT "PK_0b8d96a086e3e8f411743a216ee" PRIMARY KEY ("id"),
  CONSTRAINT "REL_b00c5e7f8b4285602c890abd4e" UNIQUE ("appointment_id"),
  CONSTRAINT "FK_8dd04a400c7bf64f2deeb4e266b" FOREIGN KEY ("recorded_by_id") REFERENCES "members" ("id") ON UPDATE NO ACTION ON DELETE SET NULL,
  CONSTRAINT "FK_b00c5e7f8b4285602c890abd4eb" FOREIGN KEY ("appointment_id") REFERENCES "appointments" ("id") ON UPDATE NO ACTION ON DELETE CASCADE
);
-- Create index "IDX_82207676b839694688afb21fe3" to table: "revenue_entries"
CREATE INDEX "IDX_82207676b839694688afb21fe3" ON "revenue_entries" ("tenant_id");
-- Create index "IDX_b00c5e7f8b4285602c890abd4e" to table: "revenue_entries"
CREATE UNIQUE INDEX "IDX_b00c5e7f8b4285602c890abd4e" ON "revenue_entries" ("appointment_id");
-- Create "stock_items" table
CREATE TABLE "stock_items" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" uuid NOT NULL,
  "name" character varying(120) NOT NULL,
  "quantity" numeric(10,2) NOT NULL DEFAULT 0,
  "unit" character varying(20) NOT NULL,
  "min_quantity" numeric(10,2) NOT NULL DEFAULT 0,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT "PK_52a266aa3e04b8ad1f01088f3f0" PRIMARY KEY ("id"),
  CONSTRAINT "FK_598273c2e92c500b453fc8c4ae1" FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id") ON UPDATE NO ACTION ON DELETE CASCADE
);
-- Create index "IDX_598273c2e92c500b453fc8c4ae" to table: "stock_items"
CREATE INDEX "IDX_598273c2e92c500b453fc8c4ae" ON "stock_items" ("tenant_id");
-- Drop "tenant_clients" table
DROP TABLE "tenant_clients";
-- Drop "clients" table
DROP TABLE "clients";
