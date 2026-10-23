import { Resource } from "sst/resource"
import { defineConfig } from "drizzle-kit"

// drizzle-kit drops ssl options it does not list, including mysql2's verifyIdentity, and mysql2 skips the
// hostname check without it. Options in the URL reach mysql2 unchanged.
const ssl = encodeURIComponent(JSON.stringify({ rejectUnauthorized: true, verifyIdentity: true }))

export default defineConfig({
  dialect: "mysql",
  schema: ["./src/database/schema.ts"],
  // schema: ["./src/**/*.sql.ts"],
  out: "./migrations/",
  strict: true,
  verbose: true,
  dbCredentials: {
    url: `mysql://${encodeURIComponent(Resource.StatsDatabase.username)}:${encodeURIComponent(Resource.StatsDatabase.password)}@${Resource.StatsDatabase.host}:${Resource.StatsDatabase.port}/${Resource.StatsDatabase.database}?ssl=${ssl}`,
  },
})
