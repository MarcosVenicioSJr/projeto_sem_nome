-- Create enum type "verification_codes_purpose_enum"
CREATE TYPE "verification_codes_purpose_enum" AS ENUM ('registration', 'password_reset');
-- Create enum type "users_status_enum"
CREATE TYPE "users_status_enum" AS ENUM ('pending_verification', 'active', 'blocked');
-- Create "refresh_tokens" table
CREATE TABLE "refresh_tokens" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "user_id" uuid NOT NULL,
  "token_hash" character varying NOT NULL,
  "device_info" character varying NULL,
  "expires_at" timestamptz NOT NULL,
  "revoked_at" timestamptz NULL,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT "PK_7d8bee0204106019488c4c50ffa" PRIMARY KEY ("id")
);
-- Create index "IDX_3ddc983c5f7bcf132fd8732c3f" to table: "refresh_tokens"
CREATE INDEX "IDX_3ddc983c5f7bcf132fd8732c3f" ON "refresh_tokens" ("user_id");
-- Create "terms_acceptances" table
CREATE TABLE "terms_acceptances" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "user_id" uuid NOT NULL,
  "terms_version" character varying NOT NULL,
  "consent_recommendations" boolean NOT NULL DEFAULT false,
  "consent_marketing" boolean NOT NULL DEFAULT false,
  "accepted_at" timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT "PK_6862bb2dab40bd9f9a6ec2098b8" PRIMARY KEY ("id")
);
-- Create index "IDX_64be8234615202977baf55453b" to table: "terms_acceptances"
CREATE INDEX "IDX_64be8234615202977baf55453b" ON "terms_acceptances" ("user_id");
-- Create "users" table
CREATE TABLE "users" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "name" character varying(120) NOT NULL,
  "username" character varying(20) NOT NULL,
  "email" character varying NOT NULL,
  "password_hash" character varying NOT NULL,
  "birth_date" date NOT NULL,
  "status" "users_status_enum" NOT NULL DEFAULT 'pending_verification',
  "email_verified_at" timestamptz NULL,
  "favorite_genres" text NOT NULL DEFAULT '',
  "failed_login_attempts" integer NOT NULL DEFAULT 0,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id")
);
-- Create index "IDX_97672ac88f789774dd47f7c8be" to table: "users"
CREATE UNIQUE INDEX "IDX_97672ac88f789774dd47f7c8be" ON "users" ("email");
-- Create index "IDX_fe0bb3f6520ee0469504521e71" to table: "users"
CREATE UNIQUE INDEX "IDX_fe0bb3f6520ee0469504521e71" ON "users" ("username");
-- Create "verification_codes" table
CREATE TABLE "verification_codes" (
  "id" uuid NOT NULL DEFAULT gen_random_uuid(),
  "user_id" uuid NOT NULL,
  "code_hash" character varying NOT NULL,
  "purpose" "verification_codes_purpose_enum" NOT NULL,
  "expires_at" timestamptz NOT NULL,
  "attempts_count" integer NOT NULL DEFAULT 0,
  "consumed_at" timestamptz NULL,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT "PK_18741b6b8bf1680dbf5057421d7" PRIMARY KEY ("id")
);
-- Create index "IDX_0a53c41a810420ee446082ce6c" to table: "verification_codes"
CREATE INDEX "IDX_0a53c41a810420ee446082ce6c" ON "verification_codes" ("user_id");
