export interface CountryPhoneConfig {
  countryName: string;
  phoneCode: string;
  digits: number;
  placeholder: string;
}

export const PHONE_CONFIGS: CountryPhoneConfig[] = [
  { countryName: "Venezuela", phoneCode: "+58", digits: 10, placeholder: "412-123-4567" },
  { countryName: "Colombia", phoneCode: "+57", digits: 10, placeholder: "300-123-4567" },
  { countryName: "Estados Unidos", phoneCode: "+1", digits: 10, placeholder: "555-123-4567" },
  { countryName: "Canadá", phoneCode: "+1", digits: 10, placeholder: "416-123-4567" },
  { countryName: "Puerto Rico", phoneCode: "+1", digits: 10, placeholder: "787-123-4567" },
  { countryName: "España", phoneCode: "+34", digits: 9, placeholder: "612-345-678" },
  { countryName: "México", phoneCode: "+52", digits: 10, placeholder: "55-1234-5678" },
  { countryName: "Argentina", phoneCode: "+54", digits: 10, placeholder: "11-1234-5678" },
  { countryName: "Chile", phoneCode: "+56", digits: 9, placeholder: "9-1234-5678" },
  { countryName: "Perú", phoneCode: "+51", digits: 9, placeholder: "912-345-678" },
  { countryName: "Ecuador", phoneCode: "+593", digits: 9, placeholder: "99-123-4567" },
  { countryName: "Bolivia", phoneCode: "+591", digits: 8, placeholder: "7123-4567" },
  { countryName: "Brasil", phoneCode: "+55", digits: 11, placeholder: "11-91234-5678" },
  { countryName: "Costa Rica", phoneCode: "+506", digits: 8, placeholder: "8123-4567" },
  { countryName: "Cuba", phoneCode: "+53", digits: 8, placeholder: "5123-4567" },
  { countryName: "República Dominicana", phoneCode: "+1", digits: 10, placeholder: "809-123-4567" },
  { countryName: "Panamá", phoneCode: "+507", digits: 8, placeholder: "6123-4567" },
  { countryName: "Uruguay", phoneCode: "+598", digits: 8, placeholder: "91-234-567" },
  { countryName: "Paraguay", phoneCode: "+595", digits: 9, placeholder: "981-123-456" },
  { countryName: "Guatemala", phoneCode: "+502", digits: 8, placeholder: "5123-4567" },
  { countryName: "Honduras", phoneCode: "+504", digits: 8, placeholder: "9123-4567" },
  { countryName: "El Salvador", phoneCode: "+503", digits: 8, placeholder: "7123-4567" },
  { countryName: "Nicaragua", phoneCode: "+505", digits: 8, placeholder: "8123-4567" },
];

export const DEFAULT_PHONE_CONFIG: CountryPhoneConfig = {
  countryName: "Default",
  phoneCode: "",
  digits: 10,
  placeholder: "412-123-4567",
};

export interface PhoneConfigParams {
  countryName?: string;
  phoneCode?: string;
}

const normalizeText = (text?: string): string => {
  if (!text) return "";
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
};

const normalizeCode = (code?: string): string => {
  if (!code) return "";
  const trimmed = code.trim();
  return trimmed.startsWith("+") ? trimmed : `+${trimmed}`;
};

export const getPhoneConfig = (
  params?: PhoneConfigParams | string
): CountryPhoneConfig => {
  if (!params) return DEFAULT_PHONE_CONFIG;

  const countryName = typeof params === "string" ? undefined : params.countryName;
  const phoneCode = typeof params === "string" ? params : params.phoneCode;

  const normName = normalizeText(countryName);
  const normCode = normalizeCode(phoneCode);

  // 1. Intentar coincidir por país y código juntos
  if (normName && normCode) {
    const match = PHONE_CONFIGS.find(
      (c) => normalizeText(c.countryName) === normName && c.phoneCode === normCode
    );
    if (match) return match;
  }

  // 2. Intentar coincidir por nombre de país
  if (normName) {
    const match = PHONE_CONFIGS.find((c) => normalizeText(c.countryName) === normName);
    if (match) return match;
  }

  // 3. Intentar coincidir por código telefónico
  if (normCode) {
    const match = PHONE_CONFIGS.find((c) => c.phoneCode === normCode);
    if (match) return match;
  }

  return DEFAULT_PHONE_CONFIG;
};

export const findPlaceHolder = (phoneCode?: string, countryName?: string): string => {
  return getPhoneConfig({ phoneCode, countryName }).placeholder;
};

/**
 * Limpia el teléfono dejando únicamente los dígitos.
 */
export const cleanPhoneNumber = (phone?: string): string => {
  return (phone || "").replace(/\D/g, "");
};

/**
 * Formatea el número de teléfono agregando guiones según el patrón del país/placeholder.
 */
export const formatPhoneNumber = (value: string, config: CountryPhoneConfig): string => {
  const cleanDigits = cleanPhoneNumber(value).slice(0, config.digits);
  if (!cleanDigits) return "";

  const parts = config.placeholder.split("-");
  if (parts.length <= 1) {
    return cleanDigits;
  }

  const groupLengths = parts.map((p) => cleanPhoneNumber(p).length || p.length);
  const formattedParts: string[] = [];
  let currentIndex = 0;

  for (const len of groupLengths) {
    if (currentIndex >= cleanDigits.length) break;
    formattedParts.push(cleanDigits.slice(currentIndex, currentIndex + len));
    currentIndex += len;
  }

  if (currentIndex < cleanDigits.length) {
    formattedParts.push(cleanDigits.slice(currentIndex));
  }

  return formattedParts.join("-");
};

export const validatePhoneNumber = (
  phone: string | undefined,
  config: CountryPhoneConfig
): { isValid: boolean; message?: string } => {
  const clean = cleanPhoneNumber(phone);
  if (!clean) {
    return { isValid: false, message: "El teléfono es obligatorio" };
  }

  if (clean.length !== config.digits) {
    const countryLabel =
      config.countryName !== "Default"
        ? config.countryName
        : config.phoneCode || "el país seleccionado";
    return {
      isValid: false,
      message: `El número de teléfono debe tener ${config.digits} dígitos para ${countryLabel}`,
    };
  }

  return { isValid: true };
};
