# Forge embedding on v2.2.5

This fork's stable baseline is upstream tag `v2.2.5`. The Forge commits on top
port the embedding patches first written against v2.0.32. Do not replay the old
fork's test timing changes or overwrite stable's generated clients.

## Host contract

- Import `AppBaseProviders`, `AppInterface`, `PlatformProvider`, `Platform`, and
  `ServerConnection` from `@opencode/app`. The package scope changed from
  `@opencode-ai/*` to `@opencode/*`.
- Mount `PlatformProvider` outside `AppBaseProviders`, then render
  `AppInterface embedded servers={[connection]} router={HostRouter}` inside it.
  `AppBaseProviders` includes the stable `PluginRoot` (named `ExtensionRoot`
  before v2.2); keep it mounted.
- `AppInterface` no longer accepts `defaultServer`. `Platform` no longer has
  `getDefaultServer` or `setDefaultServer`. The route selects the server.
- An HTTP connection is `{ type: "http", http: { url, password? } }`. Its key is
  `ServerConnection.key(connection)`. Use the full absolute task proxy URL,
  such as `https://forge.owner.sh/api/v2/opencode-host/<task-id>`.
- A session route is
  `/server/${base64Encode(ServerConnection.key(connection))}/session/${sessionID}`;
  import `base64Encode` from `@opencode/util/encode`. A host-owned
  `createMemoryHistory()` can select it with
  `history.set({ value: route, replace: true, scroll: false })`. Pass a stable
  router component rendering `<MemoryRouter {...props} history={history} />`.
- Mount and load the app bundle inside the iframe's own window/document. Give
  its root a bounded full height and dispose the Solid render root on teardown.
  Styles, theme/font writes, keyboard handlers, workers, and platform callbacks
  then belong to that iframe. Namespace host-provided storage for the stable UI
  when running it beside the legacy UI.
- The web platform must supply `platform: "web"`, `openExternal`, `restart`,
  and `notify`. `storage`, `draftStore`, and `fetch` remain optional host hooks.
  No desktop plugin bridge is required for web rendering.

Embedded mode hides the titlebar, vertical tab sidebar and its collapsed toggle,
session identity header, timeline header, mobile view tabs, mobile location bar,
and floating review toggle. Mobile stays on the conversation. The timeline
retains a 16px headerless inset at both viewport sizes. Standalone mode keeps
upstream layout and plugin behavior.

Server controllers are disposed on provider teardown through the same disposer
used for credential changes and server removal, including the credentials map.
The timeline waits for document adoption before attaching and recovers silent
scroll resets without taking over native touch momentum or size compensation.

`charon_execute` and `executor_execute` display expandable, highlighted
JavaScript and output. Native `execute` keeps upstream's v2.2 renderer (call
rows and a code dialog), which depends on metadata the gateway tools don't
emit. Highlighting uses the existing Markdown worker and falls back to raw code
if unavailable.

### Dropped since v2.0.32

- Undated models: v2.2.5 maps `time.released === 0` to an empty
  `release_date` natively.
- Path-prefixed client `baseUrl` and PTY proxy paths: v2.2.5 preserves the
  connection URL's path prefix for both.

## Dependencies and build

Install the complete stable workspace with its lockfile:

```sh
mise x bun@1.4.4 -- bun install --frozen-lockfile
mise x bun@1.4.4 -- bun run check
mise x bun@1.4.4 -- bun run --cwd packages/app build
```

For focused iteration, run `bun typecheck` in `packages/app` and
`packages/session-ui`. The build emits `packages/app/dist`.

The stable app directly needs the local `@opencode/client`, `schema`,
`gui-plugins` (formerly `gui-extensions`), `plugin`, `session-ui`, `ui`, and
`util` packages. Preserve their transitive workspace dependencies, including
`protocol` and `plugin-browser`; adding only the old app/ui aliases is
insufficient. v2.2.5 uses Effect
4.0.6, Solid 1.9.17, Vite 8.2.4, and Tailwind 4.3.3 for the app. Keep the
lockfile patches, especially Solid, TanStack virtual-core, and the stable
Vite/worker configuration. `@opencode/client` pins its `effect` peer to the
catalog version (4.0.6) because `catalog:` does not resolve when the package is
linked outside this workspace. `@opencode/app/vite` exports the app's Vite plugins
and configures its source alias, workers, Tailwind, and Solid compiler.

Keep the stable entry's dependency resolution separate from legacy package
aliases when building both UIs. Compile the stable sources and load their CSS
inside the iframe. Do not alias stable packages back to the legacy vendored tree.

Stable already preserves path prefixes for generated HTTP calls, PTY sockets,
and persistent PTY sockets. HTTP and socket routes append `/api/...` to the
connection URL. The app request queue classifies paths relative to the current
server URL so prefixed SSE bypasses the queue, filesystem/git reads use the slow
slots, and worktree creation keeps its ten-minute response-header budget. The
host proxy still needs to support both HTTP and WebSocket requests and streaming
responses.

Before rollout, verify the parent wrapper against a v2.2.5 sandbox: session
load and streaming, task switches/remounts, mobile scrolling, tool expansion,
undated model visibility, and HTTP plus both PTY paths. A fork build alone does
not establish those host/runtime contracts.
