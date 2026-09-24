export * as SharedConnection from "./shared-connection.js"

import { Schema } from "effect"
import { Credential } from "./credential.js"
import { IntegrationID } from "./integration-id.js"

export class Info extends Schema.Class<Info>("SharedConnection.Info")({
  integrationID: IntegrationID,
  label: Schema.String,
}) {}

export const CreateInput = Schema.Struct({
  integrationID: IntegrationID,
  label: Schema.optional(Schema.String),
  value: Credential.Value,
})
export type CreateInput = typeof CreateInput.Type

export const UpdateInput = Schema.Struct({
  label: Schema.optional(Schema.String),
  value: Schema.optional(Credential.Value),
})
export type UpdateInput = typeof UpdateInput.Type
