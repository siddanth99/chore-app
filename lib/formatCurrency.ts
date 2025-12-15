/**
 * Format currency from paise to rupees
 * @param paise - Amount in paise (e.g., 10000 = ₹100.00)
 * @returns Formatted currency string (e.g., "₹100.00")
 */
export function formatCurrency(paise: number): string {
  const rupees = paise / 100;
  return `₹${rupees.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/**
 * Format currency from rupees to display string
 * @param rupees - Amount in rupees (e.g., 100 = ₹100)
 * @returns Formatted currency string (e.g., "₹100")
 */
export function formatCurrencyFromRupees(rupees: number): string {
  return `₹${rupees.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
}

