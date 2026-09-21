/** Validates a Thai 13-digit taxpayer ID using the standard mod-11 checksum
 * (same algorithm as the national ID card). */
export function isValidThaiTaxId(input: string): boolean {
  const digits = input.replace(/\D/g, "");
  if (digits.length !== 13) return false;

  let sum = 0;
  for (let i = 0; i < 12; i++) {
    sum += Number(digits[i]) * (13 - i);
  }
  const checkDigit = (11 - (sum % 11)) % 10;
  return checkDigit === Number(digits[12]);
}
