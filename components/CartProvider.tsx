'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { CART_STORAGE_KEY, type CartItem, getCartItemCount, getCartLineKey, getCartSubtotal } from '@/lib/cart'

type CartContextValue = {
  items: CartItem[]
  itemCount: number
  subtotal: number
  addItem: (item: CartItem) => void
  updateQuantity: (slug: string, option: CartItem['option'], quantity: number, itemType?: CartItem['itemType']) => void
  removeItem: (slug: string, option: CartItem['option'], itemType?: CartItem['itemType']) => void
  clearCart: () => void
}

const CartContext = createContext<CartContextValue | null>(null)

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(() => {
    if (typeof window === 'undefined') return []
    try {
      const raw = window.localStorage.getItem(CART_STORAGE_KEY)
      return raw ? (JSON.parse(raw) as CartItem[]) : []
    } catch {
      return []
    }
  })

  useEffect(() => {
    try {
      window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items))
    } catch {
      // Keep cart state in memory when storage is blocked.
    }
  }, [items])

  const addItem = useCallback((item: CartItem) => {
    setItems((current) => {
      const itemKey = getCartLineKey(item)
      const existingIndex = current.findIndex((entry) => getCartLineKey(entry) === itemKey)

      if (existingIndex >= 0) {
        return current.map((entry, index) =>
          index === existingIndex
            ? { ...entry, quantity: entry.quantity + item.quantity }
            : entry,
        )
      }

      return [...current, item]
    })
  }, [])

  const updateQuantity = useCallback((slug: string, option: CartItem['option'], quantity: number, itemType: CartItem['itemType'] = 'product') => {
    const targetKey = getCartLineKey({ slug, option, itemType })
    setItems((current) =>
      current
        .map((entry) =>
          getCartLineKey(entry) === targetKey
            ? { ...entry, quantity: Math.max(1, quantity) }
            : entry,
        )
        .filter((entry) => entry.quantity > 0),
    )
  }, [])

  const removeItem = useCallback((slug: string, option: CartItem['option'], itemType: CartItem['itemType'] = 'product') => {
    const targetKey = getCartLineKey({ slug, option, itemType })
    setItems((current) =>
      current.filter((entry) => getCartLineKey(entry) !== targetKey),
    )
  }, [])

  const clearCart = useCallback(() => {
    setItems((current) => (current.length === 0 ? current : []))
  }, [])

  const value = useMemo<CartContextValue>(
    () => ({
      items,
      itemCount: getCartItemCount(items),
      subtotal: getCartSubtotal(items),
      addItem,
      updateQuantity,
      removeItem,
      clearCart,
    }),
    [addItem, clearCart, items, removeItem, updateQuantity],
  )

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error('useCart must be used within a CartProvider')
  }
  return context
}
