const currencies: Record<string, { symbol: string; code: string; locale: string }> = {
  RWF: { symbol: 'FRw', code: 'RWF', locale: 'rw-RW' },
  USD: { symbol: '$', code: 'USD', locale: 'en-US' },
  EUR: { symbol: '€', code: 'EUR', locale: 'de-DE' },
  GBP: { symbol: '£', code: 'GBP', locale: 'en-GB' },
  KES: { symbol: 'KSh', code: 'KES', locale: 'sw-KE' },
  UGX: { symbol: 'USh', code: 'UGX', locale: 'sw-UG' },
  TZS: { symbol: 'TSh', code: 'TZS', locale: 'sw-TZ' },
};

let currentCurrency = localStorage.getItem('currency') || 'RWF';

export function setCurrency(code: string) {
  if (currencies[code]) {
    currentCurrency = code;
    localStorage.setItem('currency', code);
  }
}

export function getCurrency() {
  return currencies[currentCurrency] || currencies.RWF;
}

export function formatAmount(amount: number): string {
  const cur = getCurrency();
  return `${cur.symbol} ${amount.toLocaleString(cur.locale, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

export const currencyCodes = Object.keys(currencies);

export function useCurrency() {
  return { formatAmount, setCurrency, getCurrency, currencies: currencyCodes };
}
