/** Joins firstName/lastName for display, falling back to phone (or whatever
 * the caller passes as `phone`, e.g. a customer id slice) when both are unset. */
export function customerDisplayName(customer: { firstName: string | null; lastName: string | null; phone?: string | null }): string {
  const full = [customer.firstName, customer.lastName].filter(Boolean).join(" ");
  return full || customer.phone || "-";
}
