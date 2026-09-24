import { sqliteTable, text } from "drizzle-orm/sqlite-core"
import { Timestamps } from "../database/schema.sql.js"
import type { SharedConnection } from "../shared-connection.js"
import type { Credential } from "../credential.js"

export const SharedConnectionTable = sqliteTable("shared_connection", {
  integration_id: text().$type<SharedConnection.Info["integrationID"]>().primaryKey(),
  label: text().notNull(),
  value: text({ mode: "json" }).$type<Credential.Value>().notNull(),
  ...Timestamps,
})
