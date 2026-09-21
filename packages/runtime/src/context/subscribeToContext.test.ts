import type {
  Component,
  ComponentData,
} from '@nordcraft/core/dist/component/component.types'
import { describe, expect, test } from 'bun:test'
import { signal } from '../signal/signal'
import type { ComponentContext } from '../types'
import { subscribeToContext } from './subscribeToContext'

describe('subscribeToContext()', () => {
  test('it unsubscribes from the provider when the consumer data signal is destroyed', () => {
    const providerFormulaSignal = signal<ComponentData>({ Attributes: {} })
    const consumerDataSignal = signal<ComponentData>({
      Attributes: {},
      Variables: {},
      Contexts: {},
    })
    const ctx = {
      package: undefined,
      providers: {
        Provider: {
          component: { name: 'Provider' } as Component,
          formulaDataSignals: { myFormula: providerFormulaSignal },
          ctx: {} as ComponentContext,
        },
      },
      env: { runtime: 'page' },
    } as unknown as ComponentContext

    const consumer = {
      name: 'Consumer',
      contexts: {
        Provider: { formulas: ['myFormula'] },
      },
    } as unknown as Component

    subscribeToContext(consumerDataSignal, consumer, ctx)

    expect(providerFormulaSignal.subscribers.size).toBe(1)

    consumerDataSignal.destroy()

    expect(providerFormulaSignal.subscribers.size).toBe(0)
  })
})
