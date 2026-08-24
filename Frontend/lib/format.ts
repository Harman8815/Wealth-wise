/**
 * Universal number and currency formatting utilities.
 *
 * Uses compact Indian notation:
 *  - < 1 lakh   : plain number
 *  - 1L – 99.99L: lakhs with 1 decimal when needed
 *  - >= 1 Cr    : crores with 1 decimal when needed
 */

export type FormatOptions = {
  /** Maximum fraction digits for compact notation. Defaults to 1. */
  maxFractionDigits?: number
  /** Minimum fraction digits for compact notation. Defaults to 0. */
  minFractionDigits?: number
  /** If true, format as currency with ₹ prefix. */
  currency?: boolean
}

const LAKH = 100_000
const CRORE = 10_000_000

export function formatCompactNumber(value: number, options: FormatOptions = {}): string {
  const { maxFractionDigits = 1, minFractionDigits = 0 } = options

  if (Math.abs(value) < LAKH) {
    return new Intl.NumberFormat("en-IN", {
      maximumFractionDigits: maxFractionDigits,
      minimumFractionDigits: minFractionDigits,
    }).format(value)
  }

  if (Math.abs(value) < CRORE) {
    const lakhs = value / LAKH
    return `${lakhs.toFixed(lakhs % 1 === 0 ? 0 : maxFractionDigits)}L`
  }

  const crores = value / CRORE
  return `${crores.toFixed(crores % 1 === 0 ? 0 : maxFractionDigits)}Cr`
}

export function formatCurrency(value: number, options: FormatOptions = {}): string {
  const { maxFractionDigits = 1, minFractionDigits = 0 } = options

  if (Math.abs(value) < LAKH) {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: maxFractionDigits,
      minimumFractionDigits: minFractionDigits,
    }).format(value)
  }

  if (Math.abs(value) < CRORE) {
    const lakhs = value / LAKH
    const formatted = `${lakhs.toFixed(lakhs % 1 === 0 ? 0 : maxFractionDigits)}L`
    return `₹${formatted}`
  }

  const crores = value / CRORE
  const formatted = `${crores.toFixed(crores % 1 === 0 ? 0 : maxFractionDigits)}Cr`
  return `₹${formatted}`
}

export function formatNumber(value: number, options: FormatOptions = {}): string {
  return formatCompactNumber(value, options)
}
