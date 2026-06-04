import type { Temperature, LeadSource, ActivityType } from "@/types";

export const TEMPERATURE_CONFIG: Record<
  Temperature,
  { label: string; color: string; bgColor: string }
> = {
  cold: { label: "Frio", color: "#64748b", bgColor: "#f1f5f9" },
  warm: { label: "Tibio", color: "#ea580c", bgColor: "#fff7ed" },
  hot: { label: "Caliente", color: "#dc2626", bgColor: "#fef2f2" },
};

export const SOURCE_LABELS: Record<LeadSource, string> = {
  website: "Sitio web",
  whatsapp: "WhatsApp",
  referido: "Referido",
  redes_sociales: "Redes sociales",
  llamada_fria: "Llamada fria",
  email: "Email",
  formulario: "Formulario",
  evento: "Evento",
  import: "Importado",
  webhook: "Webhook",
  otro: "Otro",
};

export const ACTIVITY_TYPE_CONFIG: Record<
  ActivityType,
  { label: string; icon: string }
> = {
  call: { label: "Llamada", icon: "Phone" },
  email: { label: "Email", icon: "Mail" },
  meeting: { label: "Reunion", icon: "Users" },
  note: { label: "Nota", icon: "FileText" },
  follow_up: { label: "Seguimiento", icon: "Clock" },
};

// Moneda activa (se actualiza desde la configuración del CRM)
let _activeCurrency = "MXN";
export function setActiveCurrency(code: string) {
  if (code) _activeCurrency = code;
}
export function getActiveCurrency() {
  return _activeCurrency;
}

// Monedas soportadas (código → etiqueta y locale para formato)
export const CURRENCIES: Record<string, { label: string; locale: string }> = {
  MXN: { label: "Peso mexicano (MXN)", locale: "es-MX" },
  USD: { label: "Dólar (USD)", locale: "en-US" },
  EUR: { label: "Euro (EUR)", locale: "es-ES" },
  COP: { label: "Peso colombiano (COP)", locale: "es-CO" },
  ARS: { label: "Peso argentino (ARS)", locale: "es-AR" },
  CLP: { label: "Peso chileno (CLP)", locale: "es-CL" },
  PEN: { label: "Sol peruano (PEN)", locale: "es-PE" },
  DOP: { label: "Peso dominicano (DOP)", locale: "es-DO" },
  GBP: { label: "Libra (GBP)", locale: "en-GB" },
  BRL: { label: "Real (BRL)", locale: "pt-BR" },
};

export function formatCurrency(cents: number, currency?: string): string {
  const code = currency || _activeCurrency;
  const locale = CURRENCIES[code]?.locale || "es-MX";
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: code,
  }).format(cents / 100);
}

export function cleanPhoneForWhatsApp(phone: string): string {
  // "+52 55 1234 5678" → "525512345678"
  return phone.replace(/[\s\-\(\)]/g, "").replace(/^\+/, "");
}

function toDate(date: Date | number): Date {
  if (date instanceof Date) return date;
  // If number is less than 1e12, it's in seconds; otherwise milliseconds
  return new Date(date < 1e12 ? date * 1000 : date);
}

export function formatDate(date: Date | number | null): string {
  if (!date) return "-";
  const d = toDate(date);
  return new Intl.DateTimeFormat("es-MX", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(d);
}

export function formatRelativeDate(date: Date | number): string {
  const d = toDate(date);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Hoy";
  if (diffDays === 1) return "Ayer";
  if (diffDays < 7) return `Hace ${diffDays} dias`;
  if (diffDays < 30) return `Hace ${Math.floor(diffDays / 7)} semanas`;
  return formatDate(date);
}
