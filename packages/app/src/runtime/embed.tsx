import { createContext, useContext, type ParentProps } from "solid-js"

const EmbeddedContext = createContext({ embedded: false })

export function EmbeddedProvider(props: ParentProps<{ embedded?: boolean }>) {
  const value = {
    get embedded() {
      return props.embedded ?? false
    },
  }

  return <EmbeddedContext.Provider value={value}>{props.children}</EmbeddedContext.Provider>
}

export function useEmbedded() {
  return useContext(EmbeddedContext)
}
