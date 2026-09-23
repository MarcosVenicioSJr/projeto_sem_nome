-- Create enum type "member_role"
CREATE TYPE "member_role" AS ENUM ('owner', 'employee');
-- Create "tenants" table
CREATE TABLE "tenants" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "name" character varying(120) NOT NULL,
  "slug" character varying(60) NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT "PK_53be67a04681c66b87ee27c9321" PRIMARY KEY ("id")
);
-- Create index "IDX_2310ecc5cb8be427097154b18f" to table: "tenants"
CREATE UNIQUE INDEX "IDX_2310ecc5cb8be427097154b18f" ON "tenants" ("slug");
-- Create "members" table
CREATE TABLE "members" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" uuid NOT NULL,
  "role" "member_role" NOT NULL,
  "name" character varying(120) NOT NULL,
  "email" character varying NOT NULL,
  "phone" character varying(11) NOT NULL,
  "password_hash" character varying NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT "PK_28b53062261b996d9c99fa12404" PRIMARY KEY ("id"),
  CONSTRAINT "FK_844f9f34eaefdb094ef9664dc65" FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id") ON UPDATE NO ACTION ON DELETE CASCADE
);
-- Create index "IDX_2714af51e3f7dd42cf66eeb08d" to table: "members"
CREATE UNIQUE INDEX "IDX_2714af51e3f7dd42cf66eeb08d" ON "members" ("email");
-- Create index "IDX_844f9f34eaefdb094ef9664dc6" to table: "members"
CREATE INDEX "IDX_844f9f34eaefdb094ef9664dc6" ON "members" ("tenant_id");
-- Create "clients" table
CREATE TABLE "clients" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "name" character varying(120) NOT NULL,
  "email" character varying NOT NULL,
  "phone" character varying(11) NOT NULL,
  "password_hash" character varying NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT "PK_f1ab7cf3a5714dbc6bb4e1c28a4" PRIMARY KEY ("id")
);
-- Create index "IDX_b48860677afe62cd96e1265948" to table: "clients"
CREATE UNIQUE INDEX "IDX_b48860677afe62cd96e1265948" ON "clients" ("email");
-- Create "tenant_clients" table
CREATE TABLE "tenant_clients" (
  "tenant_id" uuid NOT NULL,
  "client_id" uuid NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT "PK_e5b3aa7283c02d0850270662f48" PRIMARY KEY ("tenant_id", "client_id"),
  CONSTRAINT "FK_cae6e12445563039851a44d3586" FOREIGN KEY ("client_id") REFERENCES "clients" ("id") ON UPDATE NO ACTION ON DELETE CASCADE,
  CONSTRAINT "FK_fb26eccd2e4381120ed1f5b5a4e" FOREIGN KEY ("tenant_id") REFERENCES "tenants" ("id") ON UPDATE NO ACTION ON DELETE CASCADE
);
-- Create index "IDX_cae6e12445563039851a44d358" to table: "tenant_clients"
CREATE INDEX "IDX_cae6e12445563039851a44d358" ON "tenant_clients" ("client_id");
