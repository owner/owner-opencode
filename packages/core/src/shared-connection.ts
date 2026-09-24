export * as SharedConnection from "./shared-connection.js"

import { asc, eq } from "drizzle-orm"
import { Context, Effect, Layer, Schema } from "effect"
import { SharedConnection } from "@opencode-ai/schema/shared-connection"
import { Integration } from "@opencode-ai/schema/integration"
import { Credential } from "./credential.js"
import { Database } from "./database/database.js"
import { makeGlobalNode } from "@opencode-ai/util/effect/app-node"
import { SharedConnectionTable } from "./shared-connection/sql.js"

export const Info = SharedConnection.Info
export type Info = SharedConnection.Info

export class ConflictError extends Schema.TaggedError<ConflictError>()("SharedConnection.ConflictError", {
  integrationID: Integration.ID,
}) {}

type Stored = Info & { readonly value: Credential.Value }

export interface Interface {
  /** Lists shared connections without returning their secret values. */
  readonly list: () => Effect.Effect<Info[]>
  /** Reads one shared connection for runtime resolution. */
  readonly get: (integrationID: Info["integrationID"]) => Effect.Effect<Stored | undefined>
  /** Creates the server-wide fallback connection for an integration. */
  readonly create: (input: SharedConnection.CreateInput) => Effect.Effect<Info, ConflictError>
  /** Updates a shared connection's label or secret value. */
  readonly update: (integrationID: Info["integrationID"], updates: SharedConnection.UpdateInput) => Effect.Effect<void>
  /** Removes a shared connection. */
  readonly remove: (integrationID: Info["integrationID"]) => Effect.Effect<void>
}

export class Service extends Context.Service<Service, Interface>()("@opencode/SharedConnection") {}

const layer = Layer.effect(
  Service,
  Effect.gen(function* () {
    const db = (yield* Database.Service).db
    const decode = Schema.decodeUnknownSync(Credential.Value)
    const info = (row: typeof SharedConnectionTable.$inferSelect) =>
      new Info({ integrationID: row.integration_id, label: row.label })
    const stored = (row: typeof SharedConnectionTable.$inferSelect): Stored => ({
      ...info(row),
      value: decode(row.value),
    })

    return Service.of({
      list: Effect.fn("SharedConnection.list")(() =>
        db
          .select()
          .from(SharedConnectionTable)
          .orderBy(asc(SharedConnectionTable.integration_id))
          .all()
          .pipe(
            Effect.orDie,
            Effect.map((rows) => rows.map(info)),
          ),
      ),
      get: Effect.fn("SharedConnection.get")((integrationID) =>
        db
          .select()
          .from(SharedConnectionTable)
          .where(eq(SharedConnectionTable.integration_id, integrationID))
          .get()
          .pipe(
            Effect.orDie,
            Effect.map((row) => (row ? stored(row) : undefined)),
          ),
      ),
      create: Effect.fn("SharedConnection.create")(function* (input) {
        const row = yield* db
          .insert(SharedConnectionTable)
          .values({
            integration_id: input.integrationID,
            label: input.label ?? "Shared",
            value: input.value,
          })
          .onConflictDoNothing()
          .returning()
          .get()
          .pipe(Effect.orDie)
        if (!row) return yield* new ConflictError({ integrationID: input.integrationID })
        return info(row)
      }),
      update: Effect.fn("SharedConnection.update")(function* (integrationID, updates) {
        if (updates.label === undefined && updates.value === undefined) return
        const current = yield* db
          .select({ label: SharedConnectionTable.label })
          .from(SharedConnectionTable)
          .where(eq(SharedConnectionTable.integration_id, integrationID))
          .get()
          .pipe(Effect.orDie)
        if (!current) return
        if (updates.label === current.label && updates.value === undefined) return
        yield* db
          .update(SharedConnectionTable)
          .set({ label: updates.label, value: updates.value })
          .where(eq(SharedConnectionTable.integration_id, integrationID))
          .run()
          .pipe(Effect.orDie)
      }),
      remove: Effect.fn("SharedConnection.remove")((integrationID) =>
        db
          .delete(SharedConnectionTable)
          .where(eq(SharedConnectionTable.integration_id, integrationID))
          .run()
          .pipe(Effect.orDie),
      ),
    })
  }),
)

export const node = makeGlobalNode({ service: Service, layer, deps: [Database.node] })
