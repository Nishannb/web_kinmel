export type PhoneCountry = {
  iso: string;
  name: string;
  dial: string;
  nationalLength: number;
};

/** Common seller markets; Nepal first. Dial codes without '+'. */
export const PHONE_COUNTRIES: PhoneCountry[] = [
  { iso: "NP", name: "Nepal", dial: "977", nationalLength: 10 },
  { iso: "IN", name: "India", dial: "91", nationalLength: 10 },
  { iso: "US", name: "United States", dial: "1", nationalLength: 10 },
  { iso: "CA", name: "Canada", dial: "1", nationalLength: 10 },
  { iso: "GB", name: "United Kingdom", dial: "44", nationalLength: 10 },
  { iso: "AU", name: "Australia", dial: "61", nationalLength: 9 },
  { iso: "JP", name: "Japan", dial: "81", nationalLength: 10 },
  { iso: "KR", name: "South Korea", dial: "82", nationalLength: 10 },
  { iso: "CN", name: "China", dial: "86", nationalLength: 11 },
  { iso: "AE", name: "United Arab Emirates", dial: "971", nationalLength: 9 },
  { iso: "QA", name: "Qatar", dial: "974", nationalLength: 8 },
  { iso: "SA", name: "Saudi Arabia", dial: "966", nationalLength: 9 },
  { iso: "BD", name: "Bangladesh", dial: "880", nationalLength: 10 },
  { iso: "PK", name: "Pakistan", dial: "92", nationalLength: 10 },
  { iso: "LK", name: "Sri Lanka", dial: "94", nationalLength: 9 },
  { iso: "MY", name: "Malaysia", dial: "60", nationalLength: 10 },
  { iso: "SG", name: "Singapore", dial: "65", nationalLength: 8 },
  { iso: "TH", name: "Thailand", dial: "66", nationalLength: 9 },
  { iso: "DE", name: "Germany", dial: "49", nationalLength: 11 },
  { iso: "FR", name: "France", dial: "33", nationalLength: 9 },
];

export const DEFAULT_PHONE_COUNTRY_ISO = "NP";

export function phoneCountryByIso(iso: string): PhoneCountry {
  const upper = iso.trim().toUpperCase();
  return (
    PHONE_COUNTRIES.find((c) => c.iso === upper) ??
    PHONE_COUNTRIES.find((c) => c.iso === DEFAULT_PHONE_COUNTRY_ISO)!
  );
}

export function isNepalCountryIso(iso: string): boolean {
  return iso.trim().toUpperCase() === "NP";
}

export function nationalDigits(raw: string): string {
  return raw.replace(/\D/g, "");
}

export function composeE164(iso: string, national: string): string {
  const country = phoneCountryByIso(iso);
  let digits = nationalDigits(national);
  if (digits.startsWith(country.dial)) {
    digits = digits.slice(country.dial.length);
  }
  if (country.iso === "NP" && digits.length === 10 && digits.startsWith("9")) {
    return `+977${digits}`;
  }
  return `+${country.dial}${digits}`;
}
