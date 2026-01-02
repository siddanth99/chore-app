/**
 * Currency formatting utilities
 * 
 * Provides consistent currency formatting across the application.
 * Currently uses Indian Rupee (₹) as the default currency.
 */

/**
 * Format a numeric value as Indian Rupee currency (simple formatter)
 * 
 * @param value - The numeric value to format
 * @returns Formatted currency string (e.g., "₹1,000")
 * 
 * @example
 * formatCurrency(1000) // "₹1,000"
 * formatCurrency(1000.50) // "₹1,000" (no decimals)
 */
export function formatCurrency(value: number | null | undefined): string {
  if (value == null || isNaN(value)) {
    return '₹0'
  }
  
  return `₹${value.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`
}

/**
 * Format currency from paise (smallest currency unit)
 * Converts paise to rupees and formats
 * 
 * @param paise - Amount in paise
 * @returns Formatted currency string with decimals
 * 
 * @example
 * formatCurrencyFromPaise(10000) // "₹100"
 */
export function formatCurrencyFromPaise(paise: number): string {
  const rupees = paise / 100
  return formatCurrency(Math.round(rupees))
}

/**
 * Format currency from rupees (simple formatter without Intl)
 * Useful for quick formatting without locale dependencies
 * 
 * @param rupees - Amount in rupees
 * @returns Formatted currency string (e.g., "₹1,000")
 * 
 * @example
 * formatCurrencyFromRupees(1000) // "₹1,000"
 */
export function formatCurrencyFromRupees(rupees: number): string {
  if (rupees == null || isNaN(rupees)) {
    return '₹0'
  }
  
  return `₹${rupees.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`
}
