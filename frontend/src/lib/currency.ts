/**
 * Currency utilities for displaying native currencies
 */

export function getCurrencySymbol(currency: string): string {
  const symbols: Record<string, string> = {
    USD: '$',
    EUR: '€',
    GBP: '£',
    RON: 'lei',
    CAD: 'C$',
    AUD: 'A$',
    JPY: '¥',
    CNY: '¥',
    INR: '₹',
    BRL: 'R$',
    MXN: 'MX$',
    CHF: 'CHF',
    SEK: 'kr',
    NOK: 'kr',
    DKK: 'kr',
    PLN: 'zł',
    CZK: 'Kč',
    HUF: 'Ft',
    TRY: '₺',
    ZAR: 'R',
    AED: 'د.إ',
    SAR: '﷼',
  }

  return symbols[currency.toUpperCase()] || currency
}

export function formatCurrency(amount: number, currency: string): string {
  const symbol = getCurrencySymbol(currency)
  const formatted = amount.toFixed(2)

  // For some currencies, symbol goes after the amount
  const suffixCurrencies = ['RON', 'CZK', 'HUF', 'PLN']

  if (suffixCurrencies.includes(currency.toUpperCase())) {
    return `${formatted} ${symbol}`
  }

  return `${symbol}${formatted}`
}

export function formatCurrencyCompact(amount: number, currency: string): string {
  const symbol = getCurrencySymbol(currency)

  if (amount >= 1000000) {
    return `${symbol}${(amount / 1000000).toFixed(2)}M`
  } else if (amount >= 1000) {
    return `${symbol}${(amount / 1000).toFixed(2)}K`
  }

  return formatCurrency(amount, currency)
}
