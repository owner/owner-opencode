import { SharedConnection } from "@opencode-ai/core/shared-connection"
import { ConflictError } from "@opencode-ai/protocol/errors"
import { Effect } from "effect"
import { HttpApiBuilder, HttpApiSchema } from "effect/unstable/httpapi"
import { Api } from "../api"

export const SharedConnectionHandler = HttpApiBuilder.group(Api, "server.sharedConnection", (handlers) =>
  Effect.gen(function* () {
    const shared = yield* SharedConnection.Service
    return handlers
      .handle(
        "sharedConnection.list",
        Effect.fn(() => shared.list()),
      )
      .handle(
        "sharedConnection.create",
        Effect.fn(function* (ctx) {
          return yield* shared.create(ctx.payload).pipe(
            Effect.mapError(
              (error) =>
                new ConflictError({
                  resource: error.integrationID,
                  message: `A shared connection already exists for integration ${error.integrationID}`,
                }),
            ),
          )
        }),
      )
      .handle(
        "sharedConnection.update",
        Effect.fn(function* (ctx) {
          yield* shared.update(ctx.params.integrationID, ctx.payload)
          return HttpApiSchema.NoContent.make()
        }),
      )
      .handle(
        "sharedConnection.remove",
        Effect.fn(function* (ctx) {
          yield* shared.remove(ctx.params.integrationID)
          return HttpApiSchema.NoContent.make()
        }),
      )
  }),
)
