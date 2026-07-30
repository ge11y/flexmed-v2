'use client'

import { useEffect, useMemo, useState } from 'react'
import { buildOrderDraft, type CartItem, type OrderDraft } from '@/lib/cart'

function normalizePostalCode(value?: string | null) {
  return value?.match(/\d{5}/)?.[0] ?? ''
}

export function useCheckoutQuote(items: CartItem[], shippingPostalCode?: string | null) {
  const fallback = useMemo(() => buildOrderDraft(items), [items])
  const normalizedShippingPostalCode = normalizePostalCode(shippingPostalCode)
  const signature = useMemo(
    () =>
      JSON.stringify(
        {
          items: items.map((item) => ({
            itemType: item.itemType ?? 'product',
            slug: item.slug,
            option: item.option,
            quantity: item.quantity,
          })),
          shippingPostalCode: normalizedShippingPostalCode,
        },
      ),
    [items, normalizedShippingPostalCode],
  )
  const [result, setResult] = useState<{
    signature: string
    quote: OrderDraft
    errors: string[]
  }>({
    signature: '',
    quote: fallback,
    errors: [],
  })

  useEffect(() => {
    if (items.length === 0) return

    const controller = new AbortController()

    async function loadQuote() {
      try {
        const response = await fetch('/api/checkout-quote', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...(JSON.parse(signature) as {
              items: Array<{ itemType?: 'product' | 'vial_case'; slug: string; option?: 'vial' | 'case'; quantity: number }>
              shippingPostalCode?: string
            }),
          }),
          signal: controller.signal,
        })
        const result = (await response.json()) as {
          ok?: boolean
          quote?: OrderDraft
          errors?: string[]
          error?: string
        }
        if (controller.signal.aborted) return
        setResult({
          signature,
          quote: result.quote ?? fallback,
          errors: result.errors ?? (result.error ? [result.error] : []),
        })
      } catch (error) {
        if (controller.signal.aborted) return
        setResult({
          signature,
          quote: fallback,
          errors: [error instanceof Error ? error.message : 'Checkout pricing could not be refreshed.'],
        })
      }
    }

    void loadQuote()
    return () => controller.abort()
  }, [fallback, items, signature])

  if (items.length === 0) return { quote: fallback, errors: [], loading: false }
  const loading = result.signature !== signature
  return {
    quote: loading ? fallback : result.quote,
    errors: loading ? [] : result.errors,
    loading,
  }
}
