export const ADMIN_SEEN_ORDERS_STORAGE_KEY = 'flexmed_admin_seen_orders_v1'

export function dispatchAdminOrdersUpdated(orders: Array<{ id: string; status: string }>) {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new CustomEvent('admin-orders-updated', { detail: { orders } }))
}

export function loadSeenOrderIds() {
  if (typeof window === 'undefined') return [] as string[]
  try {
    const raw = window.localStorage.getItem(ADMIN_SEEN_ORDERS_STORAGE_KEY)
    return raw ? (JSON.parse(raw) as string[]) : []
  } catch {
    return []
  }
}

export function saveSeenOrderIds(orderIds: string[]) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(ADMIN_SEEN_ORDERS_STORAGE_KEY, JSON.stringify(orderIds))
  window.dispatchEvent(new CustomEvent('admin-seen-orders-updated'))
}

export function markOrderSeen(orderId: string) {
  const current = loadSeenOrderIds()
  if (current.includes(orderId)) return current
  const next = [...current, orderId]
  saveSeenOrderIds(next)
  return next
}
