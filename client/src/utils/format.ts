/**
 * Formats a numeric amount to Philippine Peso (PHP ₱).
 * e.g., 3499 -> "₱3,499.00", 2500.5 -> "₱2,500.50"
 */
export function formatPrice(amount: number | string | undefined | null): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : Number(amount);
  if (isNaN(num) || num === undefined || num === null) {
    return '₱0.00';
  }
  return `₱${num.toLocaleString('en-PH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/**
 * Formats a numeric amount to a compact integer Philippine Peso (PHP ₱).
 * e.g., 3499 -> "₱3,499"
 */
export function formatPriceCompact(amount: number | string | undefined | null): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : Number(amount);
  if (isNaN(num) || num === undefined || num === null) {
    return '₱0';
  }
  return `₱${num.toLocaleString('en-PH', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;
}

/**
 * Formats date to a human readable format.
 */
export function formatDate(dateString: string | undefined | null): string {
  if (!dateString) return '—';
  try {
    const d = new Date(dateString);
    return d.toLocaleDateString('en-PH', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return String(dateString);
  }
}
