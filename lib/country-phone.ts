export type CountryPhoneRule = {
  iso: string;
  country: string;
  dialCode: string;
  minLength: number;
  maxLength: number;
  subscriberPattern?: RegExp;
};

export const COUNTRY_PHONE_RULES: CountryPhoneRule[] = [
  { iso: "IN", country: "India", dialCode: "+91", minLength: 10, maxLength: 10, subscriberPattern: /^[6-9]\d{9}$/ },
  { iso: "US", country: "United States", dialCode: "+1", minLength: 10, maxLength: 10, subscriberPattern: /^[2-9]\d{9}$/ },
  { iso: "CA", country: "Canada", dialCode: "+1", minLength: 10, maxLength: 10, subscriberPattern: /^[2-9]\d{9}$/ },
  { iso: "GB", country: "United Kingdom", dialCode: "+44", minLength: 10, maxLength: 10, subscriberPattern: /^7\d{9}$/ },
  { iso: "AU", country: "Australia", dialCode: "+61", minLength: 9, maxLength: 9, subscriberPattern: /^4\d{8}$/ },
  { iso: "NZ", country: "New Zealand", dialCode: "+64", minLength: 8, maxLength: 9, subscriberPattern: /^2\d{7,8}$/ },
  { iso: "SG", country: "Singapore", dialCode: "+65", minLength: 8, maxLength: 8, subscriberPattern: /^[3689]\d{7}$/ },
  { iso: "AE", country: "United Arab Emirates", dialCode: "+971", minLength: 9, maxLength: 9, subscriberPattern: /^[2-9]\d{8}$/ },
  { iso: "SA", country: "Saudi Arabia", dialCode: "+966", minLength: 9, maxLength: 9, subscriberPattern: /^5\d{8}$/ },
  { iso: "QA", country: "Qatar", dialCode: "+974", minLength: 8, maxLength: 8, subscriberPattern: /^[3567]\d{7}$/ },
  { iso: "KW", country: "Kuwait", dialCode: "+965", minLength: 8, maxLength: 8, subscriberPattern: /^[569]\d{7}$/ },
  { iso: "BH", country: "Bahrain", dialCode: "+973", minLength: 8, maxLength: 8, subscriberPattern: /^[36]\d{7}$/ },
  { iso: "OM", country: "Oman", dialCode: "+968", minLength: 8, maxLength: 8, subscriberPattern: /^[279]\d{7}$/ },
  { iso: "DE", country: "Germany", dialCode: "+49", minLength: 10, maxLength: 12 },
  { iso: "FR", country: "France", dialCode: "+33", minLength: 9, maxLength: 9, subscriberPattern: /^[1-9]\d{8}$/ },
  { iso: "ES", country: "Spain", dialCode: "+34", minLength: 9, maxLength: 9, subscriberPattern: /^[6789]\d{8}$/ },
  { iso: "IT", country: "Italy", dialCode: "+39", minLength: 9, maxLength: 10 },
  { iso: "NL", country: "Netherlands", dialCode: "+31", minLength: 9, maxLength: 9, subscriberPattern: /^[1-9]\d{8}$/ },
  { iso: "BE", country: "Belgium", dialCode: "+32", minLength: 9, maxLength: 9 },
  { iso: "CH", country: "Switzerland", dialCode: "+41", minLength: 9, maxLength: 9, subscriberPattern: /^[1-9]\d{8}$/ },
  { iso: "AT", country: "Austria", dialCode: "+43", minLength: 10, maxLength: 13 },
  { iso: "LU", country: "Luxembourg", dialCode: "+352", minLength: 9, maxLength: 9, subscriberPattern: /^[26]\d{8}$/ },
  { iso: "SE", country: "Sweden", dialCode: "+46", minLength: 7, maxLength: 9 },
  { iso: "NO", country: "Norway", dialCode: "+47", minLength: 8, maxLength: 8 },
  { iso: "DK", country: "Denmark", dialCode: "+45", minLength: 8, maxLength: 8 },
  { iso: "FI", country: "Finland", dialCode: "+358", minLength: 9, maxLength: 12 },
  { iso: "IS", country: "Iceland", dialCode: "+354", minLength: 7, maxLength: 7, subscriberPattern: /^[67]\d{6}$/ },
  { iso: "IE", country: "Ireland", dialCode: "+353", minLength: 9, maxLength: 9 },
  { iso: "EE", country: "Estonia", dialCode: "+372", minLength: 7, maxLength: 8, subscriberPattern: /^5\d{6,7}$/ },
  { iso: "PT", country: "Portugal", dialCode: "+351", minLength: 9, maxLength: 9 },
  { iso: "PL", country: "Poland", dialCode: "+48", minLength: 9, maxLength: 9 },
  { iso: "CZ", country: "Czechia", dialCode: "+420", minLength: 9, maxLength: 9 },
  { iso: "HU", country: "Hungary", dialCode: "+36", minLength: 9, maxLength: 9 },
  { iso: "RO", country: "Romania", dialCode: "+40", minLength: 9, maxLength: 9 },
  { iso: "SI", country: "Slovenia", dialCode: "+386", minLength: 8, maxLength: 8, subscriberPattern: /^[134567]\d{7}$/ },
  { iso: "MT", country: "Malta", dialCode: "+356", minLength: 8, maxLength: 8, subscriberPattern: /^[79]\d{7}$/ },
  { iso: "GR", country: "Greece", dialCode: "+30", minLength: 10, maxLength: 10 },
  { iso: "IL", country: "Israel", dialCode: "+972", minLength: 9, maxLength: 9 },
  { iso: "JP", country: "Japan", dialCode: "+81", minLength: 10, maxLength: 10 },
  { iso: "KR", country: "South Korea", dialCode: "+82", minLength: 9, maxLength: 10 },
  { iso: "TW", country: "Taiwan", dialCode: "+886", minLength: 9, maxLength: 9 },
  { iso: "HK", country: "Hong Kong", dialCode: "+852", minLength: 8, maxLength: 8 },
  { iso: "MY", country: "Malaysia", dialCode: "+60", minLength: 9, maxLength: 10 },
  { iso: "TH", country: "Thailand", dialCode: "+66", minLength: 9, maxLength: 9 },
  { iso: "VN", country: "Vietnam", dialCode: "+84", minLength: 9, maxLength: 10 }
];

export function normalizePhoneDigits(value: string) {
  return value.replace(/\D/g, "");
}

export function getCountryRuleByIso(iso: string) {
  return COUNTRY_PHONE_RULES.find((rule) => rule.iso === iso);
}

export function getCountryRuleByDialCode(dialCode: string) {
  return COUNTRY_PHONE_RULES.find((rule) => rule.dialCode === dialCode);
}

export function isValidPhoneForRule(rule: CountryPhoneRule, digits: string) {
  if (digits.length < rule.minLength || digits.length > rule.maxLength) {
    return false;
  }

  if (rule.subscriberPattern) {
    return rule.subscriberPattern.test(digits);
  }

  return /^\d+$/.test(digits);
}

export function formatE164(rule: CountryPhoneRule, digits: string) {
  return `${rule.dialCode}${digits}`;
}
