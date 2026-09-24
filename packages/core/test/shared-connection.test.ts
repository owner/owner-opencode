import { describe, expect } from "bun:test"
import { Effect } from "effect"
import { Database } from "@opencode-ai/core/database/database"
import { SharedConnection } from "@opencode-ai/core/shared-connection"
import { Integration } from "@opencode-ai/core/integration"
import { LayerNode } from "@opencode-ai/util/effect/layer-node"
import { testEffect } from "./lib/effect"

const it = testEffect(LayerNode.compile(LayerNode.group([SharedConnection.node, Database.node])))

describe("SharedConnection", () => {
  it.effect("stores and updates fallback values while keeping list results secret-free", () =>
    Effect.gen(function* () {
      const shared = yield* SharedConnection.Service
      const integrationID = Integration.ID.make("datadog")
      const created = yield* shared.create({
        integrationID,
        value: { type: "key", key: "shared-secret" },
      })

      expect(created).toEqual({ integrationID, label: "Shared" })
      expect(yield* shared.list()).toEqual([created])
      expect(yield* shared.get(integrationID)).toEqual({
        ...created,
        value: { type: "key", key: "shared-secret" },
      })

      yield* shared.update(integrationID, { label: "Datadog shared read-only", value: { type: "key", key: "rotated" } })
      expect(yield* shared.list()).toEqual([{ integrationID, label: "Datadog shared read-only" }])
      expect((yield* shared.get(integrationID))?.value).toEqual({ type: "key", key: "rotated" })

      yield* shared.remove(integrationID)
      expect(yield* shared.list()).toEqual([])
    }),
  )

  it.effect("rejects a second shared connection for the same integration", () =>
    Effect.gen(function* () {
      const shared = yield* SharedConnection.Service
      const integrationID = Integration.ID.make("datadog")
      yield* shared.create({ integrationID, value: { type: "key", key: "first" } })

      expect(
        yield* shared.create({ integrationID, value: { type: "key", key: "second" } }).pipe(Effect.flip),
      ).toBeInstanceOf(SharedConnection.ConflictError)
    }),
  )
})
