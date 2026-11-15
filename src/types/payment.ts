export type PaymentCurrencyCode = 1 | 2 | 3;
export type PaymentMethodCode = 1 | 2 | 3 | 4 | 5 | 6 | 99;
export type PaymentStatusCode = 1 | 2 | 3;

export type PaymentCurrencyLabel = "VES" | "USD" | "USDT";
export type PaymentStatusLabel = "Pendiente" | "Aprobado" | "Rechazado";

export interface PaymentDto {
  id: number;
  userId: number;
  amount: number;
  currency: string;
  paymentMethod: string;
  paymentDate: string;
  reference?: string | null;
  status: string;
  receiptUrl?: string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt?: string | null;
}

export interface CreateOrUpdatePaymentDto {
  userId: number;
  amount: number;
  currency: PaymentCurrencyCode;
  paymentMethod: PaymentMethodCode;
  paymentDate: string;
  reference?: string | null;
  status: PaymentStatusCode;
  receiptKey?: string | null;
  notes?: string | null;
}

export interface PagedResult<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
}

export interface GetPaymentsParams {
  userId?: number;
  studentId?: number;
  currency?: string;
  status?: string;
  from?: string;
  to?: string;
  page?: number;
  pageSize?: number;
}

export const CURRENCY_OPTIONS: { value: PaymentCurrencyCode; label: PaymentCurrencyLabel; name: string }[] = [
  { value: 1, label: "VES", name: "Bolívares (VES)" },
  { value: 2, label: "USD", name: "Dólares (USD)" },
  { value: 3, label: "USDT", name: "Tether (USDT)" },
];

export const PAYMENT_METHOD_OPTIONS: {
  value: PaymentMethodCode;
  key: string;
  label: string;
}[] = [
  { value: 1, key: "Transferencia", label: "Transferencia Bancaria" },
  { value: 2, key: "PagoMovil", label: "Pago Móvil" },
  { value: 3, key: "Zelle", label: "Zelle" },
  { value: 4, key: "BinancePay", label: "Binance Pay" },
  { value: 5, key: "Efectivo", label: "Efectivo" },
  { value: 6, key: "PayPal", label: "PayPal" },
  { value: 99, key: "Otro", label: "Otro" },
];

export const PAYMENT_STATUS_OPTIONS: { value: PaymentStatusCode; label: PaymentStatusLabel }[] = [
  { value: 1, label: "Pendiente" },
  { value: 2, label: "Aprobado" },
  { value: 3, label: "Rechazado" },
];

export function currencyLabelToCode(currency?: string | null): PaymentCurrencyCode {
  switch ((currency || "").toUpperCase()) {
    case "VES":
      return 1;
    case "USDT":
      return 3;
    case "USD":
    default:
      return 2;
  }
}

export function methodLabelToCode(method?: string | null): PaymentMethodCode {
  const normalized = (method || "").toLowerCase().replace(/\s+/g, "");
  switch (normalized) {
    case "transferencia":
      return 1;
    case "pagomovil":
    case "pagomóvil":
      return 2;
    case "zelle":
      return 3;
    case "binancepay":
      return 4;
    case "efectivo":
      return 5;
    case "paypal":
      return 6;
    default:
      return 99;
  }
}

export function statusLabelToCode(status?: string | null): PaymentStatusCode {
  switch ((status || "").toLowerCase()) {
    case "aprobado":
      return 2;
    case "rechazado":
      return 3;
    case "pendiente":
    default:
      return 1;
  }
}

export function formatMethodLabel(method?: string | null): string {
  const found = PAYMENT_METHOD_OPTIONS.find(
    (m) => m.key.toLowerCase() === (method || "").toLowerCase()
  );
  return found ? found.label : method || "Otro";
}

