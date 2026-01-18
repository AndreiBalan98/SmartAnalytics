/**
 * Currency utilities for displaying monetary values
 */

/**
 * Get currency symbol for a given currency code
 */
export function getCurrencySymbol(currency: string): string {
  const currencyMap: Record<string, string> = {
    'USD': '$',
    'EUR': '€',
    'RON': 'Lei',
    'GBP': '£',
    'JPY': '¥',
  }

  return currencyMap[currency.toUpperCase()] || currency
}

/**
 * Format monetary value with currency symbol
 */
export function formatCurrency(value: number, currency: string, decimals: number = 2): string {
  const symbol = getCurrencySymbol(currency)
  const formattedValue = value.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })

  // For RON, put currency after value: "100.00 Lei"
  if (currency.toUpperCase() === 'RON') {
    return `${formattedValue} ${symbol}`
  }

  // For others, put symbol before value: "$100.00"
  return `${symbol}${formattedValue}`
}
