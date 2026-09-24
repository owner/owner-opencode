import { SharedConnection } from "@opencode-ai/schema/shared-connection"
import { Schema } from "effect"
import { HttpApiEndpoint, HttpApiGroup, HttpApiSchema, OpenApi } from "effect/unstable/httpapi"
import { ConflictError } from "../errors.js"

export const SharedConnectionGroup = HttpApiGroup.make("server.sharedConnection")
  .add(
    HttpApiEndpoint.get("sharedConnection.list", "/api/shared-connection", {
      success: Schema.Array(SharedConnection.Info),
    }).annotateMerge(
      OpenApi.annotations({
        identifier: "v2.sharedConnection.list",
        summary: "List shared connections",
        description: "List server-wide shared connection metadata without returning secret values.",
      }),
    ),
  )
  .add(
    HttpApiEndpoint.post("sharedConnection.create", "/api/shared-connection", {
      payload: SharedConnection.CreateInput,
      success: SharedConnection.Info,
      error: ConflictError,
    }).annotateMerge(
      OpenApi.annotations({
        identifier: "v2.sharedConnection.create",
        summary: "Create a shared connection",
        description: "Create a server-wide fallback connection for an integration.",
      }),
    ),
  )
  .add(
    HttpApiEndpoint.patch("sharedConnection.update", "/api/shared-connection/:integrationID", {
      params: { integrationID: SharedConnection.Info.fields.integrationID },
      payload: SharedConnection.UpdateInput,
      success: HttpApiSchema.NoContent,
    }).annotateMerge(
      OpenApi.annotations({
        identifier: "v2.sharedConnection.update",
        summary: "Update a shared connection",
        description: "Update the label or secret value of a server-wide shared connection.",
      }),
    ),
  )
  .add(
    HttpApiEndpoint.delete("sharedConnection.remove", "/api/shared-connection/:integrationID", {
      params: { integrationID: SharedConnection.Info.fields.integrationID },
      success: HttpApiSchema.NoContent,
    }).annotateMerge(
      OpenApi.annotations({
        identifier: "v2.sharedConnection.remove",
        summary: "Remove a shared connection",
        description: "Remove a server-wide shared connection.",
      }),
    ),
  )
  .annotateMerge(OpenApi.annotations({ title: "sharedConnection" }))
