import { createSimpleContext } from "@opencode-ai/ui/context"

export const { use: useEmbedded, provider: EmbeddedProvider } = createSimpleContext({
  name: "Embedded",
  init: (props: { embedded?: boolean }) => ({
    embedded: props.embedded ?? false,
  }),
})
