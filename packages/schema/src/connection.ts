export * as Connection from "./connection.js"

import { Schema } from "effect"
import { Credential } from "./credential.js"
import { IntegrationID } from "./integration-id.js"

export interface CredentialInfo extends Schema.Schema.Type<typeof CredentialInfo> {}
export const CredentialInfo = Schema.Struct({
  type: Schema.Literal("credential"),
  id: Credential.ID,
  label: Schema.String,
}).annotate({ identifier: "Connection.CredentialInfo" })

export interface EnvInfo extends Schema.Schema.Type<typeof EnvInfo> {}
export const EnvInfo = Schema.Struct({
  type: Schema.Literal("env"),
  name: Schema.String,
}).annotate({ identifier: "Connection.EnvInfo" })

export interface SharedInfo extends Schema.Schema.Type<typeof SharedInfo> {}
export const SharedInfo = Schema.Struct({
  type: Schema.Literal("shared"),
  integrationID: IntegrationID,
  label: Schema.String,
}).annotate({ identifier: "Connection.SharedInfo" })

export const Info = Schema.Union([CredentialInfo, EnvInfo])
  .pipe(Schema.toTaggedUnion("type"))
  .annotate({ identifier: "Connection.Info" })
export type Info = typeof Info.Type

export const ActiveInfo = Schema.Union([CredentialInfo, EnvInfo, SharedInfo])
  .pipe(Schema.toTaggedUnion("type"))
  .annotate({ identifier: "Connection.ActiveInfo" })
export type ActiveInfo = typeof ActiveInfo.Type
