"use client";

import { setActiveCurrency } from "@/lib/constants";

// Sincroniza la moneda activa en el cliente (se ejecuta al renderizar)
export function CurrencyInit({ currency }: { currency: string }) {
  setActiveCurrency(currency);
  return null;
}
