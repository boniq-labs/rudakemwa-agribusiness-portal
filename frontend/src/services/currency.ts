const currencies: Record<string, { code: string; locale: string }> = {
  RWF: { code: 'RWF', locale: 'en-US' },
};

export function setCurrency(_code: string) {
  // EFMS uses Rwandan Francs (RWF) only.
  return;
}

export function getCurrency() {
  return currencies.RWF;
}

export function formatAmount(amount: number): string {
  const n = Number(amount) || 0;
  return `RWF ${n.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

export const currencyCodes = Object.keys(currencies);

export function useCurrency() {
  return { formatAmount, setCurrency, getCurrency, currencies: currencyCodes };
}