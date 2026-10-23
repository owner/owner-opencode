import { Resource } from "sst"
import { defineConfig } from "drizzle-kit"

// drizzle-kit drops ssl options it does not list, including mysql2's verifyIdentity, and mysql2 skips the
// hostname check without it. Options in the URL reach mysql2 unchanged.
const ssl = encodeURIComponent(JSON.stringify({ rejectUnauthorized: true, verifyIdentity: true }))

export default defineConfig({
  out: "./migrations/",
  strict: true,
  schema: ["./src/**/*.sql.ts"],
  verbose: true,
  dialect: "mysql",
  dbCredentials: {
    url: `mysql://${encodeURIComponent(Resource.Database.username)}:${encodeURIComponent(Resource.Database.password)}@${Resource.Database.host}:${Resource.Database.port}/${Resource.Database.database}?ssl=${ssl}`,
  },
})
