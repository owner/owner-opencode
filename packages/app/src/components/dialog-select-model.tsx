import { Popover as Kobalte } from '@kobalte/core/popover'
import {
  Component,
  ComponentProps,
  createMemo,
  JSX,
  Show,
  ValidComponent,
} from 'solid-js'
import { createStore } from 'solid-js/store'
import { useLocal } from '@/context/local'
import { useDialog } from '@opencode-ai/ui/context/dialog'
import { Button } from '@opencode-ai/ui/button'
import { IconButton } from '@opencode-ai/ui/icon-button'
import { Tag } from '@opencode-ai/ui/tag'
import { Dialog } from '@opencode-ai/ui/dialog'
import { List } from '@opencode-ai/ui/list'
import { Tooltip } from '@opencode-ai/ui/tooltip'
import { ModelTooltip } from './model-tooltip'
import { useLanguage } from '@/context/language'
import { decode64 } from '@/utils/base64'

const isFree = (provider: string, cost: { input: number } | undefined) =>
  provider === 'opencode' && (!cost || cost.input === 0)

const tierColor = {
  frontier: 'var(--oc-tier-frontier)',
  balanced: 'var(--oc-tier-balanced)',
  performance: 'var(--oc-tier-performance)',
}

const tierOrder = {
  frontier: 0,
  balanced: 1,
  performance: 2,
}

type ForgeModelTier = keyof typeof tierColor

const forgeModelTiers = new Map<
  string,
  {
    label: string
    pricing: { inputPerMillion: number; outputPerMillion: number }
    tier: ForgeModelTier
  }
>([
  [
    'anthropic:claude-opus-5',
    {
      label: 'Frontier · ~5× price',
      pricing: { inputPerMillion: 5, outputPerMillion: 25 },
      tier: 'frontier',
    },
  ],
  [
    'anthropic:claude-opus-4-8',
    {
      label: 'Frontier · ~5× price',
      pricing: { inputPerMillion: 5, outputPerMillion: 25 },
      tier: 'frontier',
    },
  ],
  [
    'openai:gpt-5.6-sol',
    {
      label: 'Frontier · ~5× price',
      pricing: { inputPerMillion: 5, outputPerMillion: 30 },
      tier: 'frontier',
    },
  ],
  [
    'anthropic:claude-sonnet-5',
    {
      label: 'Balanced · ~2× price',
      pricing: { inputPerMillion: 3, outputPerMillion: 15 },
      tier: 'balanced',
    },
  ],
  [
    'openai:gpt-5.6-terra',
    {
      label: 'Balanced · ~2× price',
      pricing: { inputPerMillion: 2, outputPerMillion: 12 },
      tier: 'balanced',
    },
  ],
  [
    'baseten:zai-org/GLM-5.2-Fast',
    {
      label: 'Balanced · ~2× price',
      pricing: { inputPerMillion: 2.1, outputPerMillion: 6.6 },
      tier: 'balanced',
    },
  ],
  [
    'baseten:moonshotai/Kimi-K3',
    {
      label: 'Balanced · ~2× price',
      pricing: { inputPerMillion: 3, outputPerMillion: 15 },
      tier: 'balanced',
    },
  ],
  [
    'openai:gpt-5.6-luna',
    {
      label: 'Performance',
      pricing: { inputPerMillion: 0.2, outputPerMillion: 1.2 },
      tier: 'performance',
    },
  ],
  [
    'baseten:zai-org/GLM-5.2-1M',
    {
      label: 'Performance',
      pricing: { inputPerMillion: 1.4, outputPerMillion: 4.4 },
      tier: 'performance',
    },
  ],
  [
    'baseten:moonshotai/Kimi-K2.7-Code',
    {
      label: 'Performance',
      pricing: { inputPerMillion: 0.95, outputPerMillion: 4 },
      tier: 'performance',
    },
  ],
  [
    'baseten:thinkingmachines/inkling',
    {
      label: 'Performance',
      pricing: { inputPerMillion: 1, outputPerMillion: 4.05 },
      tier: 'performance',
    },
  ],
])

function forgeModelTier(model: { provider: { id: string }; id: string }) {
  return forgeModelTiers.get(`${model.provider.id}:${model.id}`)
}

function formatPrice(perMillion: number) {
  return `$${perMillion.toFixed(2)}`
}

function ModelPrice(props: { model: Parameters<typeof forgeModelTier>[0] }) {
  const tier = forgeModelTier(props.model)
  if (!tier) return
  return (
    <span class="text-text-weak ml-auto shrink-0 tabular-nums">
      {formatPrice(tier.pricing.inputPerMillion)} /{' '}
      {formatPrice(tier.pricing.outputPerMillion)}
    </span>
  )
}

type ModelState = ReturnType<typeof useLocal>['model']

const ModelList: Component<{
  provider?: string
  class?: string
  onSelect: () => void
  action?: JSX.Element
  model?: ModelState
}> = (props) => {
  const model = props.model ?? useLocal().model
  const language = useLanguage()

  const models = createMemo(() =>
    model
      .list()
      .filter((m) =>
        model.visible({ modelID: m.id, providerID: m.provider.id })
      )
      .filter((m) => (props.provider ? m.provider.id === props.provider : true))
  )

  return (
    <List
      class={`min-h-0 flex-1 px-3 [&_[data-slot=list-scroll]]:min-h-0 [&_[data-slot=list-scroll]]:flex-1 ${props.class ?? ''}`}
      search={{
        placeholder: language.t('dialog.model.search.placeholder'),
        autofocus: true,
        action: props.action,
      }}
      emptyMessage={language.t('dialog.model.empty')}
      key={(x) => `${x.provider.id}:${x.id}`}
      items={models}
      current={model.current()}
      filterKeys={['provider.name', 'name', 'id']}
      sortBy={(a, b) => a.name.localeCompare(b.name)}
      groupBy={(model) => forgeModelTier(model)?.label ?? 'Other models'}
      sortGroupsBy={(a, b) => {
        const aTier = forgeModelTier(a.items[0])
        const bTier = forgeModelTier(b.items[0])
        if (!aTier) return bTier ? 1 : 0
        if (!bTier) return -1
        return tierOrder[aTier.tier] - tierOrder[bTier.tier]
      }}
      groupHeader={(group) => {
        const tier = forgeModelTier(group.items[0])
        return (
          <span
            class="font-bold"
            style={{
              color: tier ? tierColor[tier.tier] : 'var(--oc-ink-muted)',
            }}
          >
            {group.category}
          </span>
        )
      }}
      itemWrapper={(item, node) => (
        <Tooltip
          class="w-full"
          placement="right-start"
          gutter={12}
          openDelay={0}
          value={
            <ModelTooltip
              model={item}
              latest={item.latest}
              free={isFree(item.provider.id, item.cost)}
            />
          }
        >
          {node}
        </Tooltip>
      )}
      onSelect={(x) => {
        model.set(
          x ? { modelID: x.id, providerID: x.provider.id } : undefined,
          {
            recent: true,
          }
        )
        props.onSelect()
      }}
    >
      {(i) => (
        <div class="text-13-regular flex w-full items-center gap-x-2">
          <span class="truncate">{i.name}</span>
          <ModelPrice model={i} />
          <Show when={isFree(i.provider.id, i.cost)}>
            <Tag>{language.t('model.tag.free')}</Tag>
          </Show>
          <Show when={i.latest}>
            <Tag>{language.t('model.tag.latest')}</Tag>
          </Show>
        </div>
      )}
    </List>
  )
}

type ModelSelectorTriggerProps = Omit<
  ComponentProps<typeof Kobalte.Trigger>,
  'as' | 'ref'
>
type Dismiss = 'escape' | 'outside' | 'select' | 'manage' | 'provider'

export function ModelSelectorPopover(props: {
  provider?: string
  model?: ModelState
  children?: JSX.Element
  triggerAs?: ValidComponent
  triggerProps?: ModelSelectorTriggerProps
  onClose?: (cause: 'escape' | 'select') => void
}) {
  const [store, setStore] = createStore<{
    open: boolean
    dismiss: Dismiss | null
  }>({
    open: false,
    dismiss: null,
  })
  const dialog = useDialog()
  const local = useLocal()
  const directory = () => decode64(local.slug())

  const close = (dismiss: Dismiss) => {
    setStore('dismiss', dismiss)
    setStore('open', false)
  }

  const handleManage = () => {
    close('manage')
    void import('./dialog-manage-models').then((x) => {
      dialog.show(() => <x.DialogManageModels />)
    })
  }

  const handleConnectProvider = () => {
    close('provider')
    void import('./dialog-select-provider').then((x) => {
      dialog.show(() => <x.DialogSelectProvider directory={directory} />)
    })
  }
  const language = useLanguage()

  return (
    <Kobalte
      open={store.open}
      onOpenChange={(next) => {
        if (next) setStore('dismiss', null)
        setStore('open', next)
      }}
      modal={false}
      placement="top-start"
      gutter={4}
    >
      <Kobalte.Trigger as={props.triggerAs ?? 'div'} {...props.triggerProps}>
        {props.children}
      </Kobalte.Trigger>
      <Kobalte.Portal>
        <Kobalte.Content
          class="border-border-base bg-surface-raised-stronger-non-alpha z-50 flex h-80 w-72 flex-col overflow-hidden rounded-md border p-2 shadow-md outline-none"
          onEscapeKeyDown={(event) => {
            close('escape')
            event.preventDefault()
            event.stopPropagation()
          }}
          onPointerDownOutside={() => close('outside')}
          onFocusOutside={() => close('outside')}
          onCloseAutoFocus={(event) => {
            const dismiss = store.dismiss
            if (dismiss === 'outside') event.preventDefault()
            if (dismiss === 'escape' || dismiss === 'select') {
              event.preventDefault()
              props.onClose?.(dismiss)
            }
            setStore('dismiss', null)
          }}
        >
          <Kobalte.Title class="sr-only">
            {language.t('dialog.model.select.title')}
          </Kobalte.Title>
          <ModelList
            provider={props.provider}
            model={props.model}
            onSelect={() => close('select')}
            class="p-1"
            action={
              <div class="flex items-center gap-1">
                <Tooltip
                  placement="top"
                  value={language.t('command.provider.connect')}
                >
                  <IconButton
                    icon="plus-small"
                    variant="ghost"
                    iconSize="normal"
                    class="size-6"
                    aria-label={language.t('command.provider.connect')}
                    onClick={handleConnectProvider}
                  />
                </Tooltip>
                <Tooltip
                  placement="top"
                  value={language.t('dialog.model.manage')}
                >
                  <IconButton
                    icon="sliders"
                    variant="ghost"
                    iconSize="normal"
                    class="size-6"
                    aria-label={language.t('dialog.model.manage')}
                    onClick={handleManage}
                  />
                </Tooltip>
              </div>
            }
          />
        </Kobalte.Content>
      </Kobalte.Portal>
    </Kobalte>
  )
}

export const DialogSelectModel: Component<{
  provider?: string
  model?: ModelState
}> = (props) => {
  const dialog = useDialog()
  const language = useLanguage()
  const local = useLocal()
  const directory = () => decode64(local.slug())

  const provider = () => {
    void import('./dialog-select-provider').then((x) => {
      dialog.show(() => <x.DialogSelectProvider directory={directory} />)
    })
  }

  const manage = () => {
    void import('./dialog-manage-models').then((x) => {
      dialog.show(() => <x.DialogManageModels />)
    })
  }

  return (
    <Dialog
      title={language.t('dialog.model.select.title')}
      action={
        <Button
          class="text-14-medium -my-1 h-7"
          icon="plus-small"
          tabIndex={-1}
          onClick={provider}
        >
          {language.t('command.provider.connect')}
        </Button>
      }
    >
      <ModelList
        provider={props.provider}
        model={props.model}
        onSelect={() => dialog.close()}
      />
      <Button
        variant="ghost"
        class="text-text-base mt-5 mb-6 ml-3 self-start"
        onClick={manage}
      >
        {language.t('dialog.model.manage')}
      </Button>
    </Dialog>
  )
}
