import { createEffect, createMemo, onCleanup } from "solid-js"
import { toaster } from "@opencode-ai/ui/toast"
import type { UpdaterState } from "@/updater"
import { usePlatform } from "@/context/platform"
import { useLanguage } from "@/context/language"
import { showToast } from "@/utils/toast"

export function updaterAction(state: UpdaterState | undefined) {
  if (!state) return { label: "settings.updates.action.checkNow" as const }
  switch (state.status) {
    case "checking":
      return { label: "settings.updates.action.checking" as const }
    case "downloading":
      return { label: "settings.updates.action.downloading" as const }
    case "ready":
      return { label: "toast.update.action.installRestart" as const, run: "install" as const }
    case "installing":
      return { label: "settings.updates.action.installing" as const }
    case "disabled":
      return { label: "settings.updates.action.checkNow" as const }
    default:
      return { label: "settings.updates.action.checkNow" as const, run: "check" as const }
  }
}

export function isUpdaterActionVisible(state: UpdaterState | undefined) {
  return state?.status !== "downloading"
}

export function useUpdaterAction() {
  const platform = usePlatform()
  const language = useLanguage()
  const action = createMemo(() => updaterAction(platform.updater?.state()))
  const visible = createMemo(() => isUpdaterActionVisible(platform.updater?.state()))

  return {
    action,
    visible,
    async run() {
      const run = action().run
      if (run === "install") return platform.updater?.install()
      if (run !== "check") return

      const state = await platform.updater?.check()
      if (state?.status === "up-to-date") {
        showToast({
          variant: "success",
          icon: "circle-check",
          title: language.t("settings.updates.toast.latest.title"),
          description: language.t("settings.updates.toast.latest.description", { version: platform.version ?? "" }),
        })
      }
      if (state?.status === "error") {
        showToast({ title: language.t("common.requestFailed"), description: state.message })
      }
    },
  }
}

export function useInstallingUpdateToast() {
  const platform = usePlatform()
  const language = useLanguage()
  let shown = false
  let toastId: number | undefined

  createEffect(() => {
    if (platform.updater?.state().status !== "installing") {
      shown = false
      if (toastId !== undefined) toaster.dismiss(toastId)
      toastId = undefined
      return
    }
    if (shown) return
    shown = true
    toastId = showToast({
      persistent: true,
      title: language.t("toast.update.installing.title"),
      description: language.t("toast.update.installing.description"),
    })
  })

  onCleanup(() => {
    if (toastId !== undefined) toaster.dismiss(toastId)
  })
}
