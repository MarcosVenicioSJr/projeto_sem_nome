// Atlas config — schema migrations for scheduling-api.
// Desired schema comes from the TypeORM entities (loaded by the provider);
// applied history lives in src/app/database/migrations/*.sql (+ atlas.sum).
//
// Run from apps/scheduling-api/, with the root .env loaded, e.g.:
//   npx nx run scheduling-api:migrate-diff -- <name>
//   npx nx run scheduling-api:migrate-apply
//   npx nx run scheduling-api:migrate-status

data "external_schema" "typeorm" {
  // atlas-load.mjs = the TypeORM provider, with uuid_generate_v4() rewritten
  // to gen_random_uuid() (PG 13+ core, no extension).
  program = ["node", "atlas-load.mjs"]
}

locals {
  db_url = "postgres://${getenv("DB_USER")}:${getenv("DB_PASSWORD")}@${getenv("DB_HOST")}:${getenv("DB_PORT")}/${getenv("DB_NAME")}?sslmode=disable"
}

env "local" {
  src = data.external_schema.typeorm.url
  // Ephemeral database Atlas uses to plan/normalize the schema (needs Docker).
  dev = "docker://postgres/16/dev?search_path=public"
  // Target database migrations are applied to.
  url = local.db_url

  migration {
    dir = "file://src/app/database/migrations"
  }

  format {
    migrate {
      diff = "{{ sql . \"  \" }}"
    }
  }
}
