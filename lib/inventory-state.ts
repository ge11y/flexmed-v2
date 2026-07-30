type InventoryStatus = 'in_stock' | 'incoming' | 'out_of_stock'

type InventorySubject = {
  status: InventoryStatus
  inventoryOnHand?: number | null
  lowStockThreshold?: number | null
}

export function getInventoryStatusFromCount(
  inventoryOnHand: number | null | undefined,
  fallbackStatus: InventoryStatus = 'out_of_stock',
): InventoryStatus {
  if (inventoryOnHand === null || inventoryOnHand === undefined) return fallbackStatus
  if (inventoryOnHand > 0) return 'in_stock'
  return fallbackStatus === 'incoming' ? 'incoming' : 'out_of_stock'
}

export function isLowStock(subject: InventorySubject) {
  if (subject.status !== 'in_stock') return false
  if (subject.inventoryOnHand === null || subject.inventoryOnHand === undefined) return false
  if (subject.lowStockThreshold === null || subject.lowStockThreshold === undefined) return false
  return subject.inventoryOnHand <= subject.lowStockThreshold
}
